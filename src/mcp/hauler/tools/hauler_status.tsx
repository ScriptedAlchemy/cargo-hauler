import { defineTool } from 'agent-bundle/routes';
import React from 'react';

import { StatusDocument } from '../../../internal/ui/documents/documents.js';
import { surfaceNames } from '../../../internal/ui/documents/surface.js';
import { loadStatusResult } from '../../../internal/operations/inspection.js';
import { statusInputSchema, statusResultSchema } from '../../../internal/contracts/tool-schemas.js';
import { requestDaemonConfig } from '../../../internal/operations/request-config.js';
import { hasStatusFilters } from '../../../internal/operations/status-filter.js';

export const inputSchema = statusInputSchema;
export const resultSchema = statusResultSchema;

export default defineTool(
  {
    annotations: { readOnlyHint: true },
    description:
      'Show cargo-hauler queue and in-flight work as text. Filter by cwd, session, laneKey, tickets, statuses, or commandContains instead of piping CLI JSON through jq. Rows are bounded summaries: no output tail, only a short outputPreview (last 8 lines) on running rows; read one ticket with hauler_result for its whole live tail. To open the visual dashboard (MCP App) call hauler_dashboard.',
    inputJsonSchema: {
      additionalProperties: false,
      properties: {
        commandContains: { type: 'string' },
        cwd: { type: 'string' },
        laneKey: { type: 'string' },
        limit: { type: 'number' },
        session: { type: 'string' },
        statuses: {
          description:
            'Filter by projected status, where stopped-daemon active rows appear as orphaned and running matches nothing',
          items: {
            enum: ['requested', 'queued', 'running', 'done', 'failed', 'killed', 'denied', 'passthrough', 'orphaned'],
            type: 'string',
          },
          type: 'array',
        },
        tickets: { items: { type: 'string' }, type: 'array' },
      },
      type: 'object',
    },
    inputSchema,
    resultSchema,
    title: 'Hauler status',
  },
  async (input, context) => {
    const status = await loadStatusResult(input, {
      config: await requestDaemonConfig(context),
      signal: context.signal,
    });
    return (
      <StatusDocument
        filtered={hasStatusFilters(input)}
        names={surfaceNames(context)}
        nowMs={Date.now()}
        result={status}
      />
    );
  },
);
