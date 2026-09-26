import { spawn, type ChildProcess } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { version } from 'agent-bundle/meta';
import { afterEach, describe, expect, it } from 'effect-rstest';

import { removeTestPath } from '../support/tmp-guard.js';

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
  mode:
    | 'idle-older'
    | 'busy-older'
    | 'incompatible-older'
    | 'newer'
    | 'newer-compatible'
    | 'skewed-older'
    | 'skewed-same'
    | 'skewed-newer',
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
      removeTestPath(root);
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
      removeTestPath(root);
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
      removeTestPath(root);
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
      removeTestPath(root);
    }
  }, 30_000);

  it('reads a protocol-compatible newer daemon but rejects broker admission before direct fallback', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ch-stale-newer-compatible-'));
    const logPath = join(root, 'requests.log');
    const env = fixtureEnv(root);
    try {
      await startStaleDaemon(
        join(env.CARGO_HAULER_STATE_DIR, 'daemon.sock'),
        logPath,
        'newer-compatible',
      );
      const status = await run(haulerEntry, ['status', '--json'], env);
      const submitted = await run(haulerEntry, ['exec', '--bg', '--', 'cargo', 'check'], env);

      expect(status.code).toBe(0);
      expect(JSON.parse(status.stdout)).toMatchObject({ daemon: 'running', operation: 'status' });
      expect(submitted.code).toBe(0);
      expect(submitted.stderr).toContain('(999.0.0) is newer than this client');
      expect(requests(logPath)).toEqual(['ping', 'status', 'ping']);
    } finally {
      removeTestPath(root);
    }
  }, 30_000);

  const skewLine = (release: string, daemonVersion: string, pid: number, fix: string): string =>
    `cargo-hauler daemon pid ${pid} (${daemonVersion}) is ${release} whose status report this client (${version}) cannot read, so this client shows tickets as the ledger recorded them. ${fix}`;

  it('names a same-protocol older daemon whose status report this client cannot read, on every read surface', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ch-stale-skewed-'));
    const logPath = join(root, 'requests.log');
    const env = fixtureEnv(root);
    try {
      const daemon = await startStaleDaemon(join(env.CARGO_HAULER_STATE_DIR, 'daemon.sock'), logPath, 'skewed-older');
      const line = skewLine(
        'an older release',
        '0.7.1',
        daemon.pid ?? -1,
        'The next `hauler exec` or `hauler daemon start` replaces it once it is idle. `hauler daemon restart` replaces it now and ends its in-flight tickets.',
      );
      const status = await run(haulerEntry, ['status', '--json'], env);
      expect(status).toMatchObject({ code: 0, stderr: '' });
      expect(JSON.parse(status.stdout)).toMatchObject({ daemon: 'skewed', lanes: [], operation: 'status', pid: daemon.pid });
      expect(JSON.parse(status.stdout).summary.split('\n', 1)[0]).toBe(line);
      const text = await run(haulerEntry, ['status'], env);
      expect(text).toMatchObject({ code: 0, stderr: '' });
      expect(text.stdout.split('\n', 1)[0]).toBe(line);
      const daemonStatus = await run(haulerEntry, ['daemon', 'status'], env);
      expect(daemonStatus).toMatchObject({ code: 1, stderr: '' });
      expect(JSON.parse(daemonStatus.stdout)).toMatchObject({ message: line, pid: daemon.pid, report: null, running: true });
      const log = await run(haulerEntry, ['log'], env);
      expect(log).toMatchObject({ code: 0, stderr: '' });
      expect(log.stdout.split('\n', 1)[0]).toBe(line);
      const last = await run(haulerEntry, ['last', '--json'], env);
      expect(last.code).toBe(0);
      expect(JSON.parse(last.stdout)).toMatchObject({ daemon: 'skewed', request: null });
      expect(requests(logPath)).toEqual(['ping', 'status', 'ping', 'status', 'ping', 'status', 'ping', 'status', 'ping', 'status']);
    } finally {
      removeTestPath(root);
    }
  }, 30_000);

  it('names a skewed daemon of the same release and of a newer release with the fix that applies', async () => {
    for (const [mode, release, daemonVersion, fix] of [
      ['skewed-same', 'another build of this release', version, '`hauler daemon restart` replaces it and ends its in-flight tickets.'],
      ['skewed-newer', 'a newer release', '999.0.0', 'Upgrade this install, or restart the session so its hooks and MCP server come from the current plugin.'],
    ] as const) {
      const root = mkdtempSync(join(tmpdir(), `ch-stale-${mode}-`));
      const env = fixtureEnv(root);
      try {
        const daemon = await startStaleDaemon(join(env.CARGO_HAULER_STATE_DIR, 'daemon.sock'), join(root, 'requests.log'), mode);
        const status = await run(haulerEntry, ['status', '--json'], env);
        expect(status.code).toBe(0);
        expect(JSON.parse(status.stdout).summary.split('\n', 1)[0]).toBe(skewLine(release, daemonVersion, daemon.pid ?? -1, fix));
      } finally {
        removeTestPath(root);
      }
    }
  }, 60_000);

  it('names a ticket record the daemon sent that this client cannot read, instead of dumping the schema error', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ch-stale-skewed-result-'));
    const env = fixtureEnv(root);
    try {
      const socketPath = join(env.CARGO_HAULER_STATE_DIR, 'daemon.sock');
      await startStaleDaemon(socketPath, join(root, 'requests.log'), 'skewed-older');
      const result = await run(haulerEntry, ['result', 'cc-old'], env);
      expect(result.code).toBe(1);
      expect(result.stderr.trim()).toBe(
        `[render-failed] cargo-hauler daemon at ${socketPath} sent a ticket record this client (${version}) cannot read. The daemon is another release or build, and \`hauler status\` names it with the command that replaces it.`,
      );
    } finally {
      removeTestPath(root);
    }
  }, 30_000);

  it('still replaces an idle skewed older daemon before submitting exec', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ch-stale-skewed-exec-'));
    const logPath = join(root, 'requests.log');
    const env = fixtureEnv(root);
    try {
      await startStaleDaemon(join(env.CARGO_HAULER_STATE_DIR, 'daemon.sock'), logPath, 'skewed-older');
      const submitted = await run(haulerEntry, ['exec', '--bg', '--', 'cargo', 'check'], env);
      expect(submitted.code).toBe(0);
      expect(requests(logPath)).toEqual(['ping', 'status', 'shutdown']);
      await run(haulerEntry, ['daemon', 'stop'], env);
    } finally {
      removeTestPath(root);
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
      removeTestPath(root);
    }
  }, 30_000);
});
