import assert from 'node:assert/strict';

import { describe, it } from 'effect-rstest';

import { compareVersions, isNewerVersion } from '../src/lib/version-order.js';

describe('prerelease version precedence', () => {
  it('orders every pair in the SemVer precedence example', () => {
    const ordered = [
      '1.0.0-alpha',
      '1.0.0-alpha.1',
      '1.0.0-alpha.beta',
      '1.0.0-beta',
      '1.0.0-beta.2',
      '1.0.0-beta.11',
      '1.0.0-rc.1',
      '1.0.0',
    ];
    for (const [leftIndex, left] of ordered.entries()) {
      for (const [rightIndex, right] of ordered.entries()) {
        const expected = leftIndex === rightIndex ? 0 : leftIndex < rightIndex ? -1 : 1;
        assert.equal(compareVersions(left, right), expected, `${left} vs ${right}`);
      }
    }
  });

  it('does not mistake an older rc.9 client for a newer rc.10 daemon', () => {
    assert.equal(compareVersions('0.8.0-rc.9', '0.8.0-rc.10'), -1);
    assert.equal(isNewerVersion('0.8.0-rc.9', '0.8.0-rc.10'), false);
    assert.equal(isNewerVersion('0.8.0-rc.10', '0.8.0-rc.9'), true);
  });

  it('sorts numeric identifiers below identifiers containing letters or hyphens', () => {
    assert.equal(compareVersions('1.0.0-beta.10', '1.0.0-beta.-1'), -1);
    assert.equal(compareVersions('1.0.0-beta.-1', '1.0.0-beta.10'), 1);
    assert.equal(compareVersions('1.0.0-beta.10', '1.0.0-beta.1a'), -1);
  });

  it('compares identifiers rather than treating their separating dots as characters', () => {
    assert.equal(compareVersions('1.0.0-alpha.1', '1.0.0-alpha-1'), -1);
    assert.equal(compareVersions('1.0.0-alpha-1', '1.0.0-alpha.1'), 1);
    assert.equal(compareVersions('1.0.0-alpha.1', '1.0.0-alpha.1.1'), -1);
  });

  it('compares numeric prerelease identifiers without floating-point rounding', () => {
    assert.equal(
      compareVersions('1.0.0-rc.99999999999999999999', '1.0.0-rc.100000000000000000000'),
      -1,
    );
    assert.equal(
      compareVersions('1.0.0-rc.9007199254740992', '1.0.0-rc.9007199254740993'),
      -1,
    );
  });

  it('ignores build metadata and keeps a final release above prereleases', () => {
    assert.equal(compareVersions('1.0.0-rc.10+build.1', '1.0.0-rc.10+build.2'), 0);
    assert.equal(compareVersions('1.0.0-rc.10+build.2', '1.0.0'), -1);
    assert.equal(compareVersions('1.0.0', '1.0.0-rc.10+build.2'), 1);
  });
});
