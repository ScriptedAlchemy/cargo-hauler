import type { CliProjectionConfig } from 'agent-bundle/routes';

import type { inputSchema } from './hauler_result.js';

export const config = {
  command: ['result'],
  description:
    'Read a stored ticket result. A running ticket includes its live output tail. With --full, print the on-disk output log, or its last 768 KiB when the log is larger.',
  flags: {
    ticket: { description: 'Ticket id, e.g. cc-123' },
    full: {
      description: 'Print the on-disk output log (<stateDir>/tickets/<ticket>.log) instead of the tail. A log over 768 KiB prints its last 768 KiB.',
    },
  },
  positionals: ['ticket'],
} satisfies CliProjectionConfig<typeof inputSchema>;
