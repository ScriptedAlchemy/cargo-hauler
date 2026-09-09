import { lstat, rm } from 'node:fs/promises';

import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';

import { assertOwnedPrivateEntry } from '../lib/private-state.js';

export interface SocketIdentity {
  readonly device: number;
  readonly inode: number;
}

export class SocketOwnershipLostError extends Data.TaggedError('SocketOwnershipLost')<{
  readonly cause?: unknown;
  readonly socketPath: string;
}> {}

/**
 * Identity is read with `lstat`, not `stat`: a symlink planted at the socket
 * path would otherwise contribute its target's inode, so the guard below
 * would compare — and later unlink — an entry chosen by whoever made the
 * link. A relocated socket lives in a shared temp tree, so that path is
 * reachable to other accounts and the check is not theoretical. Substituting
 * a different entry of any type is already caught by the inode comparison.
 */
export const readSocketIdentity = async (socketPath: string): Promise<SocketIdentity> => {
  const metadata = await lstat(socketPath);
  assertOwnedPrivateEntry(socketPath, metadata, 'any');
  return {
    device: metadata.dev,
    inode: metadata.ino,
  };
};

const identitiesMatch = (left: SocketIdentity, right: SocketIdentity): boolean =>
  left.device === right.device && left.inode === right.inode;

export const removeSocketIfOwned = async (
  socketPath: string,
  expected: SocketIdentity,
): Promise<void> => {
  const current = await readSocketIdentity(socketPath).catch(() => null);
  if (current !== null && identitiesMatch(current, expected)) {
    await rm(socketPath, { force: true });
  }
};

/**
 * Clear a crashed daemon's socket before publishing ours. This is the one
 * place cargo-hauler deletes an entry it did not create, so it deletes only
 * a socket it owns: a symlink, a foreign entry, or anything that is not a
 * socket is refused with the path named, because unlinking it would be
 * acting on somebody else's file rather than reclaiming our own.
 */
export const removeStaleSocketEntry = async (socketPath: string): Promise<void> => {
  const existing = await lstat(socketPath).catch(() => null);
  if (existing === null) {
    return;
  }
  assertOwnedPrivateEntry(socketPath, existing, 'socket');
  await rm(socketPath, { force: true });
};

/**
 * A Unix server remains usable after its pathname is unlinked, which can
 * leave an invisible daemon serving no new clients. Comparing the bound
 * socket's inode to the pathname once per second makes that ownership loss
 * fatal, while inode-guarded teardown cannot unlink a replacement daemon.
 */
export const monitorSocketOwnership = (
  socketPath: string,
  expected: SocketIdentity,
  intervalMs = 1_000,
): Effect.Effect<never, SocketOwnershipLostError> =>
  Effect.forever(
    Effect.sleep(intervalMs).pipe(
      Effect.andThen(
        Effect.tryPromise({
          try: () => readSocketIdentity(socketPath),
          catch: (cause) => new SocketOwnershipLostError({ cause, socketPath }),
        }),
      ),
      Effect.flatMap((current) =>
        identitiesMatch(current, expected)
          ? Effect.void
          : Effect.fail(new SocketOwnershipLostError({ socketPath })),
      ),
    ),
  );
