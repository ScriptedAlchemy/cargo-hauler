import type { CliProjectionConfig } from 'agent-bundle/routes';

import type { inputSchema } from './hauler_kill.js';

export const config = {
  command: ['kill'],
  confirm: false,
  description:
    'Stop a ticket. The daemon drops a queued ticket from the queue or terminates a running ticket\'s cargo process, which frees the lane for the requests behind it.',
  flags: { ticket: { description: 'Ticket id, e.g. cc-123' } },
  positionals: ['ticket'],
} satisfies CliProjectionConfig<typeof inputSchema>;
