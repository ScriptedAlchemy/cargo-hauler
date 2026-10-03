import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPolicy, route, enqueue, checkIdentity, checkMetadata } from '../../src/internal/github-action/policy.mjs';
import { receipt } from '../../src/internal/github-action/github.mjs';
const sha = n => n.toString(16).padStart(40, '0');
const recipe = { version: 1, trustedAuthors: ['owner'], sharedBuilds: false, requiredChecks: ['Gates'], image: { dockerfile: 'docker/Dockerfile', context: 'docker' }, prepare: [], compatibilityPaths: [], lanes: [{ id: 'linux', checkName: 'Hauler Linux', tasks: [{ id: 'test', run: 'true', timeoutSeconds: 60 }] }] };
function fixture() {
  const state = { files: [{ filename: 'src/lib.rs', status: 'modified' }], fileRequests: 0, recipe, base: sha(1), image: sha(2), contextMode: '040000', checks: [], decision: null, posts: 0, head: sha(3), runHead: sha(3), event: 'pull_request', path: '.github/workflows/ci.yml', author: 'owner', draft: false, headRepo: 'owner/repo' };
  const fetchImpl = async (url, options) => {
    const path = new URL(url).pathname.replace('/repos/owner/repo', '');
    let data;
    if (path === '') data = { private: false, full_name: 'owner/repo', default_branch: 'master' };
    else if (path.startsWith('/commits/') && !path.endsWith('/check-runs')) data = { sha: state.base, commit: { tree: { sha: sha(4) } } };
    else if (path.startsWith('/contents/')) data = { type: 'file', encoding: 'base64', size: 1000, content: Buffer.from(JSON.stringify(state.recipe)).toString('base64') };
    else if (path.startsWith('/git/trees/')) data = { tree: [{ path: 'docker', mode: state.contextMode, sha: state.image }, { path: state.recipe.image.dockerfile, mode: '100644', sha: state.image }, { path: 'unrelated', mode: '100644', sha: state.base }] };
    else if (path === '/pulls') data = [{ number: 1 }];
    else if (path === '/pulls/1/files') { state.fileRequests++; if (state.filesError) return { ok: false, status: 403 }; const offset = (Number(new URL(url).searchParams.get('page')) - 1) * 100; data = state.files.slice(offset, offset + 100); }
    else if (path === '/pulls/1') data = { base: { sha: state.base }, mergeable: state.mergeable, mergeable_state: 'dirty', changed_files: Object.hasOwn(state, 'changedFiles') ? state.changedFiles : state.files.length, number: 1, state: 'open', draft: state.draft, user: { login: state.author }, head: { sha: state.head, repo: { full_name: state.headRepo } } };
    else if (path.endsWith('/check-runs') && options.method === 'GET') data = { check_runs: state.checks };
    else if (path === '/check-runs') { data = { id: ++state.posts, app: { slug: 'github-actions' }, ...JSON.parse(options.body) }; data.details_url = `https://github.com/owner/repo/runs/${data.id}`; state.checks.push(data); }
    else if (path.startsWith('/check-runs/') && options.method === 'GET') data = state.checks.find(c => c.id === Number(path.split('/').at(-1)));
    else if (path.startsWith('/check-runs/') && options.method === 'PATCH') data = Object.assign(state.checks.find(c => c.id === Number(path.split('/').at(-1))), JSON.parse(options.body));
    else if (path.includes('/actions/workflows/')) data = { workflow_runs: [{ id: 20, event: state.event, path: state.path, head_sha: state.runHead, run_attempt: 1, pull_requests: [{ number: 1 }] }] };
    else if (path.endsWith('/jobs')) data = { jobs: [{ steps: state.decision ? [{ name: state.decision, conclusion: 'success' }] : [] }] };
    else throw new Error(`Unknown route ${path}`);
    return { ok: true, json: async () => structuredClone(data) };
  };
  const options = { repository: 'owner/repo', token: 'secret', actionRef: sha(5), fetchImpl, pr: 1, head: state.head };
  return { state, options };
}
test('identity survives unrelated base changes but changes with recipe image or Action', async () => {
  const f = fixture(), original = (await loadPolicy(f.options)).policy;
  f.state.base = sha(50);
  assert.equal((await loadPolicy(f.options)).policy, original);
  f.state.image = sha(51);
  assert.notEqual((await loadPolicy(f.options)).policy, original);
  f.state.image = sha(2);
  assert.notEqual((await loadPolicy({ ...f.options, actionRef: sha(52) })).policy, original);
  f.state.recipe = { ...recipe, prepare: ['echo changed'] };
  assert.notEqual((await loadPolicy(f.options)).policy, original);
  assert.notEqual(checkIdentity(sha(3), 'linux', original), checkIdentity(sha(4), 'linux', original));
});
test('full invalid recipe falls back native without executing or queueing', async () => {
  const f = fixture(); f.state.recipe = { ...recipe, lanes: [{ ...recipe.lanes[0], tasks: [] }] };
  assert.deepEqual(await route(f.options), { decision: 'native', policy: 'unavailable' });
  assert.equal(f.state.posts, 0);
});
test('enqueue precedes cheap gates and reuses queued checks', async () => {
  const f = fixture(), loaded = await loadPolicy(f.options), opts = { ...loaded, repository: 'owner/repo', managerRunId: '10' };
  assert.equal((await enqueue(opts)).queued.length, 1);
  assert.equal((await enqueue(opts)).queued.length, 0);
  assert.deepEqual(await route(f.options), { decision: 'delegated', policy: loaded.policy });
  assert.equal(f.state.checks[0].details_url, 'https://github.com/owner/repo/runs/1');
  assert.ok(f.state.checks[0].external_id.endsWith(':run:10'));
});
test('native receipt blocks late enqueue; delegated receipt requires exact workflow and head', async () => {
  const f = fixture(), loaded = await loadPolicy(f.options), opts = { workflow: 'ci.yml', head: f.state.head, pr: 1, policy: loaded.policy };
  f.state.decision = `Hauler route / native / ${loaded.policy}`;
  assert.equal((await enqueue({ ...loaded, repository: 'owner/repo', managerRunId: '10' })).queued.length, 0);
  f.state.decision = `Hauler route / delegated / ${loaded.policy}`;
  assert.equal(await receipt(loaded.client, opts), 'delegated');
  f.state.runHead = sha(90); assert.equal(await receipt(loaded.client, opts), null);
  f.state.runHead = f.state.head; f.state.path = '.github/workflows/other.yml'; assert.equal(await receipt(loaded.client, opts), null);
  f.state.path = '.github/workflows/ci.yml'; f.state.event = 'push'; assert.equal(await receipt(loaded.client, opts), null);
});

test('route falls back to native when image context is missing or not a real directory', async () => {
  const missing = fixture();
  missing.state.recipe = { ...recipe, image: { ...recipe.image, context: 'missing-context' } };
  assert.deepEqual(await route(missing.options), { decision: 'native', policy: 'unavailable' });
  for (const mode of ['120000', '100644']) {
    const f = fixture();
    f.state.contextMode = mode;
    assert.deepEqual(await route(f.options), { decision: 'native', policy: 'unavailable' });
    assert.equal(f.state.posts, 0);
  }
});

test('check provenance parses exactly', async () => {
  const identity = checkIdentity(sha(3), 'linux', 'a'.repeat(64));
  assert.deepEqual(checkMetadata(`${identity}:run:10:infrastructure`), { identity, runId: '10', infrastructure: true });
  for (const suffix of [':run:0', ':run:01', ':run:10:junk', ':run:10:infrastructure:junk', ':run:10\n', ':run:123456789012345678901']) assert.equal(checkMetadata(`${identity}${suffix}`), null);
});

test('CI, recipe, image and renamed-out changes retain native validation', async () => {
  const cases = [
    [{ filename: '.github/workflows/ci.yml', status: 'modified' }],
    [{ filename: '.github/workflows/new-test.yml', status: 'added' }],
    [{ filename: 'ci/custom-recipe.json', status: 'modified' }],
    [{ filename: 'docker/Dockerfile', status: 'modified' }],
    [{ filename: 'docker/toolchain.txt', status: 'added' }],
    [{ filename: 'docs/old-ci.yml', previous_filename: '.github/workflows/ci.yml', status: 'renamed' }],
    [{ filename: 'docs/old-context', previous_filename: 'docker/toolchain.txt', status: 'renamed' }],
  ];
  for (const files of cases) {
    const f = fixture(); f.state.files = files;
    const options = { ...f.options, recipePath: './ci/custom-recipe.json' }, loaded = await loadPolicy(options);
    await enqueue({ ...loaded, repository: 'owner/repo', managerRunId: '10' });
    assert.deepEqual(await route(options), { decision: 'native', policy: loaded.policy });
    assert.equal(f.state.fileRequests, 1);
  }
});
test('incomplete change lists and API errors fail closed with the validated policy', async () => {
  for (const changedFiles of [undefined, -1, 1.5, '1', 3001, 2, 0]) {
    const f = fixture(); f.state.changedFiles = changedFiles;
    if (changedFiles === 0) { f.state.changedFiles = 101; f.state.files = Array.from({ length: 100 }, (_, i) => ({ filename: `src/${i}.rs` })); }
    const loaded = await loadPolicy(f.options);
    await enqueue({ ...loaded, repository: 'owner/repo', managerRunId: '10' });
    assert.deepEqual(await route(f.options), { decision: 'native', policy: loaded.policy });
  }
  const f = fixture(); f.state.filesError = true;
  const loaded = await loadPolicy(f.options);
  await enqueue({ ...loaded, repository: 'owner/repo', managerRunId: '10' });
  assert.deepEqual(await route(f.options), { decision: 'native', policy: loaded.policy });
});
test('ordinary Rust and documentation edits still delegate with one change scan', async () => {
  const f = fixture(); f.state.files = [{ filename: 'src/lib.rs' }, { filename: 'docs/design.md' }];
  const loaded = await loadPolicy(f.options);
  await enqueue({ ...loaded, repository: 'owner/repo', managerRunId: '10' });
  assert.deepEqual(await route(f.options), { decision: 'delegated', policy: loaded.policy });
  assert.equal(f.state.fileRequests, 1);
});

test('Dockerfile outside context and repository-root contexts keep native coverage', async () => {
  for (const image of [{ dockerfile: 'tools/Worker.Dockerfile', context: 'docker' }, { dockerfile: 'docker/Dockerfile', context: '.' }]) {
    const f = fixture(); f.state.recipe = { ...recipe, image };
    f.state.files = [{ filename: image.context === '.' ? 'src/lib.rs' : image.dockerfile }];
    const loaded = await loadPolicy(f.options);
    await enqueue({ ...loaded, repository: 'owner/repo', managerRunId: '10' });
    assert.deepEqual(await route(f.options), { decision: 'native', policy: loaded.policy });
  }
});

test('enqueue skips conflicts without touching queued or admitted checks', async () => {
  const f = fixture(), loaded = await loadPolicy(f.options), options = { ...loaded, repository: 'owner/repo', managerRunId: '10' };
  await enqueue(options);
  f.state.mergeable = false;
  assert.equal((await enqueue(options)).queued.length, 0);
  assert.equal(f.state.checks[0].status, 'queued');
  f.state.checks[0].status = 'in_progress';
  assert.equal(f.state.posts, 1);
  assert.equal((await enqueue(options)).queued.length, 0);
  assert.equal(f.state.checks[0].status, 'in_progress');
  f.state.checks = [];
  f.state.mergeable = null;
  assert.equal((await enqueue(options)).queued.length, 1);
});

test('route keeps native coverage if base changes during the file scan', async () => {
  const f = fixture(), loaded = await loadPolicy(f.options);
  await enqueue({ ...loaded, repository: 'owner/repo', managerRunId: '10' });
  const original = f.options.fetchImpl;
  const fetchImpl = async (url, options) => {
    const response = await original(url, options);
    if (url.includes('/pulls/1/files')) f.state.base = sha(71);
    return response;
  };
  assert.deepEqual(await route({ ...f.options, fetchImpl }), { decision: 'native', policy: loaded.policy });
});

test('native ownership crosses policy versions but delegation and malformed receipts do not', async () => {
  const f = fixture(), loaded = await loadPolicy(f.options);
  const options = { workflow: 'ci.yml', head: f.state.head, pr: 1, policy: loaded.policy };
  for (const policy of ['b'.repeat(64), 'unavailable']) {
    f.state.decision = `Hauler route / native / ${policy}`;
    assert.equal(await receipt(loaded.client, options), 'native');
  }
  for (const name of [`Hauler route / delegated / ${'b'.repeat(64)}`, 'Hauler route / native / invalid', `Hauler route / native / ${'b'.repeat(64)} trailing`]) {
    f.state.decision = name;
    assert.equal(await receipt(loaded.client, options), null);
  }
});

const observed = f => {
  const paths = [], original = f.options.fetchImpl;
  return { paths, fetchImpl: (url, options) => { paths.push(new URL(url).pathname); return original(url, options); } };
};
test('route delegates a trusted head at once, before any lane check exists', { timeout: 5000 }, async t => {
  // Any wait would stall on the frozen clock and trip the timeout.
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const f = fixture(), seen = observed(f), loaded = await loadPolicy(f.options);
  assert.deepEqual(await route({ ...f.options, fetchImpl: seen.fetchImpl }), { decision: 'delegated', policy: loaded.policy });
  assert.equal(f.state.checks.length, 0);
  assert.ok(!seen.paths.some(path => path.includes('/check-runs') || path.includes('/actions/')));
});
test('route stays native for policy changes, untrusted authors, drafts and forks without checks', { timeout: 5000 }, async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  for (const change of [{ files: [{ filename: '.github/workflows/ci.yml', status: 'modified' }] }, { author: 'stranger' }, { draft: true }, { headRepo: 'fork/repo' }]) {
    const f = fixture(), seen = observed(f), loaded = await loadPolicy(f.options);
    Object.assign(f.state, change);
    assert.deepEqual(await route({ ...f.options, fetchImpl: seen.fetchImpl }), { decision: 'native', policy: loaded.policy });
    assert.ok(!seen.paths.some(path => path.includes('/check-runs') || path.includes('/actions/')));
  }
});
