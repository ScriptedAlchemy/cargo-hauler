import type { CliProjectionConfig } from 'agent-bundle/routes';

import type { inputSchema } from './hauler_result.js';

export const config = {
  command: ['result'],
  description:
    'Read a stored ticket result (running tickets include a live output tail); --full prints the whole on-disk output log.',
  flags: {
    ticket: { description: 'Ticket id, e.g. cc-123' },
    full: { description: 'Print the whole on-disk output log (<stateDir>/tickets/<ticket>.log) instead of the tail' },
  },
  positionals: ['ticket'],
} satisfies CliProjectionConfig<typeof inputSchema>;
