import { describe, expect, it } from 'effect-rstest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';

import { Broker } from '../../src/internal/daemon/broker/broker.js';
import type { ExitInfo, SubmitInput } from '../../src/internal/daemon/broker/job-state.js';

import { brokerFixture } from '../support/broker-fixture.js';
import { execRequest, fakeCargoEnv, findExit, pollReport, scopedDaemon, scopedGate } from '../support/harness.js';

describe('lane scheduler', () => {
  it.live.each(['off', '1000000'])('reselects a cheaper same-lane request that arrived while the head waited for a global permit (heavy cap: %s)', (heavyMemAvailableGb) =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1, { CARGO_HAULER_HEAVY_MEM_AVAILABLE_GB: heavyMemAvailableGb });
      const heavyEnabled = fixture.config.heavyMemAvailableBytes !== null;
      const holderGate = yield* scopedGate(fixture, 'holder-release');
      const buildGate = yield* scopedGate(fixture, 'build-release');
      const fmtGate = yield* scopedGate(fixture, 'fmt-release');
      const holder = yield* Effect.forkChild(
        execRequest(fixture, {
          cwd: fixture.ws2,
          extraEnv: { FAKE_RELEASE_FILE: holderGate.path },
        }),
      );
      yield* pollReport(fixture, (report) => report.lanes.some((lane) => lane.runningTicket !== null));
      const build = yield* Effect.forkChild(
        execRequest(fixture, {
          argv: ['cargo', 'build', '--workspace'],
          cwd: fixture.ws1,
          extraEnv: { FAKE_RELEASE_FILE: buildGate.path },
        }),
      );
      yield* pollReport(fixture, (report) =>
        report.active.some((record) => record.cwd === fixture.ws1 && record.status === 'queued') &&
        report.lanes.some((lane) => lane.workspaceRoot === fixture.ws1 && lane.queued === 0) &&
        report.system?.heavy?.running === (heavyEnabled ? 1 : undefined),
      );
      const fmt = yield* Effect.forkChild(
        execRequest(fixture, {
          argv: ['cargo', 'fmt'],
          cwd: fixture.ws1,
          extraEnv: { FAKE_RELEASE_FILE: fmtGate.path },
        }),
      );
      yield* pollReport(fixture, (report) =>
        report.lanes.some((lane) => lane.workspaceRoot === fixture.ws1 && lane.queued === 1),
      );
      yield* holderGate.open;
      const replaced = yield* pollReport(fixture, (report) =>
        report.active.some((record) => record.cwd === fixture.ws1 && record.status === 'running'),
      );
      expect(replaced.system?.heavy?.running).toBe(heavyEnabled ? 0 : undefined);
      yield* fmtGate.open;
      const fmtTicket = findExit(yield* Fiber.join(fmt)).ticket;
      yield* pollReport(fixture, (report) =>
        report.active.some((record) => record.cwd === fixture.ws1 && record.status === 'running'),
      );
      const following = yield* Effect.forkChild(
        execRequest(fixture, {
          argv: ['cargo', 'check', '-p', 'following', '--features', 'independent'],
          cwd: fixture.ws1,
        }),
      );
      yield* pollReport(fixture, (report) =>
        report.lanes.some((lane) => lane.workspaceRoot === fixture.ws1 && lane.queued === 1),
      );
      yield* buildGate.open;
      const [buildMessages, followingMessages] = yield* Effect.all([
        Fiber.join(build),
        Fiber.join(following),
      ]);
      yield* Fiber.join(holder);
      const buildTicket = findExit(buildMessages).ticket;
      const followingTicket = findExit(followingMessages).ticket;
      const report = yield* pollReport(fixture, (candidate) =>
        [buildTicket, fmtTicket, followingTicket].every((ticket) =>
          candidate.recent.some((record) => record.ticket === ticket && record.status === 'done'),
        ),
      );
      const fmtRecord = report.recent.find((record) => record.ticket === fmtTicket);
      const buildRecord = report.recent.find((record) => record.ticket === buildTicket);
      const followingRecord = report.recent.find((record) => record.ticket === followingTicket);
      expect(fmtRecord?.finishedAtMs ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(
        buildRecord?.startedAtMs ?? 0,
      );
      expect(followingRecord?.startedAtMs ?? 0).toBeGreaterThanOrEqual(
        buildRecord?.finishedAtMs ?? Number.POSITIVE_INFINITY,
      );
      expect(report.system?.heavy?.running).toBe(heavyEnabled ? 0 : undefined);
    }));

  it.live('keeps dependents blocked and a reselected head killable without spending another permit', () =>
    Effect.gen(function* () {
      const { fixture, layer } = yield* brokerFixture(1);
      const holderGate = yield* scopedGate(fixture, 'holder-release');
      const fmtGate = yield* scopedGate(fixture, 'fmt-release');
      yield* Effect.scoped(
        Effect.gen(function* () {
          const broker = yield* Broker;
          const submit = (input: SubmitInput) =>
            Effect.gen(function* () {
              const started = yield* Deferred.make<void>();
              const exited = yield* Deferred.make<ExitInfo>();
              const result = yield* broker.submit(
                { ...input, env: fakeCargoEnv(fixture, input.env) },
                {
                  onStarted: () => Effect.asVoid(Deferred.succeed(started, undefined)),
                  onOutput: () => Effect.void,
                  onExit: (info) => Effect.asVoid(Deferred.succeed(exited, info)),
                },
              );
              return { result, started, exited };
            });
          const holder = yield* submit({
            argv: ['cargo', 'check'],
            cwd: fixture.ws2,
            env: { FAKE_RELEASE_FILE: holderGate.path },
          });
          yield* Deferred.await(holder.started);
          const build = yield* submit({ argv: ['cargo', 'build', '--workspace'], cwd: fixture.ws1 });
          yield* Effect.yieldNow;
          const dependent = yield* submit({
            argv: ['cargo', 'test', '-p', 'dependent'],
            cwd: fixture.ws1,
            after: [build.result.ticket],
          });
          const fmt = yield* submit({
            argv: ['cargo', 'fmt'],
            cwd: fixture.ws1,
            env: { FAKE_RELEASE_FILE: fmtGate.path },
          });
          yield* holderGate.open;
          yield* Deferred.await(fmt.started).pipe(Effect.timeout('3 seconds'));
          expect(yield* Deferred.isDone(build.started)).toBe(false);
          expect(yield* Deferred.isDone(dependent.started)).toBe(false);
          expect(yield* broker.kill(build.result.ticket)).toBe(true);
          const killed = yield* Deferred.await(build.exited).pipe(Effect.timeout('3 seconds'));
          expect(killed.status).toBe('killed');
          expect(yield* Deferred.isDone(build.started)).toBe(false);
          const blocked = yield* Deferred.await(dependent.exited).pipe(Effect.timeout('3 seconds'));
          expect(blocked.status).toBe('failed');
          expect(blocked.error).toBe(`prerequisite ${build.result.ticket} killed`);
          expect(yield* Deferred.isDone(dependent.started)).toBe(false);
          yield* fmtGate.open;
          expect((yield* Deferred.await(fmt.exited)).status).toBe('done');
          yield* Deferred.await(holder.exited);
        }),
      ).pipe(Effect.provide(layer));
    }));

  it.live('runs a cheap fmt ahead of a queued workspace-sized build after the holder finishes', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      yield* execRequest(fixture, {
        cwd: fixture.ws1,
        isTerminal: (message) => message.type === 'started',
        sleep: '0.35',
      });
      const buildFiber = yield* Effect.forkChild(
        execRequest(fixture, {
          argv: ['cargo', 'build', '--workspace'],
          cwd: fixture.ws1,
        }),
      );
      yield* Effect.sleep('40 millis');
      const fmtFiber = yield* Effect.forkChild(
        execRequest(fixture, {
          argv: ['cargo', 'fmt'],
          cwd: fixture.ws1,
        }),
      );
      const [buildMessages, fmtMessages] = yield* Effect.all([
        Fiber.join(buildFiber),
        Fiber.join(fmtFiber),
      ]);
      const build = findExit(buildMessages);
      const fmt = findExit(fmtMessages);
      const report = yield* pollReport(
        fixture,
        (candidate) =>
          candidate.recent.some((record) => record.ticket === build.ticket && record.status === 'done') &&
          candidate.recent.some((record) => record.ticket === fmt.ticket && record.status === 'done'),
      );
      const fmtRecord = report.recent.find((record) => record.ticket === fmt.ticket);
      const buildRecord = report.recent.find((record) => record.ticket === build.ticket);
      expect(fmtRecord?.startedAtMs ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(
        buildRecord?.startedAtMs ?? 0,
      );
    }));
});

describe('surface affinity', () => {
  it.live('runs the request on the surface the lane just built ahead of an older one that would switch', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      // The holder builds with feature `alpha`; while it runs, a request
      // without the feature arrives first and one with it arrives second.
      // Both carry the same default estimate, so only affinity separates them.
      yield* execRequest(fixture, {
        argv: ['cargo', 'check', '-p', 'holder', '--features', 'alpha'],
        cwd: fixture.ws1,
        isTerminal: (message) => message.type === 'started',
        sleep: '0.5',
      });
      const switchingFiber = yield* Effect.forkChild(
        execRequest(fixture, { argv: ['cargo', 'check', '-p', 'plain'], cwd: fixture.ws1 }),
      );
      yield* Effect.sleep('40 millis');
      const affineFiber = yield* Effect.forkChild(
        execRequest(fixture, {
          argv: ['cargo', 'check', '-p', 'featured', '--features', 'alpha'],
          cwd: fixture.ws1,
        }),
      );
      const [switchingMessages, affineMessages] = yield* Effect.all([
        Fiber.join(switchingFiber),
        Fiber.join(affineFiber),
      ]);
      const switching = findExit(switchingMessages);
      const affine = findExit(affineMessages);
      const report = yield* pollReport(fixture, (candidate) =>
        [switching.ticket, affine.ticket].every((ticket) =>
          candidate.recent.some((record) => record.ticket === ticket && record.status === 'done'),
        ),
      );
      const startedAt = (ticket: string) =>
        report.recent.find((record) => record.ticket === ticket)?.startedAtMs ?? Number.NaN;
      expect(startedAt(affine.ticket)).toBeLessThan(startedAt(switching.ticket));
    }));
});
