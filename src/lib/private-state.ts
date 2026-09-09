import { chmodSync, closeSync, lstatSync, mkdirSync, openSync } from 'node:fs';

/**
 * The one owner-private filesystem policy for cargo-hauler state.
 *
 * Everything the daemon persists — the ledger, complete command output, the
 * pid lock, hook records, the passthrough spool, the control socket — is the
 * work of one Unix user, and daemon control is that user's, not a shared
 * multi-user service. So every directory this application creates is 0700
 * and every sensitive file 0600, independent of the invoking shell's umask,
 * rather than inheriting a 0755/0644 that leaves full command output
 * readable to anyone who can traverse an operator-configured state root.
 *
 * Two rules keep the enforcement from becoming its own hazard:
 *
 * - Only the exact directory or file cargo-hauler owns is created or
 *   tightened. An operator's parent of the state root is never chmod'ed, so
 *   pointing `CARGO_HAULER_STATE_DIR` inside a shared volume cannot relock
 *   that volume.
 * - An existing path is validated before its mode changes: it must be the
 *   expected type, not a symbolic link, and owned by this process's uid.
 *   Following a link or chmod'ing another user's entry would act on their
 *   behalf, so those paths are refused with the path in the message.
 *
 * POSIX modes and uids do not exist on Windows, and `process.getuid` is
 * undefined there. Rather than pretend, the whole policy is a no-op on such
 * hosts: callers keep working and their own create calls behave as before.
 */

export const privateDirMode = 0o700;
export const privateFileMode = 0o600;

/** This process's Unix uid, or `null` where the platform has no uids. */
export const currentUid = (): number | null => process.getuid?.() ?? null;

/**
 * The entry types cargo-hauler state is allowed to consist of. `'any'` is
 * for the one caller that compares inodes instead of types — substitution is
 * already fatal there — and still must not follow a link or trust an entry
 * belonging to another account.
 */
export type PrivateEntryKind = 'any' | 'directory' | 'fifo' | 'file' | 'socket';

/**
 * The `fs.Stats` surface the policy reads. Structural so the ownership
 * refusal is testable without a second account on the machine.
 */
export interface PrivateEntryStats {
  readonly mode: number;
  readonly uid: number;
  isDirectory(): boolean;
  isFIFO(): boolean;
  isFile(): boolean;
  isSocket(): boolean;
  isSymbolicLink(): boolean;
}

/**
 * A path cargo-hauler will not create, chmod, or delete. Callers surface it
 * as a startup failure naming the path; nothing is repaired silently,
 * because every cause is either an attack or an operator mistake.
 */
export class UnsafeStatePathError extends Error {
  readonly path: string;

  constructor(path: string, reason: string) {
    super(`refusing to use ${path}: ${reason}`);
    this.name = 'UnsafeStatePathError';
    this.path = path;
  }
}

const describeKind = (kind: PrivateEntryKind): string => {
  switch (kind) {
    case 'any':
      return 'an entry it owns';
    case 'directory':
      return 'a directory';
    case 'fifo':
      return 'a FIFO';
    case 'file':
      return 'a regular file';
    case 'socket':
      return 'a socket';
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
};

const matchesKind = (stats: PrivateEntryStats, kind: PrivateEntryKind): boolean => {
  switch (kind) {
    case 'any':
      return true;
    case 'directory':
      return stats.isDirectory();
    case 'fifo':
      return stats.isFIFO();
    case 'file':
      return stats.isFile();
    case 'socket':
      return stats.isSocket();
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
};

/**
 * Gate an existing path before it is written, chmod'ed, or removed. Symlinks
 * are refused rather than resolved: the link's target is somebody else's
 * choice, and honoring it is how a predictable path in a shared temp
 * directory turns into a write to an arbitrary file.
 */
export const assertOwnedPrivateEntry = (
  path: string,
  stats: PrivateEntryStats,
  kind: PrivateEntryKind,
): void => {
  if (stats.isSymbolicLink()) {
    throw new UnsafeStatePathError(
      path,
      `it is a symbolic link, and cargo-hauler state must be ${describeKind(kind)} it owns`,
    );
  }
  if (!matchesKind(stats, kind)) {
    throw new UnsafeStatePathError(path, `it is not ${describeKind(kind)}`);
  }
  const uid = currentUid();
  if (uid !== null && stats.uid !== uid) {
    throw new UnsafeStatePathError(
      path,
      `it is owned by uid ${stats.uid}, not by this process (uid ${uid})`,
    );
  }
};

const entryStats = (path: string): PrivateEntryStats | undefined =>
  lstatSync(path, { throwIfNoEntry: false });

/**
 * `mkdir` and `open` mask their mode argument with the umask, so the mode is
 * re-applied afterwards: that is what makes the result independent of the
 * shell that happened to start the daemon, and it is also the step that
 * migrates an already-owned 0755 install in place.
 */
export const ensurePrivateDir = (dir: string): void => {
  if (currentUid() === null) {
    mkdirSync(dir, { recursive: true });
    return;
  }
  const existing = entryStats(dir);
  if (existing === undefined) {
    // Any ancestor this creates is application-created too, so it is made
    // private with the leaf; an ancestor that already exists is the
    // operator's and is left exactly as found.
    mkdirSync(dir, { recursive: true, mode: privateDirMode });
  } else {
    assertOwnedPrivateEntry(dir, existing, 'directory');
  }
  chmodSync(dir, privateDirMode);
};

/** Tighten an entry that already exists; absent paths are left alone. */
export const hardenPrivateEntry = (path: string, kind: PrivateEntryKind): void => {
  if (currentUid() === null) {
    return;
  }
  const existing = entryStats(path);
  if (existing === undefined) {
    return;
  }
  assertOwnedPrivateEntry(path, existing, kind);
  chmodSync(path, privateFileMode);
};

/**
 * Create `path` privately if it is absent, then tighten it. Writers call this
 * before their own `createWriteStream`/`appendFile`/`open`, so the mode is
 * settled before the first byte instead of depending on which writer got
 * there first.
 */
export const ensurePrivateFile = (path: string): void => {
  if (currentUid() === null) {
    return;
  }
  if (entryStats(path) === undefined) {
    closeSync(openSync(path, 'a', privateFileMode));
  }
  hardenPrivateEntry(path, 'file');
};
