import { agent } from '@agent-bundle/runtime';
import type { ToolConfig, ToolRouteProps } from 'agent-bundle';
import React from 'react';

import { ResultDocument } from '../../../internal/ui/documents/documents.js';
import { surfaceNames } from '../../../internal/ui/documents/surface.js';
import { resultFetchResultSchema, resultInputSchema } from '../../../internal/contracts/tool-schemas.js';
import { requestDaemonConfig } from '../../../internal/operations/request-config.js';
import { fetchTicketResultView } from '../../../internal/operations/tickets.js';

export const config = {
  annotations: { readOnlyHint: true },
  description:
    'Fetch one cargo-hauler ticket. Running tickets include a live output-tail snapshot; terminal tickets include the durable ledger result and the path of the full output log. Pass full: true to read that whole log (every test failure and panic section) instead of re-running the command.',
  title: 'Hauler ticket result',
} satisfies ToolConfig;

export const inputSchema = resultInputSchema;
export const resultSchema = resultFetchResultSchema;

export default async function HaulerResult({ input, signal }: ToolRouteProps<typeof inputSchema>) {
  const context = await agent();
  const view = await fetchTicketResultView(input, { config: requestDaemonConfig(context), signal });
  return (
    <ResultDocument names={surfaceNames(context)} nowMs={Date.now()} output={view.output} result={view.result} />
  );
}
