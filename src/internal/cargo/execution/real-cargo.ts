import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import type * as ChildProcess from 'effect/unstable/process/ChildProcess';

/**
 * The real cargo binary for daemon-spawned work. Never resolve bare `cargo`
 * through PATH here: once the hauler shim is installed it sits first on
 * PATH, and a daemon that launches the shim submits work back to itself.
 *
 * `CARGO_HAULER_CARGO_BIN` is the explicit override. The per-job env is
 * consulted first (the test harness routes jobs at its fake cargo that way),
 * then the daemon's own environment: clients strip every `CARGO_HAULER_*`
 * from what they transport, so the operator's setting only ever reaches
 * cargo through the daemon process (#55).
 */
export const realCargoBin = (
  env: Readonly<Record<string, string | undefined>> = process.env,
): string => {
  const override = env.CARGO_HAULER_CARGO_BIN ?? process.env.CARGO_HAULER_CARGO_BIN;
  if (override !== undefined && override.length > 0) {
    return override;
  }
  const cargoHome = env.CARGO_HOME ?? join(homedir(), '.cargo');
  const candidate = join(cargoHome, 'bin', 'cargo');
  return existsSync(candidate) ? candidate : 'cargo';
};

const defaultKillGraceMs = 8_000;

/**
 * SIGTERM to the process group, then SIGKILL after `CARGO_HAULER_KILL_GRACE_MS`.
 * The scope finalizer that runs on daemon shutdown or a timeout reads these
 * from the command's own options, so `ChildProcess.make` needs them as well as
 * `kill`. Without `forceKillAfter` it waits forever on a cargo that ignores
 * SIGTERM.
 */
export const cargoKillOptions = (
  env: Readonly<Record<string, string | undefined>> = process.env,
): ChildProcess.KillOptions => {
  const parsed = Number.parseInt(
    env.CARGO_HAULER_KILL_GRACE_MS ?? process.env.CARGO_HAULER_KILL_GRACE_MS ?? '',
    10,
  );
  return {
    killSignal: 'SIGTERM',
    forceKillAfter: Number.isInteger(parsed) && parsed >= 0 ? parsed : defaultKillGraceMs,
  };
};
