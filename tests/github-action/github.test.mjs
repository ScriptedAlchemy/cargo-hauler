import test from 'node:test';
import assert from 'node:assert/strict';
import { githubClient } from '../../src/internal/github-action/github.mjs';

test('a rejected request carries its status, path and rate-limit headers', async () => {
  const headers = new Map([['x-ratelimit-remaining', '0'], ['x-ratelimit-reset', '1700000000'], ['x-ratelimit-resource', 'core']]);
  const client = githubClient({ repository: 'owner/repo', token: 'private', fetchImpl: async () => ({ ok: false, status: 403, headers }) });
  await assert.rejects(client.api('/pulls'), error => {
    assert.equal(error.message, 'GitHub GET returned 403');
    assert.equal(error.status, 403);
    assert.equal(error.path, '/pulls');
    assert.deepEqual(error.rateLimit, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1700000000', 'x-ratelimit-resource': 'core', 'retry-after': null });
    return true;
  });
});
