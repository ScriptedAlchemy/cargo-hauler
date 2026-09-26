/**
 * The pre-parse test the cheap `tool/before` and `tool/after` handlers apply
 * before anything heavy loads. It asks whether the shell command names
 * `cargo` or `hauler` as a token. Boundaries are any character outside
 * `[A-Za-z0-9_]`, so `cargo-hauler`, `~/.cargo/bin/cargo`, `cargo.exe`,
 * `./scripts/cargo-wrapper`, and `echo cargo` all match while `mycargo` and
 * `CARGO_HOME=/x ls` do not. The match is case-insensitive, so `Cargo.toml`
 * matches. A false positive costs one parse of the command in-process, and a
 * false negative would let a cargo invocation bypass the hauler, so the test
 * errs toward matching.
 *
 * This is a superset of the check `before-shell.ts` itself applies
 * (`command.includes('cargo')`). Every command the rewrite could govern, and
 * every command `after-shell.ts` records, mentions one of these tokens.
 */
const haulerToken = /(?:^|[^A-Za-z0-9_])(?:cargo|hauler)(?![A-Za-z0-9_])/iu;

/** True when the command mentions cargo or hauler as a token; `undefined` and `''` never do. */
export const commandMentionsHauler = (command: string | undefined): boolean =>
  command !== undefined && command.length > 0 && haulerToken.test(command);

/**
 * Cargo's own status lines, right-aligned to twelve columns: `   Compiling
 * foo v0.1.0`, `    Finished \`test\` profile …`, `     Running unittests`,
 * `   Doc-tests foo`. Found in a shell tool's captured output for a command
 * that never named cargo, they mean cargo ran through a wrapper script, an
 * alias, or a shell variable. Neither the rewrite nor the PATH shim sees that
 * shape, and an absolute toolchain path skips the shim.
 */
const cargoStatusLine =
  /^(?: {3}Compiling| {4}Checking| {4}Finished| {5}Running| {3}Doc-tests| Documenting| {4}Blocking) \S/mu;

/**
 * Commands whose output is a file they were asked to show. A saved cargo log
 * read back with one of these looks exactly like a live run.
 * ponytail: first-word check only; `cd x && tail log` still trips it. Widen
 * to every pipeline stage if that shows up in the hook log.
 */
const fileReaders = new Set(['awk', 'bat', 'cat', 'grep', 'head', 'less', 'more', 'rg', 'sed', 'tac', 'tail']);

const readsFile = (command: string): boolean => {
  const first = command.trimStart().split(/\s+/u, 1)[0] ?? '';
  return fileReaders.has(first.slice(first.lastIndexOf('/') + 1));
};

/**
 * True when the command names neither cargo nor hauler, is not a file reader,
 * and its output carries cargo status lines. Cargo ran, and nothing brokered
 * it. `undefined` output never does.
 */
export const hiddenCargoRun = (command: string | undefined, output: string | undefined): boolean =>
  command !== undefined &&
  output !== undefined &&
  !commandMentionsHauler(command) &&
  !readsFile(command) &&
  cargoStatusLine.test(output);
