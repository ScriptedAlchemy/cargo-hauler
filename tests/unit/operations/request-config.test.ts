import type { AgentRequestContext } from '@agent-bundle/runtime/request';
import { describe, expect, it } from 'effect-rstest';

import { resolveDaemonConfig } from '../../../src/internal/daemon/config.js';
import { requestDaemon } from '../../../src/internal/operations/request-config.js';

describe('request daemon provider', () => {
  it('resolves the lazy provider and treats an unavailable key as absent', async () => {
    const config = resolveDaemonConfig();
    const keys: string[] = [];
    const mountedContext = {
      provider: async (key: string) => {
        keys.push(key);
        return { config };
      },
    } satisfies Pick<AgentRequestContext, 'provider'>;
    const mounted = await requestDaemon(mountedContext);
    expect(mounted).toEqual({ config });
    expect(keys).toEqual(['haulerDaemon']);

    const absentContext = {
      provider: async () => {
        throw new TypeError('Unknown provider "haulerDaemon".');
      },
    } satisfies Pick<AgentRequestContext, 'provider'>;
    const absent = await requestDaemon(absentContext);
    expect(absent).toBeUndefined();
  });
});
