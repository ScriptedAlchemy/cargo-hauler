import type { CliProjectionConfig } from 'agent-bundle/routes';

import type { inputSchema } from './hauler_last.js';

export const config = {
  command: ['last'],
  description: 'Show the most recent hauler request with its output tail and outcome.',
} satisfies CliProjectionConfig<typeof inputSchema>;
