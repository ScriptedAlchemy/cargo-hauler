import type { EventPreflight } from 'agent-bundle';

import { readCursor } from '../../hooks/hook-state.js';
import { pingSessionCompleted } from '../../hooks/session-ping.js';
import { commandMentionsHauler, hiddenCargoRun } from '../../hooks/tokens.js';
import { documentValue } from '../../lib/json.js';
import { extractShellCommand, extractShellOutput } from '../../lib/tool-input.js';

/**
 * The gate every shell tool call pays (#90). Every call still tells the daemon
 * the session is at a tool boundary — one bounded `session-completed` ping
 * with the session's hook-state cursor — so a finished background ticket is
 * announced on the very next tool call. The rendered route (telemetry record,
 * completion context) loads only when the daemon reports finished tickets,
 * the command itself names cargo or hauler, or the command's output carries
 * cargo's status lines without the command naming cargo (a wrapper script
 * ran it past the hook and the shim); a daemon that is down or slow
 * answers `unavailable`, which is `continue` here. A finished-ticket answer
 * is returned as `data` so the route can announce it without asking again.
 */
export default (async ({ canonical }) => {
  const command = extractShellCommand(canonical.payload.toolInput?.value);
  if (commandMentionsHauler(command) || hiddenCargoRun(command, extractShellOutput(canonical.payload.toolResponse?.value))) {
    return 'execute';
  }
  const session = canonical.payload.sessionId?.value;
  if (session === undefined || session.length === 0) {
    return { outcome: 'continue' };
  }
  const pinged = await pingSessionCompleted(session, readCursor(session));
  return pinged.kind === 'finished' && pinged.tickets.length > 0
    ? { outcome: 'execute', data: documentValue({ ...pinged, asOfMs: Date.now() }) }
    : { outcome: 'continue' };
}) satisfies EventPreflight<'tool/after'>;
