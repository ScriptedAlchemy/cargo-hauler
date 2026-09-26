import type { LaneStatus } from '../../contracts/protocol.js';

/**
 * One target dir used by several workspace roots (#185). This module holds
 * the grouping and the text every surface shows (daemon refusal and ack
 * warning, lane board, `hauler status` summary, dashboard) in one place, like
 * `kache-pressure-model.ts`. It is browser-safe, with no `node:` imports.
 * Detection itself lives in `daemon/broker/shared-target.ts`.
 */
export interface TargetLane {
  readonly workspaceRoot: string;
  readonly targetDir: string;
}

export interface SharedTargetGroup {
  readonly targetDir: string;
  /** Every workspace root on the dir, sorted. */
  readonly workspaceRoots: readonly string[];
}

/**
 * Flagged lanes grouped by target dir, in first-seen order. The daemon computes
 * `sharedTargetWith` for every lane against every other, so the first flagged
 * lane on a dir already names the whole set of roots.
 */
export const sharedTargetGroups = (
  lanes: readonly Pick<LaneStatus, 'targetDir' | 'workspaceRoot' | 'sharedTargetWith'>[],
): readonly SharedTargetGroup[] => {
  const groups = new Map<string, SharedTargetGroup>();
  for (const lane of lanes) {
    if (lane.sharedTargetWith?.length && !groups.has(lane.targetDir)) {
      groups.set(lane.targetDir, {
        targetDir: lane.targetDir,
        workspaceRoots: [lane.workspaceRoot, ...lane.sharedTargetWith].sort(),
      });
    }
  }
  return [...groups.values()];
};

export const sharedTargetMechanism =
  "Cargo's -C metadata hash is relative to the workspace root, so same-layout worktrees write identical artifact filenames there. Another worktree may treat whichever build compiled last as fresh and run it. This is a stale-binary problem, not a kache miss.";

const usedBy = (targetDir: string, workspaceRoots: readonly string[]): string =>
  `workspace roots ${workspaceRoots.join(' and ')} share Cargo target dir ${targetDir}`;

/** The status-surface line for one flagged group. */
export const sharedTargetWarning = (group: SharedTargetGroup): string =>
  `WARNING: ${usedBy(group.targetDir, group.workspaceRoots)}. ${sharedTargetMechanism}`;

/** The `bad-intent` refusal and, when the request was allowed, the ack warning. */
export const sharedTargetRefusal = (lane: TargetLane, otherWorkspaceRoots: readonly string[]): string =>
  `${usedBy(lane.targetDir, [lane.workspaceRoot, ...otherWorkspaceRoots])}. ${sharedTargetMechanism} Use a target dir per worktree, or pass --allow-shared-target (or set CARGO_HAULER_ALLOW_SHARED_TARGET=1) if you accept the risk.`;
