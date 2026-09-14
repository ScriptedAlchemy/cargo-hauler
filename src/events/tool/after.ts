import { events } from 'agent-bundle/routes';

import { readCursor } from '../../internal/host-hooks/hook-state.js';
import { pingSessionCompleted } from '../../internal/host-hooks/session-ping.js';
import { commandMentionsHauler, hiddenCargoRun } from '../../internal/host-hooks/tokens.js';
import { documentValue } from '../../internal/util/json.js';
import { extractShellCommand, extractShellOutput } from '../../internal/host-hooks/tool-input.js';

/**
 * Ping the daemon at each shell boundary, but load the rendered view only for
 * cargo/hauler activity or newly finished background tickets.
 */
export default events.tool.after(
  {
    requires: ['events.toolAfter.context'],
    runtime: 'standalone',
    timeoutMs: 10_000,
    tools: ['shell'],
  },
  async (context) => {
    const command = extractShellCommand(context.canonical.payload.toolInput?.value);
    if (
      commandMentionsHauler(command) ||
      hiddenCargoRun(command, extractShellOutput(context.canonical.payload.toolResponse?.value))
    ) {
      return context.render('./after.view.js', {});
    }
    const session = context.canonical.payload.sessionId?.value;
    if (session === undefined || session.length === 0) return { outcome: 'continue' };
    const asOfMs = Date.now();
    const pinged = await pingSessionCompleted(session, readCursor(session));
    return pinged.kind === 'finished' && pinged.tickets.length > 0
      ? context.render('./after.view.js', documentValue({ ...pinged, asOfMs }))
      : { outcome: 'continue' };
  },
);
