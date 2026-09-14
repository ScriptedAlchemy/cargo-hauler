import { isForwardedEnvironmentVariable } from '../cargo/env.js';

/**
 * The caller environment shipped to the daemon: everything the caller's
 * shell exported except hauler-internal `CARGO_HAULER_*` settings and make
 * jobserver flags that name the caller's file descriptors. The daemon lays
 * it over its own environment when it spawns cargo. Request identity hashes
 * this same set, so two requests that differ in a forwarded variable (an
 * `OUT` path, a `build.rs` knob) never share a leader (#222).
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
