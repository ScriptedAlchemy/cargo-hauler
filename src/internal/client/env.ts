import { isForwardedEnvironmentVariable } from '../cargo/env.js';

/**
 * The caller environment shipped to the daemon: everything the caller's
 * shell exported except hauler-internal `CARGO_HAULER_*` settings and make
 * jobserver flags that name the caller's file descriptors. The daemon lays
 * it over its own environment when it spawns cargo.
 */
export const buildTransportedEnv = (
  env: Readonly<Record<string, string | undefined>>,
): Record<string, string> => {
  const transported: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined || !isForwardedEnvironmentVariable(key, value)) {
      continue;
    }
    transported[key] = value;
  }
  return transported;
};
