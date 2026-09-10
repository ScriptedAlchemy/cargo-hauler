import { spawn, type ChildProcess, type SpawnOptions } from 'node:child_process';
import { closeSync, existsSync, openSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { version } from 'agent-bundle/meta';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Schedule from 'effect/Schedule';

import { resolveDaemonConfig } from '../daemon/config.js';
import type { DaemonConfigShape } from '../daemon/config.js';
import { pingDaemon, requestExpecting } from '../daemon/control.js';
import type {
  ConnectionClosedError,
  ControlTimeoutError,
  DaemonUnreachableError,
} from '../daemon/control.js';
import { daemonReportIsIdle } from '../daemon/protocol.js';
import type { PongMessage, StatusResultMessage } from '../daemon/protocol.js';
import {
  DaemonIncompatibleError,
  DaemonNewerError,
  DaemonNotReplacedError,
  exitGraceMs,
  processAlive,
  requestShutdown,
  waitForExit,
} from '../daemon/shutdown.js';
import type { ExitWaitOptions, ShutdownOutcome } from '../daemon/shutdown.js';
import { isNewerVersion } from '../lib/version-order.js';
import { resolveHaulerArgv } from '../hooks/hauler-binding.js';
import { absentSocketCodes, socketErrorCode } from '../lib/socket-errors.js';
import { isHaulerInternalEnvironmentVariable } from '../lib/cargo-env.js';
import { ensurePrivateDir, ensurePrivateFile } from '../lib/private-state.js';
import { shortId } from '../lib/id.js';
import { speaksCurrentWireProtocol } from '../lib/wire-protocol.js';
import { legacyRelocatedSocketPath } from '../status.js';

export class SpawnDaemonError extends Data.TaggedError('SpawnDaemonError')<{
  readonly cause: unknown;
}> {}

export class DaemonReplacementFailedError extends Data.TaggedError('DaemonReplacementFailed')<{
  readonly cause: WaitForDaemonError;
  readonly socketPath: string;
}> {}

export type WaitForDaemonError =
  | DaemonUnreachableError
  | ControlTimeoutError
  | ConnectionClosedError;

export type EnsureDaemonError =
  | WaitForDaemonError
  | SpawnDaemonError
  | DaemonIncompatibleError
  | DaemonNewerError
  | DaemonNotReplacedError
  | DaemonReplacementFailedError;

export interface EnsureDaemonDependencies extends ExitWaitOptions {
  readonly pingDaemon: (
    socketPath: string,
    timeoutMs: number,
  ) => Effect.Effect<PongMessage, WaitForDaemonError>;
  /** Whether the answering daemon has no running, queued, executing, or attached work. */
  readonly daemonIsIdle: (socketPath: string) => Effect.Effect<boolean>;
  /** The graceful `shutdown` request to a daemon of another version. */
  readonly requestShutdown: (socketPath: string) => Effect.Effect<ShutdownOutcome>;
  readonly spawnDetachedDaemon: (
    config: DaemonConfigShape,
  ) => Effect.Effect<void, SpawnDaemonError>;
  readonly waitForDaemon: (
    socketPath: string,
  ) => Effect.Effect<PongMessage, WaitForDaemonError>;
}

export interface SpawnDetachedDaemonDependencies {
  readonly spawnProcess: (
    command: string,
    args: readonly string[],
    options: SpawnOptions,
  ) => ChildProcess;
}

const defaultSpawnDependencies: SpawnDetachedDaemonDependencies = {
  spawnProcess: (command, args, options) => spawn(command, [...args], options),
};

/** Exported for the regression test against real socket error shapes. */
export const daemonIsAbsent = (cause: unknown): boolean => {
  const code = socketErrorCode(cause);
  return code !== null && absentSocketCodes.has(code);
};

export const waitForDaemon = (
  socketPath: string,
): Effect.Effect<PongMessage, WaitForDaemonError> =>
  pingDaemon(socketPath, 1_000).pipe(
    Effect.retry(
      Schedule.spaced('150 millis').pipe(
        Schedule.jittered,
        Schedule.upTo({ duration: '10 seconds' }),
      ),
    ),
  );

export interface DaemonEntryOptions {
  readonly env: Readonly<Record<string, string | undefined>>;
  /** The running script (`process.argv[1]`), possibly relative to `cwd`. */
  readonly argv1: string | undefined;
  readonly cwd: string;
  /** `import.meta.url` of the bundled module resolving the entry. */
  readonly moduleUrl: string;
  readonly exists: (path: string) => boolean;
}

/**
 * The entry that understands `daemon run`, always as an absolute path. The
 * daemon is spawned with the state dir as its cwd, so a relative entry — a
 * host that runs `node scripts/hauler.mjs` from the plugin directory, or a
 * relative plugin root — would resolve there and fail with
 * `Cannot find module <stateDir>/scripts/hauler.mjs`; with version gating
 * that failure then repeats on every hook call after an upgrade. Order: the
 * artifact's `hauler.mjs` when a host injected the plugin root and it
 * exists, then the package or checkout entry beside this module, then the
 * running script itself.
 */
export const resolveDaemonEntry = (options: DaemonEntryOptions): string => {
  const [, script] = resolveHaulerArgv({ env: options.env, cwd: options.cwd, fallback: 'path' });
  if (script !== undefined) {
    const absolute = resolve(options.cwd, script);
    if (options.exists(absolute)) {
      return absolute;
    }
  }
  // Routed commands render in a generated flight worker, so argv[1] names
  // `cargo-hauler-flight.mjs`, which is not an executable daemon entry.
  // Resolve the sibling plain script from this bundled module instead.
  for (const candidate of ['./hauler.js', '../scripts/hauler.mjs']) {
    const path = fileURLToPath(new URL(candidate, options.moduleUrl));
    if (options.exists(path)) {
      return path;
    }
  }
  return options.argv1 === undefined ? '' : resolve(options.cwd, options.argv1);
};

const defaultDaemonEntry = (): string =>
  resolveDaemonEntry({
    argv1: process.argv[1],
    cwd: process.cwd(),
    env: process.env,
    exists: existsSync,
    moduleUrl: import.meta.url,
  });

const spawnEnvExactNames = new Set([
  'ALL_PROXY',
  'CARGO_HOME',
  'HOME',
  'HTTPS_PROXY',
  'HTTP_PROXY',
  'LANG',
  'LOGNAME',
  'NO_PROXY',
  'PATH',
  'RUSTUP_HOME',
  'SHELL',
  'TMPDIR',
  'USER',
  'all_proxy',
  'http_proxy',
  'https_proxy',
  'no_proxy',
]);

const spawnEnvPrefixes = ['LC_', 'SSL_CERT_', 'XDG_'];

/**
 * The environment the detached daemon starts with. The daemon lays every
 * request's transported env over its own when it spawns cargo, so whatever
 * the first client's shell exported — `RUSTFLAGS`, `CARGO_TARGET_DIR`,
 * `RUSTC_WRAPPER`, a fd-based `MAKEFLAGS` jobserver — would otherwise become
 * the base of every other session's builds until the daemon restarts (#55).
 * Only the daemon's own settings (`CARGO_HAULER_*`), toolchain locations,
 * locale, temp/cache paths, and network knobs for crate fetches survive.
 */
export const daemonSpawnEnv = (
  env: Readonly<Record<string, string | undefined>>,
  stateDir: string,
): Record<string, string> => {
  const curated: Record<string, string> = {};
  for (const [name, value] of Object.entries(env)) {
    if (value === undefined) {
      continue;
    }
    if (
      spawnEnvExactNames.has(name) ||
      isHaulerInternalEnvironmentVariable(name) ||
      spawnEnvPrefixes.some((prefix) => name.startsWith(prefix))
    ) {
      curated[name] = value;
    }
  }
  curated.CARGO_HAULER_STATE_DIR = stateDir;
  return curated;
};

export const spawnDetachedDaemon = (
  config: DaemonConfigShape,
  entryPath: string = defaultDaemonEntry(),
  dependencies: SpawnDetachedDaemonDependencies = defaultSpawnDependencies,
): Effect.Effect<void, SpawnDaemonError> =>
  Effect.acquireUseRelease(
    Effect.try({
      try: () => {
        ensurePrivateDir(config.stateDir);
        // The daemon inherits this descriptor as stdout and stderr, so its
        // whole log is written through it; the mode is settled before the
        // child exists.
        ensurePrivateFile(config.logPath);
        return openSync(config.logPath, 'a');
      },
      catch: (cause) => new SpawnDaemonError({ cause }),
    }),
    (logFd) =>
      Effect.try({
        try: () => {
          // cwd is the state dir, not the client's directory: a relative path
          // the daemon resolves must not depend on who happened to start it.
          const child = dependencies.spawnProcess(
            process.execPath,
            [entryPath, 'daemon', 'run'],
            {
              cwd: config.stateDir,
              detached: true,
              env: daemonSpawnEnv(process.env, config.stateDir),
              stdio: ['ignore', logFd, logFd],
            },
          );
          child.unref();
        },
        catch: (cause) => new SpawnDaemonError({ cause }),
      }),
    (logFd) =>
      Effect.sync(() => {
        closeSync(logFd);
      }),
  );

export const defaultEnsureDependencies: EnsureDaemonDependencies = {
  daemonIsIdle: (socketPath) =>
    requestExpecting(
      {
        message: { id: shortId(), limit: 1, type: 'status' },
        socketPath,
        timeoutMs: 5_000,
      },
      (message): message is StatusResultMessage => message.type === 'status-result',
    ).pipe(
      Effect.map((result) => result !== undefined && daemonReportIsIdle(result.report)),
      // Unknown is busy: automatic replacement must never guess that a
      // daemon is idle when its status probe failed.
      Effect.catchCause(() => Effect.succeed(false)),
    ),
  exitGraceMs,
  pingDaemon,
  pollMs: 100,
  processAlive,
  requestShutdown: (socketPath) => requestShutdown(socketPath, 5_000, version, true),
  spawnDetachedDaemon,
  waitForDaemon,
};

/**
 * Read-only protocol gate. Compatible daemons are returned without lifecycle
 * side effects; absent stays absent, newer remains directional, and an older
 * incompatible peer fails with its identity before a payload is parsed.
 */
const pingOrAbsent = (
  socketPath: string,
  dependencies: EnsureDaemonDependencies,
  pingTimeoutMs: number,
): Effect.Effect<PongMessage | null, WaitForDaemonError> =>
  dependencies.pingDaemon(socketPath, pingTimeoutMs).pipe(
    Effect.catchTag('DaemonUnreachable', (error) =>
      daemonIsAbsent(error.cause) ? Effect.succeed(null) : Effect.fail(error),
    ),
  );

/**
 * Retire a daemon from another install: the graceful request, then a wait for
 * its pid. Directional — only an older daemon is replaced. A newer one
 * belongs to a newer install; this client is the stale one. Refusal or an
 * outlived grace returns false so the submission can stay on the old daemon.
 */
const retireDaemon = (
  socketPath: string,
  daemon: PongMessage,
  dependencies: EnsureDaemonDependencies,
): Effect.Effect<boolean, DaemonNewerError> =>
  Effect.gen(function* () {
    const identity = { pid: daemon.pid, startedAtMs: daemon.startedAtMs, version: daemon.version };
    if (isNewerVersion(daemon.version, version)) {
      return yield* new DaemonNewerError({ clientVersion: version, daemon: identity, socketPath });
    }
    const shutdown = yield* dependencies.requestShutdown(socketPath);
    if (shutdown.kind !== 'acknowledged') {
      return false;
    }
    const exited = yield* waitForExit(daemon.pid, dependencies);
    if (!exited) {
      return false;
    }
    return true;
  });

/**
 * Nothing answers at this state dir's current endpoint, so check the one a
 * pre-hardening install would have used for a relocated socket. This build
 * never binds that path, so a daemon answering there cannot serve this
 * client and is retired under the same version gate; the caller then spawns
 * at the current path with the singleton lock free.
 */
const retireLegacyRelocatedDaemon = (
  config: DaemonConfigShape,
  dependencies: EnsureDaemonDependencies,
  pingTimeoutMs: number,
): Effect.Effect<PongMessage | null, EnsureDaemonError> =>
  Effect.gen(function* () {
    const legacyPath = legacyRelocatedSocketPath(config.stateDir);
    if (legacyPath === null || legacyPath === config.socketPath) {
      return null;
    }
    const legacy = yield* pingOrAbsent(legacyPath, dependencies, pingTimeoutMs).pipe(
      // Nothing this build writes lives at that path, so a probe that fails
      // for any other reason — a hung daemon, an `EACCES` on a leftover
      // belonging to another account — is not worth failing the caller's
      // command over; the spawn at the current path proceeds instead.
      Effect.orElseSucceed(() => null),
    );
    if (legacy === null) {
      return null;
    }
    if (!(yield* dependencies.daemonIsIdle(legacyPath))) {
      return legacy;
    }
    return (yield* retireDaemon(legacyPath, legacy, dependencies)) ? null : legacy;
  });

export const ensureDaemonVersion = (
  config: DaemonConfigShape = resolveDaemonConfig(),
  dependencies: EnsureDaemonDependencies = defaultEnsureDependencies,
  pingTimeoutMs = 500,
): Effect.Effect<PongMessage | null, EnsureDaemonError> =>
  Effect.gen(function* () {
    const already = yield* pingOrAbsent(config.socketPath, dependencies, pingTimeoutMs);
    if (already === null) {
      return null;
    }
    if (already.version === version) {
      return already;
    }
    const identity = {
      pid: already.pid,
      startedAtMs: already.startedAtMs,
      version: already.version,
    };
    if (isNewerVersion(already.version, version)) {
      return yield* new DaemonNewerError({
        clientVersion: version,
        daemon: identity,
        socketPath: config.socketPath,
      });
    }
    if (speaksCurrentWireProtocol(already, version)) {
      return already;
    }
    return yield* new DaemonIncompatibleError({
      clientVersion: version,
      daemon: identity,
      socketPath: config.socketPath,
    });
  });

export const ensureDaemonRunning = (
  config: DaemonConfigShape = resolveDaemonConfig(),
  dependencies: EnsureDaemonDependencies = defaultEnsureDependencies,
  reportDiagnostic: (line: string) => void = (line) => {
    process.stderr.write(line);
  },
): Effect.Effect<PongMessage, EnsureDaemonError> =>
  ensureDaemonVersion(config, dependencies).pipe(
    Effect.flatMap((daemon) => {
      if (daemon === null) {
        return Effect.gen(function* () {
          const legacy = yield* retireLegacyRelocatedDaemon(config, dependencies, 500);
          if (legacy !== null) {
            return yield* new DaemonIncompatibleError({
              clientVersion: version,
              daemon: {
                pid: legacy.pid,
                startedAtMs: legacy.startedAtMs,
                version: legacy.version,
              },
              socketPath: legacyRelocatedSocketPath(config.stateDir) ?? config.socketPath,
            });
          }
          yield* dependencies.spawnDetachedDaemon(config);
          return yield* dependencies.waitForDaemon(config.socketPath);
        });
      }
      if (daemon.version === version) {
        return Effect.succeed(daemon);
      }
      const deferred = (): Effect.Effect<PongMessage> =>
        Effect.sync(() => {
          reportDiagnostic(
            `[cargo-hauler] daemon ${daemon.version} will be replaced by ${version} when idle\n`,
          );
          return daemon;
        });
      return dependencies.daemonIsIdle(config.socketPath).pipe(
        Effect.flatMap((idle) => {
          if (!idle) {
            return deferred();
          }
          return retireDaemon(config.socketPath, daemon, dependencies).pipe(
            Effect.flatMap((retired) =>
              retired
                ? dependencies.spawnDetachedDaemon(config).pipe(
                    Effect.andThen(
                      dependencies.waitForDaemon(config.socketPath).pipe(
                        Effect.mapError(
                          (cause) =>
                            new DaemonReplacementFailedError({
                              cause,
                              socketPath: config.socketPath,
                            }),
                        ),
                      ),
                    ),
                  )
                : deferred(),
            ),
          );
        }),
      );
    }),
  );
