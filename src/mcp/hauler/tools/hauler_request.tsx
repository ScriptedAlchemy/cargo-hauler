import { defineTool } from 'agent-bundle/routes';
import React from 'react';

import { RequestDocument } from '../../../internal/ui/documents/documents.js';
import { surfaceNames } from '../../../internal/ui/documents/surface.js';
import { lineageModel } from '../../../internal/ui/documents/view-models.js';
import { requestInputSchema, requestResultSchema } from '../../../internal/contracts/tool-schemas.js';
import { requestDaemonConfig } from '../../../internal/operations/request-config.js';
import { submitTicketRequest } from '../../../internal/operations/tickets.js';

export const inputSchema = requestInputSchema;
export const resultSchema = requestResultSchema;

export default defineTool(
  {
    annotations: { readOnlyHint: false },
    description:
      'Submit a background cargo request and return a durable ticket id. The tool infers host and session from the request, and uses the calling conversation when the host provides lineage. Explicit fields override the inferred attribution.',
    inputJsonSchema: {
      additionalProperties: false,
      properties: {
        after: {
          description: 'Tickets (cc-N) that must finish before this request starts. The request fails if any of them fails or is killed.',
          items: { type: 'string' },
          type: 'array',
        },
        argv: { items: { type: 'string' }, type: 'array' },
        cwd: { type: 'string' },
        host: { type: 'string' },
        session: { type: 'string' },
      },
      required: ['argv'],
      type: 'object',
    },
    inputSchema,
    resultSchema,
    title: 'Submit background cargo request',
  },
  async (input, context) => {
    const submitted = await submitTicketRequest(input, context, {
      config: await requestDaemonConfig(context),
      signal: context.signal,
    });
    return (
      <RequestDocument
        argv={input.argv}
        lineage={lineageModel(context.lineage)}
        names={surfaceNames(context)}
        result={submitted}
      />
    );
  },
);
