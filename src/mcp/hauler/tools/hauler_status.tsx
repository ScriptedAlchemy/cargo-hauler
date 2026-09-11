import { agent } from '@agent-bundle/runtime';
import type { ToolConfig, ToolRouteProps } from 'agent-bundle';
import React from 'react';

import { StatusDocument } from '../../../internal/ui/documents/documents.js';
import { surfaceNames } from '../../../internal/ui/documents/surface.js';
import { loadStatusResult } from '../../../internal/operations/inspection.js';
import { statusInputSchema, statusResultSchema } from '../../../internal/contracts/tool-schemas.js';
import { requestDaemonConfig } from '../../../internal/operations/request-config.js';
import { hasStatusFilters } from '../../../internal/operations/status-filter.js';

export const config = {
  annotations: { readOnlyHint: true },
  description:
    'Show cargo-hauler queue and in-flight work as text. Filter by cwd, session, laneKey, tickets, statuses, or commandContains instead of piping CLI JSON through jq. Rows are bounded summaries: no output tail, only a short outputPreview (last 8 lines) on running rows; read one ticket with hauler_result for its whole live tail. To open the visual dashboard (MCP App) call hauler_dashboard.',
  title: 'Hauler status',
} satisfies ToolConfig;

export const inputSchema = statusInputSchema;
export const resultSchema = statusResultSchema;

export default async function HaulerStatus({ input, signal }: ToolRouteProps<typeof inputSchema>) {
  const context = await agent();
  const status = await loadStatusResult(input, { config: requestDaemonConfig(context), signal });
  return (
    <StatusDocument
      filtered={hasStatusFilters(input)}
      names={surfaceNames(context)}
      nowMs={Date.now()}
      result={status}
    />
  );
}
