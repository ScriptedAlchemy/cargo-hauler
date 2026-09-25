import { appResourceUri, defineTool } from 'agent-bundle/routes';
import React from 'react';

import { DashboardDocument } from '../../../internal/ui/documents/documents.js';
import { surfaceNames } from '../../../internal/ui/documents/surface.js';
import { loadStatusResult } from '../../../internal/operations/inspection.js';
import { limitInputSchema, statusResultSchema } from '../../../internal/contracts/tool-schemas.js';
import { requestDaemonConfig } from '../../../internal/operations/request-config.js';

export const inputSchema = limitInputSchema;
export const resultSchema = statusResultSchema;

/**
 * The one tool that carries the MCP App: hosts that render MCP Apps open the
 * dashboard beside this result, populated from the same status payload the
 * App later polls through `hauler_status`. The text result is deliberately
 * one summary line, so opening the dashboard does not also paste the whole
 * status document into the model's context; `hauler_status` is the text form.
 */
export default defineTool(
  {
    _meta: { ui: { resourceUri: appResourceUri('dashboard') } },
    annotations: { readOnlyHint: true },
    description:
      'Open the live cargo-hauler dashboard (an MCP App) beside the conversation: contention and admission, lanes, in-flight and queued work, metrics windows, kache, and per-ticket live output. Returns one summary line, not the status text; call hauler_status for the queue as Markdown.',
    inputJsonSchema: { type: 'object', additionalProperties: false, properties: { limit: { type: 'number' } } },
    inputSchema,
    resultSchema,
    title: 'Hauler dashboard',
  },
  async (input, context) => {
    const status = await loadStatusResult(input, {
      config: await requestDaemonConfig(context),
      signal: context.signal,
    });
    return <DashboardDocument names={surfaceNames(context)} result={status} />;
  },
);
