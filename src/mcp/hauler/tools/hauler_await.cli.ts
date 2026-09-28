import type { CliProjectionConfig } from 'agent-bundle/routes';

import type { inputSchema } from './hauler_await.js';

export const config = {
  command: ['await'],
  description: 'Long-poll a ticket until it finishes or the wait expires.',
  flags: {
    ticket: { description: 'Ticket id, e.g. cc-123' },
    maxWaitMs: {
      description:
        'Wait budget in milliseconds (default 60000, max 7200000); call again on timeout',
    },
  },
  positionals: ['ticket'],
} satisfies CliProjectionConfig<typeof inputSchema>;
