import { compareVersions } from './version-order.js';

/** Increment only when the daemon/client NDJSON contract changes incompatibly. */
export const wireProtocol = 1;

/** First release speaking protocol 1, before pongs carried an explicit identity. */
export const wireProtocolSince = '0.7.1';

export interface WirePeer {
  readonly protocol?: number;
  readonly version: string;
}

/**
 * New peers name the protocol directly. The release floor recognizes the
 * already-published 0.7.1–0.7.3 peers whose byte-identical pongs predate the
 * field; newer peers remain subject to the directional version guard.
 */
export const speaksCurrentWireProtocol = (
  peer: WirePeer,
  clientVersion: string,
): boolean =>
  peer.protocol === wireProtocol ||
  (peer.protocol === undefined &&
    compareVersions(peer.version, wireProtocolSince) >= 0 &&
    compareVersions(peer.version, clientVersion) <= 0);
