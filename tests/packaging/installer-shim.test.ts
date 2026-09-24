import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { version } from 'agent-bundle/meta';
import { afterEach, beforeEach, describe, expect, it } from 'effect-rstest';

import { removeTestPath } from '../support/tmp-guard.js';

const installer = fileURLToPath(new URL('../../dist/bin/cargo-hauler-install.js', import.meta.url));

const shimText = (
  node: string,
  hauler: string,
  cargo: string,
  guard = `[ -x ${node} ] && [ -f ${hauler} ]`,
): string => `#!/bin/sh
# cargo-hauler PATH shim — forwards cargo to the broker.
# Installed by \`hauler install-shim\`. Hooks cannot see cargo inside scripts.
if [ -n "\${CARGO_HAULER_INSIDE:-}" ]; then
  exec ${cargo} "$@"
fi
# Re-run \`hauler install-shim --force\` after an upgrade moves the hauler entry.
${guard} || exec ${cargo} "$@"
exec ${node} ${hauler} exec --host shim -- ${cargo} "$@"
`;

const refreshHint = '`cargo-hauler-install install <host>` refreshes it.';

interface Report {
  readonly diagnostics: readonly { readonly code: string }[];
  readonly summary: { readonly errors: number };
}

describe('cargo-hauler-install and the PATH cargo shim', () => {
  let root: string;
  let shimDir: string;
  let shim: string;
  let oldNode: string;
  let oldHauler: string;
  let newHauler: string;
  let env: Record<string, string>;

  const run = (...argv: string[]) => {
    const result = spawnSync(process.execPath, [installer, ...argv], { encoding: 'utf8', env });
    return { code: result.status, stderr: result.stderr, stdout: result.stdout };
  };

  const doctor = () => {
    const result = run('doctor', '--host', 'cursor', '--json');
    const report = JSON.parse(result.stdout) as Report;
    return {
      code: result.code,
      errors: report.summary.errors,
      shim: report.diagnostics.filter((entry) => entry.code.startsWith('HAULER-SHIM')),
      stderr: result.stderr,
    };
  };

  const cargoHaulerPackage = (name: string, packageVersion: string): string => {
    const bin = join(root, name, 'lib', 'node_modules', 'cargo-hauler', 'dist', 'bin');
    mkdirSync(bin, { recursive: true });
    writeFileSync(join(bin, '..', 'package.json'), JSON.stringify({ name: 'cargo-hauler', version: packageVersion }));
    writeFileSync(join(bin, 'hauler.js'), '#!/usr/bin/env node\n');
    return join(bin, 'hauler.js');
  };

  const nodeBinary = (name: string): string => {
    const path = join(root, name, 'bin', 'node');
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, '', { mode: 0o755 });
    return path;
  };

  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'hauler-installer-shim-')));
    shimDir = join(root, 'shim');
    const newBin = join(root, 'new', 'bin');
    for (const dir of [shimDir, newBin, join(root, 'home', '.cursor'), join(root, 'state')]) {
      mkdirSync(dir, { recursive: true });
    }
    oldNode = nodeBinary('node-22');
    oldHauler = cargoHaulerPackage('node-22', '0.9.2');
    newHauler = cargoHaulerPackage('node-24', version);
    symlinkSync(newHauler, join(newBin, 'hauler'));
    shim = join(shimDir, 'cargo');
    writeFileSync(shim, shimText(oldNode, oldHauler, '/opt/rust/bin/cargo', `[ -f ${oldHauler} ]`), { mode: 0o755 });
    env = {
      CARGO_HAULER_KACHE_INDEX: '',
      CARGO_HAULER_STATE_DIR: join(root, 'state'),
      HOME: join(root, 'home'),
      PATH: [shimDir, newBin, dirname(process.execPath), '/usr/bin', '/bin'].join(':'),
    };
  });

  afterEach(() => {
    removeTestPath(root);
  });

  it('install refreshes a shim that embeds an older cargo-hauler, and a second install leaves the same bytes', () => {
    const first = run('install', 'cursor');
    expect(first.code).toBe(0);
    expect(first.stderr).toBe(
      `Refreshed cargo shim ${shim}: it ran ${oldNode} ${oldHauler}; it now runs ${process.execPath} ${newHauler}.\n`,
    );
    const refreshed = readFileSync(shim, 'utf8');
    expect(refreshed).toBe(shimText(process.execPath, newHauler, '/opt/rust/bin/cargo'));

    const second = run('install', 'cursor');
    expect([second.code, second.stderr]).toEqual([0, '']);
    expect(readFileSync(shim, 'utf8')).toBe(refreshed);
  });

  it('refreshes to its own hauler when the hauler on PATH is another version, so a second install is a no-op', () => {
    writeFileSync(join(dirname(newHauler), '..', 'package.json'), JSON.stringify({ name: 'cargo-hauler', version: '0.9.4' }));
    const own = realpathSync(fileURLToPath(new URL('../../dist/bin/hauler.js', import.meta.url)));

    expect(run('install', 'cursor').code).toBe(0);
    expect(readFileSync(shim, 'utf8')).toBe(shimText(process.execPath, own, '/opt/rust/bin/cargo'));
    expect(doctor()).toEqual({ code: 0, errors: 0, shim: [], stderr: '' });
    const second = run('install', 'cursor');
    expect([second.code, second.stderr]).toEqual([0, '']);
  });

  it('doctor reports a stale or missing shim as an error in its own report, and passes once refreshed', () => {
    expect(doctor()).toEqual({
      code: 1,
      errors: 1,
      shim: [
        {
          code: 'HAULER-SHIM-STALE',
          message: `cargo shim ${shim} runs ${oldHauler} from cargo-hauler 0.9.2, not ${version}.`,
          recovery: refreshHint,
          severity: 'error',
          target: 'cargo-shim',
        },
      ],
      stderr: '',
    });

    const text = run('doctor', '--host', 'cursor');
    expect(text.code).toBe(1);
    expect(text.stdout).toContain(
      `HAULER-SHIM-STALE: cargo shim ${shim} runs ${oldHauler} from cargo-hauler 0.9.2, not ${version}.\nRecovery: ${refreshHint}\n`,
    );
    expect(text.stdout).toMatch(/Doctor summary: 1 error\(s\)/u);

    chmodSync(oldNode, 0o644);
    expect(doctor().shim).toEqual([
      {
        code: 'HAULER-SHIM-MISSING',
        message: `cargo shim ${shim} runs ${oldNode}, which is missing or not executable, so cargo does not reach the broker.`,
        recovery: refreshHint,
        severity: 'error',
        target: 'cargo-shim',
      },
    ]);

    expect(run('install', 'cursor').code).toBe(0);
    expect(doctor()).toEqual({ code: 0, errors: 0, shim: [], stderr: '' });
  });

  it('treats a shim of the same cargo-hauler version under another working node as current', () => {
    const sameVersion = cargoHaulerPackage('checkout', version);
    const current = shimText(oldNode, sameVersion, '/opt/rust/bin/cargo');
    writeFileSync(shim, current);

    expect(doctor()).toEqual({ code: 0, errors: 0, shim: [], stderr: '' });
    const install = run('install', 'cursor');
    expect([install.code, install.stderr]).toEqual([0, '']);
    expect(readFileSync(shim, 'utf8')).toBe(current);
  });

  it('ignores a first cargo on PATH that is a directory or an unreadable file', () => {
    removeTestPath(shim);
    mkdirSync(shim);
    expect(doctor()).toEqual({ code: 0, errors: 0, shim: [], stderr: '' });
    expect([run('install', 'cursor').code, run('install', 'cursor').stderr]).toEqual([0, '']);

    removeTestPath(shim);
    writeFileSync(shim, shimText(oldNode, oldHauler, '/opt/rust/bin/cargo'), { mode: 0o111 });
    expect(doctor()).toEqual({ code: 0, errors: 0, shim: [], stderr: '' });
    expect(run('install', 'cursor').stderr).toBe('');
  });

  it('refreshes the file a symlinked shim points at and keeps the link', () => {
    const target = join(root, 'other', 'cargo');
    mkdirSync(dirname(target));
    writeFileSync(target, readFileSync(shim));
    chmodSync(target, 0o755);
    removeTestPath(shim);
    symlinkSync(target, shim);

    const install = run('install', 'cursor');
    expect([install.code, install.stderr]).toEqual([
      0,
      `Refreshed cargo shim ${target}: it ran ${oldNode} ${oldHauler}; it now runs ${process.execPath} ${newHauler}.\n`,
    ]);
    expect(lstatSync(shim).isSymbolicLink()).toBe(true);
    expect(readFileSync(target, 'utf8')).toBe(shimText(process.execPath, newHauler, '/opt/rust/bin/cargo'));
  });

  it('refreshes a shim whose real cargo sits beside it', () => {
    const beside = join(shimDir, 'cargo-real');
    writeFileSync(beside, '', { mode: 0o755 });
    writeFileSync(shim, shimText(oldNode, oldHauler, beside));

    const install = run('install', 'cursor');
    expect(install.code).toBe(0);
    expect(readFileSync(shim, 'utf8')).toBe(shimText(process.execPath, newHauler, beside));
  });
});
