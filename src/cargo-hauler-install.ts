import { fileURLToPath } from 'node:url';

import { runInstallCli } from 'agent-bundle/install';

export const main = (argv: readonly string[]): Promise<number> =>
  runInstallCli(argv, {
    from: fileURLToPath(new URL('..', import.meta.url)),
    name: 'cargo-hauler-install',
  });
