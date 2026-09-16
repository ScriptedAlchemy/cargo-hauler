/** Increment only when the daemon/client NDJSON contract changes incompatibly. */
export const wireProtocol = 1;

export interface WirePeer {
  readonly protocol?: number;
}

export const speaksCurrentWireProtocol = (peer: WirePeer): boolean =>
  peer.protocol === wireProtocol;
