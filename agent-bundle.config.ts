import { defineConfig } from 'agent-bundle/config';

/**
 * cargo-hauler is a generic per-workspace cargo orchestrator.
 * tracedecay is the first customer; identity is (workspace root, target dir).
 *
 * Everything else is discovered by convention (framework mode):
 * - `src/layout.tsx` → the hauler shell around every rendered route
 *   (daemon badge, lane summary, lineage footer, `_meta.hauler`).
 * - `src/mcp/hauler/tools/*.tsx` → the `hauler` MCP server's tools; each
 *   `<tool>.cli.ts` beside one is that tool's `cargo-hauler <command>`
 *   projection (positionals, flag names, `mapInput`);
 *   `src/mcp/hauler/apps/dashboard.tsx` → its MCP App.
 * - `src/events/**` → the event routes: session/start, stop, and the shell
 *   `tool/before` / `tool/after` routes, each with a `*.preflight.ts` gate
 *   that answers for a non-cargo command before the rendering runtime loads.
 * - `src/cli/**` → the CLI-only commands (`daemon`) of the generated
 *   `cargo-hauler` routed CLI (package bin and `bin/cargo-hauler.mjs` in the
 *   artifact).
 * - `src/scripts/hauler.ts` → `scripts/hauler.mjs` in the artifact (the hook
 *   rewrite target) and the package `hauler` bin (see `bin`).
 * - `src/cargo-hauler-install.ts` → the package `cargo-hauler-install` bin.
 * - `src/providers/hauler-daemon.ts` → the per-request daemon connection
 *   (config, socket discovery, health).
 * - `src/skills/*` → skills (`SKILL.md` or a rendered `SKILL.tsx`).
 * - Version comes from package.json (`agent-bundle/meta` in code).
 *
 * Adapters inject `AGENT_BUNDLE_PLUGIN_ROOT`; daemon state lives under the
 * per-user cache dir (`CARGO_HAULER_STATE_DIR` overrides); the framework's own
 * state lives in its state root outside the artifact.
 */
export default defineConfig({
  bin: {
    'cargo-hauler-install': './src/cargo-hauler-install.ts',
    hauler: './src/scripts/hauler.ts',
  },
  // Claude Code and Codex install via `<cli> plugin marketplace add`; this
  // emits the marketplace manifests those commands read.
  marketplace: true,
  // The composite plugin root every selected host reads; the npm package
  // build stays in `dist/` (the `bin` entries above require the two to be
  // separate).
  output: { distPath: 'artifact' },
  plugin: {
    description:
      'Coalesce, schedule, and stream cargo so concurrent agent sessions share compiles instead of fighting locks.',
    name: 'cargo-hauler',
  },
  runtime: { node: '22.19.0' },
  // No `scripts` block: `src/scripts/hauler.ts` is a conventional script. The
  // `bin` entry above does not claim it, so the same module ships as the npm
  // `hauler` bin and as `scripts/hauler.mjs` in the artifact — the path the
  // hooks rewrite cargo to (`scripts/hauler.mjs exec …`).
  // One artifact root holding the Claude, Codex, and Cursor projections
  // (`agent-bundle install <host> --from artifact`) plus the Agent Plugins
  // `portable` projection the Workbench playground and standard-native hosts
  // load.
  targets: ['claude', 'codex', 'cursor', 'portable'],
  // `hauler web`: the dashboard App in a plain browser tab from the installed
  // artifact, served by the framework's own host (`bin/cargo-hauler.mjs web`);
  // `hauler_status` opens it populated and `call-tool` lets its panels poll.
  web: {
    apps: [{ allow: ['call-tool'], app: 'hauler/dashboard', tool: 'hauler_status' }],
    open: 'browser',
  },
});
