import { agent } from '@agent-bundle/runtime';
import type { ToolConfig, ToolRouteProps } from 'agent-bundle';
import React from 'react';

import { LogStream } from '../../../internal/ui/documents/streaming.js';
import { surfaceNames } from '../../../internal/ui/documents/surface.js';
import { loadLogResult } from '../../../internal/operations/inspection.js';
import { limitInputSchema, logResultSchema } from '../../../internal/contracts/tool-schemas.js';
import { requestDaemonConfig } from '../../../internal/operations/request-config.js';

export const config = {
  annotations: { readOnlyHint: true },
  description: 'List recent cargo-hauler requests from the ledger, newest first.',
  title: 'Hauler log',
} satisfies ToolConfig;

export const inputSchema = limitInputSchema;
export const resultSchema = logResultSchema;

export default async function HaulerLog({ input, signal }: ToolRouteProps<typeof inputSchema>) {
  const context = await agent();
  return (
    <LogStream
      loading={loadLogResult(input, { config: requestDaemonConfig(context), signal })}
      names={surfaceNames(context)}
    />
  );
}
