import test from 'node:test';
import assert from 'node:assert/strict';
import { plan } from '../../src/internal/github-action/admission.mjs';
import { checkOwner, ownerText, verifyOwners, workerIdentity } from '../../src/internal/github-action/ownership.mjs';
import { githubClient } from '../../src/internal/github-action/github.mjs';
import { graphqlFetch } from './graphql-fixture.mjs';
const sha = n => n.toString(16).padStart(40, '0'), policy = 'a'.repeat(64);
const recipe = { version: 1, trustedAuthors: ['owner'], requiredChecks: [], image: { dockerfile: 'Dockerfile', context: '.' }, prepare: [], compatibilityPaths: [], lanes: [{ id: 'linux', checkName: 'Hauler Linux', tasks: [{ id: 'test', run: 'true', timeoutSeconds: 1 }] }] };
function fixture({ pulls = 3 } = {}) {
  const owner = { runId: '20', attempt: 2, jobId: '30', lane: 'linux', ordinal: 1, remaining: 2, finished: false, deadline: Date.now() + 60000 };
  const run = { id: 20, run_attempt: 2, status: 'in_progress', event: 'workflow_run', path: '.github/workflows/hauler-ci.yml', head_repository: { full_name: 'owner/repo' }, head_branch: 'master' };
  const state = { run, jobs: [{ id: 30, name: 'Hauler pool / linux', status: 'in_progress' }], checks: new Map(), calls: [], missing: '', error: '' };
  const prs = Array.from({ length: pulls }, (_, i) => i + 1).map(number => ({ number, state: 'open', draft: false, user: { login: 'owner' }, updated_at: '2026-09-28T00:00:00Z', head: { sha: sha(number), repo: { full_name: 'owner/repo' } }, base: { sha: sha(10) }, merge_commit_sha: sha(number + 100) }));
  const check = (number, patch = {}) => ({ id: number, name: 'Hauler Linux', app: { slug: 'github-actions' }, head_sha: sha(number), external_id: `hauler:linux:${sha(number)}:${policy}:run:5`, status: 'in_progress', output: { text: ownerText(owner) }, ...patch });
  async function fetchImpl(url) {
    const path = new URL(url).pathname.replace('/repos/owner/repo', ''); state.calls.push(path);
    if (state.missing === path || state.error === path) return { ok: false, status: state.missing === path ? 404 : 403 };
    let data;
    if (path === '/pulls') data = prs;
    else if (path.startsWith('/pulls/')) data = prs[Number(path.split('/').at(-1)) - 1];
    else if (path.includes('/check-runs')) data = { check_runs: state.checks.get(Number(path.split('/')[2])) ?? [] };
    else if (path.startsWith('/git/commits/')) {
      const pr = prs.find(p => p.merge_commit_sha === path.split('/').at(-1));
      data = pr ? { parents: [{ sha: pr.base.sha }, { sha: pr.head.sha }], tree: { sha: sha(40) } } : { committer: { date: '2026-09-28T00:00:00Z' } };
    } else if (path.startsWith('/actions/workflows/')) data = { workflow_runs: [] };
    else if (path === '/actions/runs/20') data = state.run;
    else if (path === '/actions/runs/20/attempts/2/jobs') data = { jobs: state.jobs };
    else throw new Error(`Unexpected ${path}`);
    return { ok: true, json: async () => structuredClone(data) };
  }
  state.checks.set(1, [check(1)]);
  const options = { recipe, repository: 'owner/repo', token: 'private', policy, defaultBranch: 'master', manualAdmission: true, fetchImpl: graphqlFetch(fetchImpl) };
  return { owner, state, check, options };
}
test('live ownership and its remaining capacity suppress successor allocation', async () => {
  const f = fixture();
  assert.deepEqual(await plan(f.options), { lanes: [], count: 0 });
  assert.equal(f.state.calls.filter(p => p === '/actions/runs/20').length, 1);
  assert.equal(f.state.calls.filter(p => p.endsWith('/jobs')).length, 1);
  f.owner.remaining = 1; f.state.checks.set(1, [f.check(1)]);
  assert.deepEqual(await plan(f.options), { lanes: ['linux'], count: 1 });
});
test('deduplicated latest ordinal capacity includes completed evidence and excludes early failure from terminal verdicts', async () => {
  const f = fixture();
  f.state.checks.set(1, [f.check(1, { status: 'completed', conclusion: 'success', output: { text: ownerText({ ...f.owner, finished: true, ordinal: 1, remaining: 20 }) } })]);
  f.state.checks.set(2, [f.check(2, { status: 'completed', conclusion: 'failure', output: { text: ownerText({ ...f.owner, ordinal: 2, remaining: 0 }) } })]);
  assert.equal((await plan(f.options)).count, 1);
  assert.equal(f.state.calls.filter(p => p === '/actions/runs/20').length, 1);
  assert.equal(f.state.calls.filter(p => p.endsWith('/jobs')).length, 1);
  f.state.run.status = 'completed';
  const result = await plan({ ...f.options, onlyPullRequests: [2] });
  assert.deepEqual(result.lanes, ['linux']);
});
test('dead, expired, exhausted and mismatched worker provenance cannot reserve future capacity', async () => {
  for (const change of ['run', 'job', 'attempt', 'branch', 'repository', 'workflow', 'duplicate', 'deadline', 'capacity']) {
    const f = fixture();
    if (change === 'run') f.state.run.status = 'completed';
    if (change === 'job') f.state.jobs[0].status = 'completed';
    if (change === 'attempt') f.state.run.run_attempt = 3;
    if (change === 'branch') f.state.run.head_branch = 'pr-code';
    if (change === 'repository') f.state.run.head_repository.full_name = 'other/repo';
    if (change === 'workflow') f.state.run.path = '.github/workflows/other.yml';
    if (change === 'duplicate') f.state.jobs.push({ ...f.state.jobs[0], id: 31 });
    if (change === 'deadline') f.owner.deadline = Date.now() - 1;
    if (change === 'capacity') f.owner.remaining = 0;
    f.state.checks.set(1, [f.check(1)]);
    assert.equal((await plan(f.options)).count, 1, change);
  }
});
test('confirmed run/job absence recovers ownership; permission failures remain visible', async () => {
  for (const path of ['/actions/runs/20', '/actions/runs/20/attempts/2/jobs']) {
    const f = fixture(); f.state.missing = path;
    assert.equal((await plan(f.options)).count, 1);
    f.state.missing = ''; f.state.error = path;
    await assert.rejects(plan(f.options), /GitHub GET returned 403/);
  }
});
test('worker identity requires the exact unique native lane job and strict block values', async () => {
  const f = fixture(), client = githubClient({ repository: 'owner/repo', token: 'private', fetchImpl: f.options.fetchImpl });
  const options = { runId: '20', attempt: '2', lane: 'linux', repository: 'owner/repo', defaultBranch: 'master' };
  assert.deepEqual(await workerIdentity(client, options), { runId: '20', attempt: 2, jobId: '30' });
  f.state.jobs.push({ ...f.state.jobs[0], id: 31 });
  await assert.rejects(workerIdentity(client, options), /Unique/);
  for (const patch of [{ remaining: -1 }, { finished: 'false' }, { attempt: 0 }, { jobId: '../30' }, { deadline: Infinity }, { ordinal: 101 }]) assert.equal(checkOwner({ output: { text: ownerText({ ...f.owner, ...patch }) } }), null);
});
test('a running lane verifies while the aggregate matrix is pending on sibling concurrency', async () => {
  const f = fixture();
  f.state.run.status = 'pending';
  f.state.jobs.push({ id: 31, name: 'Hauler pool / sibling', status: 'pending' });
  const client = githubClient({ repository: 'owner/repo', token: 'private', fetchImpl: f.options.fetchImpl });
  const options = { runId: '20', attempt: '2', lane: 'linux', repository: 'owner/repo', defaultBranch: 'master' };
  assert.deepEqual(await workerIdentity(client, options), { runId: '20', attempt: 2, jobId: '30' });
  assert.deepEqual(await plan(f.options), { lanes: [], count: 0 });
  for (const status of ['pending', 'completed']) {
    f.state.jobs[0].status = status;
    await assert.rejects(workerIdentity(client, options), /Could not verify/);
  }
  for (const patch of [{ head_branch: 'pr-code' }, { run_attempt: 3 }, { path: '.github/workflows/other.yml' }, { head_repository: { full_name: 'other/repo' } }]) {
    f.state.jobs[0].status = 'in_progress';
    const original = { ...f.state.run };
    Object.assign(f.state.run, patch);
    await assert.rejects(workerIdentity(client, options), /Could not verify/);
    f.state.run = original;
  }
});
test('numbered workers of one lane each verify against their own pool job', async () => {
  const f = fixture(), client = githubClient({ repository: 'owner/repo', token: 'private', fetchImpl: f.options.fetchImpl });
  f.state.jobs = [1, 2].map(worker => ({ id: 30 + worker, name: `Hauler pool / linux-transport / ${worker}`, status: 'in_progress' }));
  const verify = verifyOwners(client, { repository: 'owner/repo', defaultBranch: 'master' });
  const owner = worker => ({ ...f.owner, lane: 'linux-transport', jobId: String(30 + worker), worker });
  assert.equal(await verify(owner(1)), true);
  assert.equal(await verify(owner(2)), true);
  assert.equal(await verify({ ...owner(1), jobId: '32' }), false);
  assert.equal(await verify({ ...owner(1), worker: undefined }), false);
  const identity = { runId: '20', attempt: '2', lane: 'linux-transport', repository: 'owner/repo', defaultBranch: 'master' };
  assert.deepEqual(await workerIdentity(client, { ...identity, worker: 2 }), { runId: '20', attempt: 2, jobId: '32', worker: 2 });
  await assert.rejects(workerIdentity(client, identity), /Unique/);
  for (const worker of [0, 101, 1.5, '1']) assert.equal(checkOwner({ output: { text: ownerText({ ...owner(1), worker }) } }), null);
});
test('the unnumbered legacy pool job still verifies and rejects a numbered owner', async () => {
  const f = fixture(), client = githubClient({ repository: 'owner/repo', token: 'private', fetchImpl: f.options.fetchImpl });
  const verify = verifyOwners(client, { repository: 'owner/repo', defaultBranch: 'master' });
  assert.equal(await verify(f.owner), true);
  assert.equal(await verify({ ...f.owner, worker: 1 }), false);
});
test('planning subtracts the remaining capacity of every live worker in the lane', async () => {
  const f = fixture({ pulls: 4 });
  f.state.jobs = [1, 2].map(worker => ({ id: 30 + worker, name: `Hauler pool / linux / ${worker}`, status: 'in_progress' }));
  const claim = (number, worker) => f.check(number, { output: { text: ownerText({ ...f.owner, jobId: String(30 + worker), worker, remaining: 1 }) } });
  f.state.checks.set(1, [claim(1, 1)]);
  f.state.checks.set(2, [claim(2, 2)]);
  assert.deepEqual(await plan(f.options), { lanes: [], count: 0 });
  f.state.jobs[1].status = 'completed';
  assert.deepEqual(await plan(f.options), { lanes: ['linux'], count: 1 });
});
