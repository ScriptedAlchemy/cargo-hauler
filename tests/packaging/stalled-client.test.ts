import { spawn } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
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

const run = (args: readonly string[], cwd: string, env: Readonly<Record<string, string>>): Promise<number> =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [haulerEntry, ...args], {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'ignore',
    });
    child.once('error', reject);
    child.once('close', (code) => resolvePromise(code ?? 1));
  });

const open = (path: string): Promise<Socket> =>
  new Promise((resolvePromise, reject) => {
    const socket = connect(path);
    socket.once('connect', () => resolvePromise(socket));
    socket.once('error', reject);
  });

/** Round-trips one ping at a time until `stop` resolves; returns the slowest. */
const worstPingMs = async (socket: Socket, stop: Promise<void>): Promise<number> => {
  let stopped = false;
  void stop.then(() => {
    stopped = true;
  });
  let worst = 0;
  let sequence = 0;
  while (!stopped) {
    const id = `ping-${sequence++}`;
    const startedAt = performance.now();
    await new Promise<void>((resolvePromise) => {
      const onData = (chunk: Buffer): void => {
        if (chunk.toString('utf8').includes(`"${id}"`)) {
          socket.off('data', onData);
          resolvePromise();
        }
      };
      socket.on('data', onData);
      socket.write(`${JSON.stringify({ type: 'ping', id })}\n`);
    });
    worst = Math.max(worst, performance.now() - startedAt);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 5));
  }
  return worst;
};

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

describe.skipIf(!existsSync(haulerEntry))('a client that stops reading a large build', () => {
  it('never blocks the daemon when its queued output is cut to the stalled limit', async () => {
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
      expect(await run(['daemon', 'start'], workspace, env)).toBe(0);
      const socketPath = join(state, 'daemon.sock');
      const prober = await open(socketPath);
      const awaiter = await open(socketPath);
      const stalled = await open(socketPath);
      stalled.pause();
      stalled.write(
        `${JSON.stringify({ type: 'exec', id: 'exec-1', argv: ['cargo', 'build', '--bin', 'flood'], cwd: workspace })}\n`,
      );
      const worst = await worstPingMs(prober, settled(awaiter, 'cc-1'));
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
      prober.destroy();
      stalled.destroy();
      const notices = received
        .split('\n')
        .filter((line) => line.includes('"type":"output"'))
        .map((line) => Buffer.from((JSON.parse(line) as { data: string }).data, 'base64').toString('utf8'))
        .filter((text) => text.includes('output truncated'));

      expect(notices).toHaveLength(1);
      expect(worst).toBeLessThan(100);
    } finally {
      await run(['daemon', 'stop'], workspace, env);
      removeTestPath(root);
    }
  }, 60_000);
});
