import { agent } from '@agent-bundle/runtime';
import type { ToolConfig, ToolRouteProps } from 'agent-bundle';
import React from 'react';

import { AwaitStream } from '../../../internal/ui/documents/streaming.js';
import { surfaceNames } from '../../../internal/ui/documents/surface.js';
import { awaitResultSchema, ticketInputSchema } from '../../../internal/contracts/tool-schemas.js';
import { requestDaemonConfig } from '../../../internal/operations/request-config.js';
import { awaitTicketResult, defaultAwaitMs, fetchTicketResult, progressMessage } from '../../../internal/operations/tickets.js';

export const config = {
  annotations: { readOnlyHint: true },
  description:
    'Long-poll a cargo-hauler ticket until it finishes or the wait expires (maxWaitMs default 30000, ceiling 7200000 — the daemon\'s 2 h await ceiling; call again to keep waiting; a host with its own per-call deadline, such as Codex\'s tool_timeout_sec, still bounds one call). The document streams: the live ticket card first, then the settled result; progress notifications carry queue position, elapsed time, and the cost estimate while waiting.',
  // The daemon's 2 h await ceiling (`awaitCeilingMs`) plus a minute for the
  // snapshot fetch before the wait and the socket round trip after it — a
  // literal, as route config is read statically; `tests/unit/contracts/await-budget.test.ts`
  // holds the two together. The host's own tool-call deadline still applies.
  render: { maxElapsedMs: 7_260_000 },
  title: 'Await hauler ticket',
} satisfies ToolConfig;

export const inputSchema = ticketInputSchema;
export const resultSchema = awaitResultSchema;

export default async function HaulerAwait({ input, signal }: ToolRouteProps<typeof inputSchema>) {
  const context = await agent();
  const daemonConfig = requestDaemonConfig(context);
  const maxWaitMs = input.maxWaitMs ?? defaultAwaitMs;
  const startedAt = Date.now();
  // The shell frame: the ticket as it is right now, before the wait blocks.
  const snapshot = await fetchTicketResult(input, { config: daemonConfig, signal });
  const awaited = awaitTicketResult({ ...input, maxWaitMs }, {
    config: daemonConfig,
    // Heartbeats become MCP progress notifications. Progress is best-effort:
    // a host that cannot deliver it must not fail the wait.
    onProgress: ({ line }) => {
      void context.progress
        .report({
          completed: Math.min(maxWaitMs, Date.now() - startedAt),
          message: progressMessage(line),
          total: maxWaitMs,
        })
        .catch(() => undefined);
    },
    signal,
  });
  // The settled component awaits this promise; the no-op handler only keeps a
  // rejection that lands before render attaches from surfacing as unhandled.
  awaited.catch(() => undefined);
  return (
    <AwaitStream
      awaited={awaited}
      maxWaitMs={maxWaitMs}
      names={surfaceNames(context)}
      nowMs={startedAt}
      snapshot={snapshot.request}
      ticket={input.ticket}
    />
  );
}
