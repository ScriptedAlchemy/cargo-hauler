import { Agent, agent } from '@agent-bundle/runtime';
import type { AgentEventRouteConfig, AgentEventRouteProps } from 'agent-bundle';
import React from 'react';

import { daemonBadgeModel } from '../../internal/ui/documents/view-models.js';
import { probeDaemonHealth } from '../../internal/operations/daemon-health.js';
import { decisionValue } from '../../internal/host-hooks/event-support.js';
import { requestDaemonConfig } from '../../internal/operations/request-config.js';

/**
 * Session start tells the new session what the hauler daemon looks like right
 * now, so the agent makes its first cargo decision with the fleet state in
 * view instead of a `ps` probe. The route is standalone and short. A session
 * must never wait on the shared MCP runtime to begin, and the probe reports a
 * saturated daemon within its budget rather than delaying the session.
 */
export const config = {
  requires: ['events.sessionStart.context'],
  // The route probes within its own budget; ordinary rendered routes do not.
  runtime: 'standalone',
  timeoutMs: 5_000,
} satisfies AgentEventRouteConfig;

const notice = (model: ReturnType<typeof daemonBadgeModel>): string => {
  switch (model.state) {
    case 'running':
      return `cargo-hauler ${model.headline}: ${model.detail ?? ''}. Before you run cargo, check \`hauler status --session <id>\` (or the hauler_status tool with its session field). Attach to in-flight work instead of starting a duplicate. Never kill cargo by PID. \`hauler kill cc-N\` stops a stuck ticket through the broker.`;
    case 'stopped':
      return `cargo-hauler ${model.headline} (${model.detail ?? 'no detail'}). The daemon starts on demand with the first brokered cargo command, and the hooks route cargo through it.`;
    case 'unresponsive':
      return `cargo-hauler ${model.headline}: ${model.detail ?? ''}. Treat the machine as saturated. Prefer \`hauler status\` (or the hauler_status tool) to new builds until the daemon answers.`;
    case 'unreachable':
      return `cargo-hauler ${model.headline}: ${model.detail ?? ''}. Cargo still runs because the hooks fail open, but the hauler brokers nothing until it can open the socket.`;
    default: {
      const exhaustive: never = model.state;
      return exhaustive;
    }
  }
};

export default async function SessionStart({ signal }: AgentEventRouteProps) {
  const context = await agent();
  const health = await probeDaemonHealth(await requestDaemonConfig(context), { signal });
  return (
    <Agent.Result value={decisionValue({ outcome: 'continue' })}>
      <Agent.Context>{notice(daemonBadgeModel(health, Date.now()))}</Agent.Context>
    </Agent.Result>
  );
}
