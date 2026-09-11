import { agent } from '@agent-bundle/runtime';
import type { ToolConfig, ToolRouteProps } from 'agent-bundle';
import React from 'react';

import { RequestDocument } from '../../../internal/ui/documents/documents.js';
import { surfaceNames } from '../../../internal/ui/documents/surface.js';
import { lineageModel } from '../../../internal/ui/documents/view-models.js';
import { requestInputSchema, requestResultSchema } from '../../../internal/contracts/tool-schemas.js';
import { requestDaemonConfig } from '../../../internal/operations/request-config.js';
import { submitTicketRequest } from '../../../internal/operations/tickets.js';

export const config = {
  annotations: { readOnlyHint: false },
  description:
    'Submit a background cargo request and return a durable ticket id. Host and session are inferred from the request (the calling conversation when the host provides lineage); explicit fields override inferred attribution.',
  title: 'Submit background cargo request',
} satisfies ToolConfig;

export const inputSchema = requestInputSchema;
export const resultSchema = requestResultSchema;

export default async function HaulerRequest({ input, signal }: ToolRouteProps<typeof inputSchema>) {
  const context = await agent();
  const submitted = await submitTicketRequest(input, context, {
    config: requestDaemonConfig(context),
    signal,
  });
  return (
    <RequestDocument
      argv={input.argv}
      lineage={lineageModel(context.lineage)}
      names={surfaceNames(context)}
      result={submitted}
    />
  );
}
