import { githubClient, receipt } from './github.mjs';
import { checkIdentity, checkMetadata, matchesCheck, trustedPull } from './policy.mjs';
import { parseRecipe } from './recipe.mjs';
import { checkOwner, ownerKey, verifyOwners } from './ownership.mjs';
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);

export async function readSnapshot(client, pr) {
  if (!pr || pr.mergeable === false || !sha(pr.head?.sha) || !sha(pr.base?.sha) || !sha(pr.merge_commit_sha)) return null;
  const merge = await client.api(`/git/commits/${pr.merge_commit_sha}`);
  if (merge.parents?.length !== 2 || merge.parents[0].sha !== pr.base.sha || merge.parents[1].sha !== pr.head.sha) return null;
  return { pr: pr.number, head: pr.head.sha, base: pr.base.sha, merge: pr.merge_commit_sha, tree: merge.tree.sha, updatedAt: pr.updated_at };
}

export async function scanAdmission(client, { recipe, repository, policy, lanes = recipe.lanes, admissionWorkflow = 'ci.yml', managerWorkflow = 'hauler-ci.yml', defaultBranch, worker, manualAdmission = false, onlyPullRequests, attempted = new Set(), deadline = Infinity, signal }) {
  if (onlyPullRequests && (!Array.isArray(onlyPullRequests) || onlyPullRequests.some(n => !Number.isSafeInteger(n) || n < 1))) throw new TypeError('Invalid pull request selection');
  const candidates = [], maintenance = [], owners = new Map(), ownedChecks = new Set();
  const live = verifyOwners(client, { repository, workflow: managerWorkflow, defaultBranch });
  const pulls = onlyPullRequests ? onlyPullRequests.map(number => ({ number })) : await client.pages('/pulls?state=open&sort=created&direction=asc');
  for (const listed of pulls) {
    if (Date.now() >= deadline || signal?.aborted) break;
    const pr = await client.api(`/pulls/${listed.number}`);
    if (!trustedPull(pr, repository, recipe) || attempted.has(pr.head.sha)) continue;
    const checks = await client.pages(`/commits/${pr.head.sha}/check-runs?filter=latest`, 'check_runs');
    const pending = [], nativeQueued = [];
    for (const lane of lanes) {
      const identity = checkIdentity(pr.head.sha, lane.id, policy);
      const own = checks.filter(c => c.name === lane.checkName && c.app?.slug === 'github-actions' && c.head_sha === pr.head.sha);
      for (const check of own) {
        const owner = checkOwner(check);
        if (!owner || owner.lane !== lane.id || checkMetadata(check.external_id)?.identity !== identity || worker && ownerKey(owner) === ownerKey(worker)) continue;
        if (await live(owner)) {
          if (!owner.finished) ownedChecks.add(check.id);
          const key = ownerKey(owner), prior = owners.get(key);
          if (!prior || owner.ordinal > prior.ordinal || owner.ordinal === prior.ordinal && owner.finished) owners.set(key, owner);
        }
      }
      const queued = own.find(c => matchesCheck(c, identity) && ['queued', 'in_progress'].includes(c.status));
      for (const check of own) if (check.status === 'queued' && checkMetadata(check.external_id)?.identity.startsWith(checkIdentity(pr.head.sha, lane.id, '')) && (pr.mergeable !== false || !matchesCheck(check, identity))) nativeQueued.push({ lane, queued: check });
      if (pr.mergeable === false) {
        if (own.some(c => matchesCheck(c, identity) && c.status === 'queued')) maintenance.push({ kind: 'conflict', lane, pr, checks });
        continue;
      }
      if (own.some(c => matchesCheck(c, identity) && c.status === 'completed' && ['success', 'failure'].includes(c.conclusion) && checkOwner(c)?.finished !== false)) continue;
      const retry = own.find(c => c.status === 'completed' && (checkMetadata(c.external_id)?.identity === identity && checkMetadata(c.external_id)?.infrastructure || matchesCheck(c, identity) && (c.conclusion === 'cancelled' || checkOwner(c)?.finished === false)));
      if (manualAdmission || queued || retry) pending.push({ lane, queued, retry });
    }
    if (!pending.length && !nativeQueued.length) continue;
    if (!manualAdmission) {
      const decision = await receipt(client, { workflow: admissionWorkflow, head: pr.head.sha, pr: pr.number, policy });
      if (decision !== 'delegated') {
        if (decision === 'native') for (const item of nativeQueued) maintenance.push({ kind: 'native', ...item, pr });
        continue;
      }
    }
    if (!pending.length) continue;
    if (!recipe.requiredChecks.every(name => checks.some(c => c.name === name && c.app?.slug === 'github-actions' && c.status === 'completed' && c.conclusion === 'success'))) continue;
    const snapshot = await readSnapshot(client, pr);
    if (!snapshot) continue;
    const commit = await client.api(`/git/commits/${pr.head.sha}`);
    const readyAt = recipe.requiredChecks.length
      ? Math.max(Date.parse(commit.committer?.date) || 0, ...checks.filter(c => recipe.requiredChecks.includes(c.name)).map(c => Date.parse(c.completed_at) || 0))
      : Date.parse(pr.updated_at) || Date.parse(commit.committer?.date) || Date.now();
    for (const item of pending) candidates.push({ lane: item.lane, snapshot: { ...snapshot, readyAt, queued: item.queued, retry: item.retry } });
  }
  candidates.sort((a, b) => a.snapshot.readyAt - b.snapshot.readyAt || a.snapshot.pr - b.snapshot.pr);
  const capacity = new Map();
  for (const owner of owners.values()) capacity.set(owner.lane, (capacity.get(owner.lane) ?? 0) + owner.remaining);
  return { candidates: candidates.filter(item => {
    if (ownedChecks.has(item.snapshot.queued?.id) || ownedChecks.has(item.snapshot.retry?.id)) return false;
    const available = capacity.get(item.lane.id) ?? 0;
    if (available) { capacity.set(item.lane.id, available - 1); return false; }
    return true;
  }), maintenance };
}

export async function plan({ recipe: input, repository, token, policy, fetchImpl, ...options }) {
  const recipe = parseRecipe(input);
  if (typeof policy !== 'string' || !/^[a-f0-9]{64}$/.test(policy)) throw new TypeError('Invalid policy identity');
  const client = githubClient({ repository, token, fetchImpl, signal: options.signal });
  const { candidates, maintenance } = await scanAdmission(client, { ...options, recipe, repository, policy });
  const needed = new Set([...candidates, ...maintenance].map(item => item.lane.id));
  const lanes = recipe.lanes.filter(lane => needed.has(lane.id)).map(lane => lane.id);
  return { lanes, count: lanes.length };
}
