import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'effect-rstest';
import * as Effect from 'effect/Effect';

import { pingDaemon } from '../src/daemon/control.js';
import { requestShutdown } from '../src/daemon/shutdown.js';

const fixtureEntry = fileURLToPath(
  new URL('./fixtures/shutdown-daemon.mjs', import.meta.url),
);
const startFixture = (
  socketPath: string,
  mode: string,
): Promise<ChildProcess> =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [fixtureEntry, socketPath, mode], {
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`shutdown fixture exited before readiness (${code})`));
      }
    });
    child.stdout.setEncoding('utf8');
    child.stdout.once('data', (chunk: string) => {
      if (chunk.includes('ready')) resolvePromise(child);
      else reject(new Error(`unexpected shutdown fixture readiness output: ${chunk}`));
    });
  });

const withFixture = async <T>(
  mode: string,
  body: (socketPath: string, child: ChildProcess) => Promise<T>,
): Promise<T> => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'chs-')));
  const socketPath = join(root, 'daemon.sock');
  const child = await startFixture(socketPath, mode);
  try {
    return await body(socketPath, child);
  } finally {
    child.kill('SIGTERM');
    rmSync(root, { force: true, recursive: true });
  }
};

describe('shutdown socket outcome', () => {
  const cases = [
    {
      mode: 'acknowledged',
      expected: { kind: 'acknowledged' },
    },
    {
      mode: 'refused',
      expected: {
        code: 'shutdown-refused',
        kind: 'refused',
        message: 'fixture refused shutdown',
      },
    },
    {
      mode: 'internal',
      expected: {
        code: 'internal',
        kind: 'protocol-error',
        message: 'fixture internal error',
      },
    },
    {
      mode: 'bad-message',
      expected: {
        code: 'bad-message',
        kind: 'protocol-error',
        message: 'fixture bad-message error',
      },
    },
    {
      mode: 'disconnect',
      expected: { kind: 'connection-closed' },
    },
    {
      mode: 'silent',
      expected: { kind: 'timeout', phase: 'response' },
    },
  ] as const;

  for (const testCase of cases) {
    it(`maps ${testCase.mode} without inventing an acknowledgement`, async () => {
      await withFixture(testCase.mode, async (socketPath) => {
        const timeoutMs = testCase.mode === 'silent' ? 100 : 5_000;
        const outcome = await Effect.runPromise(requestShutdown(socketPath, timeoutMs));
        expect(outcome).toEqual(testCase.expected);
        if (testCase.mode !== 'acknowledged') {
          await expect(Effect.runPromise(pingDaemon(socketPath, 500))).resolves.toMatchObject({
            pid: expect.any(Number),
          });
        }
      });
    });
  }
});
