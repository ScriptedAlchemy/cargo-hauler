import { daemonSocketPath, resolveStateDir } from '../platform/state-paths.js';

export const resolveHookSocketPath = (
  env: Readonly<Record<string, string | undefined>> = process.env,
  platform: NodeJS.Platform = process.platform,
): string => daemonSocketPath(resolveStateDir(env), platform, env);
