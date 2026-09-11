import { spawn, type ChildProcess } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { version } from 'agent-bundle/meta';
import { afterEach, describe, expect, it } from 'effect-rstest';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const haulerEntry = join(repoRoot, 'dist', 'bin', 'hauler.js');
const fixtureEntry = join(repoRoot, 'tests', 'fixtures', 'stale-daemon.mjs');

interface ChildResult {
  readonly code: number;
  readonly stderr: string;
  readonly stdout: string;
}

const children = new Set<ChildProcess>();

afterEach(() => {
  for (const child of children) {
    child.kill('SIGTERM');
  }
  children.clear();
});

const run = (
  entry: string,
  args: readonly string[],
  env: Readonly<Record<string, string>>,
): Promise<ChildResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entry, ...args], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.add(child);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.once('error', reject);
    child.once('close', (code) => {
      children.delete(child);
      resolve({ code: code ?? 1, stderr, stdout });
    });
  });

const startStaleDaemon = (
  socketPath: string,
  logPath: string,
  mode: 'idle-older' | 'busy-older' | 'incompatible-older' | 'newer',
): Promise<ChildProcess> =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fixtureEntry, socketPath, logPath, mode], {
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    children.add(child);
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`stale daemon exited before readiness (${code})`));
      }
    });
    child.stdout.setEncoding('utf8');
    child.stdout.once('data', (chunk: string) => {
      if (chunk.includes('ready')) {
        resolve(child);
      } else {
        reject(new Error(`unexpected stale-daemon readiness output: ${chunk}`));
      }
    });
  });

describe.skipIf(!existsSync(haulerEntry))('stale daemon CLI replacement', () => {
  const fixtureEnv = (root: string): Readonly<Record<string, string>> => {
    const stateDir = join(root, 'state');
    const cargo = join(root, 'cargo');
    writeFileSync(cargo, '#!/usr/bin/env bash\nexit 0\n');
    chmodSync(cargo, 0o755);
    return {
      CARGO_HAULER_CARGO_BIN: cargo,
      CARGO_HAULER_KACHE_INDEX: '',
      CARGO_HAULER_STATE_DIR: stateDir,
      CARGO_HAULER_BATCH_WINDOW_MS: '0',
    };
  };

  const requests = (logPath: string): string[] =>
    readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);

  it('reads status from a busy compatible older daemon without requesting shutdown', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ch-stale-status-'));
    const logPath = join(root, 'requests.log');
    const env = fixtureEnv(root);
    try {
      await startStaleDaemon(join(env.CARGO_HAULER_STATE_DIR, 'daemon.sock'), logPath, 'busy-older');
      const status = await run(haulerEntry, ['status', '--json'], env);

      expect(status.code).toBe(0);
      expect(JSON.parse(status.stdout)).toMatchObject({
        daemon: 'running',
        lanes: [{ queued: 1 }],
        operation: 'status',
      });
      expect(status.stderr).toBe('');
      expect(requests(logPath)).toEqual(['ping', 'status']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);

  it('replaces an idle compatible older daemon before submitting exec', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ch-stale-idle-'));
    const logPath = join(root, 'requests.log');
    const env = fixtureEnv(root);
    try {
      await startStaleDaemon(join(env.CARGO_HAULER_STATE_DIR, 'daemon.sock'), logPath, 'idle-older');
      const submitted = await run(haulerEntry, ['exec', '--bg', '--', 'cargo', 'check'], env);
      const log = await run(haulerEntry, ['log', '--json'], env);

      expect(submitted.code).toBe(0);
      expect(log.code).toBe(0);
      expect(JSON.parse(log.stdout)).toMatchObject({
        daemon: 'running',
        operation: 'log',
        requests: [expect.objectContaining({ argv: ['cargo', 'check'] })],
      });
      expect(requests(logPath)).toEqual(['ping', 'status', 'shutdown']);
      await run(haulerEntry, ['daemon', 'stop'], env);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);

  it('submits to a busy compatible older daemon and reports deferred replacement once', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ch-stale-busy-'));
    const logPath = join(root, 'requests.log');
    const env = fixtureEnv(root);
    try {
      await startStaleDaemon(join(env.CARGO_HAULER_STATE_DIR, 'daemon.sock'), logPath, 'busy-older');
      const submitted = await run(haulerEntry, ['exec', '--bg', '--', 'cargo', 'check'], env);

      expect(submitted.code).toBe(0);
      const diagnostic = `daemon 0.7.1 will be replaced by ${version} when idle`;
      expect(submitted.stderr.split(diagnostic)).toHaveLength(2);
      expect(requests(logPath)).toEqual(['ping', 'status', 'exec']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);

  it('keeps newer-daemon rejection directional without requesting shutdown', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ch-stale-newer-'));
    const logPath = join(root, 'requests.log');
    const env = fixtureEnv(root);
    try {
      await startStaleDaemon(join(env.CARGO_HAULER_STATE_DIR, 'daemon.sock'), logPath, 'newer');
      const status = await run(haulerEntry, ['status', '--json'], env);

      expect(status.code).toBe(1);
      expect(status.stderr).toContain('(999.0.0) is newer than this client');
      expect(requests(logPath)).toEqual(['ping']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);

  it('rejects an incompatible older daemon by name without requesting shutdown', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ch-stale-incompatible-'));
    const logPath = join(root, 'requests.log');
    const env = fixtureEnv(root);
    try {
      await startStaleDaemon(
        join(env.CARGO_HAULER_STATE_DIR, 'daemon.sock'),
        logPath,
        'incompatible-older',
      );
      const status = await run(haulerEntry, ['status', '--json'], env);

      expect(status.code).toBe(1);
      expect(status.stderr).toContain('daemon pid');
      expect(status.stderr).toContain('(0.6.0)');
      expect(status.stderr).toContain('incompatible with this client');
      expect(requests(logPath)).toEqual(['ping']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);
});
