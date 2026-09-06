import { agent } from '@agent-bundle/runtime';
import type { ToolConfig, ToolRouteProps } from 'agent-bundle';
import React from 'react';
import { z } from 'zod';

import { LastDocument } from '../../../components/documents.js';
import { surfaceNames } from '../../../components/surface.js';
import { loadLastResult } from '../../../lib/inspect.js';
import { lastResultSchema } from '../../../lib/protocol-schemas.js';
import { requestDaemonConfig } from '../../../lib/request-config.js';

export const config = {
  annotations: { readOnlyHint: true },
  description: 'Show the most recent cargo-hauler request with its output tail and outcome.',
  title: 'Hauler last request',
} satisfies ToolConfig;

export const inputSchema = z.object({}).strict();
export const resultSchema = lastResultSchema;

export default async function HaulerLast({ signal }: ToolRouteProps<typeof inputSchema>) {
  const context = await agent();
  const last = await loadLastResult({ config: requestDaemonConfig(context), signal });
  return <LastDocument names={surfaceNames(context)} nowMs={Date.now()} result={last} />;
}
