import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'effect-rstest';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Schedule from 'effect/Schedule';

import { runExecClient } from '../../src/internal/client/exec.js';
import { fetchTicketResult, killTicketResult } from '../../src/internal/operations/tickets.js';

import { fakeCargoEnv, scopedDaemon } from '../support/harness.js';

class NotYet extends Data.TaggedError('NotYet')<{ readonly status: string | undefined }> {}

describe('killTicketResult', () => {
  it.live('stops a running ticket, frees its lane, and reports it killed', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(2);
      const signal = new AbortController().signal;
      const submitted = yield* runExecClient({
        argv: ['cargo', 'test', '-p', 'ws1'],
        autoSpawn: false,
        background: true,
        config: fixture.config,
        cwd: fixture.ws1,
        env: fakeCargoEnv(fixture, { FAKE_SLEEP: '30' }),
        io: { writeStderr: () => undefined, writeStdout: () => undefined },
      });
      const ticket = submitted.ticket;
      if (ticket === undefined) {
        throw new Error('background submit returned no ticket');
      }
      // Wait until the leader is actually running before asking for the kill.
      yield* Effect.gen(function* () {
        const current = yield* Effect.promise(() =>
          fetchTicketResult({ ticket: ticket }, { config: fixture.config, signal }),
        );
        if (current.request?.status !== 'running') {
          return yield* Effect.fail(new NotYet({ status: current.request?.status }));
        }
      }).pipe(Effect.retry(Schedule.spaced('50 millis').pipe(Schedule.upTo({ times: 200 }))));

      const killed = yield* Effect.promise(() =>
        killTicketResult({ ticket: ticket }, { config: fixture.config, signal }),
      );
      expect(killed).toMatchObject({ killed: true, operation: 'kill', ticket: ticket });
      expect(killed.summary).toContain(ticket);

      // The daemon settles the ticket as killed once the process is gone.
      const settled = yield* Effect.gen(function* () {
        const current = yield* Effect.promise(() =>
          fetchTicketResult({ ticket: ticket }, { config: fixture.config, signal }),
        );
        if (current.request?.status !== 'killed') {
          return yield* Effect.fail(new NotYet({ status: current.request?.status }));
        }
        return current;
      }).pipe(Effect.retry(Schedule.spaced('50 millis').pipe(Schedule.upTo({ times: 200 }))));
      expect(settled.request?.status).toBe('killed');
    }), 30_000);

  it.live('settles a lane head killed during its batch window without running cargo', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1, { CARGO_HAULER_BATCH_WINDOW_MS: '20000' });
      const signal = new AbortController().signal;
      const cargoStarted = join(fixture.root, 'cargo-started');
      const submitted = yield* runExecClient({
        argv: ['cargo', 'build', '-p', 'ws1'],
        autoSpawn: false,
        background: true,
        config: fixture.config,
        cwd: fixture.ws1,
        env: fakeCargoEnv(fixture, { FAKE_READY_FILE: cargoStarted }),
        io: { writeStderr: () => undefined, writeStdout: () => undefined },
      });
      const ticket = submitted.ticket;
      if (ticket === undefined) {
        throw new Error('background submit returned no ticket');
      }
      const awaitBatchWindowHead = Effect.gen(function* () {
        const current = yield* Effect.promise(() =>
          fetchTicketResult({ ticket }, { config: fixture.config, signal }),
        );
        if (current.request?.status !== 'queued' || current.request.queue !== undefined) {
          return yield* Effect.fail(new NotYet({ status: current.request?.status }));
        }
      }).pipe(Effect.retry(Schedule.spaced('20 millis').pipe(Schedule.upTo({ times: 100 }))));
      yield* awaitBatchWindowHead;

      const killedAtMs = Date.now();
      const killed = yield* Effect.promise(() =>
        killTicketResult({ ticket }, { config: fixture.config, signal }),
      );
      expect(killed.killed).toBe(true);
      const settled = yield* Effect.gen(function* () {
        const current = yield* Effect.promise(() =>
          fetchTicketResult({ ticket }, { config: fixture.config, signal }),
        );
        if (current.request?.status !== 'killed') {
          return yield* Effect.fail(new NotYet({ status: current.request?.status }));
        }
        return current;
      }).pipe(Effect.retry(Schedule.spaced('50 millis').pipe(Schedule.upTo({ times: 40 }))));
      expect(Date.now() - killedAtMs).toBeLessThan(2_000);
      expect(settled.request).toMatchObject({
        error: 'killed while queued',
        startedAtMs: null,
        status: 'killed',
      });
      expect(existsSync(cargoStarted)).toBe(false);

      const again = yield* Effect.promise(() =>
        killTicketResult({ ticket }, { config: fixture.config, signal }),
      );
      expect(again).toMatchObject({
        killed: false,
        summary: `${ticket}: nothing to kill (already killed)`,
      });
    }), 30_000);

  it.live('reports killed: false for a ticket that already finished or is unknown', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(2);
      const signal = new AbortController().signal;
      const result = yield* Effect.promise(() =>
        killTicketResult({ ticket: 'cc-999' }, { config: fixture.config, signal }),
      );
      expect(result).toMatchObject({ killed: false, operation: 'kill', ticket: 'cc-999' });
      expect(result.summary).toContain('nothing to kill');
    }));
});
