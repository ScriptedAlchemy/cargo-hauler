import { describe, expect, it } from 'effect-rstest';

import { compareVersions, isNewerVersion } from '../src/lib/version-order.js';
import { speaksCurrentWireProtocol, wireProtocol } from '../src/lib/wire-protocol.js';

describe('compareVersions', () => {
  it('orders releases numerically per component', () => {
    expect(compareVersions('0.6.6', '0.6.7')).toBe(-1);
    expect(compareVersions('0.6.10', '0.6.9')).toBe(1);
    expect(compareVersions('1.0.0', '0.99.99')).toBe(1);
    expect(compareVersions('0.6.6', '0.6.6')).toBe(0);
    expect(compareVersions('v0.6.6', '0.6.6')).toBe(0);
  });

  it('sorts a prerelease below its release and unparsable strings below everything', () => {
    expect(compareVersions('0.7.0-beta.1', '0.7.0')).toBe(-1);
    expect(compareVersions('0.7.0-beta.1', '0.6.9')).toBe(1);
    expect(compareVersions('0.0.0-previous', '0.6.6')).toBe(-1);
    expect(compareVersions('garbage', '0.0.1')).toBe(-1);
    expect(compareVersions('0.0.1', 'garbage')).toBe(1);
    expect(compareVersions('garbage', 'garbage')).toBe(0);
  });

  it('exposes strict newer-than', () => {
    expect(isNewerVersion('0.6.7', '0.6.6')).toBe(true);
    expect(isNewerVersion('0.6.6', '0.6.6')).toBe(false);
    expect(isNewerVersion('0.3.5', '0.6.6')).toBe(false);
  });
});

describe('daemon wire protocol identity', () => {
  it('recognizes published 0.7 peers and explicit protocol identity independently of patch version', () => {
    expect(speaksCurrentWireProtocol({ version: '0.7.1' }, '0.7.3')).toBe(true);
    expect(
      speaksCurrentWireProtocol({ protocol: wireProtocol, version: '0.7.1' }, '0.7.3'),
    ).toBe(true);
    expect(speaksCurrentWireProtocol({ protocol: 2, version: '0.7.1' }, '0.7.3')).toBe(false);
    expect(speaksCurrentWireProtocol({ version: '0.6.7' }, '0.7.3')).toBe(false);
    expect(speaksCurrentWireProtocol({ version: '0.7.4' }, '0.7.3')).toBe(false);
  });
});
