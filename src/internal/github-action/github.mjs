import { setTimeout as delay } from 'node:timers/promises';
export function githubClient({ repository, token, fetchImpl = fetch, signal }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !token) throw new TypeError('Invalid GitHub connection');
  async function api(path, method = 'GET', body) {
    if (!path.startsWith('/') && path !== '') throw new TypeError('Invalid GitHub path');
    for (let attempt = 0; ; attempt++) {
      let response;
      try {
        response = await fetchImpl(`https://api.github.com/repos/${repository}${path}`, { method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000), redirect: 'error' });
      } catch {
        if (!signal?.aborted && method === 'GET' && attempt < 2) { await delay(250 * (attempt + 1)); continue; }
        throw new Error(`GitHub ${method} request failed`);
      }
      if (!response.ok) {
        if (method === 'GET' && attempt < 2 && response.status >= 500) { await delay(250 * (attempt + 1)); continue; }
        throw new Error(`GitHub ${method} returned ${response.status}`);
      }
      return response.json();
    }
  }
  async function pages(path, field) {
    const rows = [];
    for (let page = 1; page <= 100; page++) {
      const data = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`), batch = field ? data[field] : data;
      if (!Array.isArray(batch)) throw new Error('Malformed GitHub list');
      rows.push(...batch);
      if (batch.length < 100) return rows;
    }
    throw new Error('GitHub listing exceeded limit');
  }
  return { api, pages };
}
export async function receipt(client, { workflow, head, pr, policy }) {
  if (typeof workflow !== 'string' || !/^[\w.-]+\.ya?ml$/.test(workflow)) throw new TypeError('Invalid admission workflow');
  const runs = await client.pages(`/actions/workflows/${encodeURIComponent(workflow)}/runs?event=pull_request&head_sha=${head}`, 'workflow_runs');
  const latest = runs.filter(r => r.event === 'pull_request' && r.head_sha === head && r.path?.split('@')[0] === `.github/workflows/${workflow}` && r.pull_requests?.some(p => p.number === pr)).sort((a, b) => b.id - a.id)[0];
  if (!latest) return null;
  const jobs = await client.pages(`/actions/runs/${latest.id}/attempts/${latest.run_attempt}/jobs`, 'jobs');
  const steps = jobs.flatMap(j => j.steps ?? []).filter(s => s.conclusion === 'success');
  if (steps.some(s => /^Hauler route \/ native \/ (?:[a-f0-9]{64}|unavailable)$/.test(s.name))) return 'native';
  return steps.some(s => s.name === `Hauler route / delegated / ${policy}`) ? 'delegated' : null;
}
