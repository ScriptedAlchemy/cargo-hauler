import { existsSync } from 'node:fs';
import { mkdtemp, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { version } from 'agent-bundle/meta';
import { describe, expect, it } from 'effect-rstest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Fiber from 'effect/Fiber';
import * as Schedule from 'effect/Schedule';
import * as Scope from 'effect/Scope';

import { SpawnDaemonError, type EnsureDaemonDependencies } from '../src/client/ensure-daemon.js';
import { resolveDaemonConfig } from '../src/daemon/config.js';
import type { DaemonConfigShape } from '../src/daemon/config.js';
import { DaemonUnreachableError, pingDaemon } from '../src/daemon/control.js';
import {
  daemonExitCode,
  makeSignalShutdownController,
  parseDaemonSubcommand,
  restartDaemon,
  runForegroundDaemon,
  startDaemon,
  stopDaemon,
  type DaemonControlResult,
  type RestartDaemonDependencies,
  type StopDaemonDependencies,
} from '../src/daemon/lifecycle.js';
import { bindDaemonSocket, runDaemon, socketListenPath } from '../src/daemon/main.js';
import {
  daemonIdentity,
  requestShutdown,
  type DaemonIdentity,
} from '../src/daemon/shutdown.js';
import {
  monitorSocketOwnership,
  readSocketIdentity,
  removeSocketIfOwned,
} from '../src/daemon/socket-ownership.js';
import { UnsafeStatePathError } from '../src/lib/private-state.js';
import { legacyRelocatedSocketPath } from '../src/status.js';
import { scopedTempDir } from './harness.js';

const connectOnce = (socketPath: string): Effect.Effect<void, Error> =>
  Effect.callback<void, Error>((resume) => {
    const client = connect(socketPath);
    client.once('connect', () => {
      client.destroy();
      resume(Effect.void);
    });
    client.once('error', (error) => resume(Effect.fail(error)));
  });

const stopInProcess = (config: DaemonConfigShape): Effect.Effect<DaemonControlResult> =>
  stopDaemon(config, {
    exitGraceMs: 5_000,
    identify: pingDaemon,
    pollMs: 10,
    processAlive: () => existsSync(config.socketPath),
    requestShutdown,
  });

describe('signal shutdown lifecycle', () => {
  it('keeps teardown alive and forces SIGTERM exit after the grace window', () => {
    let interrupted = 0;
    let exitCode: number | undefined;
    let forcedCode: number | undefined;
    let delayMs: number | undefined;
    let fallback: (() => void) | undefined;
    let keepAliveCancelled = 0;
    let fallbackCancelled = 0;
    const controller = makeSignalShutdownController(
      () => {
        interrupted += 1;
      },
      {
        forceExit: (code) => {
          forcedCode = code;
        },
        keepAlive: () => () => {
          keepAliveCancelled += 1;
        },
        scheduleForceExit: (callback, delay) => {
          fallback = callback;
          delayMs = delay;
          return () => {
            fallbackCancelled += 1;
          };
        },
        setExitCode: (code) => {
          exitCode = code;
        },
      },
    );

    controller.onSignal('SIGTERM');
    expect(interrupted).toBe(1);
    expect(exitCode).toBe(143);
    expect(delayMs).toBe(5_000);
    expect(forcedCode).toBeUndefined();

    fallback?.();
    expect(forcedCode).toBe(143);

    controller.teardownComplete();
    expect(keepAliveCancelled).toBe(1);
    expect(fallbackCancelled).toBe(1);
  });

  it('uses 130 for SIGINT and handles repeated signals once', () => {
    const exitCodes: number[] = [];
    let interrupted = 0;
    const controller = makeSignalShutdownController(
      () => {
        interrupted += 1;
      },
      {
        forceExit: () => undefined,
        keepAlive: () => () => undefined,
        scheduleForceExit: () => () => undefined,
        setExitCode: (code) => {
          exitCodes.push(code);
        },
      },
    );

    controller.onSignal('SIGINT');
    controller.onSignal('SIGTERM');

    expect(interrupted).toBe(1);
    expect(exitCodes).toEqual([130]);
  });

  it.live('keeps its signal handlers installed for repeats until teardown completes', () =>
    Effect.gen(function* () {
      const root = yield* scopedTempDir('cargo-hauler-signal-');
      const config = resolveDaemonConfig({
        CARGO_HAULER_STATE_DIR: join(root, 'state'),
        CARGO_HAULER_KACHE_INDEX: '',
      });
      const before = new Set(process.rawListeners('SIGINT'));
      const running = runForegroundDaemon(config);
      yield* pingDaemon(config.socketPath, 500).pipe(
        Effect.retry(Schedule.spaced('50 millis').pipe(Schedule.upTo({ times: 400 }))),
      );

      const added = process.rawListeners('SIGINT').filter((listener) => !before.has(listener));
      expect(added).toHaveLength(1);
      // `process.once` hands back a wrapper carrying `.listener` and removes
      // itself on the first signal, so a second Ctrl-C would reach Node's
      // default handler and skip every finalizer (lock and socket left
      // behind). The daemon must register with `process.on` and let its
      // `signaled` guard swallow repeats.
      expect(Object.hasOwn(added[0] as object, 'listener')).toBe(false);

      yield* stopInProcess(config);
      const outcome = yield* Effect.promise(() => running);
      expect(outcome.message).toBe('completed');
      expect(process.rawListeners('SIGINT').filter((listener) => !before.has(listener))).toEqual(
        [],
      );
    }), 30_000);
});

describe('daemon start under the one-version rule', () => {
  const config = resolveDaemonConfig({ CARGO_HAULER_STATE_DIR: '/tmp/cargo-hauler-start-unit' });

  it.live('keeps a compatible older daemon serving when retirement outlives the grace', () =>
    Effect.gen(function* () {
      const calls: string[] = [];
      const dependencies: EnsureDaemonDependencies = {
        daemonIsIdle: () => Effect.succeed(true),
        exitGraceMs: 40,
        pingDaemon: () =>
          Effect.succeed({ id: 'old', pid: 41, startedAtMs: 1, type: 'pong', version: '0.7.1' }),
        pollMs: 5,
        processAlive: () => true,
        requestShutdown: () =>
          Effect.sync(() => {
            calls.push('shutdown');
            return { kind: 'acknowledged' } as const;
          }),
        spawnDetachedDaemon: () => Effect.die(new Error('spawn should not run')),
        waitForDaemon: () => Effect.die(new Error('wait should not run')),
      };
      const result = yield* startDaemon(config, dependencies);

      expect(calls).toEqual(['shutdown']);
      expect(result).toMatchObject({
        operation: 'daemon',
        pid: 41,
        report: null,
        running: true,
        subcommand: 'start',
      });
      expect(result.message).toBe('cargo-hauler daemon started (pid 41)');
      expect(daemonExitCode(result)).toBe(0);
    }));

  it.effect('reports a daemon of this build as started, with no previousPid, and exits 0', () =>
    Effect.gen(function* () {
      const result = yield* startDaemon(config, {
        daemonIsIdle: () => Effect.succeed(true),
        exitGraceMs: 40,
        pingDaemon: () => Effect.succeed({ id: 'same', pid: 42, startedAtMs: 2, type: 'pong', version }),
        pollMs: 5,
        processAlive: () => true,
        requestShutdown: () => Effect.die(new Error('shutdown should not run')),
        spawnDetachedDaemon: () => Effect.die(new Error('spawn should not run')),
        waitForDaemon: () => Effect.die(new Error('wait should not run')),
      });

      expect(result).toMatchObject({ pid: 42, running: true, subcommand: 'start' });
      expect(result.previousPid).toBeUndefined();
      expect(result.message).toBe('cargo-hauler daemon started (pid 42)');
      expect(daemonExitCode(result)).toBe(0);
    }));

  it.effect('names why the spawn was refused, since that failure never opens the log', () =>
    Effect.gen(function* () {
      // A state path this user does not own fails before the log exists, so
      // "check <logPath>" alone would send the operator to a file that was
      // never written.
      const result = yield* startDaemon(config, {
        daemonIsIdle: () => Effect.succeed(true),
        exitGraceMs: 40,
        pingDaemon: (socketPath) =>
          Effect.fail(
            new DaemonUnreachableError({
              socketPath,
              cause: Object.assign(new Error('no such file'), { code: 'ENOENT' }),
            }),
          ),
        pollMs: 5,
        processAlive: () => false,
        requestShutdown: () => Effect.die(new Error('shutdown should not run')),
        spawnDetachedDaemon: () =>
          Effect.fail(
            new SpawnDaemonError({
              cause: new UnsafeStatePathError(config.stateDir, 'it is a symbolic link'),
            }),
          ),
        waitForDaemon: () => Effect.die(new Error('wait should not run')),
      });

      expect(result.running).toBe(false);
      expect(result.message).toContain(config.stateDir);
      expect(result.message).toContain('it is a symbolic link');
      expect(daemonExitCode(result)).toBe(1);
    }));
});

describe('daemon stop after the control socket moved', () => {
  // Only a state dir too deep for `sun_path` relocates its socket, and only a
  // relocated socket has a previous path a pre-hardening daemon still serves.
  const deepConfig = resolveDaemonConfig({
    CARGO_HAULER_STATE_DIR: `/private/var/folders/3m/${'x'.repeat(60)}/T/cargo-hauler/state`,
  });
  const shallowConfig = resolveDaemonConfig({
    CARGO_HAULER_STATE_DIR: '/tmp/cargo-hauler-stop-unit',
  });

  /** Answers as pid 41 at `serving`; nowhere else is anything listening. */
  const stopFakes = (serving: string | null) => {
    const asked: string[] = [];
    const dependencies: StopDaemonDependencies = {
      exitGraceMs: 100,
      identify: (socketPath) => {
        asked.push(socketPath);
        return socketPath === serving
          ? Effect.succeed({ pid: 41, startedAtMs: 1, version: '0.4.1' })
          : Effect.fail(
              new DaemonUnreachableError({
                socketPath,
                cause: Object.assign(new Error('no such file'), { code: 'ENOENT' }),
              }),
            );
      },
      pollMs: 5,
      processAlive: () => false,
      requestShutdown: () => Effect.succeed({ kind: 'acknowledged' as const }),
    };
    return { asked, dependencies };
  };

  it.effect('stops a daemon left serving the pre-hardening path when nothing answers the current one', () =>
    Effect.gen(function* () {
      const legacyPath = legacyRelocatedSocketPath(deepConfig.stateDir);
      const { asked, dependencies } = stopFakes(legacyPath);
      const result = yield* stopDaemon(deepConfig, dependencies);

      expect(asked).toEqual([deepConfig.socketPath, legacyPath]);
      expect(result.message).toBe('cargo-hauler daemon stopped');
      expect(result.running).toBe(false);
    }));

  it.effect('asks only the current path when a daemon answers it', () =>
    Effect.gen(function* () {
      const { asked, dependencies } = stopFakes(deepConfig.socketPath);
      const stopped = yield* stopDaemon(deepConfig, dependencies);

      expect(asked).toEqual([deepConfig.socketPath]);
      expect(stopped.message).toBe('cargo-hauler daemon stopped');
    }));

  it.effect('has no previous path to ask when the socket never moved', () =>
    Effect.gen(function* () {
      const { asked, dependencies } = stopFakes(null);
      const absent = yield* stopDaemon(shallowConfig, dependencies);

      expect(asked).toEqual([shallowConfig.socketPath]);
      expect(absent.message).toBe('cargo-hauler daemon is not running');
    }));
});

describe('daemon restart', () => {
  const config = resolveDaemonConfig({ CARGO_HAULER_STATE_DIR: '/tmp/cargo-hauler-restart-unit' });
  const controlResult = (
    subcommand: 'start' | 'stop',
    fields: Partial<DaemonControlResult> = {},
  ): DaemonControlResult => ({
    message: subcommand === 'start' ? 'cargo-hauler daemon started (pid 42)' : 'cargo-hauler daemon stopped',
    operation: 'daemon',
    pid: subcommand === 'start' ? 42 : null,
    report: null,
    running: subcommand === 'start',
    socketPath: config.socketPath,
    subcommand,
    ...fields,
  });
  const old: DaemonIdentity = { pid: 41, startedAtMs: 1, version: '0.4.1' };
  const fresh: DaemonIdentity = { pid: 42, startedAtMs: 2, version: '0.4.4' };

  /** Fakes: the old daemon (pid 41) answers until `stop`, exits shortly after, and `start` brings up pid 42. */
  const fakes = (overrides: Partial<RestartDaemonDependencies> = {}) => {
    const calls: string[] = [];
    let alive = true;
    let stopped = false;
    const dependencies: RestartDaemonDependencies = {
      exitGraceMs: 500,
      identify: () => Effect.sync(() => (stopped ? (alive ? old : fresh) : old)),
      pollMs: 5,
      processAlive: () => alive,
      start: () =>
        Effect.sync(() => {
          calls.push('start');
          return controlResult('start');
        }),
      stop: () =>
        Effect.sync(() => {
          calls.push('stop');
          stopped = true;
          setTimeout(() => {
            alive = false;
          }, 30);
          return controlResult('stop');
        }),
      ...overrides,
    };
    return { calls, dependencies };
  };

  it.live('stops the running daemon, waits for its pid to exit, starts a new one, and names both', () =>
    Effect.gen(function* () {
      const { calls, dependencies } = fakes();
      const result = yield* restartDaemon(config, dependencies);
      expect(calls).toEqual(['stop', 'start']);
      expect(result).toMatchObject({
        operation: 'daemon',
        pid: 42,
        previousPid: 41,
        running: true,
        subcommand: 'restart',
      });
      expect(result.message).toBe('cargo-hauler daemon restarted: pid 41 (0.4.1) → pid 42 (0.4.4)');
      expect(daemonExitCode(result)).toBe(0);
    }));

  it.live('starts the daemon when none was running and says so', () =>
    Effect.gen(function* () {
      const { calls, dependencies } = fakes({ identify: () => Effect.succeed(null) });
      const result = yield* restartDaemon(config, {
        ...dependencies,
        // Nobody answered before; the new daemon answers after `start`.
        identify: () => Effect.sync(() => (calls.includes('start') ? fresh : null)),
      });
      expect(calls).toEqual(['start']);
      expect(result).toMatchObject({ pid: 42, previousPid: null, running: true, subcommand: 'restart' });
      expect(result.message).toBe('cargo-hauler daemon was not running; started pid 42 (0.4.4)');
      expect(daemonExitCode(result)).toBe(0);
    }));

  it.live('does not start a second daemon while the old pid is still alive after the grace', () =>
    Effect.gen(function* () {
      const { calls, dependencies } = fakes({ exitGraceMs: 40, processAlive: () => true });
      const result = yield* restartDaemon(config, dependencies);
      expect(calls).toEqual(['stop']);
      expect(result).toMatchObject({ pid: 41, previousPid: 41, running: true, subcommand: 'restart' });
      expect(result.message).toContain('pid 41 (0.4.1) is still running 40ms after the shutdown request');
      expect(result.message).toContain('not restarted');
      expect(daemonExitCode(result)).toBe(1);
    }));

  it.live('does not claim a shutdown request was sent when the nested identity probe failed', () =>
    Effect.gen(function* () {
      const { dependencies } = fakes({
        exitGraceMs: 40,
        processAlive: () => true,
        stop: () =>
          Effect.succeed(
            controlResult('stop', {
              message: 'cargo-hauler daemon identity probe timed out',
              pid: null,
              running: null,
            }),
          ),
      });
      const result = yield* restartDaemon(config, dependencies);

      expect(result.message).toContain('identity probe timed out');
      expect(result.message).toContain('not restarted');
      expect(result.message).not.toContain('after the shutdown request');
      expect(result).toMatchObject({ pid: 41, previousPid: 41, running: true });
      expect(daemonExitCode(result)).toBe(1);
    }));

  it('is a daemon subcommand', () => {
    expect(parseDaemonSubcommand(['restart'])).toBe('restart');
    expect(() => parseDaemonSubcommand(['reload'])).toThrow('run, start, stop, status, restart');
  });

  it.live('restarts a live daemon: the old one stops before the new one is started', () =>
    Effect.gen(function* () {
      const root = yield* scopedTempDir('cargo-hauler-restart-');
      const liveConfig: DaemonConfigShape = resolveDaemonConfig({
        CARGO_HAULER_STATE_DIR: join(root, 'state'),
        CARGO_HAULER_KACHE_INDEX: '',
      });
      const scope = yield* Scope.make();
      yield* Effect.addFinalizer(() => Scope.close(scope, Exit.void));
      let activeDaemon: Fiber.Fiber<unknown, unknown> | undefined;
      const startInProcess = (): Effect.Effect<DaemonControlResult> =>
        Effect.gen(function* () {
          activeDaemon = yield* Effect.forkIn(runDaemon(liveConfig), scope);
          const pong = yield* pingDaemon(liveConfig.socketPath, 500).pipe(
            Effect.retry(Schedule.spaced('50 millis').pipe(Schedule.upTo({ times: 400 }))),
          );
          const started: DaemonControlResult = {
            message: `cargo-hauler daemon started (pid ${pong.pid})`,
            operation: 'daemon',
            pid: pong.pid,
            report: null,
            running: true,
            socketPath: liveConfig.socketPath,
            subcommand: 'start',
          };
          return started;
        }).pipe(Effect.orDie);
      let sawSocketGone = false;
      const stopInProcessAndWait = (config: DaemonConfigShape): Effect.Effect<DaemonControlResult> =>
        Effect.gen(function* () {
          const daemon = activeDaemon;
          const stopped = yield* stopDaemon(config, {
            exitGraceMs: 5_000,
            identify: pingDaemon,
            pollMs: 10,
            processAlive: () => {
              const alive = existsSync(config.socketPath);
              sawSocketGone ||= !alive;
              return alive;
            },
            requestShutdown,
          });
          if (daemon !== undefined) {
            // Socket removal precedes the outer singleton-lock finalizer.
            // A real restart waits for process exit, so this in-process stand-in
            // must wait for the daemon fiber's complete teardown too.
            yield* Fiber.await(daemon);
          }
          return stopped;
        });
      const first = yield* startInProcess();
      const startedAt = (yield* pingDaemon(liveConfig.socketPath, 500)).startedAtMs;
      yield* Effect.sleep('5 millis');

      const result = yield* restartDaemon(liveConfig, {
        exitGraceMs: 5_000,
        identify: daemonIdentity,
        pollMs: 10,
        // Both daemons live in this test process, so "the process exited" is
        // "its socket is gone" — which the daemon removes on shutdown.
        processAlive: () => {
          const alive = existsSync(liveConfig.socketPath);
          sawSocketGone ||= !alive;
          return alive;
        },
        start: startInProcess,
        stop: stopInProcessAndWait,
      });
      expect(sawSocketGone).toBe(true);
      expect(result.running).toBe(true);
      expect(result.previousPid).toBe(first.pid);
      expect(result.message).toContain('restarted');
      const after = yield* pingDaemon(liveConfig.socketPath, 500);
      expect(after.startedAtMs).toBeGreaterThan(startedAt);
      yield* stopInProcessAndWait(liveConfig);
    }), 30_000);
});

describe('socket listen path', () => {
  it('is never longer than the canonical socket path so it fits sun_path wherever the canonical one does', () => {
    const canonical = `/private/var/folders/d8/${'x'.repeat(30)}/T/cargo-hauler-socket-rename-cjiTJc/daemon.sock`;
    const listen = socketListenPath(canonical, 5226);
    expect(dirname(listen)).toBe(dirname(canonical));
    expect(Buffer.byteLength(listen)).toBeLessThanOrEqual(Buffer.byteLength(canonical));
    expect(socketListenPath(canonical, 9_999_999).length).toBeLessThanOrEqual(canonical.length);
  });
});

describe('socket ownership lifecycle', () => {
  it.live('fails when the bound socket path is unlinked', () =>
    Effect.gen(function* () {
      const stateDir = yield* Effect.acquireRelease(
        Effect.promise(() => mkdtemp(join(tmpdir(), 'cargo-hauler-socket-owner-'))),
        (directory) => Effect.promise(() => rm(directory, { recursive: true, force: true })),
      );
      const socketPath = join(stateDir, 'daemon.sock');
      yield* Effect.promise(() => writeFile(socketPath, 'bound socket stand-in'));
      const identity = yield* Effect.promise(() => readSocketIdentity(socketPath));
      const lost = yield* Effect.forkChild(
        Effect.flip(monitorSocketOwnership(socketPath, identity, 5)),
      );

      yield* Effect.sleep('15 millis');
      yield* Effect.promise(() => unlink(socketPath));

      const error = yield* Fiber.join(lost);
      expect(error._tag).toBe('SocketOwnershipLost');
      expect(error.socketPath).toBe(socketPath);
    }));

  it('does not unlink a replacement socket during teardown', async () => {
    const stateDir = await mkdtemp(join(tmpdir(), 'cargo-hauler-socket-cleanup-'));
    const socketPath = join(stateDir, 'daemon.sock');
    const replacementPath = join(stateDir, 'replacement.sock');
    try {
      await writeFile(socketPath, 'original');
      await writeFile(replacementPath, 'replacement');
      const identity = await readSocketIdentity(socketPath);
      await unlink(socketPath);
      await rename(replacementPath, socketPath);

      await removeSocketIfOwned(socketPath, identity);

      expect((await stat(socketPath)).isFile()).toBe(true);
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  });

  it.live('closing a superseded server leaves the replacement daemon bound and reachable', () =>
    Effect.gen(function* () {
      const stateDir = yield* scopedTempDir('cargo-hauler-socket-rename-');
      const socketPath = join(stateDir, 'daemon.sock');
      const replacementScope = yield* Scope.make();
      yield* Effect.addFinalizer(() => Scope.close(replacementScope, Exit.void));

      const replacement = yield* Effect.scoped(
        Effect.gen(function* () {
          const superseded = yield* bindDaemonSocket(socketPath);
          expect(superseded.identity).not.toBeNull();
          // A replacement daemon judged us dead: it removed the path and
          // bound its own socket there, exactly what monitorSocketOwnership
          // exists to detect. Our teardown must not take it down with us.
          yield* Effect.promise(() => rm(socketPath, { force: true }));
          return yield* bindDaemonSocket(socketPath).pipe(
            Effect.provideService(Scope.Scope, replacementScope),
          );
        }),
      );

      expect(existsSync(socketPath)).toBe(true);
      expect(yield* Effect.promise(() => readSocketIdentity(socketPath))).toEqual(
        replacement.identity,
      );
      yield* connectOnce(socketPath);
    }));
});
