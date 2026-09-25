import { spawn } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { connect } from 'node:net';
import type { Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'effect-rstest';

import { removeTestPath } from '../support/tmp-guard.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const haulerEntry = join(repoRoot, 'dist', 'bin', 'hauler.js');

// About 60 MiB of queued output cost, written before the 2 s stall window
// closes, then one more line after it: that line meets a stalled peer.
const floodingCargo = `#!/usr/bin/env bash
seq -f "   Compiling crate-%g v0.1.0 (/workspace/crates/crate)" 1 180000
sleep 3
echo "after-stall"
`;

const run = (
  args: readonly string[],
  cwd: string,
  env: Readonly<Record<string, string>>,
): Promise<{ readonly code: number; readonly stdout: string }> =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [haulerEntry, ...args], {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const stdout: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.once('error', reject);
    child.once('close', (code) => resolvePromise({ code: code ?? 1, stdout: Buffer.concat(stdout).toString('utf8') }));
  });

const open = (path: string): Promise<Socket> =>
  new Promise((resolvePromise, reject) => {
    const socket = connect(path);
    socket.once('connect', () => resolvePromise(socket));
    socket.once('error', reject);
  });

/** Resolves once the daemon reports the ticket finished; an await sent before the ticket exists answers at once. */
const settled = (socket: Socket, ticket: string): Promise<void> =>
  new Promise((resolvePromise) => {
    let pending = '';
    const ask = (): void => {
      socket.write(`${JSON.stringify({ type: 'await', id: `await-${ticket}`, ticket, maxWaitMs: 30_000 })}\n`);
    };
    socket.on('data', (chunk: Buffer) => {
      pending += chunk.toString('utf8');
      const lines = pending.split('\n');
      pending = lines.pop() ?? '';
      for (const line of lines) {
        const reply = JSON.parse(line) as { type: string; request?: { finishedAtMs?: number | null } | null };
        if (reply.type !== 'await-result') {
          continue;
        }
        if (typeof reply.request?.finishedAtMs === 'number') {
          resolvePromise();
        } else {
          setTimeout(ask, 50);
        }
      }
    });
    ask();
  });

interface FloodedRun {
  readonly logPath: string;
  readonly notices: readonly string[];
  readonly result: (args: readonly string[]) => Promise<{ readonly code: number; readonly stdout: string }>;
}

/** Floods a build to a client that stops reading until the ticket settles, then lets it read to the exit. */
const withFloodedClient = async (check: (flooded: FloodedRun) => Promise<void>): Promise<void> => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'ch-stall-')));
  const workspace = join(root, 'ws');
  mkdirSync(workspace);
  writeFileSync(join(workspace, 'Cargo.toml'), '[package]\nname = "ws"\n');
  writeFileSync(join(root, 'cargo'), floodingCargo);
  chmodSync(join(root, 'cargo'), 0o755);
  const state = join(root, 'state');
  const env = {
    CARGO_HAULER_BATCH_WINDOW_MS: '0',
    CARGO_HAULER_CARGO_BIN: join(root, 'cargo'),
    CARGO_HAULER_CPU_PRESSURE_THRESHOLD: '0',
    CARGO_HAULER_KACHE_INDEX: '',
    CARGO_HAULER_MEM_AVAILABLE_MIN_GB: 'off',
    CARGO_HAULER_MEM_PRESSURE_HARD: 'off',
    CARGO_HAULER_MEM_PRESSURE_SOFT: 'off',
    CARGO_HAULER_STATE_DIR: state,
  };
  try {
    expect((await run(['daemon', 'start'], workspace, env)).code).toBe(0);
    const socketPath = join(state, 'daemon.sock');
    const awaiter = await open(socketPath);
    const stalled = await open(socketPath);
    stalled.pause();
    stalled.write(
      `${JSON.stringify({ type: 'exec', id: 'exec-1', argv: ['cargo', 'build', '--bin', 'flood'], cwd: workspace })}\n`,
    );
    await settled(awaiter, 'cc-1');
    awaiter.destroy();

    let received = '';
    stalled.setEncoding('utf8');
    stalled.on('data', (chunk: string) => {
      received += chunk;
    });
    stalled.resume();
    await new Promise<void>((resolvePromise) => {
      const poll = setInterval(() => {
        if (received.includes('"type":"exit"')) {
          clearInterval(poll);
          resolvePromise();
        }
      }, 20);
    });
    stalled.destroy();
    const notices = received
      .split('\n')
      .filter((line) => line.includes('"type":"output"'))
      .map((line) => Buffer.from((JSON.parse(line) as { data: string }).data, 'base64').toString('utf8'))
      .filter((text) => text.includes('output truncated'));

    await check({
      logPath: join(state, 'tickets', 'cc-1.log'),
      notices,
      result: (args) => run(['result', ...args], workspace, env),
    });
  } finally {
    await run(['daemon', 'stop'], workspace, env);
    removeTestPath(root);
  }
};

describe.skipIf(!existsSync(haulerEntry))('a client that stops reading a large build', () => {
  it('names the log that keeps the dropped output, and result --full says it shows only the tail', () =>
    withFloodedClient(async ({ logPath, notices, result }) => {
      const summary = await result(['cc-1']);
      const full = await result(['cc-1', '--full']);
      const logged = readFileSync(logPath, 'utf8').split('\n');

      expect(notices.map((text) => text.replace(/\d+ bytes dropped/u, 'N bytes dropped'))).toEqual([
        `[cargo-hauler] output truncated: client fell behind; N bytes dropped; full log: ${logPath}\n`,
      ]);
      expect(logged.filter((line) => line.startsWith('   Compiling crate-'))).toHaveLength(180_000);
      expect(logged.slice(-2)).toEqual(['after-stall', '']);
      expect(summary.stdout).toContain(
        `Full output: ${logPath} (10.0 MB) — hauler result cc-1 --full shows its last 768.0 KB\n`,
      );
      expect(full.stdout).toContain(
        `> Showing the last 768.0 KB of 10.0 MB; the first 9.3 MB are omitted here to fit the document. The whole run is in ${logPath}.\n`,
      );
    }), 60_000);
});
