import {
  chmodSync,
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
  const guard =
    options.haulerArgv.length >= 2 ? `[ -f ${entry} ]` : `command -v ${entry} >/dev/null 2>&1`;
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
 * resolve the shim itself through PATH — the shim would call the broker
 * which spawns the shim: a self-attachment deadlock.
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
        `--real-cargo ${realCargo} points at the shim itself; pass the real cargo binary`,
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
    `could not resolve a real ${realCargo} outside ${destDir}; pass --real-cargo /path/to/cargo`,
  );
};

const pathCargo = (env: Readonly<Record<string, string | undefined>>): string | null => {
  for (const entry of (env.PATH ?? '').split(delimiter)) {
    const candidate = join(entry, 'cargo');
    if (entry.length > 0 && existsSync(candidate)) {
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
 * the shim never runs — surface that at install time instead of letting the
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
  const path = pathCargo(env);
  // A shim is a few hundred bytes; the real cargo is a multi-megabyte binary.
  if (path === null || statSync(path).size > 4096) {
    return null;
  }
  const text = readFileSync(path, 'utf8');
  const match = text.startsWith('#!/bin/sh\n# cargo-hauler PATH shim') ? shimExec.exec(text) : null;
  if (match === null) {
    return null;
  }
  const [realCargo, ...extra] = shellWords(match[2] ?? '');
  return realCargo === undefined || extra.length > 0
    ? null
    : { haulerArgv: shellWords(match[1] ?? ''), path, realCargo };
};

export type CargoShimState =
  | { readonly kind: 'current' }
  | { readonly kind: 'missing'; readonly path: string }
  | { readonly kind: 'stale' };

/** An installed shim versus the one `haulerArgv` would install now. */
export const cargoShimState = (shim: InstalledShim, haulerArgv: readonly string[]): CargoShimState => {
  const missing = shim.haulerArgv.find((part) => isAbsolute(part) && !existsSync(part));
  if (missing !== undefined) {
    return { kind: 'missing', path: missing };
  }
  return shim.haulerArgv.join('\0') === haulerArgv.join('\0') ? { kind: 'current' } : { kind: 'stale' };
};

export const installCargoShim = (options: InstallShimOptions): InstallShimResult => {
  // The shim is a POSIX shell script; installing it as `cargo` on Windows
  // would produce a file cmd.exe cannot execute. Refuse clearly instead.
  if ((options.platform ?? process.platform) === 'win32') {
    throw new Error(
      'hauler install-shim is not supported on Windows: the shim is a POSIX shell script. Windows is not yet supported.',
    );
  }
  const destDir = options.destDir ?? defaultShimDir();
  mkdirSync(destDir, { recursive: true });
  const path = join(destDir, 'cargo');
  if (lstatSync(path, { throwIfNoEntry: false }) !== undefined && options.force !== true) {
    throw new Error(`cargo already exists at ${path}; pass --force to replace it`);
  }
  const realCargo = resolveRealCargo(options.realCargo, destDir);
  // Publish a complete executable without following symlinks or modifying
  // other hard links to an existing cargo binary. Staging beside the final
  // path keeps rename/link on the same filesystem.
  const stagingDir = mkdtempSync(join(destDir, '.cargo-hauler-shim-'));
  try {
    const staged = join(stagingDir, 'cargo');
    writeFileSync(staged, renderCargoShim({ ...options, realCargo }), { flag: 'wx' });
    chmodSync(staged, 0o755);
    if (options.force === true) {
      renameSync(staged, path);
    } else {
      // Unlike rename, link fails if an entry appeared after the lstat above.
      linkSync(staged, path);
    }
  } finally {
    rmSync(stagingDir, { recursive: true, force: true });
  }
  return { haulerScript: shimHaulerEntry(options.haulerArgv), path, realCargo };
};
