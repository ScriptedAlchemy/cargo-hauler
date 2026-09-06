import type { CliProjectionConfig } from 'agent-bundle/routes';

import type { inputSchema } from './hauler_await.js';

export const config = {
  command: ['await'],
  description: 'Long-poll a ticket until it finishes or the wait expires.',
  flags: {
    ticket: { description: 'Ticket id, e.g. cc-123' },
    maxWaitMs: {
      description:
        'Give up after this many milliseconds (default 30000, ceiling 7200000 — the daemon\'s 2 h await ceiling); call again to keep waiting',
    },
  },
  positionals: ['ticket'],
} satisfies CliProjectionConfig<typeof inputSchema>;
