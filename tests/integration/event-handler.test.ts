import { mkdtempSync } from 'node:fs';
import { createServer, type Server, type Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { JsonValue } from '@agent-bundle/runtime';
import { version } from 'agent-bundle/meta';
import type { EventContext } from 'agent-bundle/routes';
import { describe, expect, it } from 'effect-rstest';
import * as Effect from 'effect/Effect';

import { runExecClient } from '../../src/internal/client/exec.js';
import afterEvent from '../../src/events/tool/after.js';
import beforeEvent from '../../src/events/tool/before.js';
import { pingSessionCompleted } from '../../src/internal/host-hooks/session-ping.js';

import { fakeCargoEnv, pollReport, scopedDaemon } from '../support/harness.js';
import { removeTestPath } from '../support/tmp-guard.js';

/**
 * The shell routes' handlers decide on the raw command before the rendered
 * view — bash parser, rewrite, telemetry — is loaded: `render`
 * only for a command that names cargo or hauler (or, after the tool ran, when
 * the daemon reports a finished background ticket for the session), plain
 * `continue` for everything else.
 */
const eventContext = <E extends 'tool/before' | 'tool/after'>(
  event: E,
  payload: Record<string, unknown>,
): EventContext<E> =>
  ({
    canonical: { event, payload, provenance: { host: 'claude', nativeEvent: 'PreToolUse' } },
    native: {},
    render: (module: string, data: JsonValue) => ({ data, module, outcome: 'render' }),
    signal: new AbortController().signal,
  }) as unknown as EventContext<E>;

const shellPayload = (command: string | undefined, session = 'sess-claude'): Record<string, unknown> => ({
  cwd: { value: '/tmp/ws' },
  sessionId: { value: session },
  toolInput: command === undefined ? { value: { file_path: '/tmp/ws/Cargo.toml' } } : { value: { command } },
  toolName: { value: command === undefined ? 'Read' : 'Bash' },
});

describe('tool/before event handler', () => {
  it('continues a non-cargo command and a tool input without a command', async () => {
    expect(await beforeEvent(eventContext('tool/before', shellPayload('ls -la')))).toEqual({ outcome: 'continue' });
    expect(await beforeEvent(eventContext('tool/before', shellPayload('git status && pnpm test')))).toEqual({
      outcome: 'continue',
    });
    expect(await beforeEvent(eventContext('tool/before', shellPayload(undefined)))).toEqual({ outcome: 'continue' });
  });

  it('renders the view for cargo and hauler commands', async () => {
    for (const command of ['cargo test -p foo', 'cargo clean', 'cd crates/foo && cargo build', 'hauler status', 'hauler exec -- cargo check']) {
      expect(await beforeEvent(eventContext('tool/before', shellPayload(command)))).toEqual({
        data: {},
        module: './before.view.js',
        outcome: 'render',
      });
    }
  });
});

describe('tool/after event handler', () => {
  it('renders the view for a cargo command without pinging the daemon', async () => {
    expect(await afterEvent(eventContext('tool/after', shellPayload('cargo test -p foo')))).toEqual({
      data: {},
      module: './after.view.js',
      outcome: 'render',
    });
  });

  it('renders the view, without a ping, for a wrapper script whose output is cargo status lines', async () => {
    const cargoOutput = { exit_code: 0, stdout: '   Compiling foo v0.1.0\n    Finished `test` profile target(s) in 2.00s\n' };
    expect(
      await afterEvent(
        eventContext('tool/after', { ...shellPayload('/tmp/scratch/cg.sh test -p foo', ''), toolResponse: { value: cargoOutput } }),
      ),
    ).toEqual({ data: {}, module: './after.view.js', outcome: 'render' });
    // A saved log shown with a file reader is not a run: no session, so no ping, plain continue.
    expect(
      await afterEvent(eventContext('tool/after', { ...shellPayload('tail -30 build.log', ''), toolResponse: { value: cargoOutput } })),
    ).toEqual({ outcome: 'continue' });
  });

  it('continues without a ping when the host names no session', async () => {
    expect(await afterEvent(eventContext('tool/after', shellPayload('ls -la', '')))).toEqual({ outcome: 'continue' });
  });

  it('continues quietly when no daemon listens', async () => {
    const root = mkdtempSync(join(tmpdir(), 'hauler-event-handler-'));
    try {
      const previous = process.env.CARGO_HAULER_STATE_DIR;
      process.env.CARGO_HAULER_STATE_DIR = root;
      try {
        expect(await afterEvent(eventContext('tool/after', shellPayload('ls -la')))).toEqual({ outcome: 'continue' });
      } finally {
        if (previous === undefined) {
          delete process.env.CARGO_HAULER_STATE_DIR;
        } else {
          process.env.CARGO_HAULER_STATE_DIR = previous;
        }
      }
    } finally {
      removeTestPath(root);
    }
  });
});

describe('pingSessionCompleted', () => {
  const withServer = async (
    onLine: (line: string, socket: Socket) => void,
    body: (socketPath: string, received: string[]) => Promise<void>,
  ): Promise<void> => {
    const root = mkdtempSync(join(tmpdir(), 'hauler-ping-'));
    const socketPath = join(root, 'daemon.sock');
    const received: string[] = [];
    const server: Server = createServer((socket) => {
      let pending = '';
      socket.setEncoding('utf8');
      socket.on('data', (chunk: string) => {
        pending += chunk;
        let newline = pending.indexOf('\n');
        while (newline !== -1) {
          const line = pending.slice(0, newline);
          pending = pending.slice(newline + 1);
          const message = JSON.parse(line) as { readonly id?: string; readonly type?: string };
          if (message.type === 'ping') {
            socket.write(
              `${JSON.stringify({ id: message.id, pid: process.pid, protocol: 1, startedAtMs: 1, type: 'pong', version })}\n`,
            );
          } else {
            received.push(line);
            onLine(line, socket);
          }
          newline = pending.indexOf('\n');
        }
      });
    });
    await new Promise<void>((resolve) => {
      server.listen(socketPath, resolve);
    });
    try {
      await body(socketPath, received);
    } finally {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
      removeTestPath(root);
    }
  };

  it('sends the session-completed request and reads the finished tickets', async () => {
    await withServer(
      (_line, socket) => {
        socket.write(
          `${JSON.stringify({
            id: 'hook-completed',
            requests: [
              { error: null, errorCount: 0, exitCode: 0, status: 'done', ticket: 'cc-3', warningCount: 1 },
              { status: 'queued', ticket: 'cc-4' },
              'not a ticket',
            ],
            type: 'session-completed-result',
          })}\n`,
        );
      },
      async (socketPath, received) => {
        const ping = await pingSessionCompleted('sess-ping', 1234, { socketPath, timeoutMs: 500 });
        expect(ping).toEqual({
          kind: 'finished',
          tickets: [{ error: null, errorCount: 0, exitCode: 0, status: 'done', ticket: 'cc-3', warningCount: 1 }],
        });
        expect(received.map((line) => JSON.parse(line) as unknown)).toEqual([
          { id: 'hook-completed', session: 'sess-ping', sinceMs: 1234, type: 'session-completed' },
        ]);
      },
    );
  });

  it('reports a reply that is not a session-completed-result as malformed', async () => {
    await withServer(
      (_line, socket) => {
        socket.write(`${JSON.stringify({ type: 'error', message: 'unknown request' })}\n`);
      },
      async (socketPath) => {
        expect(await pingSessionCompleted('sess-ping', 0, { socketPath })).toEqual({
          kind: 'unavailable',
          reason: 'malformed',
        });
      },
    );
  });

  it('gives up within the budget when the daemon accepts but never answers', async () => {
    await withServer(
      () => undefined,
      async (socketPath, received) => {
        let longerSettled = false;
        const longer = pingSessionCompleted('sess-longer', 0, { socketPath, timeoutMs: 1_000 }).finally(() => {
          longerSettled = true;
        });
        while (received.length === 0) {
          await new Promise((resolve) => setImmediate(resolve));
        }
        expect(await pingSessionCompleted('sess-ping', 0, { socketPath, timeoutMs: 100 })).toEqual({
          kind: 'unavailable',
          reason: 'timeout',
        });
        expect(longerSettled).toBe(false);
        expect(await longer).toEqual({ kind: 'unavailable', reason: 'timeout' });
      },
    );
  });

  it('reports a daemon that hangs up before answering as closed', async () => {
    await withServer(
      (_line, socket) => {
        socket.end();
      },
      async (socketPath) => {
        expect(await pingSessionCompleted('sess-ping', 0, { socketPath })).toEqual({
          kind: 'unavailable',
          reason: 'closed',
        });
      },
    );
  });

  it('is unreachable, fast and silent, when nothing listens on the socket path', async () => {
    const root = mkdtempSync(join(tmpdir(), 'hauler-ping-none-'));
    try {
      const startedAt = performance.now();
      const ping = await pingSessionCompleted('sess-ping', 0, { socketPath: join(root, 'missing.sock') });
      expect(ping).toEqual({ code: 'ENOENT', kind: 'unavailable', reason: 'unreachable' });
      expect(performance.now() - startedAt).toBeLessThan(1_000);
    } finally {
      removeTestPath(root);
    }
  });

  it.live('speaks the running daemon protocol and feeds the after-tool hook its finished tickets', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      const session = 'sess-live-ping';
      // Only a background ticket reaches the agent through session-completed;
      // a streamed one already delivered its exit to the waiting client.
      const submitted = yield* runExecClient({
        argv: ['cargo', 'check'],
        autoSpawn: false,
        background: true,
        config: fixture.config,
        cwd: fixture.ws1,
        env: fakeCargoEnv(fixture),
        host: 'claude',
        io: { writeStderr: () => undefined, writeStdout: () => undefined },
        session,
      });
      expect(submitted.ticket).toMatch(/^cc-\d+$/u);
      yield* pollReport(fixture, (report) =>
        report.recent.some((request) => request.ticket === submitted.ticket && request.status === 'done'),
      );
      const socketPath = fixture.config.socketPath;

      const pinged = yield* Effect.promise(() => pingSessionCompleted(session, 0, { socketPath }));
      expect(pinged).toEqual({
        kind: 'finished',
        tickets: [expect.objectContaining({ exitCode: 0, status: 'done' })],
      });
      // Another session sees nothing; the ledger answers per session.
      expect(yield* Effect.promise(() => pingSessionCompleted('sess-other', 0, { socketPath }))).toEqual({
        kind: 'finished',
        tickets: [],
      });

      // The handler against the live daemon: a non-cargo `ls` in the session
      // that ran cargo loads the route; another session's does not.
      const previous = process.env.CARGO_HAULER_STATE_DIR;
      process.env.CARGO_HAULER_STATE_DIR = fixture.config.stateDir;
      try {
        expect(yield* Effect.promise(() => Promise.resolve(afterEvent(eventContext('tool/after', shellPayload('ls -la', session)))))).toEqual({
          data: {
            asOfMs: expect.any(Number),
            kind: 'finished',
            tickets: [expect.objectContaining({ exitCode: 0, status: 'done' })],
          },
          module: './after.view.js',
          outcome: 'render',
        });
        expect(yield* Effect.promise(() => Promise.resolve(afterEvent(eventContext('tool/after', shellPayload('ls -la', 'sess-other')))))).toEqual({
          outcome: 'continue',
        });
      } finally {
        if (previous === undefined) {
          delete process.env.CARGO_HAULER_STATE_DIR;
        } else {
          process.env.CARGO_HAULER_STATE_DIR = previous;
        }
      }
    }), 20_000);
});
