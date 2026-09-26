import { defineTool } from 'agent-bundle/routes';
import React from 'react';

import { ResultDocument } from '../../../internal/ui/documents/documents.js';
import { surfaceNames } from '../../../internal/ui/documents/surface.js';
import { resultFetchResultSchema, resultInputSchema } from '../../../internal/contracts/tool-schemas.js';
import { requestDaemonConfig } from '../../../internal/operations/request-config.js';
import { fetchTicketResultView } from '../../../internal/operations/tickets.js';

export const inputSchema = resultInputSchema;
export const resultSchema = resultFetchResultSchema;

export default defineTool(
  {
    annotations: { readOnlyHint: true },
    description:
      'Fetch one cargo-hauler ticket. A running ticket includes a snapshot of its live output tail. A terminal ticket includes the durable ledger result and the path of the full output log. Pass `full: true` to read that log instead of rerunning the command. A log over 768 KiB returns its last 768 KiB, where the test failures and panic sections are.',
    inputJsonSchema: {
      additionalProperties: false,
      properties: {
        full: {
          description: 'Render the on-disk output log instead of the stored tail. A log over 768 KiB renders its last 768 KiB.',
          type: 'boolean',
        },
        ticket: { type: 'string' },
      },
      required: ['ticket'],
      type: 'object',
    },
    inputSchema,
    resultSchema,
    title: 'Hauler ticket result',
  },
  async (input, context) => {
    const view = await fetchTicketResultView(input, {
      config: await requestDaemonConfig(context),
      signal: context.signal,
    });
    return (
      <ResultDocument names={surfaceNames(context)} nowMs={Date.now()} output={view.output} result={view.result} />
    );
  },
);
