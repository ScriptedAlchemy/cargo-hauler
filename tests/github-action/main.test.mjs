import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, symlink, rm, realpath, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main, assertTrustedContext, positiveInteger, within, imageLoader } from '../../src/internal/github-action/main.mjs';

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
test('digest images pull once; failed and cancelled pulls never fall back to builds', async () => {
  for (const fail of [false, true]) {
    const calls = [], reference = `ghcr.io/owner/ci@sha256:${'a'.repeat(64)}`;
    const load = imageLoader({ reference, image: reference, env: { PATH: '/bin', HOME: '/private', DOCKER_CONFIG: '/private/auth' }, execute: async (...args) => {
      calls.push(args); if (fail && calls.length === 1) throw new Error('pull failed');
    } });
    if (fail) { await assert.rejects(load(), /pull failed/); await load(); await load(); }
    else { await load(); await load(); }
    assert.equal(calls.length, fail ? 2 : 1);
    assert.deepEqual(calls[0].slice(0, 2), ['docker', ['pull', reference]]);
    assert.deepEqual(Object.keys(calls[0][2].env), ['PATH', 'HOME', 'DOCKER_CONFIG']);
  }
  let attempts = 0;
  const controller = new AbortController();
  const load = imageLoader({ reference: 'immutable', env: {}, execute: async (...args) => {
    if (++attempts === 1) { controller.abort(); args[2].signal.throwIfAborted(); }
  } });
  await assert.rejects(load(controller.signal));
  await load(new AbortController().signal);
  assert.equal(attempts, 2);
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

test('plan entry emits empty lanes without worker state, image files or sandbox execution', async () => {
  const exec = promisify(execFile), root = await mkdtemp(join(tmpdir(), 'hauler-plan-entry-'));
  const previousFetch = globalThis.fetch;
  try {
    await exec('git', ['init', '-q'], { cwd: root });
    await exec('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-qm', 'test'], { cwd: root });
    const head = (await exec('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
    const eventPath = join(root, 'event.json'), outputPath = join(root, 'outputs');
    await writeFile(eventPath, JSON.stringify({ repository: { default_branch: 'master', private: false, full_name: 'owner/repo' } }));
    const recipe = { version: 1, trustedAuthors: ['owner'], sharedBuilds: false, requiredChecks: [], image: { dockerfile: 'absent/Dockerfile', context: '.' }, prepare: [], compatibilityPaths: [], lanes: [{ id: 'tests', checkName: 'Hauler tests', tasks: [{ id: 'test', run: 'false', timeoutSeconds: 1 }] }] };
    globalThis.fetch = async (url, options) => {
      assert.equal(options.method, 'GET');
      const path = new URL(url).pathname.replace('/repos/owner/repo', '');
      const data = path === '' ? { default_branch: 'master', private: false, full_name: 'owner/repo' }
        : path.startsWith('/commits/') ? { sha: head, commit: { tree: { sha: head } } }
        : path.startsWith('/contents/') ? { type: 'file', encoding: 'base64', size: 1000, content: Buffer.from(JSON.stringify(recipe)).toString('base64') }
        : path.startsWith('/git/trees/') ? { tree: [{ path: 'absent/Dockerfile', mode: '100644', sha: head }] }
        : path === '/pulls' ? [] : null;
      assert.notEqual(data, null);
      return { ok: true, json: async () => data };
    };
    const result = await main({ GITHUB_WORKSPACE: root, GITHUB_EVENT_PATH: eventPath, GITHUB_EVENT_NAME: 'schedule', GITHUB_REF: 'refs/heads/master', GITHUB_SHA: head, GITHUB_SERVER_URL: 'https://github.com', GITHUB_REPOSITORY: 'owner/repo', GITHUB_OUTPUT: outputPath, RUNNER_TEMP: join(root, 'absent-runtime'), CARGO_HAULER_CI_MODE: 'plan', CARGO_HAULER_CI_TOKEN: 'private', CARGO_HAULER_ACTION_REF: 'a'.repeat(40), CARGO_HAULER_CI_MINUTES: '1', CARGO_HAULER_CI_SNAPSHOTS: '1' });
    assert.deepEqual(result, { lanes: [], count: 0 });
    assert.equal(await readFile(outputPath, 'utf8'), 'lanes=[]\ncount=0\n');
  } finally { globalThis.fetch = previousFetch; await rm(root, { recursive: true, force: true }); }
});

test('the entry script reports the failing error instead of only the generic line', async () => {
  const exec = promisify(execFile), root = await mkdtemp(join(tmpdir(), 'hauler-entry-error-'));
  try {
    const eventPath = join(root, 'event.json');
    await writeFile(eventPath, JSON.stringify({ repository: { default_branch: 'master', private: false, full_name: 'owner/repo' } }));
    const env = { PATH: process.env.PATH, GITHUB_EVENT_PATH: eventPath, CARGO_HAULER_CI_MODE: 'bogus' };
    await assert.rejects(exec(process.execPath, ['src/internal/github-action/main.mjs'], { env }), error => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /Hauler CI controller failed\. No successful PR verdict is inferred\./);
      assert.match(error.stderr, /Error: Invalid Action mode/);
      return true;
    });
  } finally { await rm(root, { recursive: true, force: true }); }
});
