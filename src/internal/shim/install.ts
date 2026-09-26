import {
  accessSync,
  chmodSync,
  constants,
  existsSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, dirname, isAbsolute, join, resolve } from 'node:path';

import { isRecord } from '../util/guards.js';

import { canonical } from './entry-location.js';

export interface RenderShimOptions {
  readonly haulerArgv: readonly string[];
  readonly realCargo: string;
}

export interface InstallShimOptions extends RenderShimOptions {
  readonly destDir?: string;
  readonly force?: boolean;
  /** Overridable in tests; defaults to `process.platform`. */
  readonly platform?: NodeJS.Platform;
}

export interface InstallShimResult {
  readonly path: string;
  /** The hauler entry the shim embeds (a script path, or a PATH command name). */
  readonly haulerScript: string;
  /** The absolute cargo the shim falls back to. */
  readonly realCargo: string;
}

const shellQuote = (value: string): string => {
  if (value.length === 0) {
    return "''";
  }
  if (/^[A-Za-z0-9_./-]+$/u.test(value)) {
    return value;
  }
  return `'${value.replaceAll("'", `'\\''`)}'`;
};

/**
 * The hauler entry the shim depends on: the script when the argv is
 * `node …/hauler.mjs`, otherwise the command name to look up on PATH.
 */
export const shimHaulerEntry = (haulerArgv: readonly string[]): string =>
  haulerArgv[1] ?? haulerArgv[0] ?? 'hauler';

export const renderCargoShim = (options: RenderShimOptions): string => {
  const hauler = options.haulerArgv.map(shellQuote).join(' ');
  const cargo = shellQuote(options.realCargo);
  // A Node installation can still move the embedded global entry. Losing the
  // broker for a while beats turning every `cargo` on PATH into "No such file".
  const entry = shellQuote(shimHaulerEntry(options.haulerArgv));
  const [node] = options.haulerArgv;
  const guard =
    options.haulerArgv.length >= 2 && node !== undefined
      ? `[ -x ${shellQuote(node)} ] && [ -f ${entry} ]`
      : `command -v ${entry} >/dev/null 2>&1`;
  // --host shim: unlike hook rewrites, the shim has no agent identity, but the
  // ledger should still say where a request entered. CARGO_HAULER_INSIDE
  // marks cargo spawned by the daemon itself (the executor sets it on every
  // child); forwarding that would submit the broker's own work back to the
  // broker.
  return `#!/bin/sh
# cargo-hauler PATH shim — forwards cargo to the broker.
# Installed by \`hauler install-shim\`. Hooks cannot see cargo inside scripts.
if [ -n "\${CARGO_HAULER_INSIDE:-}" ]; then
  exec ${cargo} "$@"
fi
# Re-run \`hauler install-shim --force\` after an upgrade moves the hauler entry.
${guard} || exec ${cargo} "$@"
exec ${hauler} exec --host shim -- ${cargo} "$@"
`;
};

export const defaultShimDir = (): string => join(homedir(), '.local', 'bin');

/**
 * Resolves the real cargo to an ABSOLUTE path, skipping anything inside the
 * shim's own directory. Embedding a bare `cargo` would let the broker daemon
 * resolve the shim itself through PATH. The shim would call the broker,
 * which spawns the shim, and the two would deadlock on each other.
 */
export const resolveRealCargo = (
  realCargo: string,
  destDir: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
): string => {
  const canonicalDest = canonical(destDir);
  const insideDest = (path: string): boolean => {
    const resolved = canonical(path);
    // The destination may still be a symlink to real cargo before install.
    // Do not embed that entry: replacing it would make the shim call itself.
    return canonical(dirname(path)) === canonicalDest || resolved.startsWith(`${canonicalDest}/`);
  };
  if (isAbsolute(realCargo)) {
    // An explicit absolute path is the operator's call; only self-reference
    // is refused.
    if (insideDest(realCargo)) {
      throw new Error(
        `--real-cargo ${realCargo} points at the shim itself. Pass the real cargo binary`,
      );
    }
    return realCargo;
  }
  for (const entry of (env.PATH ?? '').split(delimiter)) {
    if (entry.length === 0) {
      continue;
    }
    const candidate = join(entry, realCargo);
    if (!existsSync(candidate) || insideDest(candidate)) {
      continue;
    }
    // Keep the symlink, not its target: rustup's `~/.cargo/bin/cargo` is a
    // link to the `rustup` proxy, which picks the tool from argv[0]. Resolving
    // it would make the shim run rustup itself instead of cargo.
    return resolve(candidate);
  }
  throw new Error(
    `could not resolve a real ${realCargo} outside ${destDir}. Pass --real-cargo /path/to/cargo`,
  );
};

const isFile = (path: string): boolean => {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
};

const isExecutableFile = (path: string): boolean => {
  try {
    accessSync(path, constants.X_OK);
  } catch {
    return false;
  }
  return isFile(path);
};

const pathCargo = (env: Readonly<Record<string, string | undefined>>): string | null => {
  for (const entry of (env.PATH ?? '').split(delimiter)) {
    const candidate = join(entry, 'cargo');
    if (entry.length > 0 && isFile(candidate)) {
      return candidate;
    }
  }
  return null;
};

export type ShimPathStatus =
  | { readonly kind: 'wins' }
  | { readonly kind: 'shadowed'; readonly by: string }
  | { readonly kind: 'not-on-path' };

/**
 * Where a fresh PATH lookup of `cargo` lands relative to the installed shim.
 * rustup's `~/.cargo/bin` commonly precedes `~/.local/bin`, in which case
 * the shim never runs. The install reports that instead of letting the
 * operator discover it from an idle dashboard.
 */
export const shimPathStatus = (
  shimPath: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
): ShimPathStatus => {
  const found = pathCargo(env);
  if (found === null) {
    return { kind: 'not-on-path' };
  }
  return canonical(found) === canonical(shimPath) ? { kind: 'wins' } : { kind: 'shadowed', by: found };
};

export interface InstalledShim extends RenderShimOptions {
  /** The canonical file, so a refresh writes through a symlinked `cargo`. */
  readonly path: string;
}

const shimExec = /^exec (.+) exec --host shim -- (.+) "\$@"$/mu;

/** The words `shellQuote` joined: bare, or single-quoted with `'\''` for a quote. */
const shellWords = (text: string): string[] =>
  [...text.matchAll(/(?:'[^']*'|\\'|[^\s'\\])+/gu)].map(([word]) =>
    word.replaceAll(/'([^']*)'|\\(')/gu, '$1$2'),
  );

/** The first `cargo` on PATH when `renderCargoShim` wrote it, with what it embeds. */
export const findCargoShim = (
  env: Readonly<Record<string, string | undefined>> = process.env,
): InstalledShim | null => {
  const found = pathCargo(env);
  if (found === null) {
    return null;
  }
  const path = canonical(found);
  let text: string;
  try {
    // A shim is a few hundred bytes; the real cargo is a multi-megabyte binary.
    if (statSync(path).size > 4096) {
      return null;
    }
    text = readFileSync(path, 'utf8');
  } catch {
    return null;
  }
  const match = text.startsWith('#!/bin/sh\n# cargo-hauler PATH shim') ? shimExec.exec(text) : null;
  if (match === null) {
    return null;
  }
  const [realCargo, ...extra] = shellWords(match[2] ?? '');
  return realCargo === undefined || extra.length > 0
    ? null
    : { haulerArgv: shellWords(match[1] ?? ''), path, realCargo };
};

/** The version in the nearest package.json above `script`, when that package is cargo-hauler. */
export const cargoHaulerVersion = (script: string): string | null => {
  for (let dir = dirname(script); ; dir = dirname(dir)) {
    const manifest = join(dir, 'package.json');
    if (existsSync(manifest)) {
      try {
        const parsed: unknown = JSON.parse(readFileSync(manifest, 'utf8'));
        return isRecord(parsed) && parsed.name === 'cargo-hauler' && typeof parsed.version === 'string'
          ? parsed.version
          : null;
      } catch {
        return null;
      }
    }
    if (dirname(dir) === dir) {
      return null;
    }
  }
};

export type CargoShimState =
  | { readonly kind: 'current' }
  | { readonly kind: 'missing'; readonly path: string }
  | { readonly kind: 'stale'; readonly entry: string; readonly version: string | null };

/**
 * A shim is current when it runs this cargo-hauler version through a node
 * that still works. Which node, and which copy of that version, do not
 * matter: mise can pin a different node per directory.
 */
export const cargoShimState = (shim: InstalledShim, currentVersion: string): CargoShimState => {
  const [node, entry] = shim.haulerArgv;
  if (node === undefined || entry === undefined) {
    return { entry: shimHaulerEntry(shim.haulerArgv), kind: 'stale', version: null };
  }
  if (!isExecutableFile(node)) {
    return { kind: 'missing', path: node };
  }
  if (!isFile(entry)) {
    return { kind: 'missing', path: entry };
  }
  const version = cargoHaulerVersion(entry);
  return version === currentVersion ? { kind: 'current' } : { entry, kind: 'stale', version };
};

/**
 * Publish a complete executable without following symlinks or modifying
 * other hard links to an existing cargo binary. Staging beside the final
 * path keeps rename/link on the same filesystem.
 */
const publishShim = (path: string, text: string, replace: boolean): void => {
  const stagingDir = mkdtempSync(join(dirname(path), '.cargo-hauler-shim-'));
  try {
    const staged = join(stagingDir, 'cargo');
    writeFileSync(staged, text, { flag: 'wx' });
    chmodSync(staged, 0o755);
    if (replace) {
      renameSync(staged, path);
    } else {
      // Unlike rename, link fails if an entry appeared after the caller's lstat.
      linkSync(staged, path);
    }
  } finally {
    rmSync(stagingDir, { recursive: true, force: true });
  }
};

/** Rewrites an installed shim to run `haulerArgv`, keeping the Cargo path it already runs. */
export const refreshCargoShim = (shim: InstalledShim, haulerArgv: readonly string[]): void => {
  publishShim(shim.path, renderCargoShim({ haulerArgv, realCargo: shim.realCargo }), true);
};

export const installCargoShim = (options: InstallShimOptions): InstallShimResult => {
  // The shim is a POSIX shell script; installing it as `cargo` on Windows
  // would produce a file cmd.exe cannot execute. Refuse clearly instead.
  if ((options.platform ?? process.platform) === 'win32') {
    throw new Error(
      'hauler install-shim is not supported on Windows, because the shim is a POSIX shell script.',
    );
  }
  const destDir = options.destDir ?? defaultShimDir();
  mkdirSync(destDir, { recursive: true });
  const path = join(destDir, 'cargo');
  if (lstatSync(path, { throwIfNoEntry: false }) !== undefined && options.force !== true) {
    throw new Error(`cargo already exists at ${path}. Pass --force to replace it`);
  }
  const realCargo = resolveRealCargo(options.realCargo, destDir);
  publishShim(path, renderCargoShim({ ...options, realCargo }), options.force === true);
  return { haulerScript: shimHaulerEntry(options.haulerArgv), path, realCargo };
};
