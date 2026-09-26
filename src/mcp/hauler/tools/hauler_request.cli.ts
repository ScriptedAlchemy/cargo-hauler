import type { CliProjectionConfig } from 'agent-bundle/routes';
import type { z } from 'zod';

import { parseTicketList } from '../../../internal/client/parse.js';
import { environmentAttribution } from '../../../internal/operations/attribution.js';

import type { inputSchema } from './hauler_request.js';

export const config = {
  command: ['request'],
  confirm: false,
  description:
    'Submit a background cargo request and print its ticket, for example with hauler request [--after cc-N] -- cargo check -p foo',
  flags: {
    argv: { description: 'The cargo command, after --' },
    after: {
      description:
        'Tickets that must finish first. Repeat the flag or separate the ids with commas. The request fails if one of them fails or is killed.',
    },
    cwd: { description: 'Workspace directory (defaults to the current directory)', required: false },
    host: { description: 'Agent host name for attribution' },
    session: { description: 'Agent session id for attribution' },
  },
  positionals: ['argv'],
} satisfies CliProjectionConfig<typeof inputSchema>;

type CliInput = z.input<typeof inputSchema>;

/**
 * Splits comma-separated `--after` lists. The caller's shell environment
 * attributes an omitted host or session, and request context resolves an
 * omitted cwd.
 */
export const mapInput = (input: CliInput): z.input<typeof inputSchema> => {
  const after = input.after === undefined ? [] : [...parseTicketList(input.after)];
  return {
    ...environmentAttribution(process.env),
    ...input,
    ...(after.length === 0 ? {} : { after }),
  };
};
