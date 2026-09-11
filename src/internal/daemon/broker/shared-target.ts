import type { TargetLane } from '../../ui/shared/shared-target.js';

import { isPathInside } from '../../cargo/workspace.js';

/**
 * Other workspace roots known to use this lane's target directory, sorted
 * (#185). Empty when the target dir sits inside the lane's own workspace:
 * that is the default layout, never the request that pointed elsewhere.
 *
 * Both sides are lane paths as `normalizeCargoIntent` produced them — already
 * through `canonicalPath` — so equality is plain string equality and nothing
 * here touches the filesystem.
 */
export const sharedTargetWith = (
  requested: TargetLane,
  knownLanes: readonly TargetLane[],
): readonly string[] => {
  if (isPathInside(requested.workspaceRoot, requested.targetDir)) {
    return [];
  }
  const roots = new Set<string>();
  for (const known of knownLanes) {
    if (known.targetDir === requested.targetDir && known.workspaceRoot !== requested.workspaceRoot) {
      roots.add(known.workspaceRoot);
    }
  }
  return [...roots].sort();
};
