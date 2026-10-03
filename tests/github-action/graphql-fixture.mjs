// Serves the admission scan's GraphQL queries by rendering a REST fixture's GET routes, so one
// fixture state drives both the GraphQL scan and the REST drain.
const ROWS = Symbol('rows');
const rows = list => ({ [ROWS]: list });
const MERGEABLE = new Map([[true, 'MERGEABLE'], [false, 'CONFLICTING']]);

export function graphqlFetch(rest, repository = 'owner/repo') {
  const nodes = new Map();
  const register = node => { nodes.set(node.id, node); return node; };
  async function get(path) {
    const response = await rest(`https://api.github.com/repos/${repository}${path}`, { method: 'GET' });
    if (!response.ok) throw response;
    return response.json();
  }
  async function pull(pr) {
    const head = pr.head.sha, merge = pr.merge_commit_sha ? await get(`/git/commits/${pr.merge_commit_sha}`) : null;
    const runs = (await get(`/commits/${head}/check-runs`)).check_runs.filter(c => c.app?.slug === 'github-actions' && (c.head_sha ?? head) === head);
    const workflowRuns = (await get(`/actions/workflows/ci.yml/runs?event=pull_request&head_sha=${head}`)).workflow_runs.filter(r => r.head_sha === head);
    const { committer } = await get(`/git/commits/${head}`);
    const checks = register({ id: `suite:checks:${head}`, app: { slug: 'github-actions' }, workflowRun: null, checkRuns: rows(runs.map(c => ({ databaseId: c.id ?? 0, name: c.name, status: c.status?.toUpperCase(), conclusion: c.conclusion?.toUpperCase() ?? null, externalId: c.external_id ?? null, completedAt: c.completed_at ?? null, detailsUrl: c.details_url ?? null, text: c.output?.text ?? null }))) });
    const admission = workflowRuns.map(run => register({
      id: `suite:${run.id}:${head}`, app: { slug: 'github-actions' }, workflowRun: { databaseId: run.id, event: run.event, file: { path: run.path } }, checkRuns: rows([]),
      async receipt() {
        const { jobs } = await get(`/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs`);
        return register({ id: this.id, matchingPullRequests: rows((run.pull_requests ?? []).map(p => ({ number: p.number }))), checkRuns: rows(jobs.map((job, i) => register({ id: `job:${run.id}:${i}`, steps: rows((job.steps ?? []).map(s => ({ name: s.name, conclusion: s.conclusion?.toUpperCase() ?? null }))) }))) });
      }
    }));
    const commit = register({ id: `commit:${head}`, oid: head, committedDate: committer?.date ?? null, checkSuites: rows([checks, ...admission]) });
    return {
      number: pr.number, isDraft: pr.draft, state: pr.state.toUpperCase(), author: pr.user && { login: pr.user.login }, headRepository: pr.head.repo && { nameWithOwner: pr.head.repo.full_name },
      headRefOid: head, baseRefOid: pr.base.sha, mergeable: MERGEABLE.get(pr.mergeable) ?? 'UNKNOWN', updatedAt: pr.updated_at ?? null,
      potentialMergeCommit: merge && { oid: pr.merge_commit_sha, tree: { oid: merge.tree.sha }, parents: rows(merge.parents.map(p => ({ oid: p.sha }))) },
      commits: rows([{ commit }])
    };
  }
  async function resolve(query, variables) {
    const sizes = Object.fromEntries([...query.matchAll(/(\w+)\([^(){}]*?first:(\d+)/g)].map(m => [m[1], Number(m[2])]));
    const view = value => {
      if (Array.isArray(value)) return value.map(view);
      if (!value || typeof value !== 'object') return value;
      return Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v !== 'function').map(([k, v]) => [k, v?.[ROWS] ? connection(v[ROWS], sizes[k] ?? 100, null) : view(v)]));
    };
    const connection = (list, size, after) => {
      const offset = Number(after ?? 0);
      return { pageInfo: { hasNextPage: offset + size < list.length, endCursor: String(offset + size) }, nodes: list.slice(offset, offset + size).map(view) };
    };
    if (query.includes('pullRequests(states:OPEN')) {
      const page = connection(await get('/pulls'), sizes.pullRequests, variables.after);
      const rendered = [];
      for (const pr of page.nodes) rendered.push(view(await pull(pr)));
      return { repository: { pullRequests: { ...page, nodes: rendered } } };
    }
    const aliases = [...query.matchAll(/(p\d+):pullRequest\(number:(\d+)\)/g)];
    if (aliases.length) {
      const repo = {};
      for (const [, alias, number] of aliases) repo[alias] = view(await pull(await get(`/pulls/${number}`)));
      return { repository: repo };
    }
    if (query.includes('nodes(ids:')) {
      const found = [];
      for (const id of variables.ids) found.push(nodes.has(id) ? view(await nodes.get(id).receipt()) : null);
      return { nodes: found };
    }
    const [, name] = query.match(/node\(id:\$id\)\{\.\.\.on \w+\{(\w+)\(/);
    return { node: { [name]: connection(nodes.get(variables.id)[name][ROWS], sizes[name], variables.after) } };
  }
  return async (url, options) => {
    if (!url.endsWith('/graphql')) return rest(url, options);
    const { query, variables } = JSON.parse(options.body);
    try {
      const data = await resolve(query, variables);
      return { ok: true, json: async () => ({ data }) };
    } catch (failure) {
      if (failure?.ok === false) return failure;
      throw failure;
    }
  };
}
