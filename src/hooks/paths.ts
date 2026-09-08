import { daemonSocketPath, resolveStateDir } from '../status.js';

export const resolveHookStateDir = (
  env: Readonly<Record<string, string | undefined>> = process.env,
): string => resolveStateDir(env);

export const resolveHookSocketPath = (
  env: Readonly<Record<string, string | undefined>> = process.env,
  platform: NodeJS.Platform = process.platform,
): string => daemonSocketPath(resolveHookStateDir(env), platform, env);
