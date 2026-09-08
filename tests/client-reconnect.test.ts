import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'effect-rstest';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Schedule from 'effect/Schedule';

import { runExecClient, type RunExecResult } from '../src/client/exec.js';
import { pingDaemon } from '../src/daemon/control.js';
import { runDaemon } from '../src/daemon/main.js';

import { disconnectOnceProxy, type DisconnectProxy } from './disconnect-proxy.js';
import {
  fakeCargoEnv,
  pollReport,
  scopedDaemon,
  scopedFixture,
} from './harness.js';

class FilePending extends Data.TaggedError('FilePending')<{ readonly path: string }> {}

const waitForFile = (path: string): Effect.Effect<void, FilePending> =>
  Effect.suspend(() =>
    existsSync(path) ? Effect.void : Effect.fail(new FilePending({ path })),
  ).pipe(Effect.retry(Schedule.spaced('10 millis').pipe(Schedule.upTo({ times: 1_000 }))));

const release = (path: string): void => {
  writeFileSync(path, '');
};

const collectIo = (): {
  readonly io: {
    readonly writeStderr: (data: string | Uint8Array) => void;
    readonly writeStdout: (data: Uint8Array) => void;
  };
  readonly stderr: () => string;
} => {
  const stderr: Buffer[] = [];
  return {
    io: {
      writeStderr: (data) => {
        stderr.push(typeof data === 'string' ? Buffer.from(data) : Buffer.from(data));
      },
      writeStdout: () => undefined,
    },
    stderr: () => Buffer.concat(stderr).toString('utf8'),
  };
};

const recoveryStartedBefore = (
  proxy: DisconnectProxy,
  run: Fiber.Fiber<RunExecResult>,
): Effect.Effect<'finished' | 'reattached'> =>
  Effect.raceFirst(
    Effect.promise(() => proxy.reattached).pipe(Effect.as('reattached' as const)),
    Fiber.join(run).pipe(Effect.as('finished' as const)),
  );

describe('exec transport recovery (#187)', () => {
  it.live('keeps a queued ticket in place, reattaches, and returns its cargo result', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      const holderReady = join(fixture.root, 'holder.ready');
      const holderRelease = join(fixture.root, 'holder.release');
      yield* Effect.addFinalizer(() => Effect.sync(() => release(holderRelease)));
      yield* runExecClient({
        argv: ['cargo', 'check', '-p', 'holder'],
        autoSpawn: false,
        background: true,
        config: fixture.config,
        cwd: fixture.ws1,
        env: fakeCargoEnv(fixture, {
          FAKE_READY_FILE: holderReady,
          FAKE_RELEASE_FILE: holderRelease,
        }),
        io: collectIo().io,
      });
      yield* waitForFile(holderReady);

      const proxy = yield* disconnectOnceProxy(fixture.config, 'ack');
      const collected = collectIo();
      const run = yield* Effect.forkChild(
        runExecClient({
          argv: ['cargo', 'check', '-p', 'recovered-queued'],
          autoSpawn: false,
          config: proxy.config,
          cwd: fixture.ws1,
          env: fakeCargoEnv(fixture, { FAKE_EXIT: '23' }),
          io: collected.io,
        }),
      );

      expect(yield* recoveryStartedBefore(proxy, run)).toBe('reattached');
      const ticket = yield* Effect.promise(() => proxy.dropped);
      const queued = yield* pollReport(fixture, (report) =>
        report.active.some((record) => record.ticket === ticket && record.status === 'queued'),
      );
      expect(queued.active.find((record) => record.ticket === ticket)?.orphaned).not.toBe(true);

      release(holderRelease);
      const result = yield* Fiber.join(run);
      expect(result).toEqual({ exitCode: 23, mode: 'brokered', ticket });
      const settled = yield* pollReport(fixture, (report) =>
        report.recent.some((record) => record.ticket === ticket && record.status === 'failed'),
      );
      expect(settled.recent.find((record) => record.ticket === ticket)).toMatchObject({
        exitCode: 23,
        startedAtMs: expect.any(Number),
        status: 'failed',
      });
      expect(proxy.messages().filter((message) => message.type === 'exec')).toHaveLength(1);
      expect(collected.stderr()).toContain(`connection to daemon lost; reconnecting to ticket ${ticket}`);
      expect(collected.stderr()).not.toContain('continues — hauler result');
    }), 20_000);

  it.live('reattaches to a running ticket without spawning or submitting it twice', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      const countFile = join(fixture.root, 'running.count');
      const readyFile = join(fixture.root, 'running.ready');
      const releaseFile = join(fixture.root, 'running.release');
      yield* Effect.addFinalizer(() => Effect.sync(() => release(releaseFile)));
      const proxy = yield* disconnectOnceProxy(fixture.config, 'started');
      const run = yield* Effect.forkChild(
        runExecClient({
          argv: ['cargo', 'check', '-p', 'recovered-running'],
          autoSpawn: false,
          config: proxy.config,
          cwd: fixture.ws1,
          env: fakeCargoEnv(fixture, {
            FAKE_COUNT_FILE: countFile,
            FAKE_READY_FILE: readyFile,
            FAKE_RELEASE_FILE: releaseFile,
          }),
          io: collectIo().io,
        }),
      );

      expect(yield* recoveryStartedBefore(proxy, run)).toBe('reattached');
      const ticket = yield* Effect.promise(() => proxy.dropped);
      yield* waitForFile(readyFile);
      yield* pollReport(fixture, (report) =>
        report.active.some(
          (record) =>
            record.ticket === ticket && record.status === 'running' && record.orphaned !== true,
        ),
      );

      release(releaseFile);
      expect(yield* Fiber.join(run)).toEqual({ exitCode: 0, mode: 'brokered', ticket });
      expect(readFileSync(countFile, 'utf8').trim().split('\n')).toHaveLength(1);
      expect(proxy.messages().filter((message) => message.type === 'exec')).toHaveLength(1);
    }), 20_000);

  it.live('reports a broker abort when the daemon dies and cannot preserve the ticket', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedFixture(1);
      const daemon = yield* Effect.forkChild(runDaemon(fixture.config));
      yield* pingDaemon(fixture.config.socketPath, 500).pipe(
        Effect.retry(Schedule.spaced('20 millis').pipe(Schedule.upTo({ times: 500 }))),
      );
      const readyFile = join(fixture.root, 'doomed.ready');
      const releaseFile = join(fixture.root, 'doomed.release');
      yield* Effect.addFinalizer(() => Effect.sync(() => release(releaseFile)));
      const proxy = yield* disconnectOnceProxy(fixture.config, 'started');
      const collected = collectIo();
      const run = yield* Effect.forkChild(
        runExecClient({
          argv: ['cargo', 'check', '-p', 'doomed'],
          autoSpawn: false,
          config: proxy.config,
          cwd: fixture.ws1,
          env: fakeCargoEnv(fixture, {
            FAKE_READY_FILE: readyFile,
            FAKE_RELEASE_FILE: releaseFile,
          }),
          io: collected.io,
        }),
      );
      const ticket = yield* Effect.promise(() => proxy.dropped);
      yield* waitForFile(readyFile);

      yield* Fiber.interrupt(daemon);
      yield* Effect.forkScoped(runDaemon(fixture.config));
      yield* pingDaemon(fixture.config.socketPath, 500).pipe(
        Effect.retry(Schedule.spaced('20 millis').pipe(Schedule.upTo({ times: 500 }))),
      );

      expect(yield* Fiber.join(run)).toEqual({ exitCode: 75, mode: 'brokered', ticket });
      expect(collected.stderr()).toContain('brokered run aborted: daemon connection lost');
      expect(collected.stderr()).not.toContain('continues — hauler result');
      expect(collected.stderr()).not.toContain(`ticket ${ticket} killed`);
    }), 20_000);
});
