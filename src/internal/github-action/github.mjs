import { setTimeout as delay } from 'node:timers/promises';
export function githubClient({ repository, token, fetchImpl = fetch, signal }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !token) throw new TypeError('Invalid GitHub connection');
  // A 304 to an authorized conditional GET does not count against the primary rate limit.
  const cache = new Map();
  async function api(path, method = 'GET', body) {
    if (!path.startsWith('/') && path !== '') throw new TypeError('Invalid GitHub path');
    for (let attempt = 0, limited = 0; ; attempt++) {
      let response;
      const cached = method === 'GET' ? cache.get(path) : undefined;
      try {
        response = await fetchImpl(`https://api.github.com/repos/${repository}${path}`, { method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json', ...(cached ? { 'If-None-Match': cached.etag } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000), redirect: 'error' });
      } catch {
        if (!signal?.aborted && method === 'GET' && attempt < 2) { await delay(250 * (attempt + 1)); continue; }
        throw new Error(`GitHub ${method} request failed`);
      }
      if (response.status === 304 && cached) return structuredClone(cached.body);
      if (!response.ok) {
        if (method === 'GET' && attempt < 2 && response.status >= 500) { await delay(250 * (attempt + 1)); continue; }
        const wait = limited < 3 && await rateLimitWait(response, limited);
        if (wait !== false && wait <= 15 * 60_000) {
          limited++;
          console.error(`GitHub ${method} ${path} rate limited (${response.status}); retrying in ${Math.ceil(wait / 1000)}s`);
          await delay(wait, undefined, signal ? { signal } : undefined);
          continue;
        }
        const error = new Error(`GitHub ${method} returned ${response.status}`);
        error.status = response.status;
        error.path = path;
        error.rateLimit = Object.fromEntries(['x-ratelimit-remaining', 'x-ratelimit-reset', 'x-ratelimit-resource', 'retry-after'].map(name => [name, response.headers?.get?.(name) ?? null]));
        throw error;
      }
      const data = await response.json(), etag = method === 'GET' ? response.headers?.get?.('etag') : null;
      if (etag) cache.set(path, { etag, body: structuredClone(data) });
      return data;
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
// Milliseconds to wait before retrying a rate-limited response, or false when it is not one.
async function rateLimitWait(response, limited) {
  if (![403, 429].includes(response.status)) return false;
  const header = name => response.headers?.get?.(name) ?? null;
  const retryAfter = header('retry-after'), reset = Number(header('x-ratelimit-reset'));
  if (retryAfter !== null && /^\d+$/.test(retryAfter)) return Number(retryAfter) * 1000;
  if (header('x-ratelimit-remaining') === '0' && reset) return Math.max(0, reset * 1000 - Date.now()) + 1000;
  const text = response.status === 403 ? await response.text?.().catch(() => '') : '';
  return response.status === 429 || /rate limit/i.test(text ?? '') ? 60_000 * 2 ** limited : false;
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
