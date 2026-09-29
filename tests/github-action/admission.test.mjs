import test from 'node:test';
import assert from 'node:assert/strict';
import { plan } from '../../src/internal/github-action/admission.mjs';
import { drain } from '../../src/internal/github-action/manager.mjs';
const sha = n => n.toString(16).padStart(40, '0'), policy = 'a'.repeat(64);
function fixture() {
  const recipe = { version: 1, trustedAuthors: ['owner'], sharedBuilds: true, requiredChecks: ['Gates'], image: { dockerfile: 'Dockerfile', context: '.' }, prepare: [], compatibilityPaths: [], lanes: ['a', 'b', 'c'].map(id => ({ id, checkName: `Hauler ${id}`, tasks: [{ id: `test-${id}`, run: 'true', timeoutSeconds: 60 }] })) };
  const state = { calls: [], writes: [], builds: 0, decision: 'delegated', gate: 'success', parents: [sha(2), sha(1)], pr: { number: 1, state: 'open', draft: false, user: { login: 'owner' }, head: { sha: sha(1), repo: { full_name: 'owner/repo' } }, base: { sha: sha(2) }, merge_commit_sha: sha(3) }, checks: [] };
  const check = (lane, overrides = {}) => ({ id: lane.charCodeAt(0), name: `Hauler ${lane}`, head_sha: sha(1), app: { slug: 'github-actions' }, external_id: `hauler:${lane}:${sha(1)}:${policy}:run:10`, status: 'queued', ...overrides });
  async function fetchImpl(url, options) {
    const path = new URL(url).pathname.replace('/repos/owner/repo', '');
    state.calls.push(path);
    if (state.apiFailure) return { ok: false, status: 403 };
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
    else if (path.includes('/actions/workflows/')) data = { workflow_runs: [{ id: 10, event: 'pull_request', head_sha: state.pr.head.sha, path: '.github/workflows/ci.yml', run_attempt: 1, pull_requests: [{ number: 1 }] }] };
    else if (path.endsWith('/jobs')) data = { jobs: [{ steps: state.decision ? [{ name: `Hauler route / ${state.decision} / ${policy}`, conclusion: 'success' }] : [] }] };
    else throw new Error(`Unexpected API path ${path}`);
    return { ok: true, json: async () => structuredClone(data) };
  }
  const options = { recipe, repository: 'owner/repo', token: 'private', policy, fetchImpl };
  const sandboxFactory = async () => { state.builds++; return { async prepare() {}, async run() { return { exitCode: 0 }; }, async close() {} }; };
  const drainOptions = { ...options, actionIdentity: 'action', lane: 'a', root: '/tmp', maxMinutes: 1, maxSnapshots: 1, sandboxFactory };
  return { state, check, options, drainOptions };
}
test('empty, single and mixed lane plans share one metadata scan and never execute work', async () => {
  const f = fixture();
  assert.deepEqual(await plan(f.options), { lanes: [], count: 0 });
  f.state.checks = [f.check('b')];
  assert.deepEqual(await plan(f.options), { lanes: ['b'], count: 1 });
  f.state.checks = [f.check('a', { status: 'completed', conclusion: 'success' }), f.check('b'), f.check('c', { status: 'in_progress' })];
  f.state.calls = [];
  assert.deepEqual(await plan(f.options), { lanes: ['b', 'c'], count: 2 });
  assert.equal(f.state.calls.filter(p => p.endsWith('/check-runs')).length, 1);
  assert.equal(f.state.calls.filter(p => p.endsWith('/jobs')).length, 1);
  assert.equal(f.state.writes.length, 0);
  assert.equal(f.state.builds, 0);
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
  await assert.rejects(plan(f.options), /GitHub GET returned 403/);
  assert.equal(f.state.writes.length, 0);
});
