import { describe, expect, it } from 'effect-rstest';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';

import { requestOverSocket } from '../../src/internal/client/control.js';
import type { KillResultMessage, StatusReport } from '../../src/internal/contracts/protocol.js';
import {
  execRequest,
  findExit,
  pollReport,
  scopedDaemon,
  scopedGate,
  shortId,
} from '../support/harness.js';

const recordFor = (report: StatusReport, ticket: string) =>
  [...report.active, ...report.recent].find((record) => record.ticket === ticket);

const statusOf = (ticket: string) => (report: StatusReport) => recordFor(report, ticket)?.status;

describe('lanes follow the directory cargo locks', () => {
  it.live('runs two profiles of one workspace at once and queues a same-profile check', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(5);
      const target = `${fixture.ws1}/target`;
      const debugGate = yield* scopedGate(fixture, 'debug.gate');
      const perfGate = yield* scopedGate(fixture, 'perf.gate');
      const debugBuild = yield* Effect.forkChild(
        execRequest(fixture, {
          cwd: fixture.ws1,
          argv: ['cargo', 'build', '-p', 'aa'],
          extraEnv: { FAKE_RELEASE_FILE: debugGate.path },
          timeoutMs: 15_000,
        }),
      );
      yield* pollReport(fixture, (report) => statusOf('cc-1')(report) === 'running');
      const perfBuild = yield* Effect.forkChild(
        execRequest(fixture, {
          cwd: fixture.ws1,
          argv: ['cargo', 'build', '-p', 'aa', '--profile', 'perf'],
          extraEnv: { FAKE_RELEASE_FILE: perfGate.path },
          timeoutMs: 15_000,
        }),
      );
      yield* pollReport(fixture, (report) => statusOf('cc-2')(report) === 'running');
      const check = yield* Effect.forkChild(
        execRequest(fixture, { cwd: fixture.ws1, argv: ['cargo', 'check', '-p', 'bb'], timeoutMs: 15_000 }),
      );
      const queued = yield* pollReport(fixture, (report) => statusOf('cc-3')(report) === 'queued');

      expect(['cc-1', 'cc-2', 'cc-3'].map((ticket) => statusOf(ticket)(queued))).toEqual([
        'running',
        'running',
        'queued',
      ]);
      expect(recordFor(queued, 'cc-3')?.queue?.aheadTickets).toEqual(['cc-1']);
      expect(
        [...queued.lanes]
          .sort((left, right) => left.key.localeCompare(right.key))
          .map((lane) => [lane.key, lane.profileDir, lane.runningTicket, lane.queued]),
      ).toEqual([
        [JSON.stringify([fixture.ws1, target, 'debug']), 'debug', 'cc-1', 1],
        [JSON.stringify([fixture.ws1, target, 'perf']), 'perf', 'cc-2', 0],
      ]);

      yield* debugGate.open;
      yield* perfGate.open;
      const exits = [
        findExit(yield* Fiber.join(debugBuild)),
        findExit(yield* Fiber.join(perfBuild)),
        findExit(yield* Fiber.join(check)),
      ];
      expect(exits.map((exit) => [exit.ticket, exit.status])).toEqual([
        ['cc-1', 'done'],
        ['cc-2', 'done'],
        ['cc-3', 'done'],
      ]);
    }));

  it.live('gates a whole-target clean behind every build on the target dir, and later builds behind it', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(5);
      const target = `${fixture.ws1}/target`;
      const perfGate = yield* scopedGate(fixture, 'perf.gate');
      const perfBuild = yield* Effect.forkChild(
        execRequest(fixture, {
          cwd: fixture.ws1,
          argv: ['cargo', 'build', '-p', 'aa', '--profile', 'perf'],
          extraEnv: { FAKE_RELEASE_FILE: perfGate.path },
          timeoutMs: 15_000,
        }),
      );
      yield* pollReport(fixture, (report) => statusOf('cc-1')(report) === 'running');
      const clean = yield* Effect.forkChild(
        execRequest(fixture, { cwd: fixture.ws1, argv: ['cargo', 'clean'], timeoutMs: 15_000 }),
      );
      yield* pollReport(fixture, (report) => recordFor(report, 'cc-2')?.admissionHold !== undefined);
      const debugBuild = yield* Effect.forkChild(
        execRequest(fixture, { cwd: fixture.ws1, argv: ['cargo', 'build', '-p', 'aa'], timeoutMs: 15_000 }),
      );
      const held = yield* pollReport(
        fixture,
        (report) => recordFor(report, 'cc-3')?.admissionHold !== undefined,
      );

      expect(
        ['cc-1', 'cc-2', 'cc-3'].map((ticket) => [
          recordFor(held, ticket)?.status,
          recordFor(held, ticket)?.admissionHold,
        ]),
      ).toEqual([
        ['running', undefined],
        ['queued', { detail: `cc-1 still uses ${target}`, reason: 'target-clean' }],
        ['queued', { detail: `whole-target cargo clean cc-2 on ${target}`, reason: 'target-clean' }],
      ]);
      expect(
        [...held.lanes]
          .sort((left, right) => left.key.localeCompare(right.key))
          .map((lane) => [lane.key, lane.profileDir]),
      ).toEqual([
        [JSON.stringify([fixture.ws1, target, '*']), null],
        [JSON.stringify([fixture.ws1, target, 'debug']), 'debug'],
        [JSON.stringify([fixture.ws1, target, 'perf']), 'perf'],
      ]);

      yield* perfGate.open;
      const exits = [
        findExit(yield* Fiber.join(perfBuild)),
        findExit(yield* Fiber.join(clean)),
        findExit(yield* Fiber.join(debugBuild)),
      ];
      expect(exits.map((exit) => [exit.ticket, exit.status])).toEqual([
        ['cc-1', 'done'],
        ['cc-2', 'done'],
        ['cc-3', 'done'],
      ]);
      const settled = yield* pollReport(fixture, (report) =>
        ['cc-1', 'cc-2', 'cc-3'].every((ticket) => recordFor(report, ticket)?.finishedAtMs != null),
      );
      const stamp = (ticket: string) => {
        const record = recordFor(settled, ticket);
        return { finishedAtMs: record?.finishedAtMs ?? Number.NaN, startedAtMs: record?.startedAtMs ?? Number.NaN };
      };
      expect([
        stamp('cc-2').startedAtMs >= stamp('cc-1').finishedAtMs,
        stamp('cc-3').startedAtMs >= stamp('cc-2').finishedAtMs,
      ]).toEqual([true, true]);
    }));

  it.live('settles a clean killed at the gate at once and lets the builds behind it run', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(5);
      const perfGate = yield* scopedGate(fixture, 'perf.gate');
      const perfBuild = yield* Effect.forkChild(
        execRequest(fixture, {
          cwd: fixture.ws1,
          argv: ['cargo', 'build', '-p', 'aa', '--profile', 'perf'],
          extraEnv: { FAKE_RELEASE_FILE: perfGate.path },
          timeoutMs: 15_000,
        }),
      );
      yield* pollReport(fixture, (report) => statusOf('cc-1')(report) === 'running');
      const clean = yield* Effect.forkChild(
        execRequest(fixture, { cwd: fixture.ws1, argv: ['cargo', 'clean'], timeoutMs: 15_000 }),
      );
      yield* pollReport(fixture, (report) => recordFor(report, 'cc-2')?.admissionHold !== undefined);

      const killMessages = yield* requestOverSocket({
        socketPath: fixture.config.socketPath,
        message: { type: 'kill', id: shortId(), ticket: 'cc-2' },
        isTerminal: (message) => message.type === 'kill-result',
      });
      expect(
        killMessages.find((message): message is KillResultMessage => message.type === 'kill-result')?.killed,
      ).toBe(true);
      expect(findExit(yield* Fiber.join(clean)).status).toBe('killed');

      const debugExit = findExit(
        yield* execRequest(fixture, { cwd: fixture.ws1, argv: ['cargo', 'build', '-p', 'aa'], timeoutMs: 15_000 }),
      );
      const during = yield* pollReport(fixture, (report) => statusOf('cc-3')(report) === 'done');
      expect([debugExit.status, statusOf('cc-1')(during)]).toEqual(['done', 'running']);

      yield* perfGate.open;
      expect(findExit(yield* Fiber.join(perfBuild)).status).toBe('done');
    }));
});
