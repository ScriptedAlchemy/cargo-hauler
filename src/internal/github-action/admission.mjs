import { githubClient, routeDecision, workflowPath } from './github.mjs';
import { checkIdentity, checkMetadata, matchesCheck, trustedPull } from './policy.mjs';
import { parseRecipe } from './recipe.mjs';
import { checkOwner, ownerKey, verifyOwners } from './ownership.mjs';
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);

const connection = (name, type, args, nodes) => ({ name, type, text: after => `${name}(${args},after:${after}){pageInfo{hasNextPage endCursor}nodes{${nodes}}}` });
const RUNS = connection('checkRuns', 'CheckSuite', 'first:50,filterBy:{checkType:LATEST}', 'databaseId name status conclusion externalId completedAt detailsUrl text');
// 15368 is the GitHub Actions app. Every scan rule ignores checks from other apps.
const SUITES = connection('checkSuites', 'Commit', 'first:10,filterBy:{appId:15368}', `id app{slug} workflowRun{databaseId event file{path}} ${RUNS.text(null)}`);
const STEPS = connection('steps', 'CheckRun', 'first:100', 'name conclusion');
const STEP_RUNS = connection('checkRuns', 'CheckSuite', 'first:50,filterBy:{checkType:LATEST}', `id ${STEPS.text(null)}`);
const MATCHING = connection('matchingPullRequests', 'CheckSuite', 'first:100', 'number');
const PULL = `number isDraft state author{login} headRepository{nameWithOwner} headRefOid baseRefOid mergeable updatedAt potentialMergeCommit{oid tree{oid} parents(first:3){nodes{oid}}} commits(last:1){nodes{commit{id oid committedDate ${SUITES.text(null)}}}}`;
const OPEN = `query($owner:String!,$name:String!,$after:String){rateLimit{cost remaining} repository(owner:$owner,name:$name){pullRequests(states:OPEN,first:100,after:$after,orderBy:{field:CREATED_AT,direction:ASC}){pageInfo{hasNextPage endCursor}nodes{${PULL}}}}}`;
const RECEIPTS = `query($ids:[ID!]!){rateLimit{cost remaining} nodes(ids:$ids){...on CheckSuite{id ${MATCHING.text(null)} ${STEP_RUNS.text(null)}}}}`;
const MERGEABLE = { MERGEABLE: true, CONFLICTING: false };

async function allNodes(client, { name, type, text }, owner) {
  const rows = [...owner[name].nodes];
  for (let info = owner[name].pageInfo, page = 1; info.hasNextPage; page++) {
    if (page === 100) throw new Error('GitHub listing exceeded limit');
    const next = (await client.graphql(`query($id:ID!,$after:String){node(id:$id){...on ${type}{${text('$after')}}}}`, { id: owner.id, after: info.endCursor })).node[name];
    rows.push(...next.nodes);
    info = next.pageInfo;
  }
  return rows;
}

async function pullRequests(client, repository, numbers) {
  const [owner, name] = repository.split('/'), nodes = [];
  if (numbers) {
    for (let i = 0; i < numbers.length; i += 100) {
      const batch = numbers.slice(i, i + 100);
      const { repository: repo } = await client.graphql(`query($owner:String!,$name:String!){rateLimit{cost remaining} repository(owner:$owner,name:$name){${batch.map(n => `p${n}:pullRequest(number:${n}){${PULL}}`).join(' ')}}}`, { owner, name });
      nodes.push(...batch.map(n => repo[`p${n}`]));
    }
    return nodes;
  }
  for (let after = null, page = 1; ; page++) {
    if (page > 100) throw new Error('GitHub listing exceeded limit');
    const { pullRequests: list } = (await client.graphql(OPEN, { owner, name, after })).repository;
    nodes.push(...list.nodes);
    if (!list.pageInfo.hasNextPage) return nodes;
    after = list.pageInfo.endCursor;
  }
}

function adapt(node) {
  const merge = node.potentialMergeCommit;
  return {
    pr: { number: node.number, state: node.state.toLowerCase(), draft: node.isDraft, user: { login: node.author?.login }, head: { sha: node.headRefOid, repo: { full_name: node.headRepository?.nameWithOwner } }, base: { sha: node.baseRefOid }, mergeable: MERGEABLE[node.mergeable] ?? null, merge_commit_sha: merge?.oid ?? null, updated_at: node.updatedAt },
    merge: merge && { tree: { sha: merge.tree.oid }, parents: merge.parents.nodes.map(p => ({ sha: p.oid })) },
    commit: node.commits.nodes[0]?.commit
  };
}

// Matches REST `check-runs?filter=latest`, the latest run per name within each suite, newest first.
async function checkRuns(client, commit) {
  const suites = await allNodes(client, SUITES, commit), checks = [];
  for (const suite of suites) {
    for (const run of await allNodes(client, RUNS, suite)) checks.push({ id: run.databaseId, name: run.name, status: run.status.toLowerCase(), conclusion: run.conclusion?.toLowerCase() ?? null, external_id: run.externalId, completed_at: run.completedAt, details_url: run.detailsUrl, output: { text: run.text }, head_sha: commit.oid, app: { slug: suite.app?.slug } });
  }
  return { suites, checks: checks.sort((a, b) => b.id - a.id) };
}

async function receipts(client, items, workflow, policy) {
  const path = workflowPath(workflow);
  const admission = items.map(item => item.suites.filter(s => s.workflowRun?.event === 'pull_request' && s.workflowRun.file?.path?.split('@')[0] === path));
  const ids = [...new Set(admission.flat().map(s => s.id))], found = new Map();
  for (let i = 0; i < ids.length; i += 100) {
    for (const suite of (await client.graphql(RECEIPTS, { ids: ids.slice(i, i + 100) })).nodes) {
      const steps = [];
      for (const run of await allNodes(client, STEP_RUNS, suite)) steps.push(...(await allNodes(client, STEPS, run)).map(s => ({ name: s.name, conclusion: s.conclusion?.toLowerCase() })));
      found.set(suite.id, { pulls: (await allNodes(client, MATCHING, suite)).map(p => p.number), steps });
    }
  }
  return new Map(items.map((item, i) => {
    const latest = admission[i].filter(s => found.get(s.id).pulls.includes(item.pr.number)).sort((a, b) => b.workflowRun.databaseId - a.workflowRun.databaseId)[0];
    return [item.pr.number, latest ? routeDecision(found.get(latest.id).steps, policy) : null];
  }));
}

export async function readSnapshot(client, pr, merge) {
  if (!pr || pr.mergeable === false || !sha(pr.head?.sha) || !sha(pr.base?.sha) || !sha(pr.merge_commit_sha)) return null;
  merge ??= await client.api(`/git/commits/${pr.merge_commit_sha}`);
  if (merge.parents?.length !== 2 || merge.parents[0].sha !== pr.base.sha || merge.parents[1].sha !== pr.head.sha) return null;
  return { pr: pr.number, head: pr.head.sha, base: pr.base.sha, merge: pr.merge_commit_sha, tree: merge.tree.sha, updatedAt: pr.updated_at };
}

export async function scanAdmission(client, { recipe, repository, policy, lanes = recipe.lanes, admissionWorkflow = 'ci.yml', managerWorkflow = 'hauler-ci.yml', defaultBranch, worker, manualAdmission = false, onlyPullRequests, attempted = new Set(), deadline = Infinity, signal }) {
  if (onlyPullRequests && (!Array.isArray(onlyPullRequests) || onlyPullRequests.some(n => !Number.isSafeInteger(n) || n < 1))) throw new TypeError('Invalid pull request selection');
  const candidates = [], maintenance = [], owners = new Map(), ownedChecks = new Set();
  const live = verifyOwners(client, { repository, workflow: managerWorkflow, defaultBranch });
  const classify = async (pr, checks) => {
    const pending = [], nativeQueued = [], conflicts = [];
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
        if (own.some(c => matchesCheck(c, identity) && c.status === 'queued')) conflicts.push({ kind: 'conflict', lane, pr, checks });
        continue;
      }
      if (own.some(c => matchesCheck(c, identity) && c.status === 'completed' && ['success', 'failure'].includes(c.conclusion) && checkOwner(c)?.finished !== false)) continue;
      const retry = own.find(c => c.status === 'completed' && (checkMetadata(c.external_id)?.identity === identity && checkMetadata(c.external_id)?.infrastructure || matchesCheck(c, identity) && (c.conclusion === 'cancelled' || checkOwner(c)?.finished === false)));
      if (manualAdmission || queued || retry) pending.push({ lane, queued, retry });
    }
    return { pending, nativeQueued, conflicts };
  };
  const reviewed = [];
  for (const node of await pullRequests(client, repository, onlyPullRequests)) {
    if (Date.now() >= deadline || signal?.aborted) break;
    const { pr, merge, commit } = adapt(node);
    // commits(last:1) can trail headRefOid across a push. The next scan reads a consistent pair.
    if (!trustedPull(pr, repository, recipe) || attempted.has(pr.head.sha) || commit?.oid !== pr.head.sha) continue;
    const { suites, checks } = await checkRuns(client, commit);
    reviewed.push({ pr, merge, commit, suites, checks, ...await classify(pr, checks) });
  }
  const decisions = manualAdmission ? new Map() : await receipts(client, reviewed.filter(item => item.pending.length || item.nativeQueued.length), admissionWorkflow, policy);
  for (const { pr, merge, commit, checks, pending, nativeQueued, conflicts } of reviewed) {
    maintenance.push(...conflicts);
    if (!pending.length && !nativeQueued.length) continue;
    if (!manualAdmission) {
      const decision = decisions.get(pr.number);
      if (decision !== 'delegated') {
        if (decision === 'native') for (const item of nativeQueued) maintenance.push({ kind: 'native', ...item, pr });
        continue;
      }
    }
    if (!pending.length) continue;
    if (!recipe.requiredChecks.every(name => checks.some(c => c.name === name && c.app?.slug === 'github-actions' && c.status === 'completed' && c.conclusion === 'success'))) continue;
    const snapshot = await readSnapshot(client, pr, merge);
    if (!snapshot) continue;
    const readyAt = recipe.requiredChecks.length
      ? Math.max(Date.parse(commit.committedDate) || 0, ...checks.filter(c => recipe.requiredChecks.includes(c.name)).map(c => Date.parse(c.completed_at) || 0))
      : Date.parse(pr.updated_at) || Date.parse(commit.committedDate) || Date.now();
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
