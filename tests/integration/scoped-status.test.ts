import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:net';
import { join } from 'node:path';

import { version } from 'agent-bundle/meta';
import { describe, expect, it } from 'effect-rstest';
import * as Effect from 'effect/Effect';

import { Broker } from '../../src/internal/daemon/broker/broker.js';
import { loadLastResult, loadLogResult, loadStatusResult } from '../../src/internal/operations/inspection.js';
import { statusReportSchema, statusResultSchema } from '../../src/internal/contracts/tool-schemas.js';
import { toStatusRow, type StatusReport, type StatusRow } from '../../src/internal/contracts/protocol.js';
import { boundedStatusQueue, statusBlockerTickets } from '../../src/internal/operations/status-filter.js';
import type { CreateRequestInput } from '../../src/internal/storage/ledger.js';
import type { LedgerApi } from '../../src/internal/storage/ledger.js';
import { brokerFixture } from '../support/broker-fixture.js';
import { fakeCargoEnv, scopedFixture, scopedLedger } from '../support/harness.js';

const input = (cwd: string, createdAtMs: number): CreateRequestInput => ({
  argv: ['cargo', 'test', '--literal', '%_case'],
  createdAtMs,
  cwd,
  host: null,
  intentJson: null,
  intentKey: null,
  laneKey: `${cwd}::${cwd}/target`,
  session: 'selected-session',
  targetDir: `${cwd}/target`,
  workspaceRoot: cwd,
});

const callbacks = {
  onExit: () => Effect.void,
  onOutput: () => Effect.void,
  onStarted: () => Effect.void,
};

/** A compatible older daemon which ignores every new status query field. */
const olderReportServer = (socketPath: string, report: StatusReport, ledger: LedgerApi) => Effect.acquireRelease(
  Effect.promise(() => new Promise<Server>((resolve, reject) => {
    const server = createServer((socket) => {
      let buffered = '';
      socket.on('data', (data) => {
        buffered += data.toString();
        const end = buffered.indexOf('\n');
        if (end < 0) return;
        const message = JSON.parse(buffered.slice(0, end)) as { type: string; id: string; ticket: string };
        if (message.type === 'result') {
          Effect.runPromise(ledger.getRequestByTicket(message.ticket)).then((request) => {
            socket.end(`${JSON.stringify({ type: 'result-result', id: message.id, request })}\n`);
          });
          return;
        }
        socket.end(`${JSON.stringify(message.type === 'ping'
          ? { type: 'pong', id: message.id, protocol: 1, pid: process.pid, startedAtMs: 1, version }
          : { type: 'status-result', id: message.id, report })}\n`);
      });
    });
    server.once('error', reject);
    server.listen(socketPath, () => resolve(server));
  })),
  (server) => Effect.promise(() => new Promise<void>((resolve) => server.close(() => resolve()))),
);

describe('scoped status reads', () => {
  it.live('finds tickets and workspace rows older than 500, filtering projected orphaned state before the limit', () => Effect.gen(function* () {
    const fixture = yield* scopedFixture(1);
    const ledger = yield* scopedLedger(fixture.config);
    const settled = yield* ledger.createRequest(input(fixture.ws1, 1));
    yield* ledger.markFinished(settled.id, { status: 'done', atMs: 2 });
    const stranded = yield* ledger.createRequest(input(fixture.ws1, 3));
    yield* ledger.markRunning(stranded.id, 4);
    for (let index = 0; index < 600; index++) {
      const unrelated = yield* ledger.createRequest({ ...input(fixture.ws2, 10 + index), session: 'other-session' });
      yield* ledger.markFinished(unrelated.id, { status: 'done', atMs: 1_000 + index });
    }
    const read = (query: Parameters<typeof loadStatusResult>[0]) =>
      Effect.promise((signal) => loadStatusResult(query, { config: fixture.config, signal }));
    const exact = yield* read({ tickets: [settled.ticket], limit: 1 });
    expect(statusResultSchema.parse(exact)).toMatchObject({ daemon: 'stopped', scope: 'filtered', active: [] });
    expect(exact.recent.map((row) => row.ticket)).toEqual([settled.ticket]);
    expect(exact).not.toHaveProperty('savings');
    expect(exact.recent[0]).not.toHaveProperty('outputTail');
    const workspace = yield* read({ cwd: fixture.ws1, statuses: ['done'], limit: 1 });
    expect(workspace.recent.map((row) => row.ticket)).toEqual([settled.ticket]);
    const orphaned = yield* read({ cwd: fixture.ws1, statuses: ['orphaned'], limit: 1 });
    expect(orphaned.recent.map((row) => [row.ticket, row.status])).toEqual([[stranded.ticket, 'orphaned']]);
    expect((yield* read({ cwd: fixture.ws1, statuses: ['running'], limit: 1 })).recent).toEqual([]);
    const combined = yield* ledger.recentStatusRequests({
      commandContains: 'test --literal %_', cwd: fixture.ws1, session: 'selected-session',
      laneKey: input(fixture.ws1, 1).laneKey, statuses: ['done'], limit: 1,
    });
    expect(combined.map((row) => row.ticket)).toEqual([settled.ticket]);
    expect(yield* ledger.recentStatusRequests({ tickets: [], limit: 1 })).toEqual([]);
    expect(yield* ledger.recentStatusRequests({ tickets: ['cc-0001', 'invalid'], limit: 1 })).toEqual([]);
  }));

  it.live('returns only matching work and its blocker lanes, skips global telemetry, and preserves the full dashboard report', () => Effect.gen(function* () {
    let metricsReads = 0;
    let savingsReads = 0;
    const { fixture, ledger, layer } = yield* brokerFixture(3, (base) => ({
      ...base,
      metricsWindows: (now) => Effect.sync(() => { metricsReads++; }).pipe(Effect.andThen(base.metricsWindows(now))),
      attachmentSavings: () => Effect.sync(() => { savingsReads++; }).pipe(Effect.andThen(base.attachmentSavings())),
    }));
    const other = join(fixture.root, 'unrelated');
    mkdirSync(other);
    writeFileSync(join(other, 'Cargo.toml'), '[package]\nname = "unrelated"\n');
    yield* Effect.scoped(Effect.gen(function* () {
      const broker = yield* Broker;
      const submit = (cwd: string, after?: readonly string[]) => broker.submit({
        argv: ['cargo', 'check'], cwd, env: fakeCargoEnv(fixture, { FAKE_SLEEP: '20' }),
        ...(after === undefined ? {} : { after }),
      }, callbacks);
      const prerequisite = yield* submit(fixture.ws2);
      const unrelated = yield* submit(other);
      const selected = yield* submit(fixture.ws1, [prerequisite.ticket]);
      const scoped = yield* broker.report({ tickets: [selected.ticket], limit: 1, telemetry: false });
      expect(statusReportSchema.parse({ ...scoped, version })).toMatchObject({ scope: 'filtered' });
      expect(scoped.active.map((row) => row.ticket)).toEqual([selected.ticket]);
      expect(scoped.recent).toEqual([]);
      expect(scoped.active[0]?.waitingFor?.map((row) => row.ticket)).toEqual([prerequisite.ticket]);
      expect(new Set(scoped.lanes.map((lane) => lane.workspaceRoot))).toEqual(new Set([fixture.ws1, fixture.ws2]));
      for (const key of ['metrics', 'savings', 'system', 'kache']) expect(scoped).not.toHaveProperty(key);
      expect([metricsReads, savingsReads]).toEqual([0, 0]);
      const dashboard = yield* broker.report({ limit: 40, telemetry: true });
      expect(dashboard.lanes).toHaveLength(3);
      expect(dashboard.active).toHaveLength(3);
      for (const key of ['metrics', 'savings', 'system', 'kache']) expect(dashboard).toHaveProperty(key);
      expect([metricsReads, savingsReads]).toEqual([1, 1]);
      const globalMetrics = yield* broker.report({ tickets: [selected.ticket], telemetry: true });
      expect(globalMetrics.active).toHaveLength(1);
      expect(globalMetrics.lanes).toHaveLength(2);
      expect(globalMetrics.metrics?.windows).toEqual(dashboard.metrics?.windows);

      // The older wire response omits the scope marker and has only a
      // bounded recent window; exact SQL selection must recover its old row.
      const old = yield* ledger.createRequest({ ...input(fixture.ws1, 1), laneKey: selected.laneKey });
      yield* ledger.markFinished(old.id, { status: 'done', atMs: 2 });
      for (let index = 0; index < 600; index++) {
        const row = yield* ledger.createRequest(input(other, 10 + index));
        yield* ledger.markFinished(row.id, { status: 'done', atMs: 1_000 + index });
      }
      const { scope: _scope, ...legacy } = dashboard;
      const legacyReport = { ...legacy, recent: (yield* ledger.recentStatusRequests(500)).map((row) => toStatusRow(row)), version };
      yield* olderReportServer(fixture.config.socketPath, legacyReport, ledger);
      const fallback = yield* Effect.promise((signal) => loadStatusResult({ tickets: [old.ticket], limit: 1 }, { config: fixture.config, signal }));
      expect(fallback.daemon).toBe('running');
      expect(fallback.active).toEqual([]);
      expect(fallback.recent.map((row) => row.ticket)).toEqual([old.ticket]);
      expect(fallback.lanes.map((lane) => lane.workspaceRoot)).toEqual([fixture.ws1]);
      expect(fallback).not.toHaveProperty('metrics');
      const liveFallback = yield* Effect.promise((signal) => loadStatusResult({ tickets: [selected.ticket] }, { config: fixture.config, signal }));
      expect(liveFallback.active[0]?.waitingFor?.map((row) => row.ticket)).toEqual([prerequisite.ticket]);
      expect(liveFallback.lanes).toHaveLength(2);
      const last = yield* Effect.promise((signal) => loadLastResult({ config: fixture.config, signal }));
      expect(last.request?.ticket).toBe(selected.ticket);
      const log = yield* Effect.promise((signal) => loadLogResult({ limit: 1 }, { config: fixture.config, signal }));
      expect(log.requests.map((row) => row.ticket)).toEqual([selected.ticket]);

      const queued: StatusRow = { ...scoped.active[0]!, queue: {
        position: 1_000, aheadTickets: Array.from({ length: 1_000 }, (_, index) => `cc-${index + 1}`),
        headTicket: prerequisite.ticket, waitEtaMs: 1_000,
      } };
      const bounded = boundedStatusQueue(queued);
      expect(bounded.queue?.aheadTickets).toHaveLength(20);
      expect(bounded.queue?.aheadTicketsTotal).toBe(1_000);
      expect(bounded.queue?.position).toBe(1_000);
      expect(statusBlockerTickets([bounded])).toEqual([prerequisite.ticket]);
      expect(statusReportSchema.parse({ ...scoped, active: [bounded], version }).active[0]?.queue?.aheadTicketsTotal).toBe(1_000);

      for (const ticket of [selected.ticket, unrelated.ticket, prerequisite.ticket]) yield* broker.kill(ticket);
    })).pipe(Effect.provide(layer));
  }), 30_000);
});
