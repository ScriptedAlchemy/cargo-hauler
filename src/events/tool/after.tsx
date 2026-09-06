import { Agent } from '@agent-bundle/runtime';
import type { AgentEventRouteConfig, AgentEventRouteProps } from 'agent-bundle';
import React from 'react';

import { handleAfterShell } from '../../hooks/after-shell.js';
import { decisionValue, shellEventFrom } from '../../lib/event-support.js';

export const config = {
  // The portable playground target defines no hooks; events ship with the plugin hosts.
  targets: ['claude', 'codex', 'cursor'],
  providers: [],
  runtime: 'standalone',
  timeoutMs: 10_000,
  tools: ['shell'],
} satisfies AgentEventRouteConfig;

export { default as preflight } from './after.preflight.js';

/** The telemetry record for a cargo/hauler command and the finished-ticket context, after the preflight ping. */
export default async function AfterShellTool({ canonical }: AgentEventRouteProps<'tool/after'>) {
  const { host, nativeEvent } = canonical.provenance;
  const result = await handleAfterShell(shellEventFrom(canonical.payload), { nativeEvent, target: host });
  return (
    <Agent.Result value={decisionValue(result)}>
      {result.additionalContext === undefined ? null : <Agent.Context>{result.additionalContext}</Agent.Context>}
    </Agent.Result>
  );
}
