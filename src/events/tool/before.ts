import { events } from 'agent-bundle/routes';

import { extractShellCommand } from '../../internal/host-hooks/tool-input.js';

/**
 * The gate every shell tool call pays (#90). `handleBeforeShell` continues
 * on any command without `cargo`, so those commands, `hauler await` among
 * them, continue here before the rendered view, bash parser, and daemon
 * probe load.
 */
export default events.tool.before(
  {
    requires: ['events.toolBefore.deny'],
    runtime: 'standalone',
    timeoutMs: 10_000,
    tools: ['shell'],
  },
  (context) =>
    extractShellCommand(context.canonical.payload.toolInput?.value)?.includes('cargo') === true
      ? context.render('./before.view.js', {})
      : { outcome: 'continue' },
);
