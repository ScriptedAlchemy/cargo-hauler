import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, symlink, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertTrustedContext, positiveInteger, within } from '../../src/internal/github-action/main.mjs';

test('only the exact public default-branch checkout may hold reporting credentials', () => {
  const sha = 'a'.repeat(40);
  const env = { GITHUB_EVENT_NAME: 'pull_request_target', GITHUB_REF: 'refs/heads/master',
    GITHUB_SHA: sha, GITHUB_SERVER_URL: 'https://github.com', GITHUB_REPOSITORY: 'owner/repo' };
  const event = { repository: { default_branch: 'master', private: false, full_name: 'owner/repo' } };
  assert.doesNotThrow(() => assertTrustedContext(env, event, sha));
  for (const change of [{ GITHUB_EVENT_NAME: 'pull_request' }, { GITHUB_REF: 'refs/heads/feature' },
    { GITHUB_SERVER_URL: 'https://attacker.example' }, { GITHUB_REPOSITORY: 'other/repo' }]) {
    assert.throws(() => assertTrustedContext({ ...env, ...change }, event, sha));
  }
  assert.throws(() => assertTrustedContext(env, event, 'b'.repeat(40)));
  assert.throws(() => assertTrustedContext(env, { repository: { ...event.repository, private: true } }, sha));
});

test('work budgets reject empty, negative, fractional, and excessive inputs', () => {
  assert.equal(positiveInteger('120', 300, 'minutes'), 120);
  for (const value of ['', '-1', '1.5', '301', '1e2', '2\n']) {
    assert.throws(() => positiveInteger(value, 300, 'minutes'));
  }
});

test('trusted build paths cannot escape through a symlink', async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'hauler-action-boundary-')));
  try {
    await mkdir(join(root, 'checkout'));
    await mkdir(join(root, 'outside'));
    await symlink(join(root, 'outside'), join(root, 'checkout', 'link'));
    assert.equal(await within(join(root, 'checkout'), '.'), join(root, 'checkout'));
    await assert.rejects(within(join(root, 'checkout'), 'link'), /escapes/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
