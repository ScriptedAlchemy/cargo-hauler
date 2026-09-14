import { Agent, agent } from '@agent-bundle/runtime';
import type { AgentEventRouteProps } from 'agent-bundle';
import React from 'react';

import { handleBeforeShell } from '../../internal/host-hooks/before-shell.js';
import { haulerArgvForRoot } from '../../internal/platform/hauler-binding.js';
import { decisionValue, shellEventFrom } from '../../internal/host-hooks/event-support.js';

/**
 * Rewrite cargo onto `hauler exec`, guard `cargo clean`, and record telemetry
 * after the cheap handler selects this view.
 */
export default async function BeforeShellTool({ canonical, signal }: AgentEventRouteProps<'tool/before'>) {
  const { host, nativeEvent } = canonical.provenance;
  const result = await handleBeforeShell(shellEventFrom(canonical.payload), { nativeEvent, target: host }, {
    signal,
    resolveHaulerArgv: async () => {
      const { plugin } = await agent();
      if (plugin.state !== 'available') throw new Error('plugin binding unavailable');
      return haulerArgvForRoot(plugin.value.root);
    },
  });
  return (
    <Agent.Result value={decisionValue(result)}>
      {result.additionalContext === undefined ? null : <Agent.Context>{result.additionalContext}</Agent.Context>}
    </Agent.Result>
  );
}
