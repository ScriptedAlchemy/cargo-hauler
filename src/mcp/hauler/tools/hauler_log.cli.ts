import type { CliProjectionConfig } from 'agent-bundle/routes';

import type { inputSchema } from './hauler_log.js';

export const config = {
  command: ['log'],
  description: 'List recent hauler requests from the ledger, newest first.',
  flags: { limit: { description: 'Rows to show' } },
} satisfies CliProjectionConfig<typeof inputSchema>;
