import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { performance } from 'node:perf_hooks';

/**
 * Fresh workspace source authority for sharing an already-started process.
 * Never use topology's cached edit hint for this correctness decision.
 * Git lists tracked and nonignored untracked inputs; plain workspaces are
 * walked directly. Cargo outputs, VCS state and installed JS dependencies
 * are not source inputs. Unknown, oversized or unreadable trees refuse reuse.
 * ctime catches same-size writes even when a caller restores mtime.
 */
export const sourceSnapshot = (workspaceRoot: string, targetDir: string): string | null => {
  const started = performance.now();
  const root = resolve(workspaceRoot), target = resolve(targetDir);
  const excluded = (path: string): boolean => {
    const absolute = resolve(root, path);
    return absolute === target || absolute.startsWith(`${target}${sep}`) ||
      path.split(/[\\/]/u).some(part => part === '.git' || part === 'node_modules');
  };
  try {
    const git = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', '.'], {
      cwd: root, encoding: 'utf8', timeout: 500, maxBuffer: 8 * 1024 * 1024,
      env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
    });
    let files: string[];
    if (git.status === 0) files = [...new Set(git.stdout.split('\0').filter(Boolean))];
    else {
      // A Git failure inside a repository is unknown, not a plain tree.
      if (git.error || git.status !== 128 || !git.stderr.includes('not a git repository')) return null;
      files = [];
      const visit = (directory: string): void => {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
          const path = join(directory, entry.name), name = relative(root, path);
          if (excluded(name)) continue;
          if (files.length > 25_000 || performance.now() - started > 500) throw new Error('source limit');
          if (entry.isDirectory()) visit(path);
          else files.push(name);
        }
      };
      visit(root);
    }
    if (files.length > 25_000) return null;
    const hash = createHash('sha256');
    for (const name of files.sort()) {
      if (excluded(name)) continue;
      if (performance.now() - started > 500) return null;
      let stat;
      try { stat = lstatSync(join(root, name), { bigint: true }); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') return null;
        hash.update(JSON.stringify([name, 'missing']));
        continue;
      }
      // Symlinked inputs and submodules may change outside this tree.
      if (!stat.isFile()) return null;
      hash.update(JSON.stringify([name, String(stat.dev), String(stat.ino), String(stat.size),
        String(stat.mode), String(stat.mtimeNs), String(stat.ctimeNs)]));
    }
    return hash.digest('hex');
  } catch { return null; }
};
