import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'effect-rstest';

const installer = fileURLToPath(new URL('../../dist/bin/cargo-hauler-install.js', import.meta.url));

const shimText = (node: string, hauler: string, cargo: string): string => `#!/bin/sh
# cargo-hauler PATH shim — forwards cargo to the broker.
# Installed by \`hauler install-shim\`. Hooks cannot see cargo inside scripts.
if [ -n "\${CARGO_HAULER_INSIDE:-}" ]; then
  exec ${cargo} "$@"
fi
# Re-run \`hauler install-shim --force\` after an upgrade moves the hauler entry.
[ -f ${hauler} ] || exec ${cargo} "$@"
exec ${node} ${hauler} exec --host shim -- ${cargo} "$@"
`;

describe('cargo-hauler-install and the PATH cargo shim', () => {
  let root: string;
  let shim: string;
  let oldNode: string;
  let oldHauler: string;
  let newHauler: string;
  let env: Record<string, string>;

  const run = (...argv: string[]) => {
    const result = spawnSync(process.execPath, [installer, ...argv], { encoding: 'utf8', env });
    return { code: result.status, stderr: result.stderr };
  };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'hauler-installer-shim-'));
    const shimDir = join(root, 'shim');
    const newBin = join(root, 'new', 'bin');
    oldNode = join(root, 'node-22', 'bin', 'node');
    oldHauler = join(root, 'node-22', 'lib', 'node_modules', 'cargo-hauler', 'dist', 'bin', 'hauler.js');
    newHauler = join(root, 'node-24', 'lib', 'node_modules', 'cargo-hauler', 'dist', 'bin', 'hauler.js');
    for (const dir of [shimDir, newBin, dirname(oldNode), dirname(oldHauler), dirname(newHauler), join(root, 'home', '.cursor'), join(root, 'state')]) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(oldNode, '', { mode: 0o755 });
    writeFileSync(oldHauler, '#!/usr/bin/env node\n');
    writeFileSync(newHauler, '#!/usr/bin/env node\n');
    symlinkSync(newHauler, join(newBin, 'hauler'));
    newHauler = realpathSync(newHauler);
    shim = join(shimDir, 'cargo');
    writeFileSync(shim, shimText(oldNode, oldHauler, '/opt/rust/bin/cargo'), { mode: 0o755 });
    env = {
      CARGO_HAULER_KACHE_INDEX: '',
      CARGO_HAULER_STATE_DIR: join(root, 'state'),
      HOME: join(root, 'home'),
      PATH: [shimDir, newBin, dirname(process.execPath), '/usr/bin', '/bin'].join(':'),
    };
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('install refreshes a shim that embeds an older hauler, and a second install leaves the same bytes', () => {
    const first = run('install', 'cursor');
    expect(first.code).toBe(0);
    expect(first.stderr).toBe(
      `Refreshed cargo shim ${shim}: it ran ${oldNode} ${oldHauler}; it now runs ${process.execPath} ${newHauler}.\n`,
    );
    const refreshed = readFileSync(shim, 'utf8');
    expect(refreshed).toBe(shimText(process.execPath, newHauler, '/opt/rust/bin/cargo'));

    const second = run('install', 'cursor');
    expect(second).toEqual({ code: 0, stderr: '' });
    expect(readFileSync(shim, 'utf8')).toBe(refreshed);
  });

  it('doctor fails on a shim that embeds another hauler or a missing one, and passes once refreshed', () => {
    expect(run('doctor', '--host', 'cursor')).toEqual({
      code: 1,
      stderr: `error: cargo shim ${shim} runs ${oldNode} ${oldHauler}, not the current ${process.execPath} ${newHauler}. \`cargo-hauler-install install <host>\` refreshes it.\n`,
    });

    rmSync(oldHauler);
    expect(run('doctor', '--host', 'cursor')).toEqual({
      code: 1,
      stderr: `error: cargo shim ${shim} runs ${oldHauler}, which no longer exists, so cargo does not reach the broker. \`cargo-hauler-install install <host>\` refreshes it.\n`,
    });

    expect(run('install', 'cursor').code).toBe(0);
    expect(run('doctor', '--host', 'cursor')).toEqual({ code: 0, stderr: '' });
  });
});
