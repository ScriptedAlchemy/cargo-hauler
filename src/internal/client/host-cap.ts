import type { EstimateSource } from '../contracts/protocol.js';

/**
 * Host shell-tool timeouts mined from the tracedecay corpus (Claude hard-kills
 * around 10 minutes; 106 of those kills landed on still-running cargo).
 * Auto-background fires when the priors-based ETA exceeds the cap so the
 * agent keeps working instead of being killed mid-build.
 */
const capsMs: Readonly<Record<string, number>> = {
  claude: 9 * 60_000,
  codex: 10 * 60_000,
  cursor: 14 * 60_000,
};

const defaultCapMs = capsMs.claude;

/**
 * `EX_TEMPFAIL`: a synchronous request that was converted to a background
 * ticket has not run yet, so `cargo build && ./target/debug/x` must not
 * continue as if it had succeeded. Explicit `--bg` requests keep exit 0.
 */
export const autoBackgroundExitCode = 75;

export const hostShellCapMs = (host: string | undefined): number =>
  capsMs[host ?? ''] ?? defaultCapMs;

/**
 * The PATH shim has no agent identity of its own (`--host shim`), so it
 * borrows the cap of the host named by `CARGO_HAULER_HOST` when the operator
 * exported one. Hook rewrites already carry the real host and are never
 * overridden.
 */
export const shellCapHost = (
  host: string | undefined,
  env: Readonly<Record<string, string | undefined>>,
): string | undefined => (host === 'shim' ? (env.CARGO_HAULER_HOST ?? host) : host);

export interface AutoBackgroundRequest {
  /** The `--host` on the request, before `CARGO_HAULER_HOST` substitution. */
  readonly requestHost?: string;
  readonly stdoutIsTty?: boolean;
  /** `CARGO_HAULER_SHIM_BACKGROUND` is on: restore auto-background for the PATH shim. */
  readonly shimBackground?: boolean;
}

/**
 * Only a measured estimate (EWMA of past runs, or kache priors) can trip the
 * cap. A `default` prior is a cold-start placeholder that says "unknown", and
 * an unknown duration must run in the foreground: backgrounding on it
 * reported compile errors on sub-second builds as exit 0 (#37).
 *
 * The PATH shim pretends to be cargo. Cargo never returns 75 before the
 * work is done, so a non-TTY shim caller (spawnSync, make, a script) stays
 * in the foreground until the ticket finishes (#223). An interactive shim
 * (stdout is a TTY) still auto-backgrounds on the cap; `CARGO_HAULER_SHIM_BACKGROUND`
 * restores that for scripts that consume tickets themselves.
 */
export const shouldAutoBackground = (
  estimateMs: number,
  host: string | undefined,
  source: EstimateSource,
  request: AutoBackgroundRequest = {},
): boolean => {
  if (source === 'default' || host === undefined) {
    return false;
  }
  if (
    request.requestHost === 'shim' &&
    request.stdoutIsTty !== true &&
    request.shimBackground !== true
  ) {
    return false;
  }
  return estimateMs > hostShellCapMs(host);
};
