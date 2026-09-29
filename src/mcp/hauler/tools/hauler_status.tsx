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
      'Show the cargo-hauler queue and in-flight work as text. Filters run before the recent-row limit and include only relevant lanes and blockers. Filter by cwd, session, laneKey, tickets, statuses, or commandContains. Set metrics to include daemon-wide telemetry, independent of filters. Rows have no output tail; a running row carries a short outputPreview of its last 8 lines. Call hauler_result for the whole live tail or hauler_dashboard for the visual dashboard.',
    inputJsonSchema: {
      additionalProperties: false,
      properties: {
        commandContains: { type: 'string' },
        cwd: { type: 'string' },
        laneKey: { type: 'string' },
        limit: { type: 'number' },
        metrics: { type: 'boolean', description: 'Include daemon-wide metrics, savings, kache, and system telemetry, independent of filters.' },
        session: { type: 'string' },
        statuses: {
          description:
            'Filter by projected status. While the daemon is stopped, active rows appear as orphaned and running matches nothing.',
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
