import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, renameSync, statSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'effect-rstest';
import { sourceSnapshot } from '../../../src/internal/cargo/source-snapshot.js';
import { removeTestPath } from '../../support/tmp-guard.js';

describe('source authority', () => {
  it('sees tracked and untracked edits, additions, deletions and renames even with restored mtime', () => {
    const root = mkdtempSync(join(tmpdir(), 'hauler-source-'));
    try {
      expect(spawnSync('git', ['init', '-q', root]).status).toBe(0);
      const file = join(root, 'test.rs');
      writeFileSync(file, 'old');
      expect(spawnSync('git', ['add', '.'], { cwd: root }).status).toBe(0);
      const snapshot = () => sourceSnapshot(root, join(root, 'target'));
      const original = snapshot();
      expect(original).not.toBeNull();
      expect(snapshot()).toBe(original);
      const stat = statSync(file);
      writeFileSync(file, 'new');
      utimesSync(file, stat.atime, stat.mtime);
      expect(snapshot()).not.toBe(original);
      const edited = snapshot();
      writeFileSync(join(root, 'new.rs'), 'new input');
      expect(snapshot()).not.toBe(edited);
      const added = snapshot();
      renameSync(join(root, 'new.rs'), join(root, 'renamed.rs'));
      expect(snapshot()).not.toBe(added);
      removeTestPath(file);
      expect(snapshot()).not.toBeNull();
      expect(snapshot()).not.toBe(added);
    } finally { removeTestPath(root); }
  });

  it('does not invalidate reuse for output files and ignored execution markers', () => {
    const root = mkdtempSync(join(tmpdir(), 'hauler-source-'));
    try {
      expect(spawnSync('git', ['init', '-q', root]).status).toBe(0);
      writeFileSync(join(root, '.gitignore'), 'release-marker\n');
      writeFileSync(join(root, 'test.rs'), 'test');
      const target = join(root, 'custom-build');
      const before = sourceSnapshot(root, target);
      expect(before).not.toBeNull();
      mkdirSync(target);
      writeFileSync(join(target, 'binary'), 'output');
      writeFileSync(join(root, 'release-marker'), 'released');
      expect(sourceSnapshot(root, target)).toBe(before);
    } finally { removeTestPath(root); }
  });

  it('fails closed for absent workspaces and symlinked source trees', () => {
    const root = mkdtempSync(join(tmpdir(), 'hauler-source-'));
    try {
      writeFileSync(join(root, 'test.rs'), 'test');
      symlinkSync(join(root, 'test.rs'), join(root, 'linked.rs'));
      expect(sourceSnapshot(root, join(root, 'target'))).toBeNull();
      expect(sourceSnapshot(join(root, 'absent'), join(root, 'target'))).toBeNull();
    } finally { removeTestPath(root); }
  });
});
