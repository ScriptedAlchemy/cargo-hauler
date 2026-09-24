const exactEnvironmentNames = new Set([
  'AR',
  'CC',
  'CFLAGS',
  'CXX',
  'CXXFLAGS',
  'LDFLAGS',
  'PKG_CONFIG_PATH',
]);

const haulerPrefix = 'CARGO_HAULER_';

const jobserverFlagNames = new Set(['CARGO_MAKEFLAGS', 'MAKEFLAGS', 'MFLAGS']);

const targetToolPattern =
  /^(?:AR|CC|CFLAGS|CXX|CXXFLAGS|LDFLAGS)_[A-Za-z0-9_-]+$/u;

/**
 * A GNU make jobserver handed down through file descriptors
 * (`--jobserver-auth=R,W`, or the pre-4.4 `--jobserver-fds=R,W`) names
 * descriptors open in the caller, not in the daemon. Only the FIFO form
 * (`--jobserver-auth=fifo:PATH`) is a path another process can open.
 */
const carriesDescriptorJobserver = (value: string): boolean =>
  /--jobserver-fds=/u.test(value) || /--jobserver-auth=(?!fifo:)/u.test(value);

/**
 * Daemon and hook settings. They configure the broker itself and never ride
 * along with a request: a caller's `CARGO_HAULER_STATE_DIR` must not retarget
 * the daemon-spawned cargo, and none of them affect what cargo builds.
 */
export const isHaulerInternalEnvironmentVariable = (name: string): boolean =>
  name.startsWith(haulerPrefix);

/**
 * Variables the daemon-spawned cargo actually sees: everything except
 * hauler-internal settings and make jobserver flags that name the caller's
 * file descriptors (those would skip the daemon's shared FIFO).
 */
export const isForwardedEnvironmentVariable = (name: string, value: string): boolean =>
  !isHaulerInternalEnvironmentVariable(name) &&
  !(jobserverFlagNames.has(name) && carriesDescriptorJobserver(value));

const shellBookkeepingNames = new Set(['OLDPWD', 'PWD', 'SHLVL', '_']);

/**
 * Forwarded variables that decide request identity. The shell rewrites its
 * bookkeeping (`OLDPWD`, `SHLVL`, mise's `__MISE_*` session state) on every
 * tool call, so hashing it would give every request a fresh identity and no
 * run could ever be shared; `cwd` already carries what `PWD` would.
 */
export const isIdentityEnvironmentVariable = (name: string, value: string): boolean =>
  isForwardedEnvironmentVariable(name, value) &&
  !shellBookkeepingNames.has(name) &&
  !name.startsWith('__MISE_');

/**
 * The variables that participate in the *compile surface* (coverage, target
 * dir, toolchain). Request *identity* additionally hashes every forwarded
 * variable `isIdentityEnvironmentVariable` keeps: a `build.rs` or test may
 * read `OUT`, `SCHEMA_OUT`, and friends (#222).
 */
export const isRelevantCargoEnvironmentVariable = (name: string): boolean =>
  !isHaulerInternalEnvironmentVariable(name) &&
  (exactEnvironmentNames.has(name) ||
    name.startsWith('CARGO_') ||
    name.startsWith('RUST') ||
    targetToolPattern.test(name));
