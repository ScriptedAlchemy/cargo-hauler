import * as Effect from 'effect/Effect';

import {
  awaitTicketWithProgress,
  fetchTicket,
  killTicket,
  submitBackgroundAck,
  type AwaitProgress,
  type BackgroundSubmitAck,
  type TicketSocketError,
} from '../client/tickets.js';
import { daemonIsAbsent } from '../client/ensure-daemon.js';
import type { DaemonConfigShape } from '../daemon/config.js';
import type { DisplayRequestRecord, RequestRecord } from '../contracts/protocol.js';
import { describeRequestRecord, displayRequestRecord, loadLedgerTicket } from './status.js';

import type { TicketRequestContext } from './attribution.js';
import { enrichTicketRequest, ticketAttribution } from './attribution.js';
import {
  type AwaitResult,
  type KillResult,
  type RequestInput,
  type RequestSubmitResult,
  type ResultFetchResult,
  type ResultInput,
  type TicketInput,
} from '../contracts/tool-schemas.js';
import { runTicketEffect } from './ticket-errors.js';
import { loadTicketOutput } from './ticket-output.js';
import type { TicketOutputModel } from './ticket-output.js';

export interface TicketOptions {
  readonly config?: DaemonConfigShape;
  readonly signal: AbortSignal;
}

export interface AwaitOptions extends TicketOptions {
  /** Heartbeats while waiting; the caller decides how (or whether) to surface them. */
  readonly onProgress?: (progress: AwaitProgress) => void;
}

export const defaultAwaitMs = 30_000;

/** A heartbeat line without the `[cargo-hauler]` prefix, for progress channels that label the source themselves. */
export const progressMessage = (line: string): string =>
  line.replace(/^\[cargo-hauler\]\s*/u, '').trimEnd();

/**
 * Records cross from storage (ANSI kept) to a structured result here. Both
 * transports serialize the result to JSON — the CLI prints it, the MCP
 * server ships it as structured content — so the projection always strips:
 * an inherited FORCE_COLOR/CLICOLOR_FORCE must not leave ESC bytes to become
 * literal `\u001b[…` in the JSON.
 */
const requestForConsumer = (request: RequestRecord | null): RequestRecord | null =>
  request === null ? null : displayRequestRecord(request);

/**
 * A stopped daemon leaves the ledger as a ticket's only record, so a read
 * answers from it (a stranded run as orphaned) instead of failing.
 */
const fromLedgerWhenStopped = <A, B>(
  read: Effect.Effect<A, TicketSocketError>,
  ticket: string,
  config: DaemonConfigShape | undefined,
  answer: (request: DisplayRequestRecord | null) => B,
): Effect.Effect<A | B, TicketSocketError> =>
  read.pipe(
    Effect.catchTag('DaemonUnreachable', (error) =>
      daemonIsAbsent(error.cause)
        ? loadLedgerTicket(ticket, 'stopped', config).pipe(Effect.map(answer))
        : Effect.fail(error),
    ),
  );

export const awaitTicketResult = async (
  input: TicketInput,
  options: AwaitOptions,
): Promise<AwaitResult> => {
  const waited = await runTicketEffect(
    fromLedgerWhenStopped(
      awaitTicketWithProgress(
        input.ticket,
        input.maxWaitMs ?? defaultAwaitMs,
        options.onProgress ?? (() => undefined),
        options.config,
      ).pipe(
        Effect.map(({ request, timedOut }) => ({
          daemon: 'running' as const,
          request: requestForConsumer(request),
          timedOut,
        })),
      ),
      input.ticket,
      options.config,
      (request) => ({ daemon: 'stopped' as const, request, timedOut: false }),
    ),
    options.signal,
  );
  return {
    daemon: waited.daemon,
    operation: 'await',
    request: waited.request,
    summary: waited.timedOut
      ? `${input.ticket} still pending`
      : describeRequestRecord(input.ticket, waited.request),
    ticket: input.ticket,
    timedOut: waited.timedOut,
  };
};

export const fetchTicketResult = async (
  input: Pick<TicketInput, 'ticket'>,
  options: TicketOptions,
): Promise<ResultFetchResult> => {
  const { daemon, request } = await runTicketEffect(
    fromLedgerWhenStopped(
      fetchTicket(input.ticket, options.config).pipe(
        Effect.map((record) => ({ daemon: 'running' as const, request: requestForConsumer(record) })),
      ),
      input.ticket,
      options.config,
      (found) => ({ daemon: 'stopped' as const, request: found }),
    ),
    options.signal,
  );
  return {
    daemon,
    operation: 'result',
    request,
    summary: describeRequestRecord(input.ticket, request),
    ticket: input.ticket,
  };
};

export interface TicketResultView {
  readonly result: ResultFetchResult;
  /** The ticket's on-disk output log as the document shows it; the JSON result carries only `outputPath`. */
  readonly output: TicketOutputModel;
}

/**
 * `hauler result` / `hauler_result`: the structured result plus the view of
 * the full output log — a pointer (path and size) by default, the log text
 * itself under `full`. The log stays out of the JSON result: a 64 MiB run
 * belongs in a file the agent can grep, not in structured content.
 */
export const fetchTicketResultView = async (
  input: ResultInput,
  options: TicketOptions,
): Promise<TicketResultView> => {
  const result = await fetchTicketResult(input, options);
  return { output: loadTicketOutput(result.request, input.full === true), result };
};

const acceptedKillSummary = (ticket: string, request: RequestRecord | null): string => {
  if (request === null) {
    return `${ticket} kill requested`;
  }
  switch (request.status) {
    case 'requested':
    case 'queued':
      return `${ticket} kill requested before it started; it settles killed`;
    case 'running':
      return `${ticket} kill requested; the daemon stops its cargo process and frees the lane`;
    case 'killed':
      if (request.attachedTo !== null) {
        return `${ticket} killed; detached from ${request.attachedTo}`;
      }
      return request.startedAtMs === null
        ? `${ticket} killed before it started; no cargo process ran`
        : `${ticket} killed`;
    case 'done':
    case 'failed':
    case 'denied':
    case 'passthrough':
      return `${ticket} kill requested; it settled ${request.status}`;
    default: {
      const exhaustive: never = request.status;
      return exhaustive;
    }
  }
};

export const killTicketResult = async (
  input: Pick<TicketInput, 'ticket'>,
  options: TicketOptions,
): Promise<KillResult> => {
  const killed = await runTicketEffect(killTicket(input.ticket, options.config), options.signal);
  const request = await runTicketEffect(fetchTicket(input.ticket, options.config), options.signal);
  return {
    killed,
    operation: 'kill',
    request: requestForConsumer(request),
    summary: killed
      ? acceptedKillSummary(input.ticket, request)
      : `${input.ticket}: nothing to kill (${request === null ? 'unknown ticket' : `already ${request.status}`})`,
    ticket: input.ticket,
  };
};

const formatWait = (ms: number): string => {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return seconds >= 90 ? `~${Math.round(seconds / 60)}m` : `~${seconds}s`;
};

/**
 * Where the ticket landed, so a reorder is visible on the acknowledgement
 * itself: `queued behind cc-3281 (~13m)`, `waiting for cc-3281`, or
 * `attached to cc-3281` (issue #45).
 */
export const describeSubmitPlacement = (ack: BackgroundSubmitAck): string | null => {
  if (ack.attachedTo !== undefined) {
    return `attached to ${ack.attachedTo}`;
  }
  if (ack.waitingFor !== undefined && ack.waitingFor.length > 0) {
    return `waiting for ${ack.waitingFor.join(', ')}`;
  }
  if (ack.ahead !== undefined && ack.ahead.length > 0) {
    const wait = ack.waitEtaMs === undefined || ack.waitEtaMs <= 0 ? '' : ` (${formatWait(ack.waitEtaMs)})`;
    return `queued behind ${ack.ahead.join(', ')}${wait}`;
  }
  return null;
};

export const submitTicketRequest = async (
  input: RequestInput,
  requestContext: TicketRequestContext,
  options: TicketOptions,
): Promise<RequestSubmitResult> => {
  const request = enrichTicketRequest(input, requestContext);
  const attribution = ticketAttribution(request, requestContext);
  const ack = await runTicketEffect(
    submitBackgroundAck(request, options.config),
    options.signal,
  );
  if (ack === null) {
    return {
      attribution,
      operation: 'request',
      summary: 'failed to submit background request',
      ticket: null,
    };
  }
  const placement = describeSubmitPlacement(ack);
  return {
    attribution,
    operation: 'request',
    ...(ack.ahead === undefined
      ? {}
      : {
          queue: {
            ahead: [...ack.ahead],
            position: ack.position,
            ...(ack.waitEtaMs === undefined ? {} : { waitEtaMs: ack.waitEtaMs }),
          },
        }),
    summary: `${ack.ticket} submitted${placement === null ? '' : `, ${placement}`}${ack.warning === undefined ? '' : `\n${ack.warning}`}`,
    ticket: ack.ticket,
    ...(ack.waitingFor === undefined ? {} : { waitingFor: [...ack.waitingFor] }),
  };
};
