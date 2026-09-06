import { describe, expect, it } from 'effect-rstest';

import { commandMentionsHauler, hiddenCargoRun } from '../src/hooks/tokens.js';

/**
 * The pre-parse test both shell hook entries apply before anything heavy
 * loads. A miss is the dangerous direction (an un-intercepted cargo command
 * bypasses the hauler), so every spelling the rewrite can govern must match;
 * a false positive only costs one in-process parse.
 */
describe('commandMentionsHauler', () => {
  it.each([
    ['cargo test', true],
    ['cd x && cargo build', true],
    ['cargo-hauler status', true],
    ['./scripts/cargo-wrapper build', true],
    ['echo cargo', true],
    ['RUSTFLAGS=-Dwarnings cargo check', true],
    ['CARGO_TARGET_DIR=/tmp/t cargo build', true],
    ['hauler status', true],
    ['hauler exec --session s --host claude -- cargo check', true],
    ['~/.cargo/bin/cargo test -p foo', true],
    ['/usr/bin/cargo.exe build', true],
    ['timeout 600 cargo nextest run', true],
    ['cat Cargo.toml', true],
    ['git commit -m "cargo"', true],
    ['cargo', true],
    ['ls -la', false],
    ['git status && pnpm test', false],
    ['CARGO_HOME=/opt/cargo_home ls', false],
    ['mycargo build', false],
    ['echo hauler_status', false],
    ['', false],
    [undefined, false],
  ])('%j → %s', (command, expected) => {
    expect(commandMentionsHauler(command)).toBe(expected);
  });

  it('matches a token on any line of a multi-line command', () => {
    expect(commandMentionsHauler('set -e\nnpm test\ncargo test -p foo\n')).toBe(true);
    expect(commandMentionsHauler('set -e\nnpm test\nls -la\n')).toBe(false);
  });

  it('is a superset of the substring test before-shell applies itself', () => {
    // Every command the rewrite can govern names a word ending in `cargo`
    // (`inspect.ts`), so a token match here is at least as inclusive.
    for (const command of ['cargo build', 'a/cargo build', 'env -u X cargo build', 'while ! cargo build; do :; done']) {
      expect(command.includes('cargo')).toBe(true);
      expect(commandMentionsHauler(command)).toBe(true);
    }
  });
});

/**
 * The output-side test the `tool/after` preflight applies: cargo's status
 * lines in the output of a command that never named cargo mean a wrapper
 * script, alias, or shell variable ran it past the hook and the PATH shim. A
 * command that shows a file (a saved cargo log) is not a run.
 */
describe('hiddenCargoRun', () => {
  const cargoOutput = [
    '   Compiling foo v0.1.0 (/ws/foo)',
    '    Finished `test` profile [unoptimized + debuginfo] target(s) in 3.20s',
    '     Running unittests src/lib.rs (target/debug/deps/foo-1a2b)',
  ].join('\n');

  it.each([
    ['/tmp/scratch/cg.sh test -p foo 2>&1 | tail -30', cargoOutput, true],
    ['"$CG" test -p foo', cargoOutput, true],
    // `$CARGO` already mentions cargo (case-insensitive token), so it took the
    // full before/after path and is recorded there; not hidden.
    ['$CARGO test -p foo', cargoOutput, false],
    ['./build.sh', '    Checking foo v0.1.0', true],
    ['nohup bash -c ./verify.sh', '   Doc-tests foo', true],
    ['cargo test -p foo', cargoOutput, false],
    ['hauler result cc-7 --full', cargoOutput, false],
    ['tail -30 build.log', cargoOutput, false],
    ['/usr/bin/cat build.log', cargoOutput, false],
    ['grep -n Finished build.log', cargoOutput, false],
    ['./build.sh', 'ok', false],
    ['./build.sh', 'Compiling without cargo indentation', false],
    ['./build.sh', 'Running: npm test', false],
    ['./build.sh', undefined, false],
    [undefined, cargoOutput, false],
  ])('%j with %j → %s', (command, output, expected) => {
    expect(hiddenCargoRun(command, output)).toBe(expected);
  });
});
