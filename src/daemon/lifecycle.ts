import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Fiber from 'effect/Fiber';

import {
  daemonIsAbsent,
  defaultEnsureDependencies,
  ensureDaemonRunning,
} from '../client/ensure-daemon.js';
import type {
  EnsureDaemonDependencies,
  WaitForDaemonError,
} from '../client/ensure-daemon.js';
import { formatMs } from '../lib/format.js';
import { loadHaulerSnapshot } from '../query.js';
import { legacyRelocatedSocketPath } from '../status.js';

import { resolveDaemonConfig } from './config.js';
import type { DaemonConfigShape } from './config.js';
import { pingDaemon } from './control.js';
import { runDaemon } from './main.js';
import type { StatusReport } from './protocol.js';
import {
  daemonIdentity,
  exitGraceMs,
  notReplacedMessage,
  processAlive,
  requestShutdown,
  waitForExit,
} from './shutdown.js';
import type {
  DaemonIdentity,
  ExitWaitOptions,
  ShutdownOutcome,
} from './shutdown.js';

export const daemonSubcommands = ['run', 'start', 'stop', 'status', 'restart'] as const;
export type DaemonSubcommand = (typeof daemonSubcommands)[number];
export type DaemonShutdownOutcome = ShutdownOutcome | { readonly kind: 'absent' };

export interface DaemonControlResult {
  readonly message: string;
  readonly operation: 'daemon';
  readonly pid: number | null;
  /**
   * `restart`: the pid that was serving before, null when none was. `stop`:
   * the pid targeted by the request. `start` and `status`: set only when a
   * daemon of another version outlived the grace and was left serving.
   */
  readonly previousPid?: number | null;
  readonly report: StatusReport | null;
  /** Null when the client could not establish whether any daemon is running. */
  readonly running: boolean | null;
  /** Present for `stop`: the typed protocol/lifecycle outcome. */
  readonly shutdown?: DaemonShutdownOutcome;
  readonly socketPath: string;
  readonly subcommand: DaemonSubcommand;
}

/**
 * The process exit code for one daemon subcommand's result, shared by the
 * `hauler` entry and the routed `cargo-hauler daemon` command.
 */
export const daemonExitCode = (result: DaemonControlResult): number => {
  switch (result.subcommand) {
    case 'run':
      return result.message === 'completed' || result.message === 'already-running' ? 0 : 1;
    case 'start':
    case 'restart':
      // Success is a running daemon that is not the one we found: a daemon
      // that outlived the grace is still serving, but was not restarted —
      // for `start`, it is a daemon of another version that was not replaced.
      return result.running && result.pid !== null && result.pid !== result.previousPid ? 0 : 1;
    case 'status':
      return result.running && result.previousPid === undefined ? 0 : 1;
    case 'stop':
      return (result.shutdown?.kind === 'absent' ||
        (result.shutdown?.kind === 'acknowledged' && result.running === false))
        ? 0
        : 1;
    default: {
      const exhaustive: never = result.subcommand;
      return exhaustive;
    }
  }
};

/**
 * How long the daemon's own signal handler waits for teardown before forcing
 * the exit: the same window a client waits for an old daemon's pid after the
 * shutdown request, so neither side gives up before the other.
 */
const signalShutdownGraceMs = exitGraceMs;

type ShutdownSignal = 'SIGINT' | 'SIGTERM';

export interface SignalShutdownDependencies {
  readonly forceExit: (code: number) => void;
  readonly keepAlive: () => () => void;
  readonly scheduleForceExit: (callback: () => void, delayMs: number) => () => void;
  readonly setExitCode: (code: number) => void;
}

export interface SignalShutdownController {
  readonly onSignal: (signal: ShutdownSignal) => void;
  readonly teardownComplete: () => void;
}

const defaultSignalShutdownDependencies: SignalShutdownDependencies = {
  forceExit: (code) => {
    process.exit(code);
  },
  keepAlive: () => {
    const timer = setInterval(() => undefined, 2_147_483_647);
    return () => {
      clearInterval(timer);
    };
  },
  scheduleForceExit: (callback, delayMs) => {
    const timer = setTimeout(callback, delayMs);
    return () => {
      clearTimeout(timer);
    };
  },
  setExitCode: (code) => {
    process.exitCode = code;
  },
};

export const makeSignalShutdownController = (
  interrupt: () => void,
  dependencies: SignalShutdownDependencies = defaultSignalShutdownDependencies,
): SignalShutdownController => {
  let cancelKeepAlive: (() => void) | undefined;
  let cancelFallback: (() => void) | undefined;
  let signaled = false;
  return {
    onSignal: (signal) => {
      if (signaled) {
        return;
      }
      signaled = true;
      const exitCode = signal === 'SIGINT' ? 130 : 143;
      dependencies.setExitCode(exitCode);
      cancelKeepAlive = dependencies.keepAlive();
      cancelFallback = dependencies.scheduleForceExit(
        () => dependencies.forceExit(exitCode),
        signalShutdownGraceMs,
      );
      interrupt();
    },
    teardownComplete: () => {
      cancelFallback?.();
      cancelFallback = undefined;
      cancelKeepAlive?.();
      cancelKeepAlive = undefined;
    },
  };
};

const isSubcommand = (value: string): value is DaemonSubcommand =>
  (daemonSubcommands as readonly string[]).includes(value);

export const parseDaemonSubcommand = (argv: readonly string[]): DaemonSubcommand => {
  const subcommand = argv[0];
  if (subcommand === undefined || !isSubcommand(subcommand)) {
    throw new Error(`daemon requires one of: ${daemonSubcommands.join(', ')}`);
  }
  const extra = argv.slice(1);
  if (extra.length === 0 || (subcommand === 'stop' && extra.length === 1 && extra[0] === '--force')) {
    return subcommand;
  }
  throw new Error(`daemon ${subcommand} does not accept extra arguments`);
};

const result = (
  config: DaemonConfigShape,
  subcommand: DaemonSubcommand,
  fields: Omit<DaemonControlResult, 'operation' | 'socketPath' | 'subcommand'>,
): DaemonControlResult => ({
  ...fields,
  operation: 'daemon',
  socketPath: config.socketPath,
  subcommand,
});

const causeMessage = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause);

/**
 * `hauler daemon start`: `ensureDaemonRunning`, so a daemon of another
 * version answering the socket is replaced on the way. One that outlives the
 * grace is reported as running and not replaced — `previousPid` equal to
 * `pid`, the verdict `daemonExitCode` turns into a failure.
 */
export const startDaemon = (
  config: DaemonConfigShape = resolveDaemonConfig(),
  dependencies: EnsureDaemonDependencies = defaultEnsureDependencies,
): Effect.Effect<DaemonControlResult> => {
  const failedStart = (): Effect.Effect<DaemonControlResult> =>
    Effect.succeed(
      result(config, 'start', {
        message: `cargo-hauler daemon did not come up; check ${config.logPath}`,
        pid: null,
        report: null,
        running: false,
      }),
    );
  return ensureDaemonRunning(config, dependencies).pipe(
    Effect.map((pong) =>
      result(config, 'start', {
        message: `cargo-hauler daemon started (pid ${pong.pid})`,
        pid: pong.pid,
        report: null,
        running: true,
      }),
    ),
    Effect.catchTags({
      ConnectionClosed: failedStart,
      ControlTimeout: failedStart,
      DaemonReplacementFailed: failedStart,
      DaemonNewer: (error) =>
        Effect.succeed(
          result(config, 'start', {
            message: error.message,
            pid: error.daemon.pid,
            previousPid: error.daemon.pid,
            report: null,
            running: true,
          }),
        ),
      DaemonNotReplaced: (error) =>
        Effect.succeed(
          result(config, 'start', {
            message: notReplacedMessage(error.daemon, error.graceMs),
            pid: error.daemon.pid,
            previousPid: error.daemon.pid,
            report: null,
            running: true,
          }),
        ),
      DaemonUnreachable: failedStart,
      // A refused state path fails before the log is opened, so pointing at
      // the log alone would send the user to a file that was never written;
      // the reason names the path they have to fix.
      SpawnDaemonError: (error) =>
        Effect.succeed(
          result(config, 'start', {
            message: `cargo-hauler daemon did not come up; check ${config.logPath}: ${causeMessage(error.cause)}`,
            pid: null,
            report: null,
            running: false,
          }),
        ),
    }),
  );
};

const stopMessage = (
  outcome: DaemonShutdownOutcome,
  running: boolean | null,
  pid: number | null,
): string => {
  switch (outcome.kind) {
    case 'acknowledged':
      return running
        ? `cargo-hauler daemon acknowledged the shutdown request, but pid ${pid} is still running`
        : 'cargo-hauler daemon stopped';
    case 'connection-closed':
      return running
        ? `cargo-hauler daemon connection closed before acknowledging shutdown; pid ${pid} is still running`
        : 'cargo-hauler daemon connection closed before acknowledging shutdown';
    case 'timeout':
      return `cargo-hauler daemon did not acknowledge the shutdown request (${outcome.phase} timeout)`;
    case 'unreachable':
      return 'cargo-hauler daemon could not be reached; its running state is unknown';
    case 'absent':
      return 'cargo-hauler daemon is not running';
    case 'refused':
      return `cargo-hauler daemon refused the shutdown: ${outcome.message}`;
    case 'protocol-error':
      return `cargo-hauler daemon rejected the shutdown (${outcome.code}): ${outcome.message}`;
    default: {
      const exhaustive: never = outcome;
      return exhaustive;
    }
  }
};

export interface StopDaemonDependencies extends ExitWaitOptions {
  readonly identify: (
    socketPath: string,
    timeoutMs: number,
  ) => Effect.Effect<DaemonIdentity, WaitForDaemonError>;
  readonly requestShutdown: (
    socketPath: string,
  ) => Effect.Effect<ShutdownOutcome>;
}

const defaultStopDependencies: StopDaemonDependencies = {
  exitGraceMs,
  identify: pingDaemon,
  pollMs: 100,
  processAlive,
  requestShutdown,
};

const stopDaemonAt = (
  config: DaemonConfigShape,
  socketPath: string,
  dependencies: StopDaemonDependencies,
): Effect.Effect<DaemonControlResult> => {
  const stopped = (
    shutdown: DaemonShutdownOutcome,
    running: boolean | null,
    pid: number | null,
    previousPid?: number,
  ): DaemonControlResult =>
    result(config, 'stop', {
      message: stopMessage(shutdown, running, pid),
      pid,
      ...(previousPid === undefined ? {} : { previousPid }),
      report: null,
      running,
      shutdown,
    });
  const probeFailed = (message: string): DaemonControlResult =>
    result(config, 'stop', {
      message,
      pid: null,
      report: null,
      running: null,
    });
  return dependencies.identify(socketPath, 1_000).pipe(
    Effect.flatMap((identity) =>
      dependencies.requestShutdown(socketPath).pipe(
        Effect.flatMap((shutdown) => {
          if (shutdown.kind === 'acknowledged') {
            return waitForExit(identity.pid, dependencies).pipe(
              Effect.map((exited) =>
                stopped(shutdown, !exited, exited ? null : identity.pid, identity.pid),
              ),
            );
          }
          const running = dependencies.processAlive(identity.pid);
          return Effect.succeed(
            stopped(shutdown, running, running ? identity.pid : null, identity.pid),
          );
        }),
      ),
    ),
    Effect.catchTags({
      ConnectionClosed: () =>
        Effect.succeed(
          probeFailed('cargo-hauler daemon identity connection closed before it could identify the process'),
        ),
      ControlTimeout: (error) =>
        Effect.succeed(
          probeFailed(
            `cargo-hauler daemon identity probe timed out during ${error.phase}; its running state is unknown`,
          ),
        ),
      DaemonUnreachable: (error) => {
        const absent = daemonIsAbsent(error.cause);
        return Effect.succeed(
          absent
            ? stopped({ kind: 'absent' }, false, null)
            : probeFailed(
                'cargo-hauler daemon identity probe could not reach the process; its running state is unknown',
              ),
        );
      },
    }),
  );
};

/**
 * `hauler daemon stop`. Nothing answering the current endpoint is not yet
 * "not running" for a state dir whose socket relocates: a daemon from a
 * pre-hardening install serves the path that install derived and still holds
 * this state dir's lock, so it is asked too before the absent verdict
 * stands.
 */
export const stopDaemon = (
  config: DaemonConfigShape = resolveDaemonConfig(),
  dependencies: StopDaemonDependencies = defaultStopDependencies,
): Effect.Effect<DaemonControlResult> => {
  const legacyPath = legacyRelocatedSocketPath(config.stateDir);
  return stopDaemonAt(config, config.socketPath, dependencies).pipe(
    Effect.flatMap((outcome) =>
      outcome.shutdown?.kind === 'absent' &&
      legacyPath !== null &&
      legacyPath !== config.socketPath
        ? stopDaemonAt(config, legacyPath, dependencies)
        : Effect.succeed(outcome),
    ),
  );
};

export const statusDaemon = (
  config: DaemonConfigShape = resolveDaemonConfig(),
): Effect.Effect<DaemonControlResult> =>
  loadHaulerSnapshot({ config }).pipe(
    Effect.map((snapshot) =>
      result(config, 'status', {
        message: snapshot.summary,
        pid: snapshot.pid,
        report: snapshot.report,
        running: snapshot.daemon === 'running',
      }),
    ),
    Effect.catchTags({
      DaemonNewer: (error) =>
        Effect.succeed(
          result(config, 'status', {
            message: error.message,
            pid: error.daemon.pid,
            previousPid: error.daemon.pid,
            report: null,
            running: true,
          }),
        ),
      DaemonNotReplaced: (error) =>
        Effect.succeed(
          result(config, 'status', {
            message: error.message,
            pid: error.daemon.pid,
            previousPid: error.daemon.pid,
            report: null,
            running: true,
          }),
        ),
      SpawnDaemonError: (error) =>
        Effect.succeed(
          result(config, 'status', {
            message: `cargo-hauler daemon could not be started; check ${config.logPath}: ${causeMessage(error.cause)}`,
            pid: null,
            report: null,
            running: false,
          }),
        ),
      DaemonReplacementFailed: (error) =>
        Effect.succeed(
          result(config, 'status', {
            message: `cargo-hauler replacement daemon failed its version handshake (${error.cause._tag}); check ${config.logPath}`,
            pid: null,
            report: null,
            running: false,
          }),
        ),
    }),
  );

export interface RestartDaemonDependencies {
  /** Who answers the socket right now; null when nobody does. */
  readonly identify: (socketPath: string) => Effect.Effect<DaemonIdentity | null>;
  readonly stop: (config: DaemonConfigShape) => Effect.Effect<DaemonControlResult>;
  readonly start: (config: DaemonConfigShape) => Effect.Effect<DaemonControlResult>;
  /** Whether the process still exists (`kill -0`). */
  readonly processAlive: (pid: number) => boolean;
  /** How long the old daemon gets to exit after acknowledging the shutdown. */
  readonly exitGraceMs: number;
  readonly pollMs: number;
}

const defaultRestartDependencies: RestartDaemonDependencies = {
  exitGraceMs,
  identify: daemonIdentity,
  pollMs: 100,
  processAlive,
  start: startDaemon,
  stop: stopDaemon,
};

const versionText = (identity: DaemonIdentity | null): string =>
  identity === null ? 'version unknown' : identity.version;

/**
 * `hauler daemon restart`, the manual replacement: the graceful stop, a wait
 * for the old pid to exit, then the usual start. A daemon of another version
 * is replaced automatically by `ensureDaemonRunning` on the next call; this
 * command replaces a daemon of any version. In-flight tickets are not handed
 * over: the old daemon settles them itself as it shuts down (`killed`, error
 * `daemon shutdown`); `orphaned by daemon restart` is stamped by the next
 * daemon's first ledger pass only on rows a daemon that died without shutting
 * down never marked. The old daemon is never signalled past the
 * shutdown request; one that does not exit within the grace is reported,
 * not killed.
 */
export const restartDaemon = (
  config: DaemonConfigShape = resolveDaemonConfig(),
  dependencies: RestartDaemonDependencies = defaultRestartDependencies,
): Effect.Effect<DaemonControlResult> =>
  Effect.gen(function* () {
    const restart = (fields: Omit<DaemonControlResult, 'operation' | 'socketPath' | 'subcommand'>) =>
      result(config, 'restart', fields);
    const before = yield* dependencies.identify(config.socketPath);
    if (before === null) {
      const started = yield* dependencies.start(config);
      if (!started.running) {
        return restart({ ...started, previousPid: null });
      }
      const after = yield* dependencies.identify(config.socketPath);
      return restart({
        message: `cargo-hauler daemon was not running; started pid ${started.pid} (${versionText(after)})`,
        pid: started.pid,
        previousPid: null,
        report: null,
        running: true,
      });
    }
    const stopped = yield* dependencies.stop(config);
    const exited =
      stopped.shutdown?.kind === 'acknowledged'
        ? stopped.running === false
        : yield* waitForExit(before.pid, dependencies);
    if (!exited) {
      return restart({
        message:
          stopped.shutdown === undefined && stopped.running === null
            ? `${stopped.message}; cargo-hauler daemon pid ${before.pid} (${before.version}) is still running ${formatMs(dependencies.exitGraceMs)} later; not restarted — retry once it has exited`
            : notReplacedMessage(before, dependencies.exitGraceMs),
        pid: before.pid,
        previousPid: before.pid,
        report: null,
        running: true,
      });
    }
    const started = yield* dependencies.start(config);
    if (!started.running) {
      return restart({
        ...started,
        message: `cargo-hauler daemon pid ${before.pid} (${before.version}) stopped, but ${started.message}`,
        previousPid: before.pid,
      });
    }
    const after = yield* dependencies.identify(config.socketPath);
    return restart({
      message: `cargo-hauler daemon restarted: pid ${before.pid} (${before.version}) → pid ${started.pid} (${versionText(after)})`,
      pid: started.pid,
      previousPid: before.pid,
      report: null,
      running: true,
    });
  });

export const runForegroundDaemon = (
  config: DaemonConfigShape = resolveDaemonConfig(),
): Promise<DaemonControlResult> => {
  const program = runDaemon(config);
  const fiber = Effect.runFork(program);
  const interrupt = (): void => {
    fiber.interruptUnsafe();
  };
  const shutdown = makeSignalShutdownController(interrupt);
  const onSigint = (): void => shutdown.onSignal('SIGINT');
  const onSigterm = (): void => shutdown.onSignal('SIGTERM');
  // `on`, not `once`: a repeated Ctrl-C during teardown must be swallowed by
  // the controller's `signaled` guard. With `once` the second signal reaches
  // Node's default handler, which exits without running finalizers and
  // leaves the lock and socket behind. The bounded force exit the controller
  // arms is the escape hatch for a hung teardown.
  process.on('SIGINT', onSigint);
  process.on('SIGTERM', onSigterm);
  return Effect.runPromise(Fiber.await(fiber)).then((exit) => {
    process.removeListener('SIGINT', onSigint);
    process.removeListener('SIGTERM', onSigterm);
    shutdown.teardownComplete();
    if (Exit.isSuccess(exit)) {
      const outcome = exit.value;
      return result(config, 'run', {
        message: outcome,
        pid: outcome === 'already-running' ? null : process.pid,
        report: null,
        running: outcome === 'already-running',
      });
    }
    if (Cause.hasInterruptsOnly(exit.cause)) {
      return result(config, 'run', {
        message: 'completed',
        pid: process.pid,
        report: null,
        running: false,
      });
    }
    return result(config, 'run', {
      message: Cause.pretty(exit.cause),
      pid: process.pid,
      report: null,
      running: false,
    });
  });
};

export const runDaemonControl = (
  subcommand: DaemonSubcommand,
  config: DaemonConfigShape = resolveDaemonConfig(),
): Promise<DaemonControlResult> => {
  switch (subcommand) {
    case 'run':
      return runForegroundDaemon(config);
    case 'start':
      return Effect.runPromise(startDaemon(config));
    case 'stop':
      return Effect.runPromise(stopDaemon(config));
    case 'status':
      return Effect.runPromise(statusDaemon(config));
    case 'restart':
      return Effect.runPromise(restartDaemon(config));
    default: {
      const exhaustive: never = subcommand;
      return Promise.reject(new Error(`Unhandled daemon subcommand: ${String(exhaustive)}`));
    }
  }
};
