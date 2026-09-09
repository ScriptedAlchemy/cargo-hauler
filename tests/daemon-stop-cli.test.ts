import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'effect-rstest';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const fixtureEntry = join(repoRoot, 'tests', 'fixtures', 'shutdown-daemon.mjs');
const projections = [
  { name: 'hauler', entry: join(repoRoot, 'dist', 'bin', 'hauler.js'), args: ['daemon', 'stop'] },
  {
    name: 'cargo-hauler',
    entry: join(repoRoot, 'dist', 'bin', 'cargo-hauler.mjs'),
    args: ['daemon', 'stop', '--json'],
  },
] as const;

interface Invocation {
  readonly code: number;
  readonly stderr: string;
  readonly stdout: string;
}

interface DaemonResult {
  readonly message: string;
  readonly pid: number | null;
  readonly previousPid?: number | null;
  readonly running: boolean | null;
  readonly shutdown?: {
    readonly kind: string;
    readonly code?: string;
    readonly message?: string;
    readonly phase?: string;
  };
}

const children = new Set<ChildProcess>();

afterEach(() => {
  for (const child of children) child.kill('SIGTERM');
  children.clear();
});

const run = (
  entry: string,
  args: readonly string[],
  env: Readonly<Record<string, string>>,
): Promise<Invocation> =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [entry, ...args], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.add(child);
    let stderr = '';
    let stdout = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.once('error', reject);
    child.once('close', (code) => {
      children.delete(child);
      resolvePromise({ code: code ?? 1, stderr, stdout });
    });
  });

const startFixture = (socketPath: string, mode: string): Promise<ChildProcess> =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [fixtureEntry, socketPath, mode], {
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    children.add(child);
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

const invokeWithFixture = async (
  projection: (typeof projections)[number],
  mode: string,
): Promise<{ readonly child: ChildProcess; readonly invocation: Invocation; readonly result: DaemonResult }> => {
  const root = mkdtempSync(join(tmpdir(), `cargo-hauler-stop-${mode}-`));
  const stateDir = join(root, 'state');
  const child = await startFixture(join(stateDir, 'daemon.sock'), mode);
  try {
    const invocation = await run(projection.entry, projection.args, {
      CARGO_HAULER_KACHE_INDEX: '',
      CARGO_HAULER_STATE_DIR: stateDir,
    });
    return { child, invocation, result: JSON.parse(invocation.stdout) as DaemonResult };
  } finally {
    child.kill('SIGTERM');
    children.delete(child);
    rmSync(root, { force: true, recursive: true });
  }
};

describe.skipIf(projections.some(({ entry }) => !existsSync(entry)))(
  'daemon stop CLI outcomes',
  () => {
    const failures = [
      {
        mode: 'refused',
        shutdown: {
          code: 'shutdown-refused',
          kind: 'refused',
          message: 'fixture refused shutdown',
        },
      },
      { mode: 'silent', shutdown: { kind: 'timeout', phase: 'response' } },
      {
        mode: 'internal',
        shutdown: {
          code: 'internal',
          kind: 'protocol-error',
          message: 'fixture internal error',
        },
      },
      {
        mode: 'bad-message',
        shutdown: {
          code: 'bad-message',
          kind: 'protocol-error',
          message: 'fixture bad-message error',
        },
      },
      { mode: 'disconnect', shutdown: { kind: 'connection-closed' } },
    ] as const;

    for (const failure of failures) {
      for (const projection of projections) {
        it(
          `${projection.name} exits nonzero and keeps the original daemon identity after ${failure.mode}`,
          async () => {
            const { child, invocation, result } = await invokeWithFixture(
              projection,
              failure.mode,
            );
            expect(invocation.code).toBe(1);
            expect(invocation.stderr).toBe('');
            expect(result).toMatchObject({
              pid: child.pid,
              previousPid: child.pid,
              running: true,
              shutdown: failure.shutdown,
            });
          },
          30_000,
        );
      }
    }

    for (const projection of projections) {
      it(
        `${projection.name} distinguishes acknowledgement from a daemon that remains alive`,
        async () => {
          const { child, invocation, result } = await invokeWithFixture(
            projection,
            'acknowledged-stubborn',
          );
          expect(invocation.code).toBe(1);
          expect(result).toMatchObject({
            pid: child.pid,
            previousPid: child.pid,
            running: true,
            shutdown: { kind: 'acknowledged' },
          });
          expect(result.message).toContain('acknowledged');
          expect(result.message).toContain('still running');
        },
        30_000,
      );

      it(`${projection.name} succeeds only after an acknowledged daemon exits`, async () => {
        const { child, invocation, result } = await invokeWithFixture(
          projection,
          'acknowledged',
        );
        expect(invocation.code).toBe(0);
        expect(result).toMatchObject({
          pid: null,
          previousPid: child.pid,
          running: false,
          shutdown: { kind: 'acknowledged' },
        });
      });

      it(`${projection.name} treats an already absent daemon as idempotent success`, async () => {
        const root = mkdtempSync(join(tmpdir(), 'cargo-hauler-stop-absent-'));
        try {
          const invocation = await run(projection.entry, projection.args, {
            CARGO_HAULER_KACHE_INDEX: '',
            CARGO_HAULER_STATE_DIR: join(root, 'state'),
          });
          expect(invocation.code).toBe(0);
          expect(JSON.parse(invocation.stdout)).toMatchObject({
            pid: null,
            running: false,
            shutdown: { kind: 'absent' },
          });
        } finally {
          rmSync(root, { force: true, recursive: true });
        }
      });
    }
  },
);
