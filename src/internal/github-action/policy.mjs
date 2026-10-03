import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { parseRecipe } from './recipe.mjs';
import { githubClient, receipt } from './github.mjs';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const checkIdentity = (head, lane, policy) => `hauler:${lane}:${head}:${policy}`;
export function checkMetadata(externalId) {
  if (typeof externalId !== 'string') return null;
  const match = /^(hauler:[a-z][a-z0-9-]{0,47}:[a-f0-9]{40}:[a-f0-9]{64})(?::run:([1-9][0-9]{0,19}))?(:infrastructure)?$/.exec(externalId);
  return match && match[0] === externalId ? { identity: match[1], runId: match[2], infrastructure: Boolean(match[3]) } : null;
}
export const matchesCheck = (check, identity) => {
  const metadata = checkMetadata(check.external_id);
  return metadata?.identity === identity && !metadata.infrastructure;
};
export const trustedPull = (pr, repository, recipe) => pr.state === 'open' && !pr.draft && pr.head?.repo?.full_name === repository && /^[a-f0-9]{40}$/.test(pr.head?.sha ?? '') && recipe.trustedAuthors.some(a => a.toLowerCase() === pr.user?.login?.toLowerCase());
export async function loadPolicy({ repository, token, actionRef, recipePath = '.github/hauler-ci.json', ref, fetchImpl, signal }) {
  if (!/^[a-f0-9]{40}$/.test(actionRef ?? '') || !/^[\w./-]+$/.test(recipePath) || recipePath.startsWith('/') || recipePath.split('/').some(p => p === '..' || !p)) throw new TypeError('Invalid trusted policy reference');
  const client = githubClient({ repository, token, fetchImpl, signal });
  const repo = await client.api('');
  if (repo.private !== false || repo.full_name !== repository || !repo.default_branch) throw new Error('Public repository required');
  const commit = await client.api(`/commits/${encodeURIComponent(ref ?? repo.default_branch)}`);
  if (!/^[a-f0-9]{40}$/.test(commit.sha ?? '')) throw new Error('Invalid policy revision');
  const file = await client.api(`/contents/${recipePath}?ref=${commit.sha}`);
  if (file.type !== 'file' || file.encoding !== 'base64' || file.size > 1024 * 1024) throw new Error('Invalid recipe file');
  const recipe = parseRecipe(JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')));
  const tree = await client.api(`/git/trees/${commit.commit.tree.sha}?recursive=1`);
  if (tree.truncated || !Array.isArray(tree.tree)) throw new Error('Incomplete policy tree');
  const context = recipe.image.context.replace(/\/$/, '');
  const entries = tree.tree.filter(e => e.path === recipe.image.dockerfile || context === '.' || e.path === context || e.path.startsWith(`${context}/`)).map(e => [e.path, e.mode, e.sha]).sort((a, b) => a[0].localeCompare(b[0]));
  if (context !== '.' && !tree.tree.some(e => e.path === context && e.mode === '040000')) throw new Error('Invalid image context');
  const dockerfile = tree.tree.find(e => e.path === recipe.image.dockerfile);
  if (!dockerfile || !['100644', '100755'].includes(dockerfile.mode) || !entries.length) throw new Error('Invalid trusted image');
  return { recipe, policy: hash({ actionRef, recipe, entries }), ref: commit.sha, defaultBranch: repo.default_branch, client };
}
async function changesPolicy(client, pr, recipePath, recipe) {
  if (!Number.isSafeInteger(pr.changed_files) || pr.changed_files < 0 || pr.changed_files > 3000) throw new Error('Incomplete PR change list');
  const context = recipe.image.context.replace(/\/$/, '');
  const policyPath = recipePath.split('/').filter(part => part !== '.').join('/');
  const protectedPath = path => path === '.github' || path.startsWith('.github/') || path === policyPath || path === recipe.image.dockerfile || context === '.' || path === context || path.startsWith(`${context}/`);
  const seen = new Set();
  for (let offset = 0; offset < pr.changed_files; offset += 100) {
    const files = await client.api(`/pulls/${pr.number}/files?per_page=100&page=${offset / 100 + 1}`);
    if (!Array.isArray(files) || files.length !== Math.min(100, pr.changed_files - offset)) throw new Error('Incomplete PR change list');
    for (const file of files) {
      if (typeof file.filename !== 'string' || !file.filename || seen.has(file.filename) || (file.status === 'renamed' && typeof file.previous_filename !== 'string') || (file.previous_filename !== undefined && typeof file.previous_filename !== 'string')) throw new Error('Invalid PR change list');
      seen.add(file.filename);
      if (protectedPath(file.filename) || file.previous_filename !== undefined && protectedPath(file.previous_filename)) return true;
    }
  }
  return false;
}
export async function route(options) {
  const controller = new AbortController();
  const managerWait = Math.max(0, options.managerWaitMilliseconds ?? 0);
  const timer = setTimeout(() => controller.abort(), 30000 + managerWait);
  let policy = 'unavailable';
  try {
    const loaded = await loadPolicy({ ...options, signal: controller.signal }), { recipe, client, defaultBranch } = loaded;
    policy = loaded.policy;
    let checkedBase;
    const deadline = Date.now() + Math.min(30000, Math.max(0, options.waitMilliseconds ?? 30000)), managerDeadline = Date.now() + managerWait;
    const provenance = new Map();
    function managerOwns(check) {
      const runId = checkMetadata(check.external_id)?.runId;
      if (!provenance.has(runId)) provenance.set(runId, queuedByManager(client, check, options.repository, options.managerWorkflow ?? 'hauler-ci.yml', defaultBranch));
      return provenance.get(runId);
    }
    for (;;) {
      const pr = await client.api(`/pulls/${options.pr}`);
      if (!trustedPull(pr, options.repository, recipe) || pr.head.sha !== options.head) return { decision: 'native', policy };
      if (!/^[a-f0-9]{40}$/.test(pr.base?.sha ?? '')) return { decision: 'native', policy };
      if (checkedBase !== pr.base.sha) {
        if (await changesPolicy(client, pr, options.recipePath ?? '.github/hauler-ci.json', recipe)) return { decision: 'native', policy };
        const confirmed = await client.api(`/pulls/${options.pr}`);
        if (!trustedPull(confirmed, options.repository, recipe) || confirmed.head.sha !== options.head || confirmed.changed_files !== pr.changed_files || confirmed.base?.sha !== pr.base.sha) return { decision: 'native', policy };
        checkedBase = pr.base.sha;
      }
      const checks = await client.pages(`/commits/${options.head}/check-runs?filter=latest`, 'check_runs');
      const owned = recipe.lanes.map(l => checks.find(c => c.name === l.checkName && c.app?.slug === 'github-actions' && matchesCheck(c, checkIdentity(options.head, l.id, policy)) && (['queued', 'in_progress'].includes(c.status) || c.status === 'completed' && ['success', 'failure'].includes(c.conclusion))));
      if (owned.every(Boolean) && (await Promise.all(owned.map(managerOwns))).every(Boolean)) return { decision: 'delegated', policy };
      if (Date.now() < deadline) await delay(Math.min(5000, deadline - Date.now()));
      else if (!await managerRunSettles(client, options, managerDeadline)) break;
    }
    return { decision: 'native', policy };
  } catch { return { decision: 'native', policy }; }
  finally { clearTimeout(timer); }
}
export async function cancelNativeCheck(client, { pr, queued, lane, recipe, repository, policy, admissionWorkflow }) {
  const current = await client.api(`/pulls/${pr.number}`);
  if (!trustedPull(current, repository, recipe) || current.head.sha !== pr.head.sha) return;
  if (await receipt(client, { workflow: admissionWorkflow, head: pr.head.sha, pr: pr.number, policy }) !== 'native') return;
  const latest = await client.api(`/check-runs/${queued.id}`);
  if (latest.status !== 'queued' || latest.head_sha !== pr.head.sha || latest.external_id !== queued.external_id || latest.name !== lane.checkName || latest.app?.slug !== 'github-actions' || !checkMetadata(latest.external_id)?.identity.startsWith(checkIdentity(pr.head.sha, lane.id, ''))) return;
  await client.api(`/check-runs/${queued.id}`, 'PATCH', { status: 'completed', conclusion: 'cancelled', completed_at: new Date().toISOString(), output: { title: 'Native CI owns this head', summary: 'Native CI fallback declined Hauler delegation.' } });
}
export async function cancelConflictedChecks(client, { pr, recipe, repository, policy, lanes = recipe.lanes, checks }) {
  if (pr.mergeable !== false) return;
  const queued = checks.filter(check => check.status === 'queued' && check.head_sha === pr.head.sha && check.app?.slug === 'github-actions' && lanes.some(lane => check.name === lane.checkName && matchesCheck(check, checkIdentity(pr.head.sha, lane.id, policy))));
  if (!queued.length) return;
  const current = await client.api(`/pulls/${pr.number}`);
  if (!trustedPull(current, repository, recipe) || current.head.sha !== pr.head.sha || current.mergeable !== false) return;
  for (const check of queued) {
    const latest = await client.api(`/check-runs/${check.id}`);
    if (latest.status !== 'queued' || latest.head_sha !== check.head_sha || latest.external_id !== check.external_id || latest.name !== check.name || latest.app?.slug !== 'github-actions') continue;
    await client.api(`/check-runs/${check.id}`, 'PATCH', { status: 'completed', conclusion: 'cancelled', completed_at: new Date().toISOString(), output: { title: 'Merge conflicts block admission', summary: 'Resolve this PR head’s merge conflicts before Hauler can admit a test snapshot.' } });
  }
}
export async function enqueue({ recipe, policy, client, repository, onlyPullRequests, admissionWorkflow = 'ci.yml', managerRunId }) {
  if (!/^[1-9][0-9]{0,19}$/.test(String(managerRunId))) throw new TypeError('Manager run identity required');
  const queued = [];
  for (const listed of await client.pages('/pulls?state=open&sort=created&direction=asc')) {
    if (onlyPullRequests && !onlyPullRequests.includes(listed.number)) continue;
    const pr = await client.api(`/pulls/${listed.number}`);
    if (!trustedPull(pr, repository, recipe) || pr.mergeable === false) continue;
    const checks = await client.pages(`/commits/${pr.head.sha}/check-runs?filter=latest`, 'check_runs');
    if (await receipt(client, { workflow: admissionWorkflow, head: pr.head.sha, pr: pr.number, policy }) === 'native') continue;
    for (const lane of recipe.lanes) {
      const identity = checkIdentity(pr.head.sha, lane.id, policy);
      const external_id = `${identity}:run:${managerRunId}`;
      if (checks.some(c => c.name === lane.checkName && c.app?.slug === 'github-actions' && matchesCheck(c, identity) && (c.status !== 'completed' || ['success', 'failure'].includes(c.conclusion)))) continue;
      const result = await client.api('/check-runs', 'POST', { name: lane.checkName, head_sha: pr.head.sha, external_id, details_url: `https://github.com/${repository}/actions/runs/${managerRunId}`, status: 'queued', output: { title: 'Hauler admission queued', summary: 'Waiting for native CI delegation and repository gates.' } });
      queued.push({ pr: pr.number, lane: lane.id, check: result.id });
    }
  }
  return { queued };
}

// Late enqueue on a saturated runner pool must not lock a head to native, so route outwaits the
// manager run for this head. Only that one run is polled; delegation still needs owned checks.
async function managerRunSettles(client, { head, managerWorkflow = 'hauler-ci.yml' }, deadline) {
  if (Date.now() >= deadline || !/^[\w.-]+\.ya?ml$/.test(managerWorkflow)) return false;
  const { workflow_runs: runs } = await client.api(`/actions/workflows/${managerWorkflow}/runs?event=pull_request_target&head_sha=${head}&per_page=10`);
  let run = runs?.find(r => r.head_sha === head && r.status !== 'completed');
  while (run && run.status !== 'completed') {
    if (Date.now() >= deadline) return false;
    await delay(Math.min(10000, deadline - Date.now()));
    run = await client.api(`/actions/runs/${run.id}`);
  }
  return Boolean(run);
}
async function queuedByManager(client, check, repository, workflow, defaultBranch) {
  if (!/^[\w.-]+\.ya?ml$/.test(workflow)) return false;
  const id = checkMetadata(check.external_id)?.runId;
  if (!id) return false;
  const run = await client.api(`/actions/runs/${id}`);
  const trustedEvent = ['pull_request_target', 'workflow_run', 'schedule', 'workflow_dispatch', 'push'].includes(run.event);
  return trustedEvent && run.path?.split('@')[0] === `.github/workflows/${workflow}` && run.head_repository?.full_name === repository && (run.event === 'pull_request_target' || run.head_branch === defaultBranch);
}
