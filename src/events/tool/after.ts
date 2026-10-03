import { events } from 'agent-bundle/routes';

import { handleAfterShell } from '../../internal/host-hooks/after-shell.js';
import { shellEventFrom } from '../../internal/host-hooks/event-support.js';
import { documentValue } from '../../internal/util/json.js';

/**
 * The cheap handler owns the after-tool decision. It records telemetry and
 * asks the daemon for finished tickets, then loads the rendered view only
 * when the result carries additionalContext.
 */
export default events.tool.after(
  {
    requires: ['events.toolAfter.context'],
    runtime: 'standalone',
    timeoutMs: 10_000,
    tools: ['shell'],
  },
  async (context) => {
    const { host, nativeEvent } = context.canonical.provenance;
    const result = await handleAfterShell(shellEventFrom(context.canonical.payload), {
      nativeEvent,
      target: host,
    });
    return result.additionalContext === undefined
      ? { outcome: 'continue' }
      : context.render('./after.view.js', documentValue({ additionalContext: result.additionalContext }));
  },
);
