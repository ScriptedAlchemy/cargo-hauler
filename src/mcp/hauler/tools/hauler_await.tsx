import { defineTool } from 'agent-bundle/routes';
import React from 'react';

import { AwaitStream } from '../../../internal/ui/documents/streaming.js';
import { surfaceNames } from '../../../internal/ui/documents/surface.js';
import { awaitResultSchema, ticketInputSchema } from '../../../internal/contracts/tool-schemas.js';
import { requestDaemonConfig } from '../../../internal/operations/request-config.js';
import { awaitTicketResult, defaultAwaitMs, fetchTicketResult, progressMessage } from '../../../internal/operations/tickets.js';

export const inputSchema = ticketInputSchema;
export const resultSchema = awaitResultSchema;

export default defineTool(
  {
    annotations: { readOnlyHint: true },
    description:
      'Long-poll a cargo-hauler ticket until it finishes or the wait expires. maxWaitMs defaults to 30000 and is capped at 7200000, the daemon\'s 2 h await ceiling. Call again to keep waiting. A host with its own per-call deadline, such as Codex\'s tool_timeout_sec, still limits each call. The document streams the live ticket card first and the settled result second. While the wait runs, progress notifications report queue position, elapsed time, and the cost estimate.',
    inputJsonSchema: {
      additionalProperties: false,
      properties: {
        maxWaitMs: { type: 'number' },
        ticket: { type: 'string' },
      },
      required: ['ticket'],
      type: 'object',
    },
    inputSchema,
    // The daemon's 2 h await ceiling (`awaitCeilingMs`) plus a minute for the
    // snapshot fetch before the wait and the socket round trip after it. Route
    // config is read statically, so this is a literal, and
    // `tests/unit/contracts/await-budget.test.ts` keeps the two in step. The
    // host's own tool-call deadline still applies.
    render: { maxElapsedMs: 7_260_000 },
    resultSchema,
    title: 'Await hauler ticket',
  },
  async (input, context) => {
    const { signal } = context;
    const daemonConfig = await requestDaemonConfig(context);
    const maxWaitMs = input.maxWaitMs ?? defaultAwaitMs;
    const startedAt = Date.now();
    const snapshot = await fetchTicketResult(input, { config: daemonConfig, signal });
    const awaited = awaitTicketResult({ ...input, maxWaitMs }, {
      config: daemonConfig,
      // Progress is best-effort. A host that cannot deliver a notification
      // must not fail the wait.
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
  },
);
