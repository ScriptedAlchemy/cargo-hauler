import { lstat, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatInstallResult,
  formatUninstallResult,
  installBundle,
  uninstallBundle,
  type InstallHost,
  type InstallMode,
  type InstallScope,
} from './install-api.mjs';

const binName = 'cargo-hauler-install';
const hosts = Object.freeze(['claude', 'codex', 'cursor'] as const satisfies readonly InstallHost[]);

export interface InstallCliOptions {
  readonly artifactRoot?: string;
  readonly argv?: readonly string[];
  readonly write?: (value: string) => void;
  readonly writeStderr?: (value: string) => void;
}

const usage = [
  `Usage: ${binName} install <host> [--scope <scope>] [--mode local|marketplace] [--replace|--force] [--plan] [--json]`,
  `       ${binName} uninstall <host> [--scope <scope>] [--mode local|marketplace] [--keep-data | --purge-data --confirm-purge] [--force] [--plan] [--json]`,
  '',
  `Built hosts: ${hosts.join(', ')}`,
  '',
  '--replace (alias --force) replaces an existing agent-bundle install of this plugin even when',
  'its version differs. Same-version content drift is replaced automatically; foreign installs',
  'are always refused.',
  '',
  '--plan on install prints the artifact identity and destination host without changing anything.',
  'uninstall --plan prints the exact paths the receipt owns without changing anything.',
  '',
].join('\n');

const defaultArtifactRoot = (): string => dirname(dirname(fileURLToPath(import.meta.url)));

const isHost = (value: string): value is InstallHost =>
  value === 'claude' || value === 'codex' || value === 'cursor';

const isScope = (value: string): value is InstallScope =>
  value === 'local' || value === 'project' || value === 'user';

const isMode = (value: string): value is InstallMode =>
  value === 'local' || value === 'marketplace';

type InstallerVerb = 'install' | 'uninstall';

interface ParsedInstallArguments {
  readonly confirmPurge: boolean;
  readonly force: boolean;
  readonly host: InstallHost;
  readonly json: boolean;
  readonly keepData: boolean;
  readonly mode?: InstallMode;
  readonly plan: boolean;
  readonly purgeData: boolean;
  readonly replace: boolean;
  readonly scope: InstallScope;
  readonly verb: InstallerVerb;
}

interface DiagnosticLike {
  readonly code: string;
  readonly message: string;
}

const diagnosticsFor = (error: unknown): readonly DiagnosticLike[] => {
  if (typeof error === 'object' && error !== null && 'diagnostics' in error) {
    const diagnostics = (error as { readonly diagnostics: unknown }).diagnostics;
    if (Array.isArray(diagnostics) && diagnostics.length > 0) {
      return diagnostics as DiagnosticLike[];
    }
  }
  return Object.freeze([{
    code: 'AB7004',
    message: error instanceof Error ? error.message : String(error),
  }]);
};

const parseArguments = (argv: readonly string[]): ParsedInstallArguments => {
  const verb = argv[0];
  if (verb !== 'install' && verb !== 'uninstall') {
    throw new TypeError(`Expected "install <host>" or "uninstall <host>"; built hosts: ${hosts.join(', ')}.`);
  }
  const candidate = argv[1];
  if (candidate === undefined || !isHost(candidate)) {
    throw new TypeError(
      `Cannot ${verb} host ${JSON.stringify(candidate ?? '')}; built hosts: ${hosts.join(', ')}.`,
    );
  }
  let json = false;
  let replace = false;
  let force = false;
  let keepData = false;
  let purgeData = false;
  let confirmPurge = false;
  let plan = false;
  let scope: InstallScope = 'user';
  let mode: InstallMode | undefined;
  for (let index = 2; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--json') {
      json = true;
      continue;
    }
    if (argument === '--replace' && verb === 'install') {
      replace = true;
      continue;
    }
    if (argument === '--force') {
      replace = true;
      force = true;
      continue;
    }
    if (argument === '--keep-data' && verb === 'uninstall') {
      keepData = true;
      continue;
    }
    if (argument === '--purge-data' && verb === 'uninstall') {
      purgeData = true;
      continue;
    }
    if (argument === '--confirm-purge' && verb === 'uninstall') {
      confirmPurge = true;
      continue;
    }
    if (argument === '--plan') {
      plan = true;
      continue;
    }
    if (argument === '--mode') {
      const value = argv[index + 1];
      if (value === undefined || !isMode(value)) {
        throw new TypeError('Install mode must be local or marketplace.');
      }
      mode = value;
      index += 1;
      continue;
    }
    if (argument === '--scope') {
      const value = argv[index + 1];
      if (value === undefined || !isScope(value)) {
        throw new TypeError('Install scope must be user, project, or local.');
      }
      scope = value;
      index += 1;
      continue;
    }
    throw new TypeError(`Unknown installer argument ${JSON.stringify(argument)}.`);
  }
  return Object.freeze({
    confirmPurge,
    force,
    host: candidate,
    json,
    keepData,
    ...(mode === undefined ? {} : { mode }),
    plan,
    purgeData,
    replace,
    scope,
    verb,
  });
};

const readApplicationIdentity = async (
  artifactRoot: string,
): Promise<{ readonly plugin: string; readonly version: string }> => {
  const raw = JSON.parse(await readFile(join(artifactRoot, 'agent-bundle.manifest.json'), 'utf8')) as {
    readonly application?: { readonly name?: string; readonly version?: string };
  };
  const plugin = raw.application?.name;
  const version = raw.application?.version;
  if (typeof plugin !== 'string' || typeof version !== 'string') {
    throw new Error(`Package artifact root is missing application identity at ${JSON.stringify(artifactRoot)}.`);
  }
  return { plugin, version };
};

const formatInstallPlan = (options: {
  readonly artifactRoot: string;
  readonly host: InstallHost;
  readonly mode?: InstallMode;
  readonly plugin: string;
  readonly scope: InstallScope;
  readonly version: string;
}): string => {
  const mode = options.mode === undefined ? '' : ` (${options.mode} mode)`;
  return `Would install ${options.plugin}@${options.version} for ${options.host}${mode} from ${options.artifactRoot} (scope ${options.scope})\n`;
};

export const runInstallCli = async (options: InstallCliOptions = {}): Promise<number> => {
  const argv = options.argv ?? process.argv.slice(2);
  const write = options.write ?? ((value: string) => {
    process.stdout.write(value);
  });
  const writeStderr = options.writeStderr ?? ((value: string) => {
    process.stderr.write(value);
  });
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    write(usage);
    return 0;
  }
  let parsed: ParsedInstallArguments | undefined;
  try {
    parsed = parseArguments(argv);
    const artifactRoot = options.artifactRoot ?? defaultArtifactRoot();
    const metadata = await lstat(artifactRoot).catch(() => undefined);
    if (metadata === undefined || !metadata.isDirectory()) {
      throw new Error(
        `Package artifact root is missing at ${JSON.stringify(artifactRoot)}; ` +
        'the package must ship its generated artifact directory.',
      );
    }
    switch (parsed.verb) {
      case 'install': {
        if (parsed.plan) {
          const identity = await readApplicationIdentity(artifactRoot);
          const result = {
            bundleRoot: artifactRoot,
            host: parsed.host,
            ...(parsed.mode === undefined ? {} : { mode: parsed.mode }),
            plugin: identity.plugin,
            scope: parsed.scope,
            state: 'planned' as const,
            version: identity.version,
          };
          write(parsed.json ? `${JSON.stringify(result)}\n` : formatInstallPlan({
            artifactRoot,
            host: parsed.host,
            ...(parsed.mode === undefined ? {} : { mode: parsed.mode }),
            plugin: identity.plugin,
            scope: parsed.scope,
            version: identity.version,
          }));
          break;
        }
        const result = await installBundle({
          from: artifactRoot,
          host: parsed.host,
          replace: parsed.replace,
          ...(parsed.mode === undefined ? {} : { mode: parsed.mode }),
          scope: parsed.scope,
        });
        write(parsed.json ? `${JSON.stringify(result)}\n` : formatInstallResult(result));
        break;
      }
      case 'uninstall': {
        const result = await uninstallBundle({
          confirmPurge: parsed.confirmPurge,
          force: parsed.force,
          from: artifactRoot,
          host: parsed.host,
          keepData: parsed.keepData,
          ...(parsed.mode === undefined ? {} : { mode: parsed.mode }),
          plan: parsed.plan,
          purgeData: parsed.purgeData,
          scope: parsed.scope,
        });
        write(parsed.json ? `${JSON.stringify(result)}\n` : formatUninstallResult(result));
        break;
      }
      default: {
        const exhaustive: never = parsed.verb;
        throw new TypeError(`Unknown installer verb ${String(exhaustive)}.`);
      }
    }
    return 0;
  } catch (error) {
    const diagnostics = diagnosticsFor(error);
    writeStderr(parsed?.json === true
      ? `${JSON.stringify(diagnostics)}\n`
      : `${diagnostics.map((entry) => `${entry.code}: ${entry.message}`).join('\n')}\n`);
    return 1;
  }
};

export const main = async (argv: readonly string[]): Promise<number> =>
  runInstallCli({ argv });
