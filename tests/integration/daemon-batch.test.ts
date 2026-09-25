import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'effect-rstest';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';

import { decodeOutput, execRequest, findExit, pollReport, scopedDaemon } from '../support/harness.js';

describe('batch composer', () => {
  it.live('merges two queued scoped checks into one cargo invocation', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      yield* execRequest(fixture, {
        cwd: fixture.ws1,
        isTerminal: (message) => message.type === 'started',
        sleep: '0.3',
      });
      const [alpha, beta] = yield* Effect.all(
        [
          execRequest(fixture, {
            argv: ['cargo', 'check', '-p', 'alpha'],
            cwd: fixture.ws1,
          }),
          execRequest(fixture, {
            argv: ['cargo', 'check', '-p', 'beta'],
            cwd: fixture.ws1,
          }),
        ],
        { concurrency: 'unbounded' },
      );
      const alphaExit = findExit(alpha);
      const betaExit = findExit(beta);
      expect(alphaExit.status).toBe('done');
      expect(betaExit.status).toBe('done');
      const report = yield* pollReport(fixture, (candidate) =>
        [alphaExit.ticket, betaExit.ticket].every((ticket) =>
          candidate.recent.some((record) => record.ticket === ticket && record.status === 'done'),
        ),
      );
      const alphaRecord = report.recent.find((record) => record.ticket === alphaExit.ticket);
      const betaRecord = report.recent.find((record) => record.ticket === betaExit.ticket);
      const attached =
        alphaRecord?.attachedTo === betaExit.ticket || betaRecord?.attachedTo === alphaExit.ticket;
      expect(attached).toBe(true);
      const rider = alphaRecord?.attachMode === 'batch' ? alphaRecord : betaRecord;
      expect([rider?.attachMode, rider?.savedComputeMs]).toEqual(['batch', 0]);
      const leaderOutput = `${decodeOutput(alpha, 'stdout')}${decodeOutput(beta, 'stdout')}`;
      expect(leaderOutput.includes('-p') || attached).toBe(true);
    }));

  it.live('folds at most sixteen packages into one composite and runs the rest on their own', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      const releaseFile = join(fixture.root, 'holder.release');
      yield* Effect.addFinalizer(() => Effect.sync(() => writeFileSync(releaseFile, '')));
      yield* execRequest(fixture, {
        cwd: fixture.ws1,
        extraEnv: { FAKE_RELEASE_FILE: releaseFile },
        isTerminal: (message) => message.type === 'started',
      });
      const packages = Array.from({ length: 17 }, (_, index) => `p${String(index + 1).padStart(2, '0')}`);
      // One at a time, so the lane's pending order is p01..p17.
      const followers = yield* Effect.forEach(packages, (name, index) =>
        Effect.gen(function* () {
          const follower = yield* Effect.forkChild(
            execRequest(fixture, { argv: ['cargo', 'check', '-p', name], cwd: fixture.ws1, timeoutMs: 15_000 }),
          );
          yield* pollReport(fixture, (report) => report.lanes.some((lane) => lane.queued === index + 1));
          return follower;
        }),
      );
      writeFileSync(releaseFile, '');
      const exits = (yield* Effect.forEach(followers, Fiber.join)).map(findExit);
      expect(exits.map((exit) => exit.status)).toEqual(packages.map(() => 'done'));
      const report = yield* pollReport(fixture, (candidate) =>
        exits.every((exit) =>
          candidate.recent.some((record) => record.ticket === exit.ticket && record.status === 'done'),
        ),
      );
      const [composite, solo, ...riders] = exits.map((exit) =>
        report.recent.find((record) => record.ticket === exit.ticket),
      );
      const flags = (names: readonly string[]) => names.flatMap((name) => ['-p', name]);
      const demux = '--message-format=json-diagnostic-rendered-ansi';
      expect(composite?.execArgv).toEqual([
        'cargo', 'check',
        ...flags(['p01', 'p17', 'p16', 'p15', 'p14', 'p13', 'p12', 'p11', 'p10', 'p09', 'p08', 'p07', 'p06', 'p05', 'p04', 'p03']),
        demux,
      ]);
      expect(riders.map((record) => [record?.attachedTo, record?.attachMode])).toEqual(
        riders.map(() => [composite?.ticket, 'batch']),
      );
      expect([solo?.attachedTo, solo?.execArgv]).toEqual([null, ['cargo', 'check', '-p', 'p02', demux]]);
      expect(solo?.startedAtMs).toBeGreaterThanOrEqual(composite?.finishedAtMs ?? Number.NaN);
    }));
});
