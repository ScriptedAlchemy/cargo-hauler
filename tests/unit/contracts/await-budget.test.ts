import { MAX_ROUTE_RENDER_ELAPSED_MS } from 'agent-bundle';
import { describe, expect, it } from 'effect-rstest';

import { awaitCeilingMs } from '../../../src/internal/contracts/protocol.js';
import { awaitMaxWaitMessage, ticketInputSchema } from '../../../src/internal/contracts/tool-schemas.js';
import { config as toolAwaitConfig } from '../../../src/mcp/hauler/tools/hauler_await.js';

/**
 * One `await` call waits up to the daemon's ceiling (issues #3, #32). The
 * rendered route (and `hauler await`, its CLI projection) declares a
 * `config.render.maxElapsedMs` (agent-bundle#454) that covers that whole wait
 * plus the snapshot fetch before it and the socket round trip after it — the
 * literal in the config is what the compiler reads, so this test holds it to
 * `awaitCeilingMs`.
 */
describe('await render budget', () => {
  it('covers the daemon await ceiling with transport headroom', () => {
    const maxElapsedMs = toolAwaitConfig.render.maxElapsedMs;
    expect(maxElapsedMs).toBeGreaterThan(awaitCeilingMs);
    expect(maxElapsedMs - awaitCeilingMs).toBeLessThanOrEqual(60_000);
    expect(maxElapsedMs).toBeLessThanOrEqual(MAX_ROUTE_RENDER_ELAPSED_MS);
  });

  it('caps maxWaitMs at the daemon ceiling, not the framework default', () => {
    expect(ticketInputSchema.parse({ maxWaitMs: awaitCeilingMs, ticket: 'cc-1' }).maxWaitMs).toBe(awaitCeilingMs);
    expect(ticketInputSchema.parse({ maxWaitMs: 90_000, ticket: 'cc-1' }).maxWaitMs).toBe(90_000);
    expect(() => ticketInputSchema.parse({ maxWaitMs: awaitCeilingMs + 1, ticket: 'cc-1' })).toThrow(
      awaitMaxWaitMessage,
    );
  });
});
