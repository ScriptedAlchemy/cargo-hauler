import type { AgentRequestContext } from '@agent-bundle/runtime/request';

import { resolveDaemonConfig, type DaemonConfigShape } from '../daemon/config.js';
import type { HaulerDaemonContext } from '../../providers/hauler-daemon.js';

import { isRecord } from '../util/guards.js';

const isDaemonConfig = (value: unknown): value is DaemonConfigShape =>
  isRecord(value) &&
  typeof value.stateDir === 'string' &&
  typeof value.socketPath === 'string' &&
  typeof value.databasePath === 'string';

const isHaulerDaemonContext = (value: unknown): value is HaulerDaemonContext =>
  isRecord(value) && isDaemonConfig(value.config);

/**
 * The daemon connection for this request: the `haulerDaemon` provider when
 * the request scope mounted one, otherwise `undefined` (a scope with an
 * explicit empty provider map, such as a degraded-path test).
 */
export const requestDaemon = async (
  context: Pick<AgentRequestContext, 'provider'>,
): Promise<HaulerDaemonContext | undefined> => {
  try {
    const provided: unknown = await context.provider('haulerDaemon');
    return isHaulerDaemonContext(provided) ? provided : undefined;
  } catch (error) {
    if (error instanceof TypeError && error.message.startsWith('Unknown provider ')) return undefined;
    throw error;
  }
};

/**
 * The daemon config for this request: the provider's when mounted, otherwise
 * resolved from the environment (the same answer a script or hook wrapper
 * gets).
 */
export const requestDaemonConfig = async (
  context: Pick<AgentRequestContext, 'provider'>,
): Promise<DaemonConfigShape> => (await requestDaemon(context))?.config ?? resolveDaemonConfig();
