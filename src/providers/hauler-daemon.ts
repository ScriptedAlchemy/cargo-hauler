import { resolveDaemonConfig, type DaemonConfigShape } from '../daemon/config.js';

/**
 * The daemon configuration for one request, mounted at
 * `(await agent()).providers.haulerDaemon` (and `useAgent().providers.haulerDaemon`
 * in synchronous components) for every generated MCP tool, routed CLI
 * command, and rendered script. Active daemon observations belong to the
 * operation that needs them, so the root layout performs no socket I/O.
 */
export interface HaulerDaemonContext {
  readonly config: DaemonConfigShape;
}

export default function haulerDaemon(): HaulerDaemonContext {
  return { config: resolveDaemonConfig() };
}
