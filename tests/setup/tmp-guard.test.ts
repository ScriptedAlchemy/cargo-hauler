import { mkdtempSync, readdirSync, readFileSync, realpathSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

import { expect, it } from 'effect-rstest';

import { assertUnderTmpdir, removeTestPath } from '../support/tmp-guard.js';

const testsRoot = resolve(import.meta.dirname, '..');

it('refuses to remove a path outside the temp dir', () => {
  expect(() => assertUnderTmpdir('/fast/cache/cargo-hauler')).toThrow(
    'refusing to remove /fast/cache/cargo-hauler outside the temp dir',
  );
  expect(() => assertUnderTmpdir(tmpdir())).toThrow(
    `refusing to remove ${realpathSync(tmpdir())} outside the temp dir`,
  );
  expect(() => assertUnderTmpdir(join(tmpdir(), '..', 'etc'))).toThrow('outside the temp dir');
  expect(() => assertUnderTmpdir(join(tmpdir(), 'cargo-hauler-test-x'))).not.toThrow();
});

it('refuses a temp path that escapes through a symlink', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cargo-hauler-test-link-'));
  try {
    symlinkSync('/', join(dir, 'root'));
    expect(() => assertUnderTmpdir(join(dir, 'root', 'missing'))).toThrow(
      'refusing to remove /missing outside the temp dir',
    );
  } finally {
    removeTestPath(dir);
  }
});

it('leaves removal to the guarded helper in every test file', () => {
  const direct = readdirSync(testsRoot, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.(ts|tsx)$/u.test(file) && !file.includes('fixtures'))
    .filter((file) => file !== join('support', 'tmp-guard.ts'))
    .filter((file) =>
      /import\s*\{[^}]*\brm(Sync)?\b[^}]*\}\s*from\s*['"]node:fs(\/promises)?['"]|\b(fs|promises)\.rm(Sync)?\b/u.test(
        readFileSync(join(testsRoot, file), 'utf8'),
      ),
    )
    .map((file) => relative(testsRoot, join(testsRoot, file)));
  expect(direct).toEqual([]);
});
