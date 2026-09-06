import { resolve } from 'node:path';

import { describe, expect, it } from 'effect-rstest';
import { inspectWorkbenchSurface } from 'agent-bundle/test';

/**
 * workbench-surface proof: what `agent-bundle dev` would hand the Workbench
 * for this project — route catalog, providers, lifecycle fixtures per host,
 * counts, and page availability — from the same compiler pass, with no
 * browser and no dev server.
 */
const projectRoot = resolve(import.meta.dirname, '..', '..');

describe('workbench surface', () => {
  it('catalogs the hauler server, the routed CLI, the event routes, and the daemon provider', async () => {
    const surface = await inspectWorkbenchSurface({ root: projectRoot });
    expect(surface.provenance.proofLevel).toBe('workbench-surface');

    expect(surface.catalog.servers.map((server) => server.name)).toEqual(['hauler']);
    expect(surface.catalog.providers.map((provider) => provider.name)).toEqual(['hauler-daemon']);
    expect(surface.catalog.routeCount).toBeGreaterThanOrEqual(15);

    const routeIds = surface.catalog.groups.flatMap((group) => group.entries.map((entry) => entry.route.id));
    for (const id of ['tool:hauler/hauler_status', 'cli:daemon', 'event:session/start', 'event:stop', 'event:tool/before', 'event:tool/after']) {
      expect(routeIds).toContain(id);
    }
    // The status tool's `.cli.ts` projection is catalogued as `hauler status`, in the CLI's own flag spellings.
    const statusCommand = surface.catalog.groups
      .flatMap((group) => group.entries)
      .find((entry) => entry.route.id === 'tool:hauler/hauler_status' && entry.commandUsage !== undefined);
    expect(statusCommand?.commandUsage).toContain('status [--command-contains <string>]');
    expect(statusCommand?.commandUsage).toContain('--lane <string>');
  }, 60_000);

  it('offers every plugin host for lifecycle replay and counts the four targets', async () => {
    const surface = await inspectWorkbenchSurface({ root: projectRoot });
    expect(surface.counts).toMatchObject({ skills: 2, targets: 4 });
    expect(surface.counts.mcpServers).toBeGreaterThanOrEqual(4);
    const sessionStart = surface.lifecycles.find((lifecycle) => lifecycle.routeId === 'event:session/start');
    expect(sessionStart?.targets.map((target) => target.target).sort()).toEqual(['claude', 'codex', 'cursor']);
    expect(surface.advanced).toEqual(expect.arrayContaining(['artifact', 'hosts']));
  }, 60_000);
});
