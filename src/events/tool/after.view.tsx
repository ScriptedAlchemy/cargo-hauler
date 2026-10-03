import { Agent } from '@agent-bundle/runtime';
import type { AgentEventRouteProps } from 'agent-bundle';
import React from 'react';

import { decisionValue } from '../../internal/host-hooks/event-support.js';
import { isRecord } from '../../internal/util/guards.js';

export default function AfterShellTool({ renderInput }: AgentEventRouteProps<'tool/after'>) {
  const additionalContext =
    isRecord(renderInput) && typeof renderInput.additionalContext === 'string'
      ? renderInput.additionalContext
      : undefined;
  return (
    <Agent.Result value={decisionValue({ outcome: 'continue' })}>
      {additionalContext === undefined ? null : <Agent.Context>{additionalContext}</Agent.Context>}
    </Agent.Result>
  );
}
