import { fileURLToPath } from 'node:url';

import { formatDoctorReport, runInstallCli, type DoctorReport } from 'agent-bundle/install';
import { version } from 'agent-bundle/meta';

import { globalHaulerArgv, haulerEntryLocation } from './internal/shim/entry-location.js';
import {
  cargoHaulerVersion,
  cargoShimState,
  findCargoShim,
  refreshCargoShim,
  type CargoShimState,
  type InstalledShim,
} from './internal/shim/install.js';
import { isRecord } from './internal/util/guards.js';

type Diagnostic = DoctorReport['diagnostics'][number];
type DriftedShim = Exclude<CargoShimState, { readonly kind: 'current' }>;

const cli = { from: fileURLToPath(new URL('..', import.meta.url)), name: 'cargo-hauler-install' };

/**
 * The PATH shim embeds an absolute node and hauler, so an upgrade leaves it
 * on an old client that falls back to passthrough against a newer daemon.
 */
const driftedShim = (): { readonly shim: InstalledShim; readonly state: DriftedShim } | null => {
  const shim = findCargoShim();
  if (shim === null) {
    return null;
  }
  const state = cargoShimState(shim, version);
  return state.kind === 'current' ? null : { shim, state };
};

const shimDiagnostic = (path: string, state: DriftedShim): Diagnostic => {
  const rest = { recovery: '`cargo-hauler-install install <host>` refreshes it.', severity: 'error', target: 'cargo-shim' } as const;
  switch (state.kind) {
    case 'missing':
      return {
        code: 'HAULER-SHIM-MISSING',
        message: `cargo shim ${path} runs ${state.path}, which is missing or not executable, so cargo does not reach the broker.`,
        ...rest,
      };
    case 'stale':
      return {
        code: 'HAULER-SHIM-STALE',
        message: `cargo shim ${path} runs ${state.entry} from ${state.version === null ? 'an unknown cargo-hauler version' : `cargo-hauler ${state.version}`}, not ${version}.`,
        ...rest,
      };
    default: {
      const exhaustive: never = state;
      throw new Error(`unhandled cargo shim state: ${JSON.stringify(exhaustive)}`);
    }
  }
};

/** What `hauler install-shim` would embed, unless that is another version; then this package's own hauler. */
const refreshTarget = (): readonly string[] => {
  const own = fileURLToPath(new URL('./hauler.js', import.meta.url));
  const onPath = globalHaulerArgv(haulerEntryLocation(own));
  return cargoHaulerVersion(onPath[1] ?? '') === version ? onPath : [process.execPath, own];
};

const refreshShim = (): number => {
  const drifted = driftedShim();
  if (drifted === null) {
    return 0;
  }
  const { shim } = drifted;
  try {
    const haulerArgv = refreshTarget();
    refreshCargoShim(shim, haulerArgv);
    process.stderr.write(
      `Refreshed cargo shim ${shim.path}: it ran ${shim.haulerArgv.join(' ')}; it now runs ${haulerArgv.join(' ')}.\n`,
    );
    return 0;
  } catch (error) {
    process.stderr.write(
      `error: could not refresh cargo shim ${shim.path}: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 1;
  }
};

const parseDoctorReport = (text: string): DoctorReport | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  return isRecord(parsed) && Array.isArray(parsed.diagnostics) && isRecord(parsed.summary)
    ? (parsed as unknown as DoctorReport)
    : null;
};

/**
 * agent-bundle's doctor takes no extra checks, so this runs it in JSON mode,
 * adds the shim finding to that report, and prints the report in the format
 * the caller asked for. The summary and exit code then agree with the output.
 */
const doctor = async (argv: readonly string[]): Promise<number> => {
  const json = argv.includes('--json');
  let output = '';
  const code = await runInstallCli(json ? argv : [...argv, '--json'], {
    ...cli,
    stdout: (text) => {
      output += text;
    },
  });
  const report = parseDoctorReport(output);
  const drifted = report === null ? null : driftedShim();
  if (report === null || drifted === null) {
    process.stdout.write(report === null || json ? output : formatDoctorReport(report));
    return code;
  }
  const withShim: DoctorReport = {
    ...report,
    diagnostics: [...report.diagnostics, shimDiagnostic(drifted.shim.path, drifted.state)],
    summary: { ...report.summary, errors: report.summary.errors + 1 },
  };
  process.stdout.write(json ? `${JSON.stringify(withShim)}\n` : formatDoctorReport(withShim));
  return 1;
};

export const main = async (argv: readonly string[]): Promise<number> => {
  const [command] = argv;
  if (command === 'doctor') {
    return doctor(argv);
  }
  const code = await runInstallCli(argv, cli);
  return command === 'install' && code === 0 && !argv.includes('--help') && !argv.includes('-h')
    ? refreshShim()
    : code;
};
