import { isAbsolute, relative, sep } from 'node:path';

import { canonicalPath } from './intent-normalizer.js';

export interface TargetLane {
  readonly workspaceRoot: string;
  readonly targetDir: string;
}

const canonicalLane = (lane: TargetLane): TargetLane => ({
  workspaceRoot: canonicalPath(lane.workspaceRoot),
  targetDir: canonicalPath(lane.targetDir),
});

const isInside = (workspaceRoot: string, targetDir: string): boolean => {
  const path = relative(workspaceRoot, targetDir);
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path));
};

/**
 * Other workspace roots known to use this lane's external target directory.
 * Paths are canonicalized through their nearest existing ancestor, matching
 * intent normalization for missing target directories and existing symlinks.
 */
export const sharedTargetWith = (
  requested: TargetLane,
  knownLanes: readonly TargetLane[],
): readonly string[] => {
  const lane = canonicalLane(requested);
  if (isInside(lane.workspaceRoot, lane.targetDir)) {
    return [];
  }
  return [
    ...new Set(
      knownLanes
        .map(canonicalLane)
        .filter(
          (known) =>
            known.workspaceRoot !== lane.workspaceRoot &&
            known.targetDir === lane.targetDir,
        )
        .map((known) => known.workspaceRoot),
    ),
  ].sort();
};

export const sharedTargetMessage = (
  lane: TargetLane,
  otherWorkspaceRoots: readonly string[],
): string =>
  `shared Cargo target dir ${canonicalPath(lane.targetDir)} is used by workspace roots ${[
    canonicalPath(lane.workspaceRoot),
    ...otherWorkspaceRoots,
  ].join(' and ')}. Cargo's -C metadata hash is relative to the workspace root, so same-layout worktrees write identical artifact filenames there; whichever compiled last may be treated as fresh and run by another worktree. This is a stale-binary problem, not a kache miss. Use a target dir per worktree, or pass --allow-shared-target (or set CARGO_HAULER_ALLOW_SHARED_TARGET=1) if you accept the risk.`;
