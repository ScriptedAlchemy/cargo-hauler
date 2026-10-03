import test from 'node:test';
import assert from 'node:assert/strict';
import { plan, scanAdmission } from '../../src/internal/github-action/admission.mjs';
import { drain } from '../../src/internal/github-action/manager.mjs';
import { githubClient, receipt } from '../../src/internal/github-action/github.mjs';
import { graphqlFetch } from './graphql-fixture.mjs';
const sha = n => n.toString(16).padStart(40, '0'), policy = 'a'.repeat(64);
function fixture() {
  const recipe = { version: 1, trustedAuthors: ['owner'], sharedBuilds: true, requiredChecks: ['Gates'], image: { dockerfile: 'Dockerfile', context: '.' }, prepare: [], compatibilityPaths: [], lanes: ['a', 'b', 'c'].map(id => ({ id, checkName: `Hauler ${id}`, tasks: [{ id: `test-${id}`, run: 'true', timeoutSeconds: 60 }] })) };
  const state = { calls: [], writes: [], builds: 0, decision: 'delegated', gate: 'success', parents: [sha(2), sha(1)], pr: { number: 1, state: 'open', draft: false, user: { login: 'owner' }, head: { sha: sha(1), repo: { full_name: 'owner/repo' } }, base: { sha: sha(2) }, merge_commit_sha: sha(3) }, checks: [] };
  const check = (lane, overrides = {}) => ({ id: lane.charCodeAt(0), name: `Hauler ${lane}`, head_sha: sha(1), app: { slug: 'github-actions' }, external_id: `hauler:${lane}:${sha(1)}:${policy}:run:10`, status: 'queued', ...overrides });
  async function rest(url, options) {
    const path = new URL(url).pathname.replace('/repos/owner/repo', '');
    let data;
    if (options.method !== 'GET') {
      state.writes.push({ path, body: JSON.parse(options.body) });
      assert.equal(options.method, 'PATCH');
      data = Object.assign(state.checks.find(c => c.id === Number(path.split('/').at(-1))), JSON.parse(options.body));
    } else if (path === '/pulls') data = [state.pr];
    else if (path === '/pulls/1') data = state.pr;
    else if (path.endsWith('/check-runs')) data = { check_runs: [{ name: 'Gates', app: { slug: 'github-actions' }, status: 'completed', conclusion: state.gate }, ...state.checks] };
    else if (path.startsWith('/check-runs/')) data = state.checks.find(c => c.id === Number(path.split('/').at(-1)));
    else if (path === `/git/commits/${sha(3)}`) data = { parents: state.parents.map(sha => ({ sha })), tree: { sha: sha(4) } };
    else if (path.startsWith('/git/commits/')) data = { committer: { date: '2026-09-28T00:00:00Z' } };
    else if (path.startsWith('/git/trees/')) data = { tree: [] };
    else if (path.includes('/actions/workflows/')) data = { workflow_runs: state.decision === undefined ? [] : [{ id: 10, event: 'pull_request', head_sha: state.pr.head.sha, path: '.github/workflows/ci.yml', run_attempt: 1, pull_requests: [{ number: state.runPull ?? 1 }] }] };
    else if (path.endsWith('/jobs')) data = { jobs: [{ steps: state.decision ? [{ name: `Hauler route / ${state.decision} / ${state.receiptPolicy ?? policy}`, conclusion: 'success' }] : [] }] };
    else throw new Error(`Unexpected API path ${path}`);
    return { ok: true, json: async () => structuredClone(data) };
  }
  const served = graphqlFetch(rest);
  async function fetchImpl(url, options) {
    state.calls.push(new URL(url).pathname.replace('/repos/owner/repo', ''));
    return state.apiFailure ? { ok: false, status: 403 } : served(url, options);
  }
  const options = { recipe, repository: 'owner/repo', token: 'private', policy, fetchImpl };
  const sandboxFactory = async () => { state.builds++; return { async prepare() {}, async run() { return { exitCode: 0 }; }, async close() {} }; };
  const drainOptions = { ...options, actionIdentity: 'action', lane: 'a', root: '/tmp', maxMinutes: 1, maxSnapshots: 1, sandboxFactory };
  return { state, check, rest, options, drainOptions };
}
test('empty, single and mixed lane plans share one metadata scan and never execute work', async () => {
  const f = fixture();
  assert.deepEqual(await plan(f.options), { lanes: [], count: 0 });
  f.state.checks = [f.check('b')];
  assert.deepEqual(await plan(f.options), { lanes: ['b'], count: 1 });
  f.state.checks = [f.check('a', { status: 'completed', conclusion: 'success' }), f.check('b'), f.check('c', { status: 'in_progress' })];
  f.state.calls = [];
  assert.deepEqual(await plan(f.options), { lanes: ['b', 'c'], count: 2 });
  assert.deepEqual(f.state.calls, ['/graphql', '/graphql']);
  assert.equal(f.state.writes.length, 0);
  assert.equal(f.state.builds, 0);
});
test('a settled pull request costs one query and skips the receipt query', async () => {
  const f = fixture();
  f.state.checks = ['a', 'b', 'c'].map(lane => f.check(lane, { status: 'completed', conclusion: 'success' }));
  assert.deepEqual(await plan(f.options), { lanes: [], count: 0 });
  assert.deepEqual(f.state.calls, ['/graphql']);
  f.state.checks = [f.check('a')];
  f.state.calls = [];
  assert.deepEqual(await plan(f.options), { lanes: ['a'], count: 1 });
  assert.deepEqual(f.state.calls, ['/graphql', '/graphql']);
});
test('conflict and native maintenance stay read-only until the serialized drain', async () => {
  for (const kind of ['conflict', 'native']) {
    const f = fixture(); f.state.checks = [f.check('a')];
    if (kind === 'conflict') { f.state.pr.mergeable = false; f.state.pr.merge_commit_sha = null; } else f.state.decision = 'native';
    assert.deepEqual(await plan(f.options), { lanes: ['a'], count: 1 });
    assert.equal(f.state.writes.length, 0);
    assert.equal(f.state.checks[0].status, 'queued');
    await drain(f.drainOptions);
    assert.equal(f.state.checks[0].conclusion, 'cancelled');
    assert.equal(f.state.builds, 0);
    if (kind === 'conflict') assert.deepEqual(await plan(f.options), { lanes: [], count: 0 });
  }
});
test('drain revalidates a stale plan after a terminal result or replaced head', async () => {
  for (const change of ['terminal', 'head']) {
    const f = fixture(); f.state.checks = [f.check('a')];
    assert.equal((await plan(f.options)).count, 1);
    if (change === 'terminal') Object.assign(f.state.checks[0], { status: 'completed', conclusion: 'success' }); else f.state.pr.head.sha = sha(9);
    assert.equal((await drain(f.drainOptions)).snapshots.length, 0);
    assert.equal(f.state.builds, 0);
  }
});
test('retries and in-progress work remain eligible but real completed verdicts do not', async () => {
  const f = fixture();
  f.state.checks = [f.check('a', { status: 'completed', conclusion: 'failure', external_id: `${f.check('a').external_id}:infrastructure` }), f.check('b', { status: 'completed', conclusion: 'cancelled' }), f.check('c', { status: 'completed', conclusion: 'failure' })];
  assert.deepEqual(await plan(f.options), { lanes: ['a', 'b'], count: 2 });
});
test('missing gates, receipts, invalid merges, untrusted or draft PRs never plan execution', async () => {
  for (const change of ['gate', 'receipt', 'merge', 'author', 'fork', 'draft']) {
    const f = fixture(); f.state.checks = [f.check('a')];
    if (change === 'gate') f.state.gate = 'failure';
    if (change === 'receipt') f.state.decision = null;
    if (change === 'merge') f.state.parents[0] = sha(9);
    if (change === 'author') f.state.pr.user.login = 'stranger';
    if (change === 'fork') f.state.pr.head.repo.full_name = 'stranger/repo';
    if (change === 'draft') f.state.pr.draft = true;
    assert.deepEqual(await plan(f.options), { lanes: [], count: 0 });
  }
});
test('explicit manual planning bypasses receipt but preserves gates and API errors fail closed', async () => {
  const f = fixture(); f.state.decision = null;
  assert.deepEqual(await plan({ ...f.options, manualAdmission: true, onlyPullRequests: [1] }), { lanes: ['a', 'b', 'c'], count: 3 });
  f.state.gate = 'failure';
  assert.equal((await plan({ ...f.options, manualAdmission: true, onlyPullRequests: [1] })).count, 0);
  f.state.apiFailure = true;
  await assert.rejects(plan(f.options), /GitHub POST returned 403/);
  assert.equal(f.state.writes.length, 0);
});

test('new-policy native ownership retires old-policy markers only in drain', async () => {
  const f = fixture();
  f.state.checks = [f.check('a', { external_id: `hauler:a:${sha(1)}:${'c'.repeat(64)}:run:10` })];
  f.state.decision = 'native';
  f.state.receiptPolicy = 'b'.repeat(64);
  assert.deepEqual(await plan(f.options), { lanes: ['a'], count: 1 });
  assert.equal(f.state.writes.length, 0);
  assert.equal(f.state.checks[0].status, 'queued');
  await drain(f.drainOptions);
  assert.equal(f.state.checks[0].conclusion, 'cancelled');
  assert.equal(f.state.builds, 0);
  assert.deepEqual(await plan(f.options), { lanes: [], count: 0 });
});

test('native cleanup ignores wrong ownership and old-policy delegation never admits work', async () => {
  const f = fixture(); f.state.decision = 'native';
  const old = f.check('a', { external_id: `hauler:a:${sha(1)}:${'c'.repeat(64)}:run:10` });
  f.state.checks = [
    { ...old, head_sha: sha(9) }, { ...old, app: { slug: 'other' } },
    { ...old, name: 'Unknown lane' }, { ...old, external_id: `${old.external_id}:junk` },
    { ...old, status: 'in_progress' }, { ...old, status: 'completed', conclusion: 'success' },
  ];
  assert.deepEqual(await plan(f.options), { lanes: [], count: 0 });
  f.state.checks = [old]; f.state.decision = 'delegated'; f.state.receiptPolicy = 'c'.repeat(64);
  assert.deepEqual(await plan(f.options), { lanes: [], count: 0 });
  await drain(f.drainOptions);
  assert.equal(f.state.writes.length, 0);
  assert.equal(f.state.builds, 0);
});
test('serialized native cleanup preserves a changed head, receipt or running check', async () => {
  for (const race of ['head', 'receipt', 'running']) {
    const f = fixture(); f.state.decision = 'native';
    f.state.checks = [f.check('a', { external_id: `hauler:a:${sha(1)}:${'c'.repeat(64)}:run:10` })];
    let pullReads = 0, jobReads = 0;
    const fetchImpl = graphqlFetch(async (url, options) => {
      const response = await f.rest(url, options), data = await response.json();
      if (url.endsWith('/pulls/1') && ++pullReads === 1 && race === 'head') data.head.sha = sha(9);
      if (url.includes('/jobs') && ++jobReads === 2 && race === 'receipt') data.jobs[0].steps[0].name = `Hauler route / delegated / ${policy}`;
      if (url.endsWith('/check-runs/97') && options.method === 'GET' && race === 'running') data.status = 'in_progress';
      return { ...response, json: async () => data };
    });
    await drain({ ...f.drainOptions, fetchImpl });
    assert.equal(f.state.writes.length, 0);
    assert.equal(f.state.checks[0].status, 'queued');
    assert.equal(f.state.builds, 0);
  }
});

function bulk(count, noise = 0) {
  const { options } = fixture(), calls = [], heads = new Map();
  const pulls = Array.from({ length: count }, (_, i) => {
    const number = i + 1, head = sha(1000 + number);
    heads.set(head, number);
    return { number, state: 'open', draft: false, user: { login: 'owner' }, head: { sha: head, repo: { full_name: 'owner/repo' } }, base: { sha: sha(2) }, merge_commit_sha: sha(5000 + number), mergeable: true };
  });
  async function rest(url) {
    const { pathname, searchParams } = new URL(url), path = pathname.replace('/repos/owner/repo', ''), head = path.split('/')[2];
    let data;
    if (path === '/pulls') data = pulls;
    else if (path.endsWith('/check-runs')) data = { check_runs: [{ id: 1, name: 'Gates', app: { slug: 'github-actions' }, status: 'completed', conclusion: 'success' }, ...Array.from({ length: noise }, (_, i) => ({ id: 2 + i, name: `Noise ${i}`, app: { slug: 'github-actions' }, status: 'completed', conclusion: 'success' })), { id: 10000, name: 'Hauler a', head_sha: head, app: { slug: 'github-actions' }, external_id: `hauler:a:${head}:${policy}:run:10`, status: 'queued' }] };
    else if (path.startsWith('/git/commits/') && pulls.some(p => p.merge_commit_sha === path.split('/')[3])) {
      const pr = pulls.find(p => p.merge_commit_sha === path.split('/')[3]);
      data = { parents: [{ sha: sha(2) }, { sha: pr.head.sha }], tree: { sha: sha(4) } };
    } else if (path.startsWith('/git/commits/')) data = { committer: { date: '2026-09-28T00:00:00Z' } };
    else if (path.includes('/actions/workflows/')) {
      const number = heads.get(searchParams.get('head_sha'));
      data = { workflow_runs: [{ id: 100 + number, event: 'pull_request', head_sha: searchParams.get('head_sha'), path: '.github/workflows/ci.yml', run_attempt: 1, pull_requests: [{ number }] }] };
    } else if (path.endsWith('/jobs')) data = { jobs: [{ steps: [{ name: `Hauler route / delegated / ${policy}`, conclusion: 'success' }] }] };
    else throw new Error(`Unexpected API path ${path}`);
    return { ok: true, json: async () => structuredClone(data) };
  }
  const served = graphqlFetch(rest);
  const client = githubClient({ repository: 'owner/repo', token: 'private', fetchImpl: async (url, init) => { calls.push(new URL(url).pathname); return served(url, init); } });
  const scan = async () => (await scanAdmission(client, options)).candidates.map(c => c.snapshot.pr);
  return { calls, scan };
}
const quiet = async run => { const log = console.error; console.error = () => {}; try { return await run(); } finally { console.error = log; } };

test('the scan pages past 100 pull requests and 100 check runs without dropping a row', async () => {
  const many = bulk(150);
  assert.deepEqual(await quiet(many.scan), Array.from({ length: 150 }, (_, i) => i + 1));
  assert.deepEqual(many.calls, ['/graphql', '/graphql', '/graphql', '/graphql']);
  const noisy = bulk(1, 120);
  assert.deepEqual(await quiet(noisy.scan), [1]);
  assert.deepEqual(noisy.calls, ['/graphql', '/graphql', '/graphql', '/graphql']);
});

test('a scan of N pull requests costs the same requests for one or sixty', async () => {
  for (const count of [1, 60]) {
    const f = bulk(count);
    assert.equal((await quiet(f.scan)).length, count);
    assert.deepEqual(f.calls, ['/graphql', '/graphql'], `${count} pull requests`);
  }
});

test('mergeable enums map to true, null and false before classification', async () => {
  for (const [mergeable, expected] of [[true, 'native'], [undefined, 'native'], [false, 'conflict']]) {
    const f = fixture(); f.state.decision = 'native'; f.state.checks = [f.check('a')]; f.state.pr.mergeable = mergeable;
    const client = githubClient({ repository: 'owner/repo', token: 'private', fetchImpl: f.options.fetchImpl });
    const { maintenance } = await quiet(() => scanAdmission(client, f.options));
    assert.deepEqual(maintenance.map(m => [m.kind, m.pr.mergeable]), [[expected, mergeable ?? null]]);
  }
});

test('the batched receipt agrees with the REST receipt for every route', async () => {
  for (const [decision, receiptPolicy, runPull, expected] of [['native', undefined, 1, 'native'], ['delegated', undefined, 1, 'delegated'], ['delegated', 'b'.repeat(64), 1, null], ['delegated', undefined, 2, null], [undefined, undefined, 1, null]]) {
    const f = fixture(); Object.assign(f.state, { decision, receiptPolicy, runPull }); f.state.checks = [f.check('a')];
    const rest = githubClient({ repository: 'owner/repo', token: 'private', fetchImpl: f.rest });
    assert.equal(await receipt(rest, { workflow: 'ci.yml', head: sha(1), pr: 1, policy }), expected);
    const client = githubClient({ repository: 'owner/repo', token: 'private', fetchImpl: f.options.fetchImpl });
    const { candidates, maintenance } = await quiet(() => scanAdmission(client, f.options));
    const scanned = candidates.length ? 'delegated' : maintenance.length ? maintenance[0].kind : null;
    assert.equal(scanned, expected, `${decision} ${receiptPolicy ?? 'current'} #${runPull}`);
  }
});
