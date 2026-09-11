import type { EventPreflight } from 'agent-bundle';

import { commandMentionsHauler } from '../../internal/host-hooks/tokens.js';
import { extractShellCommand } from '../../internal/host-hooks/tool-input.js';

/**
 * The gate every shell tool call pays (#90): a command that names neither
 * cargo nor hauler is `continue` — no decision, the host's own flow — before
 * the rendered route, its bash parser, and the daemon probe are loaded.
 */
export default (({ canonical }) =>
  commandMentionsHauler(extractShellCommand(canonical.payload.toolInput?.value))
    ? 'execute'
    : { outcome: 'continue' }) satisfies EventPreflight<'tool/before'>;
