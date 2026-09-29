import test from 'node:test';
import assert from 'node:assert/strict';
import { drain } from '../../src/internal/github-action/manager.mjs';
const recipe = { version: 1, trustedAuthors: ['owner'], sharedBuilds: true, requiredChecks: ['Gates'], image: { dockerfile: 'Dockerfile', context: '.' }, prepare: [], compatibilityPaths: ['Cargo.lock'], lanes: [{ id: 'linux', checkName: 'Hauler Linux', tasks: [{ id: 'first', run: 'first', timeoutSeconds: 60 }, { id: 'second', run: 'second', timeoutSeconds: 60 }] }] };
const hex = n => n.toString(16).padStart(40, '0');
function fixture({ authors = ['owner'], fail = false, change = false, prepareFail = false } = {}) {
  const events = [], checks = new Map(), prs = authors.map((login, i) => ({ number: i + 1, state: 'open', draft: false, user: { login }, head: { repo: { full_name: 'owner/repo' }, sha: hex(i * 10 + 1) }, base: { sha: hex(2) }, merge_commit_sha: hex(i * 10 + 3) }));
  let counter = 0;
  async function fetchImpl(url, options) {
    const path = new URL(url).pathname.replace('/repos/owner/repo', ''), body = options.body && JSON.parse(options.body);
    let result;
    if (path === '/pulls') result = prs;
    else if (/^\/pulls\/\d+$/.test(path)) result = prs[Number(path.split('/').at(-1)) - 1];
    else if (path.startsWith('/git/commits/')) {
      const id = path.split('/').at(-1), pr = prs.find(p => p.merge_commit_sha === id);
      result = pr ? { parents: [{ sha: pr.base.sha }, { sha: pr.head.sha }], tree: { sha: hex(100) } } : { committer: { date: id === hex(1) ? '2026-09-28T00:00:00Z' : '2026-09-27T00:00:00Z' } };
    } else if (path.startsWith('/check-runs/') && options.method === 'GET') result = checks.get(Number(path.split('/').at(-1)));
    else if (path.includes('/check-runs') && options.method === 'GET') {
      const head = path.split('/')[2];
      result = { check_runs: [{ name: 'Gates', app: { slug: 'github-actions' }, status: 'completed', conclusion: 'success' }, ...[...checks.values()].filter(c => c.head_sha === head)] };
    } else if (path.startsWith('/git/trees/')) result = { tree: [{ path: 'Cargo.lock', sha: hex(200), mode: '100644' }] };
    else if (path === '/check-runs' && options.method === 'POST') { result = { ...body, id: ++counter, app: { slug: 'github-actions' } }; checks.set(counter, result); events.push(['create', body.head_sha]); }
    else if (path.startsWith('/check-runs/') && options.method === 'PATCH') { result = Object.assign(checks.get(Number(path.split('/').at(-1))), body); if (body.conclusion) events.push(['report', body.conclusion]); }
    else throw new Error(`Unexpected route ${path}`);
    return { ok: true, json: async () => structuredClone(result) };
  }
  let builds = 0;
  async function sandboxFactory() {
    builds++;
    return { async prepare() { if (prepareFail) throw new Error('private worker diagnostic'); }, async run(command) { events.push(['run', command]); if (change) prs[0].head.sha = hex(500); return { exitCode: fail && command === 'first' ? 1 : 0 }; }, async close() { events.push(['close']); } };
  }
  const options = { recipe, lane: 'linux', repository: 'owner/repo', token: 'not-logged', root: '/tmp', image: 'trusted', actionIdentity: 'abc', manualAdmission: true, maxMinutes: 1, maxSnapshots: 3, fetchImpl, sandboxFactory };
  return { options, events, checks, prs, builds: () => builds };
}
test('publishes first failure before running remaining task and preserves failure', async () => {
  const f = fixture({ fail: true }), result = await drain(f.options);
  assert.equal(result.snapshots[0].conclusion, 'failure');
  assert.deepEqual(f.events.slice(1, 5), [['run', 'first'], ['report', 'failure'], ['run', 'second'], ['report', 'failure']]);
  assert.equal(result.snapshots[0].tasks.length, 2);
});
test('cancels superseded snapshot, never posts success', async () => {
  const f = fixture({ change: true }), result = await drain({ ...f.options, maxSnapshots: 1 });
  assert.equal(result.snapshots[0].conclusion, 'cancelled');
  assert.ok(!f.events.some(e => e[1] === 'success'));
});
test('preparation failure cannot claim a complete task set', async () => {
  const f = fixture({ prepareFail: true }), result = await drain(f.options);
  assert.equal(result.snapshots[0].conclusion, 'failure');
  assert.equal(result.snapshots[0].tasks.length, 0);
});
test('exact own completed check skips work, differing identity runs again', async () => {
  const f = fixture();
  await drain(f.options);
  assert.equal((await drain(f.options)).snapshots.length, 0);
  assert.equal((await drain({ ...f.options, actionIdentity: 'new' })).snapshots.length, 1);
});
test('untrusted authors never enter sandbox; oldest head first with compatible pool reuse', async () => {
  const f = fixture({ authors: ['owner', 'owner', 'stranger'] }), result = await drain(f.options);
  assert.deepEqual(result.snapshots.map(s => s.pr), [2, 1]);
  assert.equal(f.builds(), 1);
});
test('failed cheap gates prevent admission', async () => {
  const f = fixture();
  const fetchImpl = async (...args) => { const r = await f.options.fetchImpl(...args); const data = await r.json(); if (data.check_runs) data.check_runs[0].conclusion = 'failure'; return { ...r, json: async () => data }; };
  assert.equal((await drain({ ...f.options, fetchImpl })).snapshots.length, 0);
  assert.equal(f.builds(), 0);
});
test('poll aborts an active stale task and prevents remaining tasks', async () => {
  const f = fixture();
  f.options.sandboxFactory = async () => ({ async prepare() {}, async close() {}, async run(command, { signal }) {
    f.events.push(['run', command]);
    f.prs[0].head.sha = hex(400);
    await new Promise(resolve => signal.addEventListener('abort', resolve, { once: true }));
    return { exitCode: 130 };
  } });
  const result = await drain({ ...f.options, maxSnapshots: 1, pollMilliseconds: 5 });
  assert.equal(result.snapshots[0].conclusion, 'cancelled');
  assert.equal(result.snapshots[0].tasks.length, 1);
  assert.ok(!f.events.some(e => e[1] === 'success' || e[1] === 'second'));
});
test('aborted controller admits no work', async () => {
  const f = fixture(), controller = new AbortController();
  controller.abort();
  assert.equal((await drain({ ...f.options, signal: controller.signal })).snapshots.length, 0);
});
test('third-party completed checks never suppress our tests', async () => {
  const f = fixture();
  await drain(f.options);
  for (const c of f.checks.values()) c.app.slug = 'other-app';
  assert.equal((await drain(f.options)).snapshots.length, 1);
});
test('report collection failure cannot publish success', async () => {
  const f = fixture(), original = f.options.sandboxFactory;
  f.options.sandboxFactory = async (...args) => ({ ...await original(...args), async exportReports() { throw new Error('private report error'); } });
  const result = await drain({ ...f.options, recipe: { ...recipe, reports: ['target/reports/'] } });
  assert.equal(result.snapshots[0].conclusion, 'failure');
  assert.equal(result.snapshots[0].infrastructureError, true);
  assert.ok(!f.events.some(e => e[1] === 'success'));
});
test('a merge commit with different parents is never tested', async () => {
  const f = fixture(), original = f.options.fetchImpl;
  const fetchImpl = async (...args) => { const r = await original(...args), data = await r.json(); if (data.parents) data.parents[0].sha = hex(999); return { ...r, json: async () => data }; };
  assert.equal((await drain({ ...f.options, fetchImpl })).snapshots.length, 0);
  assert.equal(f.builds(), 0);
});
test('base advancement finishes the admitted snapshot and does not retest unchanged head', async () => {
  const f = fixture(), original = f.options.sandboxFactory;
  let admitted;
  f.options.sandboxFactory = async (...args) => {
    const sandbox = await original(...args);
    return { ...sandbox, async prepare(snapshot) { admitted = snapshot; }, async run(command, options) {
      f.prs[0].mergeable = false;
      f.prs[0].base.sha = hex(800);
      f.prs[0].merge_commit_sha = hex(801);
      return sandbox.run(command, options);
    } };
  };
  const result = await drain(f.options);
  assert.equal(result.snapshots.length, 1);
  assert.equal(result.snapshots[0].conclusion, 'success');
  assert.equal(result.snapshots[0].base, hex(2));
  assert.equal(result.snapshots[0].merge, hex(3));
  assert.equal(admitted.base, hex(2));
  const check = [...f.checks.values()][0];
  assert.ok(check.output.summary.includes(`pinned base ${hex(2)}, merge ${hex(3)}`));
  assert.equal((await drain(f.options)).snapshots.length, 0);
});
test('failure summary reports task identity and exit code without worker logs', async () => {
  const f = fixture({ fail: true }), result = await drain(f.options);
  assert.equal(result.snapshots[0].tasks[0].exitCode, 1);
  assert.ok([...f.checks.values()][0].output.summary.includes('first (exit 1)'));
});
test('image preparation receives the snapshot deadline signal', async () => {
  const f = fixture(), original = f.options.sandboxFactory;
  let preparationSignal;
  f.options.sandboxFactory = async options => { preparationSignal = options.preparationSignal; return original(options); };
  await drain(f.options);
  assert.ok(preparationSignal instanceof AbortSignal);
});
test('infrastructure failure retries the same head while task failure remains terminal', async () => {
  const f = fixture({ prepareFail: true });
  const first = await drain(f.options);
  assert.equal(first.snapshots[0].infrastructureError, true);
  assert.ok([...f.checks.values()][0].external_id.endsWith(':infrastructure'));
  f.options.sandboxFactory = async () => ({ async prepare() {}, async run() { return { exitCode: 0 }; }, async close() {} });
  const retry = await drain(f.options);
  assert.equal(retry.snapshots.length, 1);
  assert.equal(retry.snapshots[0].conclusion, 'success');
  const failure = fixture({ fail: true });
  await drain(failure.options);
  assert.equal((await drain(failure.options)).snapshots.length, 0);
});
test('delegated drain updates queued check ID and rejects absent or native receipts', async () => {
  const f = fixture(), policy = 'a'.repeat(64), original = f.options.fetchImpl;
  const queued = { id: 99, name: 'Hauler Linux', head_sha: hex(1), external_id: `hauler:linux:${hex(1)}:${policy}:run:10`, app: { slug: 'github-actions' }, status: 'queued' };
  f.checks.set(99, queued);
  let decision = null;
  const fetchImpl = async (url, options) => {
    if (url.includes('/actions/workflows/')) return { ok: true, json: async () => ({ workflow_runs: [{ id: 10, event: 'pull_request', head_sha: hex(1), path: '.github/workflows/ci.yml', run_attempt: 1, pull_requests: [{ number: 1 }] }] }) };
    if (url.includes('/actions/runs/10/')) return { ok: true, json: async () => ({ jobs: [{ steps: decision ? [{ name: `Hauler route / ${decision} / ${policy}`, conclusion: 'success' }] : [] }] }) };
    return original(url, options);
  };
  const options = { ...f.options, manualAdmission: false, policy, fetchImpl };
  assert.equal((await drain(options)).snapshots.length, 0);
  decision = 'delegated';
  assert.equal((await drain(options)).snapshots[0].conclusion, 'success');
  assert.equal(f.checks.get(99).conclusion, 'success');
  assert.ok(f.checks.get(99).external_id.endsWith(':run:10'));
  assert.ok(!f.events.some(e => e[0] === 'create'));
});

test('automatic delegated recovery retries infrastructure failure and cancels native queued markers', async () => {
  const f = fixture({ prepareFail: true }), policy = 'b'.repeat(64), original = f.options.fetchImpl;
  f.checks.set(99, { id: 99, name: 'Hauler Linux', head_sha: hex(1), external_id: `hauler:linux:${hex(1)}:${policy}:run:10`, app: { slug: 'github-actions' }, status: 'queued' });
  let decision = 'delegated';
  const fetchImpl = async (url, options) => {
    if (url.includes('/actions/workflows/')) return { ok: true, json: async () => ({ workflow_runs: [{ id: 10, event: 'pull_request', head_sha: hex(1), path: '.github/workflows/ci.yml', run_attempt: 1, pull_requests: [{ number: 1 }] }] }) };
    if (url.includes('/actions/runs/10/')) return { ok: true, json: async () => ({ jobs: [{ steps: [{ name: `Hauler route / ${decision} / ${policy}`, conclusion: 'success' }] }] }) };
    return original(url, options);
  };
  const options = { ...f.options, manualAdmission: false, policy, fetchImpl };
  assert.equal((await drain(options)).snapshots[0].infrastructureError, true);
  assert.ok(f.checks.get(99).external_id.endsWith(':run:10:infrastructure'));
  const sandboxFactory = async () => ({ async prepare() {}, async run() { return { exitCode: 0 }; }, async close() {} });
  assert.equal((await drain({ ...options, sandboxFactory })).snapshots[0].conclusion, 'success');
  assert.ok([...f.checks.values()].some(c => c.conclusion === 'success' && c.external_id.endsWith(':run:10')));
  f.checks.clear();
  f.checks.set(98, { id: 98, name: 'Hauler Linux', head_sha: hex(1), external_id: `hauler:linux:${hex(1)}:${policy}:run:10`, app: { slug: 'github-actions' }, status: 'queued' });
  decision = 'native';
  assert.equal((await drain({ ...options, sandboxFactory })).snapshots.length, 0);
  assert.equal(f.checks.get(98).conclusion, 'cancelled');
});

test('drain cleans only its queued conflicted-head markers without a merge or receipt', async () => {
  const f = fixture(), policy = 'c'.repeat(64);
  f.prs[0].mergeable = false; f.prs[0].merge_commit_sha = null;
  const queued = { id: 90, name: 'Hauler Linux', head_sha: hex(1), external_id: `hauler:linux:${hex(1)}:${policy}:run:10`, app: { slug: 'github-actions' }, status: 'queued' };
  for (const [index, override] of [{}, { status: 'in_progress' }, { status: 'completed', conclusion: 'success' }, { external_id: `hauler:linux:${hex(1)}:${'d'.repeat(64)}:run:10` }, { app: { slug: 'another-app' } }, { head_sha: hex(9), external_id: `hauler:linux:${hex(9)}:${policy}:run:10` }, { name: 'Other lane', external_id: `hauler:other:${hex(1)}:${policy}:run:10` }].entries()) f.checks.set(90 + index, { ...queued, ...override, id: 90 + index });
  assert.equal((await drain({ ...f.options, manualAdmission: false, policy })).snapshots.length, 0);
  assert.equal(f.checks.get(90).conclusion, 'cancelled');
  assert.equal(f.checks.get(91).status, 'in_progress');
  assert.equal(f.checks.get(92).conclusion, 'success');
  for (const id of [93, 94, 95, 96]) assert.equal(f.checks.get(id).status, 'queued');
  assert.equal(f.builds(), 0);
});
test('cleanup rechecks conflict, head and queued state before cancellation', async () => {
  for (const race of ['head', 'conflict', 'running']) {
    const f = fixture(), policy = 'e'.repeat(64), original = f.options.fetchImpl;
    f.prs[0].mergeable = false; f.prs[0].merge_commit_sha = null;
    f.checks.set(90, { id: 90, name: 'Hauler Linux', head_sha: hex(1), external_id: `hauler:linux:${hex(1)}:${policy}:run:10`, app: { slug: 'github-actions' }, status: 'queued' });
    let reads = 0;
    const fetchImpl = async (url, options) => {
      const response = await original(url, options), data = await response.json();
      if (url.endsWith('/pulls/1') && ++reads === 2) { if (race === 'head') data.head.sha = hex(99); if (race === 'conflict') data.mergeable = true; }
      if (race === 'running' && url.endsWith('/check-runs/90') && options.method === 'GET') data.status = 'in_progress';
      return { ...response, json: async () => data };
    };
    assert.equal((await drain({ ...f.options, manualAdmission: false, policy, fetchImpl })).snapshots.length, 0);
    assert.equal(f.checks.get(90).status, 'queued');
  }
});
