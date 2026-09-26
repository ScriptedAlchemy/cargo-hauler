import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'effect-rstest';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';

import {
  decodeOutput,
  execRequest,
  findExit,
  pollReport,
  scopedDaemon,
  scopedGate,
} from '../support/harness.js';

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

  it.live('folds a request that joins the lane while its head waits for a permit', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      const holderRelease = yield* scopedGate(fixture, 'holder.release');
      // Another lane holds the only permit, so ws1's head parks on admission.
      yield* execRequest(fixture, {
        cwd: fixture.ws2,
        extraEnv: { FAKE_RELEASE_FILE: holderRelease.path },
        isTerminal: (message) => message.type === 'started',
      });
      const ws1Lane = (report: { readonly lanes: readonly { readonly workspaceRoot: string; readonly queued: number }[] }) =>
        report.lanes.find((lane) => lane.workspaceRoot === fixture.ws1);
      const alpha = yield* Effect.forkChild(
        execRequest(fixture, { argv: ['cargo', 'check', '-p', 'alpha'], cwd: fixture.ws1, timeoutMs: 15_000 }),
      );
      // The lane took alpha as its head: it is queued but no longer pending.
      yield* pollReport(
        fixture,
        (report) =>
          ws1Lane(report)?.queued === 0 &&
          report.active.some((record) => record.status === 'queued' && record.argv.includes('alpha')),
      );
      const beta = yield* Effect.forkChild(
        execRequest(fixture, { argv: ['cargo', 'check', '-p', 'beta'], cwd: fixture.ws1, timeoutMs: 15_000 }),
      );
      yield* pollReport(fixture, (report) => ws1Lane(report)?.queued === 1);
      yield* holderRelease.open;

      const alphaExit = findExit(yield* Fiber.join(alpha));
      const betaExit = findExit(yield* Fiber.join(beta));
      expect([alphaExit.status, betaExit.status]).toEqual(['done', 'done']);
      const report = yield* pollReport(fixture, (candidate) =>
        [alphaExit.ticket, betaExit.ticket].every((ticket) =>
          candidate.recent.some((record) => record.ticket === ticket && record.status === 'done'),
        ),
      );
      const alphaRecord = report.recent.find((record) => record.ticket === alphaExit.ticket);
      const betaRecord = report.recent.find((record) => record.ticket === betaExit.ticket);
      expect([betaRecord?.attachedTo, betaRecord?.attachMode]).toEqual([alphaExit.ticket, 'batch']);
      expect(alphaRecord?.execArgv).toEqual([
        'cargo', 'check', '-p', 'alpha', '-p', 'beta', '--message-format=json-diagnostic-rendered-ansi',
      ]);
    }));

  it.live('folds queued checks that pass the same --locked assertion', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      const holderRelease = yield* scopedGate(fixture, 'holder.release');
      yield* execRequest(fixture, {
        cwd: fixture.ws1,
        extraEnv: { FAKE_RELEASE_FILE: holderRelease.path },
        isTerminal: (message) => message.type === 'started',
      });
      const [alpha, beta] = yield* Effect.all(
        [
          Effect.forkChild(
            execRequest(fixture, { argv: ['cargo', 'check', '-p', 'alpha', '--locked'], cwd: fixture.ws1 }),
          ),
          Effect.forkChild(
            execRequest(fixture, { argv: ['cargo', 'check', '-p', 'beta', '--locked'], cwd: fixture.ws1 }),
          ),
        ],
      );
      yield* pollReport(fixture, (report) => report.lanes.some((lane) => lane.queued === 2));
      yield* holderRelease.open;
      const exits = [findExit(yield* Fiber.join(alpha)), findExit(yield* Fiber.join(beta))];
      expect(exits.map((exit) => exit.status)).toEqual(['done', 'done']);
      const report = yield* pollReport(fixture, (candidate) =>
        exits.every((exit) =>
          candidate.recent.some((record) => record.ticket === exit.ticket && record.status === 'done'),
        ),
      );
      const records = exits.map((exit) => report.recent.find((record) => record.ticket === exit.ticket));
      const composite = records.find((record) => record?.attachedTo === null);
      const rider = records.find((record) => record?.attachedTo !== null);
      expect([rider?.attachedTo, rider?.attachMode]).toEqual([composite?.ticket, 'batch']);
      expect(composite?.execArgv?.filter((argument) => argument === '--locked')).toEqual(['--locked']);
      expect(composite?.execArgv).toEqual(expect.arrayContaining(['-p', 'alpha', '-p', 'beta']));
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
