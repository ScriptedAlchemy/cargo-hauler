import { isRecord } from '../util/guards.js';

import { asFinishedTicket, finishedTicketsOf, type FinishedTicket } from './finished-ticket.js';
import { resolveHookSocketPath } from './paths.js';
import { requestOutcome } from './rpc.js';

/**
 * The bounded wait for the `session-completed` request. It is long enough
 * for a daemon busy fanning out builds and short enough that a stuck socket
 * cannot hold a tool call.
 */
export const defaultPingTimeoutMs = 500;

/**
 * What one session-completion ping learned. `finished` is the daemon's
 * answer (possibly empty). `unavailable` covers every way the answer did not
 * arrive, which is nothing listening (`unreachable`, with the errno so a caller can
 * tell `ECONNREFUSED` / `ENOENT` from the rest), no reply within the budget
 * (`timeout`), the daemon hanging up first (`closed`), or a reply that is not
 * a `session-completed-result` (`malformed`). A stale daemon that could not be
 * replaced is `replacement-failed`.
 */
export type SessionCompletedPing =
  | { readonly kind: 'finished'; readonly tickets: readonly FinishedTicket[] }
  | {
      readonly kind: 'unavailable';
      readonly reason: 'closed' | 'malformed' | 'replacement-failed' | 'timeout';
    }
  | { readonly kind: 'unavailable'; readonly reason: 'unreachable'; readonly code: string | null };

/** Tickets the `tool/after` handler handed the rendered view, or undefined when it did not ping. */
export const finishedTicketsFromRenderInput = (
  value: unknown,
): { readonly asOfMs?: number; readonly tickets: readonly FinishedTicket[] } | undefined => {
  if (!isRecord(value) || value.kind !== 'finished' || !Array.isArray(value.tickets)) {
    return undefined;
  }
  const tickets = value.tickets.flatMap((entry) => {
    const ticket = asFinishedTicket(entry);
    return ticket === null ? [] : [ticket];
  });
  return {
    tickets,
    ...(typeof value.asOfMs === 'number' ? { asOfMs: value.asOfMs } : {}),
  };
};

export interface SessionPingOptions {
  readonly socketPath?: string;
  readonly timeoutMs?: number;
}

/**
 * The smallest client of the daemon's `session-completed` request. It makes
 * one `net.connect` on the Unix socket, writes one NDJSON line, and reads the
 * first line back through `requestOutcome`, which loads no Effect runtime and
 * no shared `LineBuffer`. The `tool/after` handler runs this on every shell
 * call before deciding whether the rendered view needs to load at all. It
 * never throws and never writes to stdout or stderr. A daemon that is down or
 * slow is an `unavailable` value, not an error.
 *
 * The wire shape is exactly the one `listSessionCompleted` in `rpc.ts`
 * sends, so the wire sees one client whichever entry point built the message.
 */
export const pingSessionCompleted = async (
  session: string,
  sinceMs: number,
  options: SessionPingOptions = {},
): Promise<SessionCompletedPing> => {
  const outcome = await requestOutcome(
    { id: 'hook-completed', session, sinceMs, type: 'session-completed' },
    options.socketPath ?? resolveHookSocketPath(),
    options.timeoutMs ?? defaultPingTimeoutMs,
  );
  switch (outcome.kind) {
    case 'reply': {
      const tickets = finishedTicketsOf(outcome.message);
      return tickets === null ? { kind: 'unavailable', reason: 'malformed' } : { kind: 'finished', tickets };
    }
    case 'closed':
    case 'malformed':
    case 'timeout':
      return { kind: 'unavailable', reason: outcome.kind };
    case 'replacement-failed':
      return { kind: 'unavailable', reason: 'replacement-failed' };
    case 'unreachable':
      return { code: outcome.code ?? null, kind: 'unavailable', reason: 'unreachable' };
    default: {
      const exhaustive: never = outcome;
      return exhaustive;
    }
  }
};
