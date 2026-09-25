import { defineTool } from 'agent-bundle/routes';
import React from 'react';
import { z } from 'zod';

import { LastDocument } from '../../../internal/ui/documents/documents.js';
import { surfaceNames } from '../../../internal/ui/documents/surface.js';
import { loadLastResult } from '../../../internal/operations/inspection.js';
import { lastResultSchema } from '../../../internal/contracts/tool-schemas.js';
import { requestDaemonConfig } from '../../../internal/operations/request-config.js';

export const inputSchema = z.object({}).strict();
export const resultSchema = lastResultSchema;

export default defineTool(
  {
    annotations: { readOnlyHint: true },
    description: 'Show the most recent cargo-hauler request with its output tail and outcome.',
    // Declared empty so `hauler last` compiles to a flagless command instead of
    // the implicit `--input <json>` a tool without input metadata receives.
    inputJsonSchema: { type: 'object', additionalProperties: false, properties: {} },
    inputSchema,
    resultSchema,
    title: 'Hauler last request',
  },
  async (_input, context) => {
    const last = await loadLastResult({ config: await requestDaemonConfig(context), signal: context.signal });
    return <LastDocument names={surfaceNames(context)} nowMs={Date.now()} result={last} />;
  },
);
