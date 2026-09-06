import type { EventPreflight } from 'agent-bundle';

import { readCursor } from '../../hooks/hook-state.js';
import { pingSessionCompleted } from '../../hooks/session-ping.js';
import { commandMentionsHauler } from '../../hooks/tokens.js';
import { extractShellCommand } from '../../lib/tool-input.js';

/**
 * The gate every shell tool call pays (#90). Every call still tells the daemon
 * the session is at a tool boundary — one bounded `session-completed` ping
 * with the session's hook-state cursor — so a finished background ticket is
 * announced on the very next tool call. The rendered route (telemetry record,
 * completion context) loads only when the daemon reports finished tickets or
 * the command itself names cargo or hauler; a daemon that is down or slow
 * answers `unavailable`, which is `continue` here. The gate's result does not
 * reach the route, so `after-shell.ts` asks the daemon once more with the
 * same cursor and advances it only after announcing — a second answer that
 * fails leaves the tickets for the next call rather than losing them.
 */
export default (async ({ canonical }) => {
  if (commandMentionsHauler(extractShellCommand(canonical.payload.toolInput?.value))) {
    return 'execute';
  }
  const session = canonical.payload.sessionId?.value;
  if (session === undefined || session.length === 0) {
    return { outcome: 'continue' };
  }
  const pinged = await pingSessionCompleted(session, readCursor(session));
  return pinged.kind === 'finished' && pinged.tickets.length > 0 ? 'execute' : { outcome: 'continue' };
}) satisfies EventPreflight<'tool/after'>;
