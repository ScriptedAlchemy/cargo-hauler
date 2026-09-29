import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, rm, writeFile, utimes, stat, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createSandbox, validateSnapshot, volumeNames, preserveSourceMtimes } from '../../src/internal/github-action/sandbox.mjs';

const snapshot = { pr: 1, base: 'a'.repeat(40), head: 'b'.repeat(40), merge: 'c'.repeat(40) };
test('rejects malformed snapshots and isolates cache cohorts', () => {
  validateSnapshot(snapshot);
  for (const bad of [{ ...snapshot, pr: '../1' }, { ...snapshot, merge: '--upload-pack=x' }, { ...snapshot, head: undefined }]) assert.throws(() => validateSnapshot(bad));
  assert.notDeepEqual(volumeNames('a/b', 'tools', snapshot, false), volumeNames('a/b', 'tools', { ...snapshot, pr: 2 }, false));
  assert.deepEqual(volumeNames('a/b', 'tools', snapshot, true), volumeNames('a/b', 'tools', { ...snapshot, pr: 2 }, true));
  assert.notDeepEqual(volumeNames('a/b', 'tools', snapshot, true), volumeNames('a/b', 'other-tools', snapshot, true));
});

test('real Docker isolates credentials, preserves warm outputs and kills descendants', { skip: !process.env.HAULER_SANDBOX_TEST_SNAPSHOT }, async () => {
  const fixture = JSON.parse(process.env.HAULER_SANDBOX_TEST_SNAPSHOT);
  const root = await mkdtemp(path.join(tmpdir(), 'hauler-sandbox-test-'));
  const compatibilityKey = `test-${Date.now()}`;
  const previous = process.env.GH_TOKEN;
  process.env.GH_TOKEN = 'host-canary-must-never-enter-worker';
  const sandbox = await createSandbox({ repository: fixture.repository, image: process.env.HAULER_SANDBOX_TEST_IMAGE || 'node:22-bookworm-slim', root, compatibilityKey });
  try {
    await sandbox.prepare(fixture.snapshot);
    const executable = await sandbox.run("printf '#!/bin/sh\\nprintf temporary-fixture-ok\\n' > /tmp/probe && chmod +x /tmp/probe && /tmp/probe");
    assert.equal(executable.exitCode, 0);
    assert.equal(await readFile(executable.logPath, 'utf8'), 'temporary-fixture-ok');
    const first = await sandbox.run('test "$(id -u)" = 10001 && test -z "$GH_TOKEN$GITHUB_TOKEN$ACTIONS_RUNTIME_TOKEN" && test ! -e /var/run/docker.sock && test ! -e /opt/controller && touch /workspace/target/warm-proof && stat -c %Y README*');
    assert.equal(first.exitCode, 0);
    const before = await readFile(first.logPath, 'utf8');
    assert(!before.includes('host-canary'));
    await sandbox.run('printf "malicious checkout config" > .git/config');
    await sandbox.prepare(fixture.snapshot);
    const next = await sandbox.run('test -e /workspace/target/warm-proof && stat -c %Y README*');
    assert.equal(next.exitCode, 0);
    assert.equal(await readFile(next.logPath, 'utf8'), before);
    await sandbox.run("mkdir -p target/reports && printf '{}' > target/reports/result.json");
    const reports = await sandbox.exportReports(['target/reports']);
    assert.equal(await readFile(path.join(reports, 'target/reports/result.json'), 'utf8'), '{}');
    await assert.rejects(sandbox.run('true'), /not ready/);
    await sandbox.prepare(fixture.snapshot);
    await sandbox.run('ln -s /etc/passwd target/reports/leak.json');
    await assert.rejects(sandbox.exportReports(['target/reports']), /failed/);
    await sandbox.prepare(fixture.snapshot);
    const containers = execFileSync('docker', ['ps', '--format', '{{.Names}}'], { encoding: 'utf8' }).trim().split('\n').filter(name => name.startsWith('hauler-'));
    await assert.rejects(sandbox.run('sleep 1000 & wait', { timeoutSeconds: 0.2 }), /timed out/);
    const after = execFileSync('docker', ['ps', '-a', '--format', '{{.Names}}'], { encoding: 'utf8' }).split('\n');
    assert(containers.some(name => !after.includes(name)));
    await assert.rejects(sandbox.run('true'), /not ready/);
    const controller = new AbortController();
    await sandbox.prepare({ ...fixture.snapshot, signal: controller.signal });
    assert.equal((await sandbox.run('sleep 1000 >/dev/null 2>&1 &')).exitCode, 0);
    controller.abort();
    await sandbox.close();
    await assert.rejects(sandbox.run('true'), /not ready/);
  } finally {
    if (previous === undefined) delete process.env.GH_TOKEN; else process.env.GH_TOKEN = previous;
    await sandbox.close();
    await rm(root, { recursive: true, force: true });
  }
});

test('source mtime reuse only follows the immediately previous snapshot, including A-B-A', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'hauler-mtimes-'));
  const file = path.join(root, 'source.rs');
  let previous = new Map();
  try {
    for (const [blob, created, expected] of [['a', 1000, 1000], ['a', 2000, 1000], ['b', 3000, 3000], ['a', 4000, 4000]]) {
      await writeFile(file, blob);
      await utimes(file, created, created);
      previous = await preserveSourceMtimes(root, `100644 blob ${blob}\tsource.rs\0`, previous);
      assert.equal((await stat(file)).mtimeMs, expected * 1000);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('Git subtree timestamps preserve identical directories but invalidate content, additions, deletions and modes', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'hauler-tree-mtimes-'));
  const source = path.join(root, 'src');
  const file = path.join(source, 'value.rs');
  const git = args => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
  let previous = new Map();
  try {
    git(['init', '--quiet']);
    await mkdir(source);
    for (const [index, [step, expected]] of [['initial', 1000], ['unchanged', 1000], ['changed', 3000], ['reverted', 4000], ['added', 5000], ['deleted', 6000], ['mode', 7000], ['mode-unchanged', 7000]].entries()) {
      const created = (index + 1) * 1000;
      await writeFile(file, step === 'changed' ? 'B' : 'A');
      if (step === 'added') await writeFile(path.join(source, 'added.rs'), 'new');
      if (step === 'deleted') await rm(path.join(source, 'added.rs'));
      git(['add', '.']);
      if (step.startsWith('mode')) git(['update-index', '--chmod=+x', 'src/value.rs']);
      const tree = git(['ls-tree', '-r', '-t', '-z', git(['write-tree'])]);
      await utimes(source, created, created);
      await utimes(file, created, created);
      await utimes(path.join(root, '.git'), created, created);
      previous = await preserveSourceMtimes(root, tree, previous);
      assert.equal((await stat(source)).mtimeMs, expected * 1000, step);
      assert.equal((await stat(path.join(root, '.git'))).mtimeMs, created * 1000, 'Git metadata stays fresh');
    }
    const tree = git(['ls-tree', '-r', '-t', '-z', git(['write-tree'])]);
    await rm(source, { recursive: true });
    await writeFile(source, 'not a directory');
    await assert.rejects(preserveSourceMtimes(root, tree, previous), /Invalid staging entry/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
