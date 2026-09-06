import type { CliProjectionConfig } from 'agent-bundle/routes';

import type { inputSchema } from './hauler_status.js';

/** `hauler status`: the tool's canonical keys under the CLI's flag spellings. */
export const config = {
  command: ['status'],
  description: 'Show the queue, in-flight cargo work, lanes, and admission state.',
  flags: {
    commandContains: { description: 'Only commands containing this text' },
    cwd: { description: 'Only requests from this workspace' },
    laneKey: { description: 'Only requests in this lane key', name: 'lane' },
    limit: { description: 'Recent rows to show' },
    session: { description: 'Only requests from this agent session' },
    statuses: { description: 'Only these statuses (repeatable)', name: 'status' },
    tickets: { description: 'Only these tickets (repeatable)', name: 'ticket' },
  },
} satisfies CliProjectionConfig<typeof inputSchema>;
