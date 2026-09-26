import { Agent } from '@agent-bundle/runtime';
import type { AgentEventRouteConfig, AgentEventRouteProps } from 'agent-bundle';
import React from 'react';

import { handleStopHold } from '../internal/host-hooks/stop-hold.js';
import { decisionValue } from '../internal/host-hooks/event-support.js';

// Stop-hold may block for its bounded wait, so it runs standalone and does
// not occupy the shared MCP runtime.
export const config = {
  requires: ['events.stop.deny'],
  runtime: 'standalone',
  timeoutMs: 900_000,
} satisfies AgentEventRouteConfig;

export default async function StopHold({ canonical }: AgentEventRouteProps<'stop'>) {
  // `reentry` is the canonical reading of Claude/Codex `stop_hook_active` and
  // Cursor `loop_count > 0` (agent-bundle#466).
  const result = await handleStopHold({
    sessionId: canonical.payload.sessionId?.value,
    stopHookActive: canonical.payload.reentry?.value,
  });
  // Stop routes ignore Context nodes; the deny reason is the only channel.
  return <Agent.Result value={decisionValue(result)} />;
}
