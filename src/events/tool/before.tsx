import { Agent } from '@agent-bundle/runtime';
import type { AgentEventRouteConfig, AgentEventRouteProps } from 'agent-bundle';
import React from 'react';

import { handleBeforeShell } from '../../hooks/before-shell.js';
import { decisionValue, shellEventFrom } from '../../lib/event-support.js';

export const config = {
  requires: ['events.toolBefore.deny'],
  // The route reads the daemon itself (`probeActiveBuilds`); no provider probe.
  providers: [],
  runtime: 'standalone',
  timeoutMs: 10_000,
  tools: ['shell'],
} satisfies AgentEventRouteConfig;

export { default as preflight } from './before.preflight.js';

/**
 * The rewrite onto `hauler exec`, the `cargo clean` guard, and the telemetry
 * record, for the commands the preflight let through. `allow` approves a
 * fully brokered rewrite so the host never prompts for it; a rewrite beside
 * an ungoverned segment is `continue` + `updatedInput`, decided by the host.
 */
export default async function BeforeShellTool({ canonical }: AgentEventRouteProps<'tool/before'>) {
  const { host, nativeEvent } = canonical.provenance;
  const result = await handleBeforeShell(shellEventFrom(canonical.payload), { nativeEvent, target: host });
  return (
    <Agent.Result value={decisionValue(result)}>
      {result.additionalContext === undefined ? null : <Agent.Context>{result.additionalContext}</Agent.Context>}
    </Agent.Result>
  );
}
