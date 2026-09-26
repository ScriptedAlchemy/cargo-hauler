import { Agent, useAgent } from '@agent-bundle/runtime';
import React from 'react';

import { lineageLine, lineageModel } from './view-models.js';

/**
 * The shell footer names the conversation this document was rendered for.
 * It is a synchronous component, so it reads the request through
 * `useAgent()`, the same handle `await agent()` returns under the same lease.
 * It stays silent when the host cannot place the request in a conversation
 * tree (bare stdio, routed CLI, rendered scripts) rather than print a guess.
 */
export const LineageFooter = () => {
  const request = useAgent();
  const lineage = lineageModel(request.lineage);
  if (lineage === null) {
    return null;
  }
  // Attribution precedence belongs to `ticketAttribution`. An explicit or
  // native session wins over the lineage conversation, so this footer only
  // places the request. The RequestDocument's `attribution` says what a
  // ticket was recorded under.
  return <Agent.Context>{`Requested by ${lineageLine(lineage)}.`}</Agent.Context>;
};
