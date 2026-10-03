import test from 'node:test';
import assert from 'node:assert/strict';
import { githubClient } from '../../src/internal/github-action/github.mjs';

const ok = (body, headers = new Map()) => ({ ok: true, status: 200, headers, json: async () => structuredClone(body) });

test('a rejected request carries its status, path and rate-limit headers without waiting past the cap', async () => {
  const reset = String(Math.floor(Date.now() / 1000) + 7200);
  const headers = new Map([['x-ratelimit-remaining', '0'], ['x-ratelimit-reset', reset], ['x-ratelimit-resource', 'core']]);
  let calls = 0;
  const client = githubClient({ repository: 'owner/repo', token: 'private', fetchImpl: async () => { calls++; return { ok: false, status: 403, headers }; } });
  await assert.rejects(client.api('/pulls'), error => {
    assert.equal(error.message, 'GitHub GET returned 403');
    assert.equal(error.status, 403);
    assert.equal(error.path, '/pulls');
    assert.deepEqual(error.rateLimit, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': reset, 'x-ratelimit-resource': 'core', 'retry-after': null });
    return true;
  });
  assert.equal(calls, 1);
});

test('a rate-limited request waits for retry-after and retries, writes included', async () => {
  for (const [status, method] of [[403, 'GET'], [429, 'PATCH']]) {
    const methods = [];
    const client = githubClient({ repository: 'owner/repo', token: 'private', fetchImpl: async (url, init) => {
      methods.push(init.method);
      return methods.length === 1 ? { ok: false, status, headers: new Map([['retry-after', '0']]) } : ok({ done: true });
    } });
    assert.deepEqual(await client.api('/check-runs/1', method, method === 'GET' ? undefined : { status: 'queued' }), { done: true });
    assert.deepEqual(methods, [method, method]);
  }
});

test('a plain 403 is not retried', async () => {
  let calls = 0;
  const client = githubClient({ repository: 'owner/repo', token: 'private', fetchImpl: async () => { calls++; return { ok: false, status: 403, headers: new Map(), text: async () => 'Resource not accessible by integration' }; } });
  await assert.rejects(client.api('/pulls'), /returned 403/);
  assert.equal(calls, 1);
});

test('a repeated GET revalidates with its ETag and reuses the cached body on 304', async () => {
  const sent = [];
  const client = githubClient({ repository: 'owner/repo', token: 'private', fetchImpl: async (url, init) => {
    sent.push(init.headers['If-None-Match']);
    return sent.length === 1 ? ok({ number: 1, head: { sha: 'a' } }, new Map([['etag', 'W/"one"']])) : { ok: false, status: 304, headers: new Map() };
  } });
  const first = await client.api('/pulls/1');
  first.head.sha = 'mutated';
  assert.deepEqual(await client.api('/pulls/1'), { number: 1, head: { sha: 'a' } });
  assert.deepEqual(sent, [undefined, 'W/"one"']);
});
