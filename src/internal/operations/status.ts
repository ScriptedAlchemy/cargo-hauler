import { existsSync } from 'node:fs';
import type { DatabaseSync } from 'node:sqlite';

import { version } from 'agent-bundle/meta';
import * as Effect from 'effect/Effect';
import type * as Scope from 'effect/Scope';

import {
  type DaemonReplacementFailedError,
  daemonIsAbsent,
  defaultEnsureDependencies,
  ensureDaemonVersion,
  type SpawnDaemonError,
} from '../client/ensure-daemon.js';
import { resolveDaemonConfig } from '../daemon/config.js';
import type { DaemonConfigShape } from '../daemon/config.js';
import { type DaemonUnreachableError, requestExpecting } from '../client/control.js';
import { socketErrorCode } from '../platform/socket-errors.js';
import type {
  DaemonIncompatibleError,
  DaemonNewerError,
  DaemonNotReplacedError,
} from '../client/shutdown.js';
import {
  createLedgerApi,
  type LedgerApi,
  openLedgerDatabase,
  openLedgerDatabaseReadOnly,
} from '../storage/ledger.js';
import { isOrphanedByRestart, orphanedByRestartError, toStatusRow } from '../contracts/protocol.js';
import type {
  AttachmentSavingsReport,
  DisplayRequestRecord,
  KacheStatusReport,
  LaneStatus,
  PongMessage,
  RequestRecord,
  StatusMetrics,
  StatusReport,
  StatusResultMessage,
  StatusRow,
  SystemLoadReport,
  TicketSummary,
} from '../contracts/protocol.js';
import { stripAnsi } from '../util/ansi.js';
import { shortId } from '../util/id.js';
import { statusReportSchema, type DaemonStatus } from '../contracts/tool-schemas.js';
import { countWord } from '../util/text.js';
import { compareVersions } from '../contracts/version-order.js';

export interface HaulerSnapshot {
  readonly active: readonly StatusRow[];
  readonly daemon: DaemonStatus;
  readonly kache?: KacheStatusReport | null;
  readonly lanes: readonly LaneStatus[];
  readonly maxConcurrent: number | null;
  readonly metrics?: StatusMetrics;
  readonly savings?: AttachmentSavingsReport;
  readonly system?: SystemLoadReport;
  readonly pid: number | null;
  readonly recent: readonly StatusRow[];
  readonly report: StatusReport | null;
  readonly socketPath: string;
  readonly startedAtMs: number | null;
  readonly stateRoot: string;
  readonly summary: string;
}

export interface LoadSnapshotOptions {
  readonly config?: DaemonConfigShape;
  readonly recentLimit?: number;
}

const defaultRecentLimit = 50;

/**
 * Status is a read on a daemon that may be fanning out several builds' output
 * on a saturated machine; the exec client tolerates a minute of slow accepts,
 * so a status read gets more than the 2s socket-open budget too.
 */
const statusTimeoutMs = 5_000;

/**
 * `hauler result` / `hauler_result` guidance for a running ticket the daemon
 * has flagged stalled (#46): name the idle window and the one command that
 * releases the lane. Riders share the leader's process, so the kill names
 * the leader.
 */
export const stalledGuidance = (
  request: Pick<TicketSummary, 'ticket' | 'status'> & Partial<Pick<TicketSummary, 'attachedTo' | 'stall'>>,
): string | null =>
  request.status === 'running' && request.stall !== undefined
    ? `ticket looks stalled (no CPU for ${Math.floor(request.stall.idleMs / 60_000)}m) — hauler kill ${request.attachedTo ?? request.ticket}`
    : null;

/**
 * `hauler result` / `hauler_result` explanation for a ticket no daemon will
 * finish: one the daemon restart ended was not killed by anyone and did not
 * fail on its own, so a plain `killed` would send the reader looking for a
 * cause; one a stopped daemon stranded carries its reason as its error.
 */
export const orphanedGuidance = (
  request: Pick<TicketSummary, 'status'> & Partial<Pick<TicketSummary, 'error'>>,
): string | null => {
  if (request.error === undefined) {
    return null;
  }
  if (request.status === 'orphaned') {
    return request.error;
  }
  return isOrphanedByRestart({ error: request.error, status: request.status })
    ? `${orphanedByRestartError}: the daemon stopped while it was in flight and does not hand runs over; resubmit if the work is still needed`
    : null;
};

export const describeRequestRecord = (
  ticket: string,
  request:
    | (Pick<TicketSummary, 'ticket' | 'status' | 'errorCount' | 'warningCount'> &
        Partial<Pick<TicketSummary, 'attachedTo' | 'error' | 'stall'>>)
    | null,
): string => {
  if (request === null) {
    return `${ticket} not found`;
  }
  const counts =
    request.errorCount === null || request.warningCount === null
      ? ''
      : ` (${countWord(request.errorCount, 'error')}, ${countWord(request.warningCount, 'warning')})`;
  const note = stalledGuidance(request) ?? orphanedGuidance(request);
  return `${request.ticket} ${request.status}${counts}${note === null ? '' : ` — ${note}`}`;
};

/**
 * Projects one stored record onto a structured operation result. Ledger
 * records keep cargo output verbatim (color included), but every operation
 * result is JSON on the wire — the CLI prints `JSON.stringify(result)` and
 * MCP structured content is JSON-RPC — where an ESC byte can only ever
 * render as literal `\u001b[…` noise. That holds regardless of process
 * stdout: a TTY still sees the escaped JSON form, and an inherited
 * FORCE_COLOR/CLICOLOR_FORCE cannot make JSON paint color. So the
 * projection strips unconditionally; only the live `hauler exec` stream
 * (which never passes through here) keeps color for TTY consumers.
 */
export const displayRequestRecord = (record: RequestRecord): RequestRecord => ({
  ...record,
  outputTail: record.outputTail === null ? null : stripAnsi(record.outputTail),
  diagnostics: record.diagnostics === null ? null : record.diagnostics.map(stripAnsi),
});

/** The status-row counterpart: the bounded preview and diagnostics, ANSI stripped. */
export const displayStatusRow = (row: StatusRow): StatusRow => ({
  ...row,
  outputPreview: row.outputPreview === null ? null : stripAnsi(row.outputPreview),
  diagnostics: row.diagnostics === null ? null : row.diagnostics.map(stripAnsi),
});

export const displayStatusRows = (rows: readonly StatusRow[]): readonly StatusRow[] =>
  rows.map(displayStatusRow);

type UnavailableDaemonStatus = Exclude<DaemonStatus, 'running'>;

const strandedReasons: Record<Exclude<UnavailableDaemonStatus, 'skewed'>, string> = {
  stopped: 'stranded by a stopped daemon',
  unresponsive: 'daemon did not answer; ownership unconfirmed',
};

export const ledgerRequestRecord = (
  record: RequestRecord,
  daemon: UnavailableDaemonStatus,
): DisplayRequestRecord => {
  // A skewed daemon answered, so it still owns and will finish its in-flight tickets.
  if (daemon === 'skewed') {
    return record;
  }
  switch (record.status) {
    case 'requested':
    case 'queued':
    case 'running':
      return { ...record, error: strandedReasons[daemon], status: 'orphaned' };
    case 'done':
    case 'failed':
    case 'killed':
    case 'denied':
    case 'passthrough':
      return record;
    default: {
      const exhaustive: never = record.status;
      return exhaustive;
    }
  }
};

const ledgerStatusRow = (
  record: RequestRecord,
  daemon: UnavailableDaemonStatus,
): StatusRow => toStatusRow(ledgerRequestRecord(record, daemon));

const stoppedSummary = (recentCount: number): string => {
  if (recentCount === 0) {
    return 'cargo-hauler daemon is not running';
  }
  return `cargo-hauler daemon is not running; ${countWord(recentCount, 'recorded request')}`;
};

const runningSummary = (report: StatusReport): string => {
  const queued = report.lanes.reduce((sum, lane) => sum + lane.queued, 0);
  const running = report.active.filter((record) => record.status === 'running').length;
  return `cargo-hauler daemon is running (pid ${report.pid}); ${queued} queued, ${running} running`;
};

/** Keep the internal raw report off the strict public status-result object spread. */
const withReport = (
  snapshot: Omit<HaulerSnapshot, 'report'>,
  report: StatusReport | null,
): HaulerSnapshot =>
  Object.defineProperty(snapshot, 'report', {
    enumerable: false,
    value: report,
  }) as HaulerSnapshot;

const fromReport = (report: StatusReport, config: DaemonConfigShape): HaulerSnapshot =>
  withReport(
    {
      active: report.active,
      daemon: 'running',
      kache: report.kache,
      lanes: report.lanes,
      maxConcurrent: report.maxConcurrent,
      metrics: report.metrics,
      pid: report.pid,
      recent: report.recent,
      savings: report.savings,
      socketPath: report.socketPath,
      startedAtMs: report.startedAtMs,
      stateRoot: config.stateDir,
      summary: runningSummary(report),
      system: report.system,
    },
    report,
  );

/** What a skewed daemon is relative to this client, and the one fix that applies to it. */
const skewSummary = (daemon: Pick<PongMessage, 'pid' | 'version'>): string => {
  const order = compareVersions(daemon.version, version);
  const [release, fix] = ((): readonly [string, string] => {
    switch (order) {
      case -1:
        return [
          'an older release',
          'The next `hauler exec` or `hauler daemon start` replaces it once it is idle; `hauler daemon restart` replaces it now and ends its in-flight tickets.',
        ];
      case 0:
        return ['another build of this release', '`hauler daemon restart` replaces it and ends its in-flight tickets.'];
      case 1:
        return [
          'a newer release',
          'Upgrade this install, or restart the session so its hooks and MCP server come from the current plugin.',
        ];
      default: {
        const exhaustive: never = order;
        return exhaustive;
      }
    }
  })();
  return `cargo-hauler daemon pid ${daemon.pid} (${daemon.version}) is ${release} whose status report this client (${version}) cannot read; showing tickets as the ledger recorded them. ${fix}`;
};

/**
 * A live daemon's report, decoded with this release's schema. The read gate
 * admits other releases on the current wire protocol, and a release can
 * reshape the report without a protocol bump, so a report that does not fit
 * renders as a skewed daemon over the ledger until the daemon is replaced.
 */
const fromLiveReport = (
  raw: unknown,
  daemon: PongMessage,
  config: DaemonConfigShape,
  recentLimit: number,
): Effect.Effect<HaulerSnapshot> => {
  const decoded = statusReportSchema.safeParse(raw);
  if (decoded.success) {
    return Effect.succeed(fromReport(decoded.data, config));
  }
  return fromLedger(config, recentLimit, 'skewed').pipe(
    Effect.map((snapshot) =>
      withReport(
        { ...snapshot, daemon: 'skewed', pid: daemon.pid, startedAtMs: daemon.startedAtMs, summary: skewSummary(daemon) },
        null,
      ),
    ),
  );
};

/**
 * One ticket's detail record straight from the ledger, for the read-only
 * surfaces when no daemon answers: `hauler last` shows the settled tail the
 * status listing leaves out. Null when the ledger has no such ticket (or no
 * database yet).
 */
export const loadLedgerRequest = (
  ticket: string,
  config: DaemonConfigShape = resolveDaemonConfig(),
): Effect.Effect<RequestRecord | null> => {
  if (!existsSync(config.databasePath)) {
    return Effect.succeed(null);
  }
  return Effect.scoped(
    Effect.gen(function* () {
      const ledger = yield* acquireSnapshotLedger(config.databasePath);
      return yield* ledger.getRequestByTicket(ticket);
    }),
  );
};

export const loadLedgerTicket = (
  ticket: string,
  daemon: UnavailableDaemonStatus,
  config?: DaemonConfigShape,
): Effect.Effect<DisplayRequestRecord | null> =>
  loadLedgerRequest(ticket, config).pipe(
    Effect.map((record) => (record === null ? null : ledgerRequestRecord(displayRequestRecord(record), daemon))),
  );

const emptyStopped = (config: DaemonConfigShape): HaulerSnapshot =>
  withReport(
    {
      active: [],
      daemon: 'stopped',
      lanes: [],
      maxConcurrent: null,
      pid: null,
      recent: [],
      socketPath: config.socketPath,
      startedAtMs: null,
      stateRoot: config.stateDir,
      summary: stoppedSummary(0),
    },
    null,
  );

const openSnapshotLedger = (open: (databasePath: string) => DatabaseSync, databasePath: string) => {
  const db = open(databasePath);
  try {
    return { db, ledger: createLedgerApi(db) };
  } catch (error) {
    db.close();
    throw error;
  }
};

/**
 * Scoped ledger for reads without a daemon report: read-only when possible,
 * falling back to the writable opener for WAL recovery after an unclean stop
 * or a ledger predating a column migration (its statements fail to prepare).
 * Always closed by the scope.
 */
const acquireSnapshotLedger = (databasePath: string): Effect.Effect<LedgerApi, never, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.try(() => openSnapshotLedger(openLedgerDatabaseReadOnly, databasePath)).pipe(
      Effect.catch(() => Effect.sync(() => openSnapshotLedger(openLedgerDatabase, databasePath))),
    ),
    ({ db }) => Effect.sync(() => db.close()),
  ).pipe(Effect.map(({ ledger }) => ledger));

const fromLedger = (
  config: DaemonConfigShape,
  recentLimit: number,
  daemon: UnavailableDaemonStatus = 'stopped',
): Effect.Effect<HaulerSnapshot> => {
  if (!existsSync(config.databasePath)) {
    return Effect.succeed(emptyStopped(config));
  }
  return Effect.scoped(
    Effect.gen(function* () {
      const ledger = yield* acquireSnapshotLedger(config.databasePath);
      const recent = (yield* ledger.recentRequests(recentLimit)).map((record) =>
        ledgerStatusRow(record, daemon));
      const active =
        daemon === 'skewed'
          ? (yield* ledger.activeStatusRequests()).map((record) => ledgerStatusRow(record, daemon))
          : [];
      const savings = yield* ledger.attachmentSavings();
      return withReport(
        {
          active,
          daemon: 'stopped' as const,
          lanes: [],
          maxConcurrent: null,
          pid: null,
          recent,
          savings,
          socketPath: config.socketPath,
          startedAtMs: null,
          stateRoot: config.stateDir,
          summary: stoppedSummary(recent.length),
        },
        null,
      );
    }),
  );
};

export const loadHaulerSnapshot = (
  options: LoadSnapshotOptions = {},
): Effect.Effect<
  HaulerSnapshot,
  | SpawnDaemonError
  | DaemonIncompatibleError
  | DaemonNewerError
  | DaemonNotReplacedError
  | DaemonReplacementFailedError
> => {
  const config = options.config ?? resolveDaemonConfig();
  const recentLimit = options.recentLimit ?? defaultRecentLimit;
  const unreachable = (error: DaemonUnreachableError) =>
    daemonIsAbsent(error.cause)
      ? fromLedger(config, recentLimit)
      : unresponsiveSnapshot(
          config,
          recentLimit,
          `socket could not be opened (${socketErrorCode(error.cause) ?? 'no errno'})`,
        );
  return ensureDaemonVersion(config, defaultEnsureDependencies, statusTimeoutMs, 'read').pipe(
    Effect.flatMap((daemon) =>
      daemon === null
        ? fromLedger(config, recentLimit)
        : requestExpecting(
            {
              message: { id: shortId(), limit: recentLimit, type: 'status' },
              socketPath: config.socketPath,
              timeoutMs: statusTimeoutMs,
            },
            (message): message is StatusResultMessage => message.type === 'status-result',
          ).pipe(
            Effect.flatMap((result) =>
              result === undefined
                ? fromLedger(config, recentLimit)
                : fromLiveReport(result.report, daemon, config, recentLimit),
            ),
            // Once the version gate has succeeded, ordinary read failures keep
            // the historical ledger fallback.
            Effect.catchTags({
              ControlTimeout: () =>
                unresponsiveSnapshot(config, recentLimit, `did not answer within ${statusTimeoutMs / 1000}s`),
              ConnectionClosed: () =>
                unresponsiveSnapshot(config, recentLimit, 'closed the connection mid-status'),
              DaemonUnreachable: unreachable,
            }),
          ),
    ),
    // A ping that never establishes a protocol identity is unresponsive.
    Effect.catchTags({
      ControlTimeout: () =>
        unresponsiveSnapshot(config, recentLimit, `did not answer within ${statusTimeoutMs / 1000}s`),
      ConnectionClosed: () => unresponsiveSnapshot(config, recentLimit, 'closed the connection mid-status'),
      DaemonUnreachable: unreachable,
    }),
  );
};

const unresponsiveSnapshot = (
  config: DaemonConfigShape,
  recentLimit: number,
  what: string,
): Effect.Effect<HaulerSnapshot> =>
  fromLedger(config, recentLimit, 'unresponsive').pipe(
    Effect.map((snapshot) =>
      withReport(
        {
          ...snapshot,
          daemon: 'unresponsive',
          summary: `cargo-hauler daemon ${what}; showing ledger data (${snapshot.recent.length} recorded)`,
        },
        snapshot.report,
      ),
    ),
  );
