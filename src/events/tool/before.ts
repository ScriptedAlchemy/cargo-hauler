import { events } from 'agent-bundle/routes';

import { commandMentionsHauler } from '../../internal/host-hooks/tokens.js';
import { extractShellCommand } from '../../internal/host-hooks/tool-input.js';

/**
 * The gate every shell tool call pays (#90): commands that name neither cargo
 * nor hauler continue before the rendered view, bash parser, and daemon probe
 * load.
 */
export default events.tool.before(
  {
    requires: ['events.toolBefore.deny'],
    runtime: 'standalone',
    timeoutMs: 10_000,
    tools: ['shell'],
  },
  (context) =>
    commandMentionsHauler(extractShellCommand(context.canonical.payload.toolInput?.value))
      ? context.render('./before.view.js', {})
      : { outcome: 'continue' },
);
