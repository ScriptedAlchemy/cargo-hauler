import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { describe, expect, it } from 'effect-rstest';
import * as Effect from 'effect/Effect';

import type { ChildProcess } from 'node:child_process';

import { spawnDetachedDaemon } from '../src/client/ensure-daemon.js';
import { resolveDaemonConfig } from '../src/daemon/config.js';
import { openLedgerDatabase } from '../src/daemon/ledger.js';
import { bindDaemonSocket } from '../src/daemon/main.js';
import { acquireSingletonLockWith } from '../src/daemon/singleton.js';
import {
  readSocketIdentity,
  removeStaleSocketEntry,
} from '../src/daemon/socket-ownership.js';
import { openTicketLog, ticketLogDirFor } from '../src/daemon/ticket-log.js';
import { appendHookRecord } from '../src/hooks/record.js';
import { writeCursor } from '../src/hooks/hook-state.js';
import {
  assertOwnedPrivateEntry,
  currentUid,
  ensurePrivateDir,
  ensurePrivateFile,
  hardenPrivateEntry,
  privateDirMode,
  privateFileMode,
  UnsafeStatePathError,
  type PrivateEntryStats,
} from '../src/lib/private-state.js';
import { daemonSocketPath } from '../src/status.js';

/**
 * The whole policy is POSIX-only: `process.getuid` is undefined on Windows,
 * where these modes and uids do not exist. Skipping keeps the suite honest
 * on non-POSIX hosts instead of asserting a mode nobody enforces.
 */
const posix = currentUid() !== null;
const skipOnNonPosix = !posix;

const permissionsOf = (path: string): number => statSync(path).mode & 0o777;

const scratch = (name: string): string => mkdtempSync(join(tmpdir(), `cargo-hauler-${name}-`));

const withUmask = <A>(mask: number, body: () => A): A => {
  const previous = process.umask(mask);
  try {
    return body();
  } finally {
    process.umask(previous);
  }
};

/**
 * Stage what a pre-hardening install or an operator left behind. `mkdir` and
 * `writeFile` mask their `mode:` with the umask, so a fixture written under a
 * `umask 077` shell would already be 0700 and prove nothing; the conventional
 * umask makes the mode the fixture asks for the mode it gets.
 */
const staged = <A>(body: () => A): A => withUmask(0o022, body);

const withScratch = <A>(name: string, body: (root: string) => A): A => {
  const root = scratch(name);
  try {
    return body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const withScratchAsync = async <A>(
  name: string,
  body: (root: string) => Promise<A>,
): Promise<A> => {
  const root = scratch(name);
  try {
    return await body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const fakeStats = (overrides: Partial<PrivateEntryStats> = {}): PrivateEntryStats => ({
  isDirectory: () => false,
  isFIFO: () => false,
  isFile: () => true,
  isSocket: () => false,
  isSymbolicLink: () => false,
  mode: 0o100_600,
  uid: currentUid() ?? 0,
  ...overrides,
});

describe.skipIf(skipOnNonPosix)('owner-private state policy', () => {
  it('creates directories 0700 whatever the umask, at every level it makes', () => {
    for (const mask of [0o022, 0o000]) {
      withScratch('policy-umask-dir', (root) => {
        const target = join(root, 'nested', 'state');
        withUmask(mask, () => {
          ensurePrivateDir(target);
        });
        expect(permissionsOf(target)).toBe(privateDirMode);
        expect(permissionsOf(join(root, 'nested'))).toBe(privateDirMode);
      });
    }
  });

  it('creates sensitive files 0600 whatever the umask', () => {
    for (const mask of [0o022, 0o000]) {
      withScratch('policy-umask-file', (root) => {
        const target = join(root, 'secret.log');
        withUmask(mask, () => {
          ensurePrivateFile(target);
        });
        expect(permissionsOf(target)).toBe(privateFileMode);
      });
    }
  });

  it('migrates an existing owned installation in place, keeping its contents', () => {
    withScratch('policy-migrate', (root) => {
      const stateDir = join(root, 'state');
      const log = join(stateDir, 'daemon.log');
      staged(() => {
        mkdirSync(stateDir, { recursive: true, mode: 0o755 });
        writeFileSync(log, 'existing output\n', { mode: 0o644 });
      });

      ensurePrivateDir(stateDir);
      ensurePrivateFile(log);

      expect(permissionsOf(stateDir)).toBe(privateDirMode);
      expect(permissionsOf(log)).toBe(privateFileMode);
      expect(readFileSync(log, 'utf8')).toBe('existing output\n');
    });
  });

  it('never widens or touches the operator parent of the state dir it tightens', () => {
    withScratch('policy-parent', (root) => {
      const parent = join(root, 'shared');
      const stateDir = join(parent, 'cargo-hauler');
      staged(() => {
        mkdirSync(parent, { recursive: true, mode: 0o755 });
        mkdirSync(stateDir, { mode: 0o755 });
      });

      ensurePrivateDir(stateDir);

      expect(permissionsOf(stateDir)).toBe(privateDirMode);
      expect(permissionsOf(parent)).toBe(0o755);
    });
  });

  it('is idempotent on an already private directory and file', () => {
    withScratch('policy-idempotent', (root) => {
      const stateDir = join(root, 'state');
      ensurePrivateDir(stateDir);
      ensurePrivateDir(stateDir);
      const file = join(stateDir, 'daemon.pid');
      ensurePrivateFile(file);
      ensurePrivateFile(file);
      expect(permissionsOf(stateDir)).toBe(privateDirMode);
      expect(permissionsOf(file)).toBe(privateFileMode);
    });
  });

  it('refuses a symlinked state dir without following it or changing the target', () => {
    withScratch('policy-dir-symlink', (root) => {
      const target = join(root, 'elsewhere');
      staged(() => mkdirSync(target, { mode: 0o755 }));
      const link = join(root, 'state');
      symlinkSync(target, link);

      expect(() => ensurePrivateDir(link)).toThrow(UnsafeStatePathError);

      expect(permissionsOf(target)).toBe(0o755);
      expect(lstatSync(link).isSymbolicLink()).toBe(true);
      expect(permissionsOf(root)).toBe(0o700);
    });
  });

  it('refuses a symlinked sensitive file without following it or changing the target', () => {
    withScratch('policy-file-symlink', (root) => {
      const target = join(root, 'victim');
      staged(() => writeFileSync(target, 'not ours\n', { mode: 0o644 }));
      const link = join(root, 'daemon.log');
      symlinkSync(target, link);

      expect(() => ensurePrivateFile(link)).toThrow(UnsafeStatePathError);

      expect(permissionsOf(target)).toBe(0o644);
      expect(readFileSync(target, 'utf8')).toBe('not ours\n');
      expect(lstatSync(link).isSymbolicLink()).toBe(true);
    });
  });

  it('refuses a path whose type is not the one the policy expects', () => {
    withScratch('policy-kind', (root) => {
      const file = join(root, 'state');
      writeFileSync(file, '');
      expect(() => ensurePrivateDir(file)).toThrow(UnsafeStatePathError);

      const directory = join(root, 'daemon.log');
      mkdirSync(directory);
      expect(() => ensurePrivateFile(directory)).toThrow(UnsafeStatePathError);
    });
  });

  it('brings a sensitive file into existence, which tightening alone does not', () => {
    // The singleton's lock target must exist before proper-lockfile can lock
    // it, and creation is the half of this that is not POSIX-only.
    withScratch('policy-create', (root) => {
      const tightenOnly = join(root, 'absent.log');
      hardenPrivateEntry(tightenOnly, 'file');
      expect(existsSync(tightenOnly)).toBe(false);

      const created = join(root, 'daemon.pid');
      ensurePrivateFile(created);
      expect(existsSync(created)).toBe(true);
    });
  });

  it('refuses an entry owned by another user', () => {
    const mine = currentUid() ?? 0;
    expect(() =>
      assertOwnedPrivateEntry('/tmp/somebody-elses.sock', fakeStats({ uid: mine + 1 }), 'file'),
    ).toThrow(UnsafeStatePathError);
    // The owner check is the only thing that can fail here.
    expect(() => assertOwnedPrivateEntry('/tmp/mine.log', fakeStats(), 'file')).not.toThrow();
  });

  it('names the path and the reason so an operator can act on the refusal', () => {
    const failure = (() => {
      try {
        assertOwnedPrivateEntry('/shared/state/daemon.sock', fakeStats({ isSymbolicLink: () => true }), 'socket');
        return null;
      } catch (error) {
        return error as Error;
      }
    })();
    expect(failure).not.toBeNull();
    expect(failure?.message).toContain('/shared/state/daemon.sock');
    expect(failure?.message).toContain('symbolic link');
  });
});

describe.skipIf(skipOnNonPosix)('sensitive state writers', () => {
  it.live('singleton lock preparation leaves the state dir and pid file private', () =>
    Effect.gen(function* () {
      const root = yield* Effect.acquireRelease(
        Effect.sync(() => scratch('writer-singleton')),
        (directory) => Effect.sync(() => rmSync(directory, { recursive: true, force: true })),
      );
      const config = resolveDaemonConfig({ CARGO_HAULER_STATE_DIR: join(root, 'state') });
      yield* Effect.scoped(
        Effect.gen(function* () {
          yield* acquireSingletonLockWith(config);
          expect(permissionsOf(config.stateDir)).toBe(privateDirMode);
          expect(permissionsOf(config.lockTargetPath)).toBe(privateFileMode);
        }),
      );
    }));

  it('ticket logs and their directory are private', () => {
    withScratch('writer-ticket-log', (root) => {
      const directory = ticketLogDirFor(join(root, 'state'));
      const writer = withUmask(0o022, () => openTicketLog(directory, 'cc-1', 1_024));
      expect(writer).not.toBeNull();
      expect(permissionsOf(directory)).toBe(privateDirMode);
      expect(permissionsOf(join(directory, 'cc-1.log'))).toBe(privateFileMode);
    });
  });

  it('the ledger database and its WAL sidecars are private', () => {
    withScratch('writer-ledger', (root) => {
      const databasePath = join(root, 'state', 'ledger.db');
      const db = withUmask(0o022, () => openLedgerDatabase(databasePath));
      try {
        expect(permissionsOf(dirname(databasePath))).toBe(privateDirMode);
        expect(permissionsOf(databasePath)).toBe(privateFileMode);
        for (const sidecar of [`${databasePath}-wal`, `${databasePath}-shm`]) {
          if (existsSync(sidecar)) {
            expect(permissionsOf(sidecar)).toBe(privateFileMode);
          }
        }
      } finally {
        db.close();
      }
    });
  });

  it('the hook event log and hook state file are private', () => {
    withScratch('writer-hooks', (root) => {
      const stateDir = join(root, 'state');
      withUmask(0o022, () => {
        appendHookRecord(
          {
            atMs: 1,
            command: 'cargo build',
            host: 'test',
            outcome: 'continue',
            phase: 'beforeTool',
          },
          stateDir,
        );
        writeCursor('session-1', 2, stateDir);
      });
      expect(permissionsOf(stateDir)).toBe(privateDirMode);
      expect(permissionsOf(join(stateDir, 'hook-events.jsonl'))).toBe(privateFileMode);
      expect(permissionsOf(join(stateDir, 'hook-state.json'))).toBe(privateFileMode);
    });
  });

  it.live('the detached daemon log is private before the daemon inherits it', () =>
    Effect.gen(function* () {
      const root = yield* Effect.acquireRelease(
        Effect.sync(() => scratch('writer-daemon-log')),
        (directory) => Effect.sync(() => rmSync(directory, { recursive: true, force: true })),
      );
      const config = resolveDaemonConfig({ CARGO_HAULER_STATE_DIR: join(root, 'state') });
      const previous = process.umask(0o022);
      try {
        yield* spawnDetachedDaemon(config, '/entry.js', {
          spawnProcess: () => ({ unref: () => undefined }) as unknown as ChildProcess,
        });
      } finally {
        process.umask(previous);
      }
      expect(permissionsOf(config.stateDir)).toBe(privateDirMode);
      expect(permissionsOf(config.logPath)).toBe(privateFileMode);
    }));
});

describe.skipIf(skipOnNonPosix)('relocated control socket', () => {
  // Long enough that `<stateDir>/daemon.sock` overflows sun_path on both
  // Linux and macOS, which is what moves the socket out of the state dir.
  const deepStateDir = `/private/var/folders/3m/${'x'.repeat(60)}/T/cargo-hauler/state`;

  it('lands in an owner-private subdirectory instead of the shared temp root', () => {
    const socket = daemonSocketPath(deepStateDir, 'darwin', { TMPDIR: '/tmp' }, 4242);
    expect(dirname(socket)).toBe('/tmp/cargo-hauler-4242');
    expect(Buffer.byteLength(socket)).toBeLessThanOrEqual(103);
  });

  it('carries a user discriminator so two accounts on one temp root never collide', () => {
    const mine = daemonSocketPath(deepStateDir, 'linux', { TMPDIR: '/tmp' }, 1000);
    const theirs = daemonSocketPath(deepStateDir, 'linux', { TMPDIR: '/tmp' }, 1001);
    expect(mine).not.toBe(theirs);
    expect(dirname(mine)).not.toBe(dirname(theirs));
  });

  it('keeps case-distinct unix state dirs on distinct endpoints', () => {
    const lower = daemonSocketPath(`${deepStateDir}/build`, 'linux', { TMPDIR: '/tmp' }, 1000);
    const upper = daemonSocketPath(`${deepStateDir}/BUILD`, 'linux', { TMPDIR: '/tmp' }, 1000);
    expect(lower).not.toBe(upper);
  });

  it('skips a runtime root that would overflow sun_path for one that fits', () => {
    const long = `/${'r'.repeat(90)}`;
    for (const platform of ['linux', 'darwin'] as const) {
      const socket = daemonSocketPath(
        deepStateDir,
        platform,
        { TMPDIR: '/tmp', XDG_RUNTIME_DIR: long },
        1000,
      );
      expect(dirname(socket)).toBe('/tmp/cargo-hauler-1000');
      expect(Buffer.byteLength(socket)).toBeLessThanOrEqual(platform === 'linux' ? 107 : 103);
    }
  });

  it.live('binding a relocated socket creates its runtime directory owner-private', () =>
    Effect.gen(function* () {
      const root = yield* Effect.acquireRelease(
        Effect.sync(() => scratch('socket-runtime-dir')),
        (directory) => Effect.sync(() => rmSync(directory, { recursive: true, force: true })),
      );
      const runtimeDir = join(root, 'runtime');
      const socketPath = join(runtimeDir, 'daemon.sock');
      yield* Effect.scoped(
        Effect.gen(function* () {
          yield* bindDaemonSocket(socketPath);
          expect(permissionsOf(runtimeDir)).toBe(privateDirMode);
          expect(lstatSync(socketPath).isSocket()).toBe(true);
        }),
      );
    }));
});

// Ownership is asserted through `fakeStats`, not a second account, so these
// run as root too — where the refusals matter most.
describe.skipIf(skipOnNonPosix)('socket publication and stale cleanup', () => {
  it('refuses to remove a symlink standing where the socket belongs, leaving the target', async () => {
    await withScratchAsync('socket-symlink', async (root) => {
      const victim = join(root, 'victim');
      writeFileSync(victim, 'not ours\n');
      const socketPath = join(root, 'daemon.sock');
      symlinkSync(victim, socketPath);

      await expect(removeStaleSocketEntry(socketPath)).rejects.toThrow(UnsafeStatePathError);

      expect(existsSync(victim)).toBe(true);
      expect(readFileSync(victim, 'utf8')).toBe('not ours\n');
      expect(lstatSync(socketPath).isSymbolicLink()).toBe(true);
    });
  });

  it('refuses to remove a non-socket entry at the socket path', async () => {
    await withScratchAsync('socket-not-a-socket', async (root) => {
      const socketPath = join(root, 'daemon.sock');
      writeFileSync(socketPath, 'somebody else lives here\n');

      await expect(removeStaleSocketEntry(socketPath)).rejects.toThrow(UnsafeStatePathError);

      expect(existsSync(socketPath)).toBe(true);
    });
  });

  it('treats an absent socket path as nothing to clean up', async () => {
    await withScratchAsync('socket-absent', async (root) => {
      await expect(removeStaleSocketEntry(join(root, 'daemon.sock'))).resolves.toBeUndefined();
    });
  });

  it('refuses to take identity from a symlink at the socket path', async () => {
    await withScratchAsync('socket-identity-symlink', async (root) => {
      const victim = join(root, 'victim.sock');
      writeFileSync(victim, '');
      const socketPath = join(root, 'daemon.sock');
      symlinkSync(victim, socketPath);

      await expect(readSocketIdentity(socketPath)).rejects.toThrow(UnsafeStatePathError);
    });
  });
});
