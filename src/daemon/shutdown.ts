/**
 * The primitives for replacing a running daemon, shared by the automatic
 * replacement in `ensureDaemonRunning` (a daemon of another version answers
 * the socket) and the manual `hauler daemon restart`. A leaf on purpose:
 * `lifecycle.ts` imports `ensure-daemon.ts`, and both import this.
 */

import { version } from 'agent-bundle/meta';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';

import { formatMs } from '../lib/format.js';
import { isRecord } from '../lib/guards.js';
import { shortId } from '../lib/id.js';

import { pingDaemon, requestOverSocket } from './control.js';
import type { ErrorMessage, ServerMessage } from './protocol.js';

/** What a `pong` says about the daemon behind the socket. */
export interface DaemonIdentity {
  readonly pid: number;
  readonly startedAtMs: number;
  readonly version: string;
}

/** Who is behind the socket, or null when nothing answered a ping in time. */
export const daemonIdentity = (
  socketPath: string,
  timeoutMs = 1_000,
): Effect.Effect<DaemonIdentity | null> =>
  pingDaemon(socketPath, timeoutMs).pipe(
    Effect.map(
      (pong): DaemonIdentity => ({
        pid: pong.pid,
        startedAtMs: pong.startedAtMs,
        version: pong.version,
      }),
    ),
    Effect.orElseSucceed(() => null),
  );

/**
 * How long a daemon gets to exit after acknowledging a shutdown request —
 * the same window its own signal handler allows before forcing the exit.
 */
export const exitGraceMs = 5_000;

/** `kill -0`: EPERM is another user's live process, ESRCH is gone. */
export const processAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return isRecord(error) && error.code === 'EPERM';
  }
};

export interface ExitWaitOptions {
  /** How long the old daemon gets to exit after acknowledging the shutdown. */
  readonly exitGraceMs: number;
  readonly pollMs: number;
  /** Whether the process still exists (`kill -0`). */
  readonly processAlive: (pid: number) => boolean;
}

/** True once the pid is gone, false when it is still there at the end of the grace. */
export const waitForExit = (pid: number, options: ExitWaitOptions): Effect.Effect<boolean> =>
  Effect.gen(function* () {
    const deadline = Date.now() + options.exitGraceMs;
    while (options.processAlive(pid)) {
      if (Date.now() >= deadline) {
        return false;
      }
      yield* Effect.sleep(options.pollMs);
    }
    return true;
  });

type ShutdownProtocolErrorCode = Exclude<ErrorMessage['code'], 'shutdown-refused'>;

/** The typed result of asking the daemon to shut down. */
export type ShutdownOutcome =
  | { readonly kind: 'acknowledged' }
  | { readonly kind: 'connection-closed' }
  | { readonly kind: 'timeout'; readonly phase: 'open' | 'response' }
  | { readonly kind: 'unreachable' }
  | {
      readonly kind: 'refused';
      readonly code: 'shutdown-refused';
      readonly message: string;
    }
  | {
      readonly kind: 'protocol-error';
      readonly code: ShutdownProtocolErrorCode;
      readonly message: string;
    };

export const requestShutdown = (
  socketPath: string,
  timeoutMs = 5_000,
  clientVersion: string = version,
  ifIdle = false,
): Effect.Effect<ShutdownOutcome> =>
  Effect.suspend(() => {
    const id = shortId();
    const isResponse = (
      message: ServerMessage,
    ): message is Extract<ServerMessage, { readonly type: 'error' | 'shutting-down' }> =>
      message.id === id && (message.type === 'shutting-down' || message.type === 'error');
    return requestOverSocket({
      isTerminal: isResponse,
      message: { id, type: 'shutdown', version: clientVersion, ...(ifIdle ? { ifIdle } : {}) },
      socketPath,
      timeoutMs,
    }).pipe(
      Effect.map((messages): ShutdownOutcome => {
        const response = messages.find(isResponse);
        if (response === undefined) {
          return { kind: 'connection-closed' };
        }
        switch (response.type) {
          case 'shutting-down':
            return { kind: 'acknowledged' };
          case 'error':
            return response.code === 'shutdown-refused'
              ? {
                  code: response.code,
                  kind: 'refused',
                  message: response.message,
                }
              : {
                  code: response.code,
                  kind: 'protocol-error',
                  message: response.message,
                };
          default: {
            const exhaustive: never = response;
            return exhaustive;
          }
        }
      }),
    );
  }).pipe(
    Effect.catchTags({
      ConnectionClosed: () => Effect.succeed<ShutdownOutcome>({ kind: 'connection-closed' }),
      ControlTimeout: (error) =>
        Effect.succeed<ShutdownOutcome>({ kind: 'timeout', phase: error.phase }),
      DaemonUnreachable: () => Effect.succeed<ShutdownOutcome>({ kind: 'unreachable' }),
    }),
  );

/** The one text for a daemon newer than the client that asked it to go. */
export const newerDaemonMessage = (daemon: DaemonIdentity, clientVersion: string): string =>
  `cargo-hauler daemon pid ${daemon.pid} (${daemon.version}) is newer than this client (${clientVersion}); not replaced — upgrade this install, or restart the session so its hooks and MCP server come from the current plugin`;

/**
 * The daemon behind the socket is a newer build than this client, or refused
 * the shutdown as one. Replacement is directional: an older client never
 * takes a newer daemon down, so a long-lived session on a previous plugin
 * cannot fight the daemon the upgraded install runs. The caller keeps using
 * cargo directly (or reads the ledger) and says so.
 */
export class DaemonNewerError extends Data.TaggedError('DaemonNewer')<{
  readonly socketPath: string;
  readonly daemon: DaemonIdentity;
  readonly clientVersion: string;
  readonly message: string;
}> {
  constructor(fields: {
    readonly socketPath: string;
    readonly daemon: DaemonIdentity;
    readonly clientVersion: string;
  }) {
    super({ ...fields, message: newerDaemonMessage(fields.daemon, fields.clientVersion) });
  }
}

/** An older daemon from a different wire-protocol release series cannot serve this client. */
export class DaemonIncompatibleError extends Data.TaggedError('DaemonIncompatible')<{
  readonly socketPath: string;
  readonly daemon: DaemonIdentity;
  readonly clientVersion: string;
  readonly message: string;
}> {
  constructor(fields: {
    readonly socketPath: string;
    readonly daemon: DaemonIdentity;
    readonly clientVersion: string;
  }) {
    super({
      ...fields,
      message: `cargo-hauler daemon pid ${fields.daemon.pid} (${fields.daemon.version}) is incompatible with this client (${fields.clientVersion}); not replaced while compatibility cannot be established — stop it with \`hauler daemon stop\` from its install`,
    });
  }
}

/** The one text for a daemon that outlived the grace after a shutdown request. */
export const notReplacedMessage = (daemon: DaemonIdentity, graceMs: number): string =>
  `cargo-hauler daemon pid ${daemon.pid} (${daemon.version}) is still running ${formatMs(graceMs)} after the shutdown request; not restarted — retry once it has exited, or stop it with \`hauler daemon stop\``;

/**
 * A daemon of another version acknowledged the shutdown request but was
 * still running at the end of the grace, so this build's daemon was not
 * started. The daemon is never signalled past the request. `message` is
 * `notReplacedMessage` for the same daemon and grace.
 */
export class DaemonNotReplacedError extends Data.TaggedError('DaemonNotReplaced')<{
  readonly socketPath: string;
  readonly daemon: DaemonIdentity;
  readonly graceMs: number;
  readonly message: string;
}> {
  constructor(fields: {
    readonly socketPath: string;
    readonly daemon: DaemonIdentity;
    readonly graceMs: number;
  }) {
    super({ ...fields, message: notReplacedMessage(fields.daemon, fields.graceMs) });
  }
}
