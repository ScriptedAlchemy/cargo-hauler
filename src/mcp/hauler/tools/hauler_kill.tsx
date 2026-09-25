import { defineTool } from 'agent-bundle/routes';
import React from 'react';
import { z } from 'zod';

import { KillDocument } from '../../../internal/ui/documents/documents.js';
import { surfaceNames } from '../../../internal/ui/documents/surface.js';
import { killResultSchema } from '../../../internal/contracts/tool-schemas.js';
import { requestDaemonConfig } from '../../../internal/operations/request-config.js';
import { killTicketResult } from '../../../internal/operations/tickets.js';

export const inputSchema = z.object({
  ticket: z.string().min(1).describe('Ticket id, e.g. cc-123'),
});
export const resultSchema = killResultSchema;

export default defineTool(
  {
    annotations: { destructiveHint: true, idempotentHint: true },
    description:
      'Stop a cargo-hauler ticket: a queued request is dropped, a running one has its cargo process terminated (SIGTERM, then SIGKILL after the grace period) and its lane freed. Use this instead of killing cargo PIDs — the daemon settles riders and the ledger. Returns killed: false when the ticket is unknown or already finished.',
    inputJsonSchema: {
      additionalProperties: false,
      properties: { ticket: { description: 'Ticket id, e.g. cc-123', type: 'string' } },
      required: ['ticket'],
      type: 'object',
    },
    inputSchema,
    resultSchema,
    title: 'Kill hauler ticket',
  },
  async (input, context) => {
    const result = await killTicketResult(input, {
      config: await requestDaemonConfig(context),
      signal: context.signal,
    });
    return <KillDocument names={surfaceNames(context)} nowMs={Date.now()} result={result} />;
  },
);
