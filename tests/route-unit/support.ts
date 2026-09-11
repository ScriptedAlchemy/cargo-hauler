import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { AgentDocument, JsonValue } from '@agent-bundle/runtime';

import type { DaemonConfigShape } from '../../src/internal/daemon/config.js';
import type { HaulerDaemonContext } from '../../src/providers/hauler-daemon.js';

/**
 * Route-unit support: isolate the daemon state directory per test so the
 * conventional `haulerDaemon` provider resolves an empty, never-started
 * daemon, and build provider fixtures that point routes at an in-process
 * fixture broker through the harness `context.providers` seam.
 */

export const withIsolatedStateDir = async <A>(body: (stateDir: string) => Promise<A>): Promise<A> => {
  const root = mkdtempSync(join(tmpdir(), 'hauler-route-unit-'));
  const stateDir = join(root, 'state');
  try {
    return await withStateDir(stateDir, () => body(stateDir));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

/** Point `CARGO_HAULER_STATE_DIR` at a fixture broker so real providers resolve it. */
export const withStateDir = async <A>(stateDir: string, body: () => Promise<A>): Promise<A> => {
  const previous = process.env.CARGO_HAULER_STATE_DIR;
  process.env.CARGO_HAULER_STATE_DIR = stateDir;
  try {
    return await body();
  } finally {
    if (previous === undefined) {
      delete process.env.CARGO_HAULER_STATE_DIR;
    } else {
      process.env.CARGO_HAULER_STATE_DIR = previous;
    }
  }
};

/** The provider value the artifact would mount for this config. */
export const haulerDaemonFor = (config: DaemonConfigShape): HaulerDaemonContext => ({
  config,
});

/** Harness options mounting an explicit `haulerDaemon` provider (no conventional provider runs). */
export const withDaemon = (config: DaemonConfigShape) => ({
  context: { providers: { haulerDaemon: haulerDaemonFor(config) } },
});

/** The root `Agent.Result` metadata — what the MCP projector emits as `_meta`. */
export const documentMetadata = (document: AgentDocument): JsonValue | undefined =>
  document.root.kind === 'result' ? document.root.metadata : undefined;

export const fakeCargoEnv = (binDir: string): Record<string, string> => ({
  CARGO_HAULER_CARGO_BIN: join(binDir, 'cargo'),
  PATH: `${binDir}:${process.env.PATH ?? ''}`,
});
