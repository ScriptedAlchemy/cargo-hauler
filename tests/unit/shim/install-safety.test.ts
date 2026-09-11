import assert from 'node:assert/strict';
import {
  chmodSync,
  existsSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';

import { afterEach, beforeEach, describe, it } from 'effect-rstest';

import { installCargoShim, resolveRealCargo } from '../../../src/internal/shim/install.js';

describe('shim installation preserves existing link targets', () => {
  let root: string;
  let destDir: string;
  let shim: string;
  let realCargo: string;
  const original = '#!/bin/sh\necho original-cargo\n';

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'cargo-hauler-shim-safety-'));
    destDir = join(root, 'bin');
    mkdirSync(destDir);
    shim = join(destDir, 'cargo');
    realCargo = join(root, 'real-cargo');
    writeFileSync(realCargo, original);
    chmodSync(realCargo, 0o750);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('replaces a symlink rather than overwriting or chmodding its executable target', () => {
    symlinkSync('../real-cargo', shim);
    const installed = installCargoShim({ destDir, force: true, haulerArgv: ['hauler'], realCargo });

    assert.equal(readFileSync(realCargo, 'utf8'), original);
    assert.equal(statSync(realCargo).mode & 0o777, 0o750);
    assert.equal(lstatSync(shim).isSymbolicLink(), false);
    assert.equal(statSync(shim).mode & 0o777, 0o755);
    assert.match(readFileSync(installed.path, 'utf8'), /hauler exec --host shim/u);
    assert.deepEqual(readdirSync(destDir), ['cargo']);
  });

  it('replaces a hard link without changing the other name for the executable', () => {
    linkSync(realCargo, shim);
    installCargoShim({ destDir, force: true, haulerArgv: ['hauler'], realCargo });

    assert.equal(readFileSync(realCargo, 'utf8'), original);
    assert.equal(statSync(realCargo).mode & 0o777, 0o750);
    assert.notEqual(statSync(shim).ino, statSync(realCargo).ino);
    assert.deepEqual(readdirSync(destDir), ['cargo']);
  });

  it('refuses a dangling symlink without --force and does not create its target', () => {
    const missing = join(root, 'missing-cargo');
    symlinkSync(missing, shim);

    assert.throws(
      () => installCargoShim({ destDir, haulerArgv: ['hauler'], realCargo }),
      /already exists/u,
    );
    assert.equal(readlinkSync(shim), missing);
    assert.equal(existsSync(missing), false);
    assert.deepEqual(readdirSync(destDir), ['cargo']);
  });

  it('replaces a dangling symlink with --force without creating its target', () => {
    const missing = join(root, 'missing-cargo');
    symlinkSync(missing, shim);
    installCargoShim({ destDir, force: true, haulerArgv: ['hauler'], realCargo });

    assert.equal(existsSync(missing), false);
    assert.equal(lstatSync(shim).isSymbolicLink(), false);
    assert.match(readFileSync(shim, 'utf8'), /hauler exec --host shim/u);
    assert.deepEqual(readdirSync(destDir), ['cargo']);
  });

  it('skips its own PATH entry even while that entry is a symlink to real cargo', () => {
    const realDir = join(root, 'real-bin');
    mkdirSync(realDir);
    const candidate = join(realDir, 'cargo');
    symlinkSync(realCargo, candidate);
    symlinkSync(realCargo, shim);

    assert.equal(
      resolveRealCargo('cargo', destDir, { PATH: [destDir, realDir].join(delimiter) }),
      candidate,
    );
  });

  it('refuses to embed the destination symlink as its own real cargo', () => {
    symlinkSync(realCargo, shim);

    assert.throws(
      () => installCargoShim({ destDir, force: true, haulerArgv: ['hauler'], realCargo: shim }),
      /points at the shim itself/u,
    );
    assert.equal(readFileSync(realCargo, 'utf8'), original);
    assert.equal(readlinkSync(shim), realCargo);
  });

  it('recognizes its destination through a symlinked parent directory', () => {
    symlinkSync(realCargo, shim);
    const alias = join(root, 'bin-alias');
    symlinkSync(destDir, alias);

    assert.throws(
      () => resolveRealCargo(join(alias, 'cargo'), destDir),
      /points at the shim itself/u,
    );
  });

  it('installs executable permissions even with a restrictive umask', () => {
    const previous = process.umask(0o077);
    try {
      installCargoShim({ destDir, haulerArgv: ['hauler'], realCargo });
    } finally {
      process.umask(previous);
    }

    assert.equal(statSync(shim).mode & 0o777, 0o755);
    assert.deepEqual(readdirSync(destDir), ['cargo']);
  });

  it('preserves an existing file without --force', () => {
    writeFileSync(shim, 'existing shim');

    assert.throws(
      () => installCargoShim({ destDir, haulerArgv: ['hauler'], realCargo }),
      /already exists/u,
    );
    assert.equal(readFileSync(shim, 'utf8'), 'existing shim');
    assert.deepEqual(readdirSync(destDir), ['cargo']);
  });

  it('cleans staging files after refusing to replace a directory', () => {
    mkdirSync(shim);
    writeFileSync(join(shim, 'keep'), 'keep');

    assert.throws(() =>
      installCargoShim({ destDir, force: true, haulerArgv: ['hauler'], realCargo }),
    );
    assert.equal(readFileSync(join(shim, 'keep'), 'utf8'), 'keep');
    assert.equal(readFileSync(realCargo, 'utf8'), original);
    assert.deepEqual(readdirSync(destDir), ['cargo']);
  });
});
