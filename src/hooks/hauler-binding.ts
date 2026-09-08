import { join, resolve } from 'node:path';

import { PLUGIN_ROOT_ENV_ANCHOR, resolvePluginRoot } from '@agent-bundle/runtime/plugin';

/** The product's declared script identity, relative to a framework code root. */
export const haulerArgvForRoot = (root: string): readonly [string, ...string[]] =>
  [process.execPath, join(root, 'scripts/hauler.mjs')];

export interface StandaloneHaulerOptions {
  readonly env?: Readonly<Record<string, string | undefined>>;
  /** Standalone callers must choose: a known artifact root, or an intentional PATH lookup. */
  readonly fallback: 'path' | { readonly root: string };
  readonly cwd?: string;
  readonly warn?: (message: string) => void;
}

/**
 * Only for callers outside an observed semantic request. Generated event
 * routes pass their observed code-root binding instead. Native host aliases
 * belong to the framework adapter, not this product.
 */
export const resolveHaulerArgv = (options: StandaloneHaulerOptions): readonly [string, ...string[]] => {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const declared = env[PLUGIN_ROOT_ENV_ANCHOR];
  // The public resolver uses process.cwd(). Rebase its one canonical anchor
  // for callers with an explicit client cwd; never trim a valid path or
  // interpret native aliases. Blank/unexpanded validation stays framework-owned.
  const resolverEnv = declared === undefined || declared.trim() === ''
    ? env
    : { ...env, [PLUGIN_ROOT_ENV_ANCHOR]: resolve(cwd, declared) };
  const binding = resolvePluginRoot({
    env: resolverEnv,
    fallback: options.fallback === 'path' ? cwd : resolve(cwd, options.fallback.root),
    ...(options.warn === undefined ? {} : { warn: options.warn }),
  });
  return options.fallback === 'path' && binding.source === 'derived'
    ? ['hauler']
    : haulerArgvForRoot(binding.root);
};
