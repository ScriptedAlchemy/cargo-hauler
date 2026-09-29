import * as Effect from 'effect/Effect';

import { fetchTicket } from '../client/tickets.js';
import type { DaemonConfigShape } from '../daemon/config.js';
import type { DisplayRequestRecord, StatusQuery } from '../contracts/protocol.js';
import {
  type HaulerSnapshot,
  displayRequestRecord,
  displayStatusRows,
  loadHaulerSnapshot,
  loadLedgerRequest,
  loadLedgerTicket,
} from './status.js';

import type {
  LastResult,
  LimitInput,
  LogResult,
  StatusInput,
  StatusResult,
} from '../contracts/tool-schemas.js';
import { filterStatusRows, statusSummary } from './status-filter.js';
import { runTicketEffect } from './ticket-errors.js';

export interface InspectOptions {
  readonly config?: DaemonConfigShape;
  readonly signal: AbortSignal;
}

/** A skewed or unresponsive daemon's summary line (what failed, the fix) leads. */
const withDaemonLine = (snapshot: HaulerSnapshot, summary: string): string =>
  snapshot.daemon === 'skewed' || snapshot.daemon === 'unresponsive' ? `${snapshot.summary}\n${summary}` : summary;

// Through the ticket boundary runner so MCP/CLI cancellation aborts the
// socket wait and replacement failures become clear transport diagnostics.
const loadSnapshot = (query: number | StatusQuery, options: InspectOptions) =>
  runTicketEffect(
    loadHaulerSnapshot({
      query: typeof query === 'number' ? { limit: query, telemetry: false } : query,
      ...(options.config === undefined ? {} : { config: options.config }),
    }),
    options.signal,
  );

/** Last and log include active work; status keeps its two lists disjoint. */
const recentSnapshotRows = (snapshot: HaulerSnapshot, limit: number) =>
  [...new Map([...snapshot.recent, ...snapshot.active].map((row) => [row.ticket, row])).values()]
    .sort((left, right) => right.createdAtMs - left.createdAtMs || right.id - left.id)
    .slice(0, limit);

/**
 * `hauler last`: the newest ticket named by the status listing, read as a
 * detail record — the listing's rows carry no tail (#95), so the record comes
 * from the daemon's `result` (the live tail overlaid while it runs) or, with
 * no daemon answering, from the ledger. Like status, the read fails open: a
 * daemon that stops answering between the two calls yields the ledger record.
 */
export const loadLastResult = async (options: InspectOptions): Promise<LastResult> => {
  const snapshot = await loadSnapshot(1, options);
  const latest = recentSnapshotRows(snapshot, 1)[0] ?? null;
  const detailOf = (ticket: string): Effect.Effect<DisplayRequestRecord | null> =>
    snapshot.daemon === 'running'
      ? fetchTicket(ticket, options.config).pipe(
          Effect.catch(() => loadLedgerRequest(ticket, options.config)),
          Effect.map((record) => (record === null ? null : displayRequestRecord(record))),
        )
      : loadLedgerTicket(ticket, snapshot.daemon, options.config);
  const request = latest === null ? null : await runTicketEffect(detailOf(latest.ticket), options.signal);
  return {
    daemon: snapshot.daemon,
    operation: 'last',
    request,
    summary: withDaemonLine(
      snapshot,
      request === null
        ? latest === null
          ? 'no hauler requests recorded'
          : `${latest.ticket} is no longer recorded`
        : `${request.ticket} ${request.status}`,
    ),
  };
};

export const loadLogResult = async (
  input: LimitInput,
  options: InspectOptions,
): Promise<LogResult> => {
  const snapshot = await loadSnapshot(input.limit ?? 50, options);
  const requests = recentSnapshotRows(snapshot, input.limit ?? 50);
  return {
    daemon: snapshot.daemon,
    operation: 'log',
    requests: displayStatusRows(requests),
    summary: withDaemonLine(
      snapshot,
      requests.length === 0
        ? 'no hauler requests recorded'
        : `${requests.length} recent request${requests.length === 1 ? '' : 's'}`,
    ),
  };
};

/**
 * Filters reach the daemon and ledger before the recent-row limit.
 * Rows are the bounded status contract: no tail, a short `outputPreview` on
 * running rows; `result` reads a ticket's whole tail (#95).
 */
export const loadStatusResult = async (
  input: StatusInput,
  options: InspectOptions,
): Promise<StatusResult> => {
  const limit = input.limit ?? 20;
  const { metrics, ...query } = input;
  const snapshot = await loadSnapshot({ ...query, limit, telemetry: metrics === true }, options);
  const active = filterStatusRows(snapshot.active, input);
  const activeTickets = new Set(active.map((row) => row.ticket));
  const recent = filterStatusRows(snapshot.recent, input)
    .filter((row) => !activeTickets.has(row.ticket))
    .slice(0, limit);
  return {
    ...snapshot,
    active: displayStatusRows(active),
    operation: 'status',
    recent: displayStatusRows(recent),
    summary: withDaemonLine(snapshot, statusSummary(snapshot.daemon, active, recent)),
  };
};
