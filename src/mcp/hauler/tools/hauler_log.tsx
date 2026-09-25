import { defineTool } from 'agent-bundle/routes';
import React from 'react';

import { LogStream } from '../../../internal/ui/documents/streaming.js';
import { surfaceNames } from '../../../internal/ui/documents/surface.js';
import { loadLogResult } from '../../../internal/operations/inspection.js';
import { limitInputSchema, logResultSchema } from '../../../internal/contracts/tool-schemas.js';
import { requestDaemonConfig } from '../../../internal/operations/request-config.js';

export const inputSchema = limitInputSchema.default({});
export const resultSchema = logResultSchema;

export default defineTool(
  {
    annotations: { readOnlyHint: true },
    description: 'List recent cargo-hauler requests from the ledger, newest first.',
    inputJsonSchema: {
      additionalProperties: false,
      properties: { limit: { type: 'number' } },
      type: 'object',
    },
    inputSchema,
    resultSchema,
    title: 'Hauler log',
  },
  async (input, context) => (
    <LogStream
      loading={loadLogResult(input, { config: await requestDaemonConfig(context), signal: context.signal })}
      names={surfaceNames(context)}
    />
  ),
);
