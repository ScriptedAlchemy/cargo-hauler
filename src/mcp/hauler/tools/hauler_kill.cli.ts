import type { CliProjectionConfig } from 'agent-bundle/routes';

import type { inputSchema } from './hauler_kill.js';

export const config = {
  command: ['kill'],
  confirm: false,
  description:
    'Stop a ticket: drop it from the queue or terminate its cargo process, freeing the lane for the requests behind it.',
  flags: { ticket: { description: 'Ticket id, e.g. cc-123' } },
  positionals: ['ticket'],
} satisfies CliProjectionConfig<typeof inputSchema>;
