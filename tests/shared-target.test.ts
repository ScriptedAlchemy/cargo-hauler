import { mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'effect-rstest';
import * as Effect from 'effect/Effect';

import { sharedTargetWith } from '../src/daemon/shared-target.js';

import { scopedTempDir } from './harness.js';

describe('sharedTargetWith', () => {
  it('detects an external target shared across different workspace roots', () => {
    expect(
      sharedTargetWith(
        { targetDir: '/cache/target/', workspaceRoot: '/work/one' },
        [{ targetDir: '/cache/target', workspaceRoot: '/work/two' }],
      ),
    ).toEqual(['/work/two']);
  });

  it('does not flag an internal target, the same root, or different targets', () => {
    expect(
      sharedTargetWith(
        { targetDir: '/work/one/target', workspaceRoot: '/work/one' },
        [{ targetDir: '/work/one/target', workspaceRoot: '/work/two' }],
      ),
    ).toEqual([]);
    expect(
      sharedTargetWith(
        { targetDir: '/cache/target', workspaceRoot: '/work/one' },
        [{ targetDir: '/cache/target', workspaceRoot: '/work/one/' }],
      ),
    ).toEqual([]);
    expect(
      sharedTargetWith(
        { targetDir: '/cache/one', workspaceRoot: '/work/one' },
        [{ targetDir: '/cache/two', workspaceRoot: '/work/two' }],
      ),
    ).toEqual([]);
  });

  it.live('compares real paths when workspace and target paths are symlinked', () =>
    Effect.gen(function* () {
      const root = yield* scopedTempDir('cargo-hauler-shared-target-');
      const real = join(root, 'real');
      const linked = join(root, 'linked');
      mkdirSync(join(real, 'one'), { recursive: true });
      mkdirSync(join(real, 'two'), { recursive: true });
      mkdirSync(join(real, 'target'), { recursive: true });
      symlinkSync(real, linked, 'dir');

      expect(
        sharedTargetWith(
          { targetDir: join(linked, 'target'), workspaceRoot: join(linked, 'one') },
          [{ targetDir: join(real, 'target'), workspaceRoot: join(real, 'two') }],
        ),
      ).toEqual([join(real, 'two')]);
    }));
});
