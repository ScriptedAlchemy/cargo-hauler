import { spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import type { Server } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'effect-rstest';

import { removeTestPath } from '../support/tmp-guard.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const haulerEntry = join(repoRoot, 'dist', 'bin', 'hauler.js');

/**
 * Acks every exec with a measured ten-minute estimate, so the real client
 * auto-backgrounds without teaching the real cost model a nine-minute prior.
 */
const scriptedDaemon = (socketPath: string): Promise<Server> =>
  new Promise((resolvePromise) => {
    const server = createServer((socket) => {
      let pending = '';
      socket.on('data', (data) => {
        pending += data.toString('utf8');
        for (let end = pending.indexOf('\n'); end >= 0; end = pending.indexOf('\n')) {
          const message = JSON.parse(pending.slice(0, end)) as { type: string; id: string; ticket?: string };
          pending = pending.slice(end + 1);
          const reply =
            message.type === 'exec'
              ? { type: 'ack', id: message.id, ticket: 'cc-1', laneKey: 'lane', position: 0, etaMs: 600_000, etaSource: 'ewma' }
              : message.type === 'detach'
                ? { type: 'detach-result', id: message.id, ticket: message.ticket, detached: true }
                : null;
          if (reply !== null) socket.write(`${JSON.stringify(reply)}\n`);
        }
      });
    });
    server.listen(socketPath, () => resolvePromise(server));
  });

describe.skipIf(!existsSync(haulerEntry))('cargo test > out.log auto-backgrounded past the shell cap', () => {
  it('points the redirected caller at hauler result, not --full', async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'ch-redirect-')));
    const workspace = join(root, 'ws');
    const state = join(root, 'state');
    mkdirSync(workspace);
    mkdirSync(state);
    writeFileSync(join(workspace, 'Cargo.toml'), '[package]\nname = "ws"\n');
    const server = await scriptedDaemon(join(state, 'daemon.sock'));
    const outLog = join(root, 'out.log');
    const outFd = openSync(outLog, 'w');
    try {
      const { code, stderr } = await new Promise<{ code: number; stderr: string }>((resolvePromise, reject) => {
        const child = spawn(process.execPath, [haulerEntry, 'exec', '--', 'cargo', 'test'], {
          cwd: workspace,
          env: { ...process.env, CARGO_HAULER_HOST: 'claude', CARGO_HAULER_KACHE_INDEX: '', CARGO_HAULER_STATE_DIR: state },
          stdio: ['ignore', outFd, 'pipe'],
        });
        const chunks: Buffer[] = [];
        child.stderr?.on('data', (chunk: Buffer) => chunks.push(chunk));
        child.once('error', reject);
        child.once('close', (exit) => resolvePromise({ code: exit ?? 1, stderr: Buffer.concat(chunks).toString('utf8') }));
      });
      expect(code).toBe(75);
      expect(stderr).toContain(
        'It runs in the background and has not started yet (exit 75). Your redirected stdout receives no output. Once the ticket runs, `hauler result cc-1` names its full log.\n',
      );
      expect(readFileSync(outLog, 'utf8')).toBe('');
    } finally {
      closeSync(outFd);
      server.close();
      removeTestPath(root);
    }
  });
});
