import { describe, expect, it } from 'effect-rstest';

import { sharedTargetWith } from '../../../src/internal/daemon/broker/shared-target.js';
import { sharedTargetGroups, sharedTargetRefusal, sharedTargetWarning } from '../../../src/internal/ui/shared/shared-target.js';

const lane = (workspaceRoot: string, targetDir: string, sharedTargetWith?: readonly string[]) => ({
  targetDir,
  workspaceRoot,
  ...(sharedTargetWith === undefined ? {} : { sharedTargetWith }),
});

// One grouping and one wording feed the lane board, `hauler status`, and the
// dashboard; the daemon's refusal and ack warning share the mechanism text.
describe('sharedTargetGroups', () => {
  it('groups flagged lanes by target dir once, roots sorted, skipping unflagged lanes', () => {
    // As the daemon emits them: every flagged lane names all the other roots.
    expect(
      sharedTargetGroups([
        lane('/work/two', '/cache/target', ['/work/one', '/work/three']),
        lane('/work/solo', '/work/solo/target'),
        lane('/work/one', '/cache/target', ['/work/two', '/work/three']),
        lane('/work/a', '/cache/other', ['/work/b']),
        lane('/work/three', '/cache/target', ['/work/one', '/work/two']),
        lane('/work/empty', '/cache/empty', []),
      ]),
    ).toEqual([
      { targetDir: '/cache/target', workspaceRoots: ['/work/one', '/work/three', '/work/two'] },
      { targetDir: '/cache/other', workspaceRoots: ['/work/a', '/work/b'] },
    ]);
  });

  it('spells the warning and the refusal from the same mechanism', () => {
    const group = { targetDir: '/cache/target', workspaceRoots: ['/work/one', '/work/two'] };
    const warning = sharedTargetWarning(group);
    const refusal = sharedTargetRefusal({ targetDir: '/cache/target', workspaceRoot: '/work/one' }, ['/work/two']);
    expect(warning).toMatch(/^WARNING: shared Cargo target dir \/cache\/target is used by workspace roots \/work\/one and \/work\/two\. /u);
    expect(refusal.startsWith(warning.slice('WARNING: '.length))).toBe(true);
    expect(refusal).toContain('--allow-shared-target');
    expect(warning).not.toContain('--allow-shared-target');
    for (const text of [warning, refusal]) {
      expect(text).toContain('-C metadata');
      expect(text).toContain('stale-binary problem, not a kache miss');
    }
  });
});

// Inputs are normalized lane paths; symlink and trailing-slash spellings are
// collapsed upstream (tests/unit/cargo/intent.test.ts) and by the live
// daemon cases in tests/integration/daemon-broker.test.ts.
describe('sharedTargetWith', () => {
  it('names the other roots, deduplicated and sorted, for an external target', () => {
    expect(
      sharedTargetWith({ targetDir: '/cache/target', workspaceRoot: '/work/one' }, [
        { targetDir: '/cache/target', workspaceRoot: '/work/two' },
        { targetDir: '/cache/target', workspaceRoot: '/work/three' },
        { targetDir: '/cache/target', workspaceRoot: '/work/two' },
        { targetDir: '/cache/target', workspaceRoot: '/work/one' },
      ]),
    ).toEqual(['/work/three', '/work/two']);
  });

  it('does not flag an internal target, the same root, or different targets', () => {
    expect(
      sharedTargetWith({ targetDir: '/work/one/target', workspaceRoot: '/work/one' }, [
        { targetDir: '/work/one/target', workspaceRoot: '/work/two' },
      ]),
    ).toEqual([]);
    expect(
      sharedTargetWith({ targetDir: '/cache/target', workspaceRoot: '/work/one' }, [
        { targetDir: '/cache/target', workspaceRoot: '/work/one' },
      ]),
    ).toEqual([]);
    expect(
      sharedTargetWith({ targetDir: '/cache/one', workspaceRoot: '/work/one' }, [
        { targetDir: '/cache/two', workspaceRoot: '/work/two' },
      ]),
    ).toEqual([]);
  });

  it('treats a sibling directory with a shared prefix as outside the workspace', () => {
    expect(
      sharedTargetWith({ targetDir: '/work/one-target', workspaceRoot: '/work/one' }, [
        { targetDir: '/work/one-target', workspaceRoot: '/work/two' },
      ]),
    ).toEqual(['/work/two']);
  });
});
