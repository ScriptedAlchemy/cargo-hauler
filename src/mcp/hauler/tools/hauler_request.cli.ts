import type { CliProjectionConfig } from 'agent-bundle/routes';
import type { z } from 'zod';

import { parseTicketList } from '../../../client/parse.js';

import type { inputSchema } from './hauler_request.js';

/** `hauler request [--after cc-N] -- cargo check -p foo`: the cargo command as positionals. */
export const config = {
  command: ['request'],
  confirm: false,
  description:
    'Submit a background cargo request and print its ticket: hauler request [--after cc-N] -- cargo check -p foo',
  flags: {
    argv: { description: 'The cargo command, after --' },
    after: {
      description:
        'Tickets that must finish first (repeatable, or comma-separated); the request fails if one of them fails or is killed',
    },
    cwd: { description: 'Workspace directory (default: current directory)', required: false },
    host: { description: 'Agent host name for attribution' },
    session: { description: 'Agent session id for attribution' },
  },
  positionals: ['argv'],
} satisfies CliProjectionConfig<typeof inputSchema>;

type CliInput = z.input<typeof inputSchema>;

/** Comma-separated `--after` lists split; request context resolves an omitted cwd. */
export const mapInput = (input: CliInput): z.input<typeof inputSchema> => {
  const after = input.after === undefined ? [] : [...parseTicketList(input.after)];
  return {
    ...input,
    ...(after.length === 0 ? {} : { after }),
  };
};
