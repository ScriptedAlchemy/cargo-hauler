import { Agent } from '@agent-bundle/runtime';
import type { AgentEventRouteProps } from 'agent-bundle';
import React from 'react';

import { handleAfterShell } from '../../internal/host-hooks/after-shell.js';
import { finishedTicketsFromRenderInput } from '../../internal/host-hooks/session-ping.js';
import { decisionValue, shellEventFrom } from '../../internal/host-hooks/event-support.js';

/** Record cargo telemetry and render any finished-ticket context selected by the handler. */
export default async function AfterShellTool({
  canonical,
  renderInput,
}: AgentEventRouteProps<'tool/after'>) {
  const { host, nativeEvent } = canonical.provenance;
  const event = shellEventFrom(canonical.payload);
  const announcement = finishedTicketsFromRenderInput(renderInput);
  const result = await handleAfterShell(
    announcement === undefined
      ? event
      : { ...event, finishedAsOfMs: announcement.asOfMs, finishedTickets: announcement.tickets },
    { nativeEvent, target: host },
  );
  return (
    <Agent.Result value={decisionValue(result)}>
      {result.additionalContext === undefined ? null : <Agent.Context>{result.additionalContext}</Agent.Context>}
    </Agent.Result>
  );
}
