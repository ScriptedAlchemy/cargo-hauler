import { createConnection, createServer, type Server, type Socket } from 'node:net';

import { describe, expect, it } from 'effect-rstest';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Schedule from 'effect/Schedule';
import type * as Scope from 'effect/Scope';

import { connectionLostExitCode, runExecClient } from '../../src/internal/client/exec.js';
import { pingDaemon, requestOverSocket } from '../../src/internal/client/control.js';
import { daemonVersion, runDaemon } from '../../src/internal/daemon/main.js';
import {
  encodeClientMessage,
  type AckMessage,
  type ClientMessage,
  type ReattachResultMessage,
  type ServerMessage,
} from '../../src/internal/contracts/protocol.js';
import { requestShutdown } from '../../src/internal/client/shutdown.js';
import { LineBuffer } from '../../src/internal/platform/ndjson.js';

import {
  decodeOutput,
  fakeCargoEnv,
  fetchReport,
  findExit,
  pollReport,
  scopedDaemon,
  scopedFixture,
  shortId,
  type Fixture,
} from '../support/harness.js';

/**
 * A raw client connection the test can hang up on at will — the daemon then
 * sees exactly what it sees when an agent shell dies or a client crashes
 * mid-request.
 */
interface RawConnection {
  readonly received: () => readonly ServerMessage[];
  readonly send: (message: ClientMessage) => void;
  readonly waitFor: (predicate: (message: ServerMessage) => boolean) => Effect.Effect<ServerMessage>;
  /** Destroy the socket without any protocol goodbye. */
  readonly drop: () => void;
}

const rawConnection = (socketPath: string): Effect.Effect<RawConnection, never, Scope.Scope> =>
  Effect.gen(function* () {
    const received: ServerMessage[] = [];
    const waiters: { predicate: (message: ServerMessage) => boolean; resolve: (message: ServerMessage) => void }[] = [];
    const socket = yield* Effect.acquireRelease(
      Effect.callback<Socket>((resume) => {
        const lines = new LineBuffer();
        const client = createConnection(socketPath, () => resume(Effect.succeed(client)));
        client.on('data', (data) => {
          for (const line of lines.push(data)) {
            const message = JSON.parse(line) as ServerMessage;
            received.push(message);
            for (const waiter of [...waiters]) {
              if (waiter.predicate(message)) {
                waiters.splice(waiters.indexOf(waiter), 1);
                waiter.resolve(message);
              }
            }
          }
        });
        client.on('error', () => undefined);
      }),
      (client) => Effect.sync(() => client.destroy()),
    );
    return {
      drop: () => socket.destroy(),
      received: () => received,
      send: (message) => {
        socket.write(encodeClientMessage(message));
      },
      waitFor: (predicate) =>
        Effect.callback<ServerMessage>((resume) => {
          const already = received.find(predicate);
          if (already !== undefined) {
            resume(Effect.succeed(already));
            return;
          }
          waiters.push({ predicate, resolve: (message) => resume(Effect.succeed(message)) });
        }).pipe(Effect.timeout('10 seconds'), Effect.orDie),
    };
  });

interface SocketProxy {
  readonly socketPath: string;
  /** Connections accepted so far. */
  readonly connections: () => number;
  /** Destroy every live pair: client and daemon both see the peer vanish. */
  readonly severAll: () => void;
  /** Accept new clients without connecting them to the daemon yet. */
  readonly pauseNewConnections: () => void;
  /** Connect every client held by `pauseNewConnections`. */
  readonly resumeNewConnections: () => void;
  /**
   * Stop forwarding daemon→client bytes on the connections open right now.
   * Whatever the daemon says on them from here (a goodbye `exit`, say) never
   * reaches the client, though a daemon-side close still does — the wire as
   * a crashed or SIGKILLed daemon leaves it. Later connections are untouched.
   */
  readonly mute: () => void;
}

/** A unix-socket pass-through in front of the daemon that the test can cut. */
const socketProxy = (daemonSocketPath: string): Effect.Effect<SocketProxy, never, Scope.Scope> =>
  Effect.gen(function* () {
    const socketPath = `${daemonSocketPath}.proxy`;
    const pairs = new Set<Socket>();
    const waiting = new Set<Socket>();
    const muters = new Set<() => void>();
    let accepted = 0;
    let paused = false;
    let bridge: (client: Socket) => void = () => undefined;
    yield* Effect.acquireRelease(
      Effect.callback<Server>((resume) => {
        bridge = (client: Socket): void => {
          const upstream = createConnection(daemonSocketPath);
          pairs.add(client);
          pairs.add(upstream);
          let forwarding = true;
          muters.add(() => {
            forwarding = false;
          });
          client.pipe(upstream);
          upstream.on('data', (data: Buffer) => {
            if (forwarding) {
              client.write(data);
            }
          });
          const close = (): void => {
            client.destroy();
            upstream.destroy();
            pairs.delete(client);
            pairs.delete(upstream);
            waiting.delete(client);
          };
          client.on('close', close);
          upstream.on('close', close);
          client.on('error', () => undefined);
          upstream.on('error', () => undefined);
        };
        const listener = createServer((client) => {
          accepted += 1;
          pairs.add(client);
          if (paused) {
            waiting.add(client);
            client.on('close', () => {
              pairs.delete(client);
              waiting.delete(client);
            });
            client.on('error', () => undefined);
            return;
          }
          bridge(client);
        });
        listener.listen(socketPath, () => resume(Effect.succeed(listener)));
      }),
      (listener) =>
        Effect.callback<void>((resume) => {
          for (const socket of pairs) {
            socket.destroy();
          }
          listener.close(() => resume(Effect.void));
        }),
    );
    return {
      connections: () => accepted,
      mute: () => {
        for (const mute of muters) {
          mute();
        }
        muters.clear();
      },
      pauseNewConnections: () => {
        paused = true;
      },
      resumeNewConnections: () => {
        paused = false;
        for (const client of waiting) {
          waiting.delete(client);
          if (!client.destroyed) {
            bridge(client);
          }
        }
      },
      severAll: () => {
        for (const socket of pairs) {
          socket.destroy();
        }
        pairs.clear();
      },
      socketPath,
    };
  });

const isAck = (message: ServerMessage): message is AckMessage => message.type === 'ack';

/** Submit over a raw connection and return the ack; the connection stays open. */
const submitRaw = (
  connection: RawConnection,
  fixture: Fixture,
  argv: readonly string[],
  env: Readonly<Record<string, string>> = {},
): Effect.Effect<AckMessage> =>
  Effect.gen(function* () {
    const id = shortId();
    connection.send({
      argv: [...argv],
      cwd: fixture.ws1,
      env: fakeCargoEnv(fixture, env),
      id,
      type: 'exec',
    });
    const ack = yield* connection.waitFor((message) => isAck(message) && message.id === id);
    if (!isAck(ack)) {
      throw new Error('ack expected');
    }
    return ack;
  });

/** Occupy ws1's lane so the next submission queues behind it. */
const occupyLane = (
  fixture: Fixture,
  sleep: string,
): Effect.Effect<AckMessage, never, Scope.Scope> =>
  Effect.gen(function* () {
    const head = yield* rawConnection(fixture.config.socketPath);
    return yield* submitRaw(head, fixture, ['cargo', 'build'], { FAKE_SLEEP: sleep });
  });

const reattach = (
  fixture: Fixture,
  ticket: string,
  fromByte = 0,
  timeoutMs = 15_000,
): Effect.Effect<readonly ServerMessage[], unknown> =>
  requestOverSocket({
    isTerminal: (message) =>
      message.type === 'exit' ||
      (message.type === 'reattach-result' && message.outcome !== 'active') ||
      message.type === 'error',
    message: { fromByte, id: shortId(), ticket, type: 'reattach' },
    socketPath: fixture.config.socketPath,
    timeoutMs,
  });

const findReattachResult = (messages: readonly ServerMessage[]): ReattachResultMessage => {
  const result = messages.find(
    (message): message is ReattachResultMessage => message.type === 'reattach-result',
  );
  if (result === undefined) {
    throw new Error(`no reattach-result in ${JSON.stringify(messages)}`);
  }
  return result;
};

const collectIo = (): {
  readonly io: {
    readonly writeStderr: (data: string | Uint8Array) => void;
    readonly writeStdout: (data: Uint8Array) => void;
  };
  readonly stderr: () => string;
  readonly stdout: () => string;
} => {
  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];
  return {
    io: {
      writeStderr: (data) => {
        stderr.push(typeof data === 'string' ? Buffer.from(data) : Buffer.from(data));
      },
      writeStdout: (data) => {
        stdout.push(Buffer.from(data));
      },
    },
    stderr: () => Buffer.concat(stderr).toString('utf8'),
    stdout: () => Buffer.concat(stdout).toString('utf8'),
  };
};

const waitUntil = (condition: () => boolean): Effect.Effect<void> =>
  Effect.suspend(() => Effect.succeed(condition())).pipe(
    Effect.repeat({ until: (ready) => ready, schedule: Schedule.spaced('20 millis') }),
    Effect.timeout('10 seconds'),
    Effect.orDie,
    Effect.asVoid,
  );

describe('reattach after a lost connection (#187)', () => {
  it.live('keeps a queued ticket through the grace window and streams it to the reattached client', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      yield* occupyLane(fixture, '1');
      const first = yield* rawConnection(fixture.config.socketPath);
      const ack = yield* submitRaw(first, fixture, ['cargo', 'test'], { FAKE_EXIT: '17' });
      expect(ack.position).toBe(1);
      first.drop();

      // The daemon knows the owner is gone but keeps the queue position.
      const orphaned = yield* pollReport(fixture, (report) =>
        report.active.some((row) => row.ticket === ack.ticket && row.orphaned === true),
      );
      expect(orphaned.active.find((row) => row.ticket === ack.ticket)?.status).toBe('queued');

      const messages = yield* reattach(fixture, ack.ticket);
      const result = findReattachResult(messages);
      expect(result).toMatchObject({ outcome: 'active', state: 'queued', missedBytes: 0 });
      expect(decodeOutput(messages, 'stdout')).toContain('fake-out:test');
      const exit = findExit(messages);
      expect(exit.ticket).toBe(ack.ticket);
      expect(exit.status).toBe('failed');
      expect(exit.exitCode).toBe(17);
    }), 30_000);

  it.live('kills a queued ticket nobody reattached to once the grace window has passed', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1, { CARGO_HAULER_REATTACH_GRACE_MS: '300' });
      yield* occupyLane(fixture, '2');
      const first = yield* rawConnection(fixture.config.socketPath);
      const ack = yield* submitRaw(first, fixture, ['cargo', 'test']);
      first.drop();

      const settled = yield* pollReport(fixture, (report) =>
        report.recent.some((row) => row.ticket === ack.ticket && row.status === 'killed'),
      );
      const row = settled.recent.find((candidate) => candidate.ticket === ack.ticket);
      expect(row?.status).toBe('killed');
      expect(row?.error).toBe(
        'killed while queued: submitter disconnected and did not reattach within 0.3s',
      );
      expect(row?.startedAtMs).toBeNull();
    }), 30_000);

  it.live('CARGO_HAULER_REATTACH_GRACE_MS=0 kills a queued ticket the moment its client disconnects', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1, { CARGO_HAULER_REATTACH_GRACE_MS: '0' });
      yield* occupyLane(fixture, '2');
      const first = yield* rawConnection(fixture.config.socketPath);
      const ack = yield* submitRaw(first, fixture, ['cargo', 'test']);
      first.drop();

      const settled = yield* pollReport(fixture, (report) =>
        report.recent.some((row) => row.ticket === ack.ticket && row.status === 'killed'),
      );
      const row = settled.recent.find((candidate) => candidate.ticket === ack.ticket);
      expect(row?.status).toBe('killed');
      expect(row?.error).toBe('killed while queued');

      const messages = yield* reattach(fixture, ack.ticket);
      expect(findReattachResult(messages)).toMatchObject({
        outcome: 'terminal',
        request: expect.objectContaining({ status: 'killed', error: 'killed while queued' }),
      });
    }), 30_000);

  it.live('rebinds a running ticket, clears orphaned, and replays only the output the client missed', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      const first = yield* rawConnection(fixture.config.socketPath);
      const ack = yield* submitRaw(first, fixture, ['cargo', 'test'], {
        FAKE_OUTPUT_COUNT: '20',
        FAKE_OUTPUT_INTERVAL: '0.05',
      });
      yield* first.waitFor(
        (message) =>
          message.type === 'output' &&
          Buffer.from(message.data, 'base64').toString('utf8').includes('fake-tick:3'),
      );
      const before = first.received();
      const receivedBytes = before
        .filter((message) => message.type === 'output')
        .reduce(
          (total, message) =>
            total + (message.type === 'output' ? Buffer.from(message.data, 'base64').byteLength : 0),
          0,
        );
      first.drop();
      yield* pollReport(fixture, (report) =>
        report.active.some((row) => row.ticket === ack.ticket && row.orphaned === true),
      );

      const messages = yield* reattach(fixture, ack.ticket, receivedBytes);
      const result = findReattachResult(messages);
      expect(result).toMatchObject({ outcome: 'active', state: 'running', missedBytes: 0 });
      expect(result.outputPath).toMatch(/\.log$/u);
      const report = yield* fetchReport(fixture);
      expect(report.active.find((row) => row.ticket === ack.ticket)?.orphaned).toBeUndefined();

      const exit = findExit(messages);
      expect(exit.status).toBe('done');
      expect(exit.exitCode).toBe(0);
      // Stitched together, the two connections saw the run exactly once.
      const stdout = decodeOutput(before, 'stdout') + decodeOutput(messages, 'stdout');
      const ticks = [...stdout.matchAll(/fake-tick:(\d+)/gu)].map((match) => Number(match[1]));
      expect(ticks).toEqual(Array.from({ length: 20 }, (_, index) => index));
    }), 30_000);

  it.live('labels output the replay buffer no longer holds as missed instead of inventing it', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1, { CARGO_HAULER_REPLAY_BUFFER_BYTES: '64' });
      const first = yield* rawConnection(fixture.config.socketPath);
      const ack = yield* submitRaw(first, fixture, ['cargo', 'test'], {
        FAKE_OUTPUT_BYTES: '4096',
        FAKE_SLEEP: '1.5',
      });
      // Only once more than the buffer's 64 bytes have reached this client is
      // there anything to lose: macOS `head -c` hands the bulk over in small
      // writes, so the first output message alone may fit the buffer.
      const outputBytesReceived = (): number =>
        first
          .received()
          .reduce(
            (total, message) =>
              message.type === 'output' ? total + Buffer.from(message.data, 'base64').byteLength : total,
            0,
          );
      yield* first.waitFor((message) => message.type === 'output' && outputBytesReceived() > 64);
      first.drop();

      // The client claims it saw nothing: everything before the buffer's tail is gone.
      const messages = yield* reattach(fixture, ack.ticket, 0);
      const result = findReattachResult(messages);
      expect(result.outcome).toBe('active');
      expect(result.missedBytes).toBeGreaterThan(0);
      expect(findExit(messages).status).toBe('done');
    }), 30_000);

  it.live('marks a late rider replay-truncation notice as zero-cursor output', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1, { CARGO_HAULER_REPLAY_BUFFER_BYTES: '64' });
      const env = { FAKE_OUTPUT_BYTES: '4096', FAKE_SLEEP: '1.5' };
      const first = yield* rawConnection(fixture.config.socketPath);
      yield* submitRaw(first, fixture, ['cargo', 'test'], env);
      const outputBytesReceived = (): number =>
        first
          .received()
          .reduce(
            (total, message) =>
              message.type === 'output'
                ? total + Buffer.from(message.data, 'base64').byteLength
                : total,
            0,
          );
      yield* first.waitFor((message) => message.type === 'output' && outputBytesReceived() > 64);

      const rider = yield* rawConnection(fixture.config.socketPath);
      yield* submitRaw(rider, fixture, ['cargo', 'test'], env);
      const notice = yield* rider.waitFor(
        (message) =>
          message.type === 'output' &&
          Buffer.from(message.data, 'base64').toString('utf8').includes('replay truncated'),
      );
      expect(notice).toMatchObject({ type: 'output', cursorBytes: 0 });
      yield* rider.waitFor((message) => message.type === 'exit');
    }), 30_000);

  it.live('answers a finished ticket with its record', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      const first = yield* rawConnection(fixture.config.socketPath);
      const ack = yield* submitRaw(first, fixture, ['cargo', 'test'], { FAKE_EXIT: '3' });
      yield* first.waitFor((message) => message.type === 'exit');

      const messages = yield* reattach(fixture, ack.ticket);
      const result = findReattachResult(messages);
      expect(result.outcome).toBe('terminal');
      expect(result.request).toMatchObject({ exitCode: 3, status: 'failed', ticket: ack.ticket });
    }), 30_000);

  it.live('rejects a ticket it does not know', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      const messages = yield* reattach(fixture, 'cc-424242');
      expect(findReattachResult(messages)).toMatchObject({ outcome: 'unknown', ticket: 'cc-424242' });
    }), 30_000);

  it.live('runExecClient reattaches to its own ticket after the connection drops and exits with cargo’s code', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      yield* occupyLane(fixture, '1');
      // The client talks to the daemon through a proxy the test can sever:
      // both ends then see exactly what a dropped socket looks like.
      const proxy = yield* socketProxy(fixture.config.socketPath);
      const collected = collectIo();
      const run = yield* Effect.forkScoped(
        runExecClient({
          argv: ['cargo', 'test'],
          autoSpawn: false,
          config: { ...fixture.config, socketPath: proxy.socketPath },
          cwd: fixture.ws1,
          env: fakeCargoEnv(fixture, { FAKE_EXIT: '5' }),
          io: collected.io,
        }),
      );
      yield* waitUntil(() => /queued behind cc-\d+ \(1 ahead/u.test(collected.stderr()));
      const ticket = /ticket (cc-\d+) queued/u.exec(collected.stderr())?.[1] ?? '';
      expect(ticket).toMatch(/^cc-\d+$/u);
      proxy.severAll();

      const result = yield* Fiber.join(run);
      expect(result).toEqual({ exitCode: 5, mode: 'brokered', ticket });
      expect(collected.stderr()).not.toContain('continues');
      expect(collected.stderr()).toContain(`connection to daemon lost; reattaching to ticket ${ticket}`);
      expect(collected.stderr()).toContain(`reattached to ticket ${ticket} (queued)`);
      expect(collected.stderr()).not.toContain('missed while reconnecting');
      expect(collected.stdout()).toContain('fake-out:test');
      // Two connections reached the daemon: the original and the reattach.
      expect(proxy.connections()).toBe(2);
    }), 30_000);

  it.live('runExecClient resumes a running ticket without repeating output it already printed', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      const proxy = yield* socketProxy(fixture.config.socketPath);
      const collected = collectIo();
      const run = yield* Effect.forkScoped(
        runExecClient({
          argv: ['cargo', 'test'],
          autoSpawn: false,
          config: { ...fixture.config, socketPath: proxy.socketPath },
          cwd: fixture.ws1,
          env: fakeCargoEnv(fixture, { FAKE_OUTPUT_COUNT: '20', FAKE_OUTPUT_INTERVAL: '0.05' }),
          io: collected.io,
        }),
      );
      yield* waitUntil(() => collected.stdout().includes('fake-tick:4'));
      proxy.severAll();

      const result = yield* Fiber.join(run);
      expect(result.exitCode).toBe(0);
      expect(collected.stderr()).toContain('reattached to ticket');
      expect(collected.stderr()).toContain('(running)');
      const ticks = [...collected.stdout().matchAll(/fake-tick:(\d+)/gu)].map((match) => Number(match[1]));
      expect(ticks).toEqual(Array.from({ length: 20 }, (_, index) => index));
    }), 30_000);

  it.live('runExecClient fails closed when the replay buffer cannot restore every output byte', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1, { CARGO_HAULER_REPLAY_BUFFER_BYTES: '64' });
      const proxy = yield* socketProxy(fixture.config.socketPath);
      const collected = collectIo();
      const run = yield* Effect.forkScoped(
        runExecClient({
          argv: ['cargo', 'test'],
          autoSpawn: false,
          config: { ...fixture.config, socketPath: proxy.socketPath },
          cwd: fixture.ws1,
          env: fakeCargoEnv(fixture, {
            FAKE_OUTPUT_COUNT: '50',
            FAKE_OUTPUT_INTERVAL: '0.02',
            FAKE_SLEEP: '2',
          }),
          io: collected.io,
        }),
      );
      yield* waitUntil(() => collected.stdout().includes('fake-tick:3'));
      const ticket = /ticket (cc-\d+) (?:queued|started)/u.exec(collected.stderr())?.[1] ?? '';
      expect(ticket).toMatch(/^cc-\d+$/u);
      proxy.pauseNewConnections();
      proxy.severAll();
      yield* pollReport(fixture, (report) =>
        report.active.some(
          (record) =>
            record.ticket === ticket && (record.outputPreview?.includes('fake-tick:30') ?? false),
        ),
      );
      proxy.resumeNewConnections();

      expect(yield* Fiber.join(run)).toEqual({
        exitCode: connectionLostExitCode,
        mode: 'brokered',
        ticket,
      });
      expect(collected.stderr()).toContain('brokered run aborted: daemon connection lost');
      expect(collected.stderr()).toContain('output could not be replayed completely');
    }), 30_000);

  it.live('runExecClient fails closed when the ticket finishes before output can be reattached', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      const proxy = yield* socketProxy(fixture.config.socketPath);
      const collected = collectIo();
      const run = yield* Effect.forkScoped(
        runExecClient({
          argv: ['cargo', 'test'],
          autoSpawn: false,
          config: { ...fixture.config, socketPath: proxy.socketPath },
          cwd: fixture.ws1,
          env: fakeCargoEnv(fixture, {
            FAKE_OUTPUT_COUNT: '5',
            FAKE_OUTPUT_INTERVAL: '0.02',
          }),
          io: collected.io,
        }),
      );
      yield* waitUntil(() => collected.stdout().includes('fake-tick:1'));
      const ticket = /ticket (cc-\d+) (?:queued|started)/u.exec(collected.stderr())?.[1] ?? '';
      expect(ticket).toMatch(/^cc-\d+$/u);
      proxy.pauseNewConnections();
      proxy.severAll();
      yield* pollReport(fixture, (report) =>
        report.recent.some((record) => record.ticket === ticket && record.status === 'done'),
      );
      proxy.resumeNewConnections();

      expect(yield* Fiber.join(run)).toEqual({
        exitCode: connectionLostExitCode,
        mode: 'brokered',
        ticket,
      });
      expect(collected.stderr()).toContain('brokered run aborted: daemon connection lost');
      expect(collected.stderr()).toContain('finished before its output stream could be reattached');
    }), 30_000);

  it.live('a daemon restart mid-queue fails closed with the abort message and exit 69, never "continues"', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedFixture(1);
      const scope = yield* Effect.scope;
      const startDaemon = Effect.gen(function* () {
        const fiber = yield* Effect.forkIn(runDaemon(fixture.config), scope);
        yield* pingDaemon(fixture.config.socketPath, 500).pipe(
          Effect.retry(Schedule.spaced('50 millis').pipe(Schedule.upTo({ times: 100 }))),
        );
        return fiber;
      });
      const firstDaemon = yield* startDaemon;
      yield* occupyLane(fixture, '3');
      // The client sits behind a proxy so the test can swallow the daemon's
      // goodbye: the issue's caller saw the socket close, not an `exit`.
      const proxy = yield* socketProxy(fixture.config.socketPath);
      const collected = collectIo();
      const run = yield* Effect.forkScoped(
        runExecClient({
          argv: ['cargo', 'test'],
          autoSpawn: true,
          config: { ...fixture.config, socketPath: proxy.socketPath },
          cwd: fixture.ws1,
          // What `ensureDaemonRunning` does, with a restart in the test's own
          // process instead of a detached spawn: a live daemon is left alone.
          ensureDaemon: () =>
            pingDaemon(fixture.config.socketPath, 500).pipe(
              Effect.asVoid,
              Effect.catch(() =>
                Effect.gen(function* () {
                  yield* Fiber.join(firstDaemon).pipe(Effect.ignore);
                  yield* startDaemon;
                }),
              ),
            ),
          env: fakeCargoEnv(fixture),
          io: collected.io,
        }),
      );
      yield* waitUntil(() => /queued behind cc-\d+ \(1 ahead/u.test(collected.stderr()));
      const ticket = /ticket (cc-\d+) queued/u.exec(collected.stderr())?.[1] ?? '';

      // The one-version rule, `hauler daemon restart`, or `daemon stop` —
      // with the goodbye lost in transit, as a crash would lose it.
      proxy.mute();
      const ack = yield* requestShutdown(fixture.config.socketPath, 5_000, daemonVersion);
      expect(ack).toEqual({ kind: 'acknowledged' });

      const result = yield* Fiber.join(run);
      expect(collected.stderr()).not.toContain('continues');
      expect(result).toEqual({ exitCode: connectionLostExitCode, mode: 'brokered', ticket });
      // The ticket never ran cargo, so there is no build result to report:
      // the daemon says why (its own shutdown, or the restart that found
      // the row still in flight), and the caller hears that, not "exit 1".
      expect(collected.stderr()).toMatch(
        new RegExp(
          `\\[cargo-hauler\\] brokered run aborted: daemon connection lost; ticket ${ticket} killed: (daemon shutdown|orphaned by daemon restart)`,
          'u',
        ),
      );
      expect(collected.stderr()).not.toContain('SIGTERM');
    }), 40_000);
});
