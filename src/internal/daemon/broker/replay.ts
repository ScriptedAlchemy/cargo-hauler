export type ReplayAudience =
  | { readonly kind: 'all' }
  | { readonly kind: 'identity' }
  | { readonly kind: 'package'; readonly packageName: string };

export interface ReplayChunk {
  readonly channel: 'stdout' | 'stderr';
  readonly data: Uint8Array;
  readonly encodedData: string;
  readonly audience: ReplayAudience;
}

export interface ReplaySnapshot {
  readonly chunks: readonly ReplayChunk[];
  readonly droppedBytes: number;
}

/**
 * Bounded in-memory copy of a leader's output so late attachers can replay
 * everything emitted before they arrived. On overflow the OLDEST chunks are
 * dropped (late attachers care most about recent diagnostics) and the
 * dropped-byte count is reported so the replay can be labeled truncated.
 */
export class ReplayBuffer {
  readonly #capacity: number;
  #chunks: ReplayChunk[] = [];
  #head = 0;
  #bytes = 0;
  #dropped = 0;

  constructor(capacityBytes: number) {
    this.#capacity = Math.max(0, capacityBytes);
  }

  push(
    channel: 'stdout' | 'stderr',
    data: Uint8Array,
    audience: ReplayAudience = { kind: 'all' },
    encodedData = Buffer.from(data).toString('base64'),
  ): void {
    if (data.byteLength === 0) {
      return;
    }
    if (this.#capacity === 0) {
      this.#dropped += data.byteLength;
      return;
    }
    this.#chunks.push({ channel, data: Buffer.from(data), encodedData, audience });
    this.#bytes += data.byteLength;
    while (this.#bytes > this.#capacity && this.#head < this.#chunks.length) {
      const oldest = this.#chunks[this.#head];
      if (oldest !== undefined) {
        this.#head += 1;
        this.#bytes -= oldest.data.byteLength;
        this.#dropped += oldest.data.byteLength;
      }
    }
    if (this.#head > 1_024 || this.#head * 2 >= this.#chunks.length) {
      this.#chunks = this.#chunks.slice(this.#head);
      this.#head = 0;
    }
  }

  snapshot(): ReplaySnapshot {
    return { chunks: this.#chunks.slice(this.#head), droppedBytes: this.#dropped };
  }
}

export interface ReplaySince {
  /** The chunks (the first possibly sliced) starting at the requested byte offset. */
  readonly chunks: readonly ReplayChunk[];
  /**
   * Bytes at or after the offset that were emitted but no longer retained.
   * `null` when the offset cannot be aligned with what is retained (a
   * filtered view whose dropped chunks may or may not have been visible).
   */
  readonly missedBytes: number | null;
}

/**
 * What a reattaching client (#187) that already received `fromByte` bytes of
 * a ticket's output still needs from the buffer. `admit` restricts the view
 * to the chunks the client was ever sent (a scoped rider's audience filter);
 * with a filter the offsets are only meaningful while nothing has been
 * dropped, since a dropped chunk's audience is gone with it.
 */
export const replaySince = (
  snapshot: ReplaySnapshot,
  fromByte: number,
  admit?: (chunk: ReplayChunk) => boolean,
): ReplaySince => {
  if (admit !== undefined && snapshot.droppedBytes > 0) {
    return { chunks: [], missedBytes: null };
  }
  const filtered = admit === undefined ? snapshot.chunks : snapshot.chunks.filter(admit);
  let offset = snapshot.droppedBytes;
  const missedBytes = Math.max(0, offset - fromByte);
  const chunks: ReplayChunk[] = [];
  for (const chunk of filtered) {
    const end = offset + chunk.data.byteLength;
    if (end > fromByte) {
      if (offset >= fromByte) {
        chunks.push(chunk);
      } else {
        const data = chunk.data.subarray(fromByte - offset);
        chunks.push({ ...chunk, data, encodedData: Buffer.from(data).toString('base64') });
      }
    }
    offset = end;
  }
  return { chunks, missedBytes };
};
