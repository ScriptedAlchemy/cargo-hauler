import type { CliRouteConfig, CliRouteProps } from 'agent-bundle';
import { z } from 'zod';

import { daemonExitCode, runDaemonControl } from '../internal/daemon/runtime/lifecycle.js';
import { daemonResultSchema } from '../internal/contracts/tool-schemas.js';

export const config = {
  description:
    'Control the hauler daemon. The subcommands run it in the foreground, start it detached, stop it, restart it (stop, wait for exit, start), or report its status.',
  exitCode: 'result',
  inputJsonSchema: {
    additionalProperties: false,
    properties: {
      subcommand: { enum: ['run', 'start', 'stop', 'status', 'restart'], type: 'string' },
    },
    required: ['subcommand'],
    type: 'object',
  },
  positionals: ['subcommand'],
} satisfies CliRouteConfig;

export const inputSchema = z.object({
  subcommand: z.enum(['run', 'start', 'stop', 'status', 'restart']),
});

export const resultSchema = daemonResultSchema.extend({
  exitCode: z.number().int().min(0).max(255),
});

export default async function Daemon({ input }: CliRouteProps<typeof inputSchema>) {
  const result = await runDaemonControl(input.subcommand);
  return { ...result, exitCode: daemonExitCode(result) };
}
