import * as NodeSocket from '@effect/platform-node/NodeSocket';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import type { Scope } from 'effect/Scope';
import * as Socket from 'effect/unstable/socket/Socket';

import { shortId } from '../util/id.js';

import type { ClientMessage, PongMessage, ServerMessage } from '../contracts/protocol.js';
import { encodeClientMessage, parseServerMessageLine } from '../contracts/protocol.js';
import { LineBuffer } from '../platform/ndjson.js';

export class DaemonUnreachableError extends Data.TaggedError('DaemonUnreachable')<{
  readonly socketPath: string;
  readonly cause: unknown;
}> {}

export class ControlTimeoutError extends Data.TaggedError('ControlTimeout')<{
  readonly socketPath: string;
  readonly timeoutMs: number;
  readonly received: readonly ServerMessage[];
  /** Which wait expired: the daemon accepting the connection, or answering once connected. */
  readonly phase: 'open' | 'response';
}> {}

export class ConnectionClosedError extends Data.TaggedError('ConnectionClosed')<{
  readonly socketPath: string;
  readonly received: readonly ServerMessage[];
}> {}

export interface RequestOverSocketOptions {
  readonly socketPath: string;
  readonly message: ClientMessage;
  /** Resolve once a received message satisfies this predicate. */
  readonly isTerminal: (message: ServerMessage) => boolean;
  readonly timeoutMs?: number;
  /** How long to wait for the daemon to accept the connection (default `openTimeoutMs`). */
  readonly openTimeoutMs?: number;
}

const defaultTimeoutMs = 10_000;

const snapshot = (received: readonly ServerMessage[]): readonly ServerMessage[] => received.slice();

/** How long a client waits for the daemon to accept a connection. */
export const openTimeoutMs = 2_000;

export const mapSocketFailure = (
  error: Socket.SocketError,
  socketPath: string,
  received: readonly ServerMessage[] = [],
  openTimeout: number = openTimeoutMs,
): DaemonUnreachableError | ControlTimeoutError | ConnectionClosedError => {
  switch (error.reason._tag) {
    case 'SocketOpenError':
      // A refused or absent socket is a stopped daemon; an accept that never
      // arrives is a live daemon too busy to answer (observed under heavy
      // machine load), and must not read as "not running".
      return error.reason.kind === 'Timeout'
        ? new ControlTimeoutError({ phase: 'open', received: snapshot(received), socketPath, timeoutMs: openTimeout })
        : new DaemonUnreachableError({ socketPath, cause: error });
    case 'SocketWriteError':
    case 'SocketReadError':
    case 'SocketCloseError':
    case 'SocketUpgradeError':
      return new ConnectionClosedError({ socketPath, received: snapshot(received) });
    default: {
      const _exhaustive: never = error.reason;
      return _exhaustive;
    }
  }
};

const runRequest = (
  options: RequestOverSocketOptions,
): Effect.Effect<
  readonly ServerMessage[],
  DaemonUnreachableError | ControlTimeoutError | ConnectionClosedError,
  Scope
> =>
  Effect.gen(function* () {
    const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
    const openTimeout = options.openTimeoutMs ?? openTimeoutMs;
    const received: ServerMessage[] = [];
    const lines = new LineBuffer();
    const socket = yield* NodeSocket.makeNet({ path: options.socketPath, openTimeout });
    const { write } = yield* socket.writer;

    const exchange = Effect.gen(function* () {
      // Acquiring the reader dials: open failures and the open timeout surface here.
      const pull = yield* Socket.readerBytes(socket);
      yield* write(encodeClientMessage(options.message));
      const readUntilTerminal = Effect.gen(function* () {
        while (true) {
          let sawTerminal = false;
          for (const data of yield* pull) {
            for (const line of lines.push(data)) {
              const message = parseServerMessageLine(line);
              received.push(message);
              sawTerminal ||= options.isTerminal(message);
            }
          }
          if (sawTerminal) {
            return snapshot(received);
          }
        }
      });
      return yield* readUntilTerminal.pipe(
        Effect.timeoutOrElse({
          duration: timeoutMs,
          orElse: () =>
            Effect.fail(
              new ControlTimeoutError({
                phase: 'response',
                received: snapshot(received),
                socketPath: options.socketPath,
                timeoutMs,
              }),
            ),
        }),
      );
    });

    return yield* exchange.pipe(
      Effect.catchTag('SocketError', (error) =>
        Effect.fail(mapSocketFailure(error, options.socketPath, received, openTimeout)),
      ),
    );
  });

export const requestOverSocket = (
  options: RequestOverSocketOptions,
): Effect.Effect<
  readonly ServerMessage[],
  DaemonUnreachableError | ControlTimeoutError | ConnectionClosedError
> => Effect.scoped(runRequest(options));

export const requestExpecting = <T extends ServerMessage>(
  options: Omit<RequestOverSocketOptions, 'isTerminal'>,
  guard: (message: ServerMessage) => message is T,
): Effect.Effect<
  T | undefined,
  DaemonUnreachableError | ControlTimeoutError | ConnectionClosedError
> =>
  requestOverSocket({ ...options, isTerminal: guard }).pipe(
    Effect.map((messages) => messages.find(guard)),
  );

export const pingDaemon = (
  socketPath: string,
  timeoutMs?: number,
): Effect.Effect<PongMessage, DaemonUnreachableError | ControlTimeoutError | ConnectionClosedError> =>
  Effect.suspend(() => {
    const id = shortId();
    return requestExpecting(
      {
        socketPath,
        message: { type: 'ping', id },
        timeoutMs,
      },
      (message): message is PongMessage => message.type === 'pong' && message.id === id,
    ).pipe(
      Effect.flatMap((pong) =>
        pong === undefined
          ? Effect.fail(new ConnectionClosedError({ socketPath, received: [] }))
          : Effect.succeed(pong),
      ),
    );
  });
