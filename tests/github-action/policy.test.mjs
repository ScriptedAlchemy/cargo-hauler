import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPolicy, route, enqueue, checkIdentity, checkMetadata } from '../../src/internal/github-action/policy.mjs';
import { receipt } from '../../src/internal/github-action/github.mjs';
const sha = n => n.toString(16).padStart(40, '0');
const recipe = { version: 1, trustedAuthors: ['owner'], sharedBuilds: false, requiredChecks: ['Gates'], image: { dockerfile: 'docker/Dockerfile', context: 'docker' }, prepare: [], compatibilityPaths: [], lanes: [{ id: 'linux', checkName: 'Hauler Linux', tasks: [{ id: 'test', run: 'true', timeoutSeconds: 60 }] }] };
function fixture() {
  const state = { recipe, base: sha(1), image: sha(2), contextMode: '040000', checks: [], decision: null, posts: 0, head: sha(3), runHead: sha(3), event: 'pull_request', path: '.github/workflows/ci.yml' };
  const fetchImpl = async (url, options) => {
    const path = new URL(url).pathname.replace('/repos/owner/repo', '');
    let data;
    if (path === '') data = { private: false, full_name: 'owner/repo', default_branch: 'master' };
    else if (path.startsWith('/commits/') && !path.endsWith('/check-runs')) data = { sha: state.base, commit: { tree: { sha: sha(4) } } };
    else if (path.startsWith('/contents/')) data = { type: 'file', encoding: 'base64', size: 1000, content: Buffer.from(JSON.stringify(state.recipe)).toString('base64') };
    else if (path.startsWith('/git/trees/')) data = { tree: [{ path: 'docker', mode: state.contextMode, sha: state.image }, { path: 'docker/Dockerfile', mode: '100644', sha: state.image }, { path: 'unrelated', mode: '100644', sha: state.base }] };
    else if (path === '/pulls') data = [{ number: 1 }];
    else if (path === '/pulls/1') data = { number: 1, state: 'open', draft: false, user: { login: 'owner' }, head: { sha: state.head, repo: { full_name: 'owner/repo' } } };
    else if (path.endsWith('/check-runs') && options.method === 'GET') data = { check_runs: state.checks };
    else if (path === '/check-runs') { data = { id: ++state.posts, app: { slug: 'github-actions' }, ...JSON.parse(options.body) }; data.details_url = `https://github.com/owner/repo/runs/${data.id}`; state.checks.push(data); }
    else if (path.includes('/actions/workflows/')) data = { workflow_runs: [{ id: 20, event: state.event, path: state.path, head_sha: state.runHead, run_attempt: 1, pull_requests: [{ number: 1 }] }] };
    else if (path.endsWith('/jobs')) data = { jobs: [{ steps: state.decision ? [{ name: state.decision, conclusion: 'success' }] : [] }] };
    else if (path === '/actions/runs/10') data = { event: 'pull_request_target', path: '.github/workflows/hauler-ci.yml', head_repository: { full_name: 'owner/repo' }, head_branch: 'master' };
    else throw new Error(`Unknown route ${path}`);
    return { ok: true, json: async () => structuredClone(data) };
  };
  const options = { repository: 'owner/repo', token: 'secret', actionRef: sha(5), fetchImpl, pr: 1, head: state.head, waitMilliseconds: 0 };
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
test('enqueue precedes cheap gates, reuses queued checks, and route verifies them', async () => {
  const f = fixture(), loaded = await loadPolicy(f.options), opts = { ...loaded, repository: 'owner/repo', managerRunId: '10' };
  assert.equal((await enqueue(opts)).queued.length, 1);
  assert.equal((await enqueue(opts)).queued.length, 0);
  assert.deepEqual(await route(f.options), { decision: 'delegated', policy: loaded.policy });
  assert.equal(f.state.checks[0].details_url, 'https://github.com/owner/repo/runs/1');
  assert.ok(f.state.checks[0].external_id.endsWith(':run:10'));
  f.state.checks[0].external_id += ':junk';
  assert.equal((await route(f.options)).decision, 'native');
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

test('check provenance parses exactly and cannot fall back to a display URL', async () => {
  const identity = checkIdentity(sha(3), 'linux', 'a'.repeat(64));
  assert.deepEqual(checkMetadata(`${identity}:run:10:infrastructure`), { identity, runId: '10', infrastructure: true });
  for (const suffix of [':run:0', ':run:01', ':run:10:junk', ':run:10:infrastructure:junk', ':run:10\n', ':run:123456789012345678901']) assert.equal(checkMetadata(`${identity}${suffix}`), null);
  const f = fixture(), loaded = await loadPolicy(f.options);
  await enqueue({ ...loaded, repository: 'owner/repo', managerRunId: '10' });
  f.state.checks[0].external_id = checkIdentity(f.state.head, 'linux', loaded.policy);
  f.state.checks[0].details_url = 'https://github.com/owner/repo/actions/runs/10';
  assert.equal((await route(f.options)).decision, 'native');
});
