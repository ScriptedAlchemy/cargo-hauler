import { realpathSync, rmSync, type PathLike } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const tmpRoots = [...new Set([tmpdir(), realpathSync(tmpdir())])];

export const assertUnderTmpdir = (path: PathLike): void => {
  const target = resolve(path instanceof URL ? fileURLToPath(path) : path.toString());
  const inside = tmpRoots.some((root) => {
    const rel = relative(root, target);
    return rel.length > 0 && !rel.startsWith('..') && !isAbsolute(rel);
  });
  if (!inside) {
    throw new Error(`refusing to remove ${target} outside the temp dir`);
  }
};

export const removeTestPath = (path: PathLike): void => {
  assertUnderTmpdir(path);
  rmSync(path, { force: true, recursive: true });
};
