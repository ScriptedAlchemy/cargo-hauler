import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runInstallCli } from 'agent-bundle/install';

import { globalHaulerArgv, haulerEntryLocation } from './internal/shim/entry-location.js';
import { cargoShimState, findCargoShim, installCargoShim } from './internal/shim/install.js';

const refreshHint = '`cargo-hauler-install install <host>` refreshes it.';

/**
 * The PATH shim embeds an absolute hauler, so a Node or package upgrade leaves
 * it running the old one. `install` rewrites it to what `hauler install-shim`
 * would embed now; `doctor` reports the drift without changing anything.
 */
const reconcileCargoShim = (command: 'doctor' | 'install'): number => {
  const shim = findCargoShim();
  if (shim === null) {
    return 0;
  }
  const haulerArgv = globalHaulerArgv(
    haulerEntryLocation(fileURLToPath(new URL('./hauler.js', import.meta.url))),
  );
  const state = cargoShimState(shim, haulerArgv);
  if (state.kind === 'current') {
    return 0;
  }
  if (command === 'install') {
    installCargoShim({ destDir: dirname(shim.path), force: true, haulerArgv, realCargo: shim.realCargo });
    process.stderr.write(
      `Refreshed cargo shim ${shim.path}: it ran ${shim.haulerArgv.join(' ')}; it now runs ${haulerArgv.join(' ')}.\n`,
    );
    return 0;
  }
  switch (state.kind) {
    case 'missing':
      process.stderr.write(
        `error: cargo shim ${shim.path} runs ${state.path}, which no longer exists, so cargo does not reach the broker. ${refreshHint}\n`,
      );
      return 1;
    case 'stale':
      process.stderr.write(
        `error: cargo shim ${shim.path} runs ${shim.haulerArgv.join(' ')}, not the current ${haulerArgv.join(' ')}. ${refreshHint}\n`,
      );
      return 1;
    default: {
      const exhaustive: never = state;
      throw new Error(`unhandled cargo shim state: ${JSON.stringify(exhaustive)}`);
    }
  }
};

export const main = async (argv: readonly string[]): Promise<number> => {
  const code = await runInstallCli(argv, {
    from: fileURLToPath(new URL('..', import.meta.url)),
    name: 'cargo-hauler-install',
  });
  const [command] = argv;
  if (code === 2 || argv.includes('--help') || argv.includes('-h')) {
    return code;
  }
  if (command === 'install' && code === 0) {
    return reconcileCargoShim('install');
  }
  if (command === 'doctor') {
    return Math.max(code, reconcileCargoShim('doctor'));
  }
  return code;
};
