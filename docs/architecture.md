# Architecture: who owns what

This is the contributor map. The README explains what cargo-hauler does and
how to install it; this document answers "which file owns this behavior?"
and walks the three main paths through the code.

## Two kinds of files under `src/`

Agent Bundle discovers entrypoints by convention (see the comment in
`agent-bundle.config.ts`). Those paths are fixed and stay at the top of `src/`:

| Path | What the framework makes of it |
| --- | --- |
| `layout.tsx` | the shell around every rendered route |
| `mcp/hauler/tools/*.tsx`, `*.cli.ts` | the `hauler` MCP server's tools and their `hauler <command>` projections |
| `mcp/hauler/apps/dashboard.tsx`, `dashboard.html` | the MCP App (`ui://cargo-hauler/dashboard.html`) |
| `events/session/start.tsx`, `events/stop.tsx`, `events/tool/{before,after}.tsx` + `*.preflight.ts` | hook routes; the preflights run before the rendering runtime loads |
| `cli/daemon.ts` | the plain `cargo-hauler daemon` command |
| `providers/hauler-daemon.ts` | request-scoped daemon configuration |
| `scripts/hauler.ts` | the `hauler` process entry (`scripts/hauler.mjs` in the artifact, the `hauler` npm bin) |
| `cargo-hauler-install.ts` | the `cargo-hauler-install` npm bin |
| `skills/*` | skills |
| `constants.ts` | static metadata literals routes read at config time |

Everything else is ordinary imported code under `src/internal/<owner>/`.
`internal/` is a namespace, not a layer: a route imports
`internal/operations/tickets.ts` directly. There is no controller → service →
repository chain and none should be added.

## Ownership map

| Owner | Holds | Must not import |
| --- | --- | --- |
| `internal/contracts/` | the daemon/client NDJSON vocabulary (`protocol.ts`: records, messages, status), the tool input/output schemas (`tool-schemas.ts`), `wire-version.ts`, `version-order.ts` | daemon, client, or UI implementation |
| `internal/cargo/` | how a cargo command is understood and run: `argv.ts`, `env.ts` (which variables ride along), `intent.ts` (normalisation, the coalescing key), `workspace.ts`, `topology.ts` (`cargo metadata` graph), `execution/` (`executor.ts` spawns cargo, `real-cargo.ts` finds the real binary, `cargo-json.ts`, `build-phase.ts`) | the broker or the ledger |
| `internal/daemon/` | the daemon process: `main.ts` composes the Effect layers, `config.ts` resolves them; `runtime/` owns the socket, singleton lock, server connections and lifecycle; `broker/` owns ticket state (jobs, lanes, riders, dependencies, replay, stall); `scheduling/` is policy (selection, admission pressure, cost estimates, batch folding); `reporting/` builds status-report numbers | UI |
| `internal/storage/` | the SQLite ledger and per-ticket output logs. Writable opening with migration is the daemon's; `openLedgerDatabaseReadOnly` (with its recovery fallback) is what a stopped-daemon status read uses | broker, UI |
| `internal/client/` | everything that talks to the socket from outside the daemon: `control.ts` (one-shot requests, ping), `tickets.ts` (submit/await/fetch/kill), `ensure-daemon.ts` (spawn or replace), `shutdown.ts`, and the streaming foreground run in `exec.ts` | broker internals |
| `internal/operations/` | what the routes call: `tickets.ts`, `status.ts` (live report or ledger snapshot), `inspection.ts` (`last`, `log`, `status` results), `daemon-health.ts`, attribution, output loading | React |
| `internal/host-hooks/` | the shell and session hook handlers (`before-shell.ts`, `after-shell.ts`, `stop-hold.ts`), the preflight-safe token test (`tokens.ts`, `tool-input.ts`), the small native-socket RPC client (`rpc.ts`, `session-ping.ts`), hook state and records | React, Effect (see below) |
| `internal/integrations/kache/` | kache index status, store pressure readers, and the pressure presentation model | daemon runtime |
| `internal/platform/` | machine facts: state and socket paths, the 0700/0600 private-file policy, socket errno walking, NDJSON line buffering, `hauler-binding.ts` (where the `hauler` executable is) | anything above it |
| `internal/shim/` | the PATH shim installer and entry classification | daemon |
| `internal/ui/documents/` | agent documents: components over `view-models.ts`, composed in `documents.tsx`; `streaming.tsx`, `surface.ts` | daemon, storage |
| `internal/ui/dashboard/` | the browser App's DOM-free logic (`lib.ts`); the route in `mcp/hauler/apps/` mounts it | `node:` modules |
| `internal/ui/shared/` | formatters and text both renderers use (`format.ts`, `shared-target.ts`) | `node:` modules |
| `internal/util/` | genuinely generic one-liners: `guards.ts`, `id.ts`, `text.ts`, `ansi.ts`, `json.ts` | anything |

Where a current file still spans two owners (for example `operations/status.ts`
opens the ledger itself), extract it in its own commit rather than moving it
twice.

## Glossary

- **ticket** — the public id (`cc-N`) of one request, live for its whole life
  in the ledger.
- **request record** — the ledger row for a ticket; `RequestRecord` in
  `contracts/protocol.ts`. The status report's `StatusRow` is the bounded
  summary (no output tail).
- **job** — the broker's in-memory unit of work for a leader
  (`daemon/broker/job-state.ts`).
- **leader** — the job that actually spawns cargo.
- **rider** — a request attached to an in-flight leader instead of running
  (`attachments.ts`; `coverage.ts` decides *how* it may ride: identity or
  coverage).
- **lane** — one FIFO per (workspace root, resolved target dir)
  (`lane-exec.ts`); a lane runs at most one leader's compile at a time.
- **admission permit** — the machine-wide cap on concurrently admitted
  leaders (`config.ts`, `scheduling/scheduler.ts`); the CPU pressure arm in
  `scheduling/pressure.ts` defers admission (`reporting/disk-stats.ts` only
  reports).
- **prerequisite** — an explicit `--after cc-N` dependency
  (`broker/dependencies.ts`).
- **passthrough** — the client ran cargo itself because no daemon could be
  reached; the run is spooled and ingested into the ledger later.

## Walkthrough 1: submitting cargo

Foreground, from a shell hook:

1. `events/tool/before.preflight.ts` reads the raw command with
   `host-hooks/tool-input.ts` and `host-hooks/tokens.ts`; a command that
   names neither `cargo` nor `hauler` gets `continue` before anything else
   loads.
2. `events/tool/before.tsx` calls `host-hooks/before-shell.ts`.
   `host-hooks/inspect.ts` parses the shell line (bashjsast) and
   `cargo/intent.ts` parses the cargo argv; `host-hooks/probe.ts` pings the
   daemon through `host-hooks/rpc.ts` for the `cargo clean` guard; the
   rewrite target comes from `platform/hauler-binding.ts`. The result is
   `hauler exec --session … --host … -- cargo …`.
3. `scripts/hauler.ts` dispatches `exec` to `client/exec.ts`
   (`runExecClient`). `client/parse.ts` reads the argv, `client/env.ts`
   selects the environment that travels, `client/local-invocation.ts`
   short-circuits non-compiling subcommands.
4. `client/ensure-daemon.ts` finds or starts a daemon (`resolveDaemonEntry`,
   version gate via `contracts/version-order.ts`; replacement through
   `client/shutdown.ts`). The client then opens the socket with
   `client/control.ts` helpers and sends an `exec` message from
   `contracts/protocol.ts`.
5. `daemon/runtime/server.ts` (`makeConnectionHandler`) decodes the line and
   calls `Broker.submit` (`daemon/broker/broker.ts`). Submission runs
   `cargo/intent.ts` (`normalizeCargoIntent`) and lane creation
   interruptibly, then the atomic section: `storage/ledger.ts`
   `createRequest`, attach as a rider (`attachments.ts`) or
   `lanesRuntime.enqueueJob` (`lane-exec.ts`), `dependencies.block/watch`.
   The `ack` goes back with the ticket and queue position.
6. `lane-exec.ts` admits the next job by `scheduling/scheduler.ts` score
   (estimates from `scheduling/cost.ts`), waits for pressure headroom, and
   runs it with `cargo/execution/executor.ts`, which spawns
   `cargo/execution/real-cargo.ts` with the jobserver from
   `daemon/runtime/jobserver.ts`. Output goes to the connection, to
   `broker/replay.ts` for late attachers, and to `storage/ticket-log.ts`.
7. On exit the ledger row is finished, riders are settled by
   `attachments.ts`, and `client/exec.ts` exits with cargo's code. A
   connection lost after `ack` reattaches (`Broker.reattach`, exit `69` when
   that fails) rather than resubmitting; a daemon that could not be reached
   at all falls back to passthrough (`executeCargo` directly) and spools the
   record for the ledger.

Background, from an MCP host: `mcp/hauler/tools/hauler_request.tsx` →
`operations/tickets.ts` (`submitTicketRequest`, attribution from
`operations/attribution.ts`) → `client/tickets.ts` (`submitBackgroundAck`) →
the same `Broker.submit`.

## Walkthrough 2: reading status

1. `mcp/hauler/tools/hauler_status.tsx` (or `hauler_status.cli.ts`) takes
   the daemon config from `operations/request-config.ts` (the
   `providers/hauler-daemon.ts` provider when mounted, else the environment)
   and calls `operations/inspection.ts` `loadStatusResult`.
2. `operations/status.ts` `loadHaulerSnapshot` first probes the daemon with
   `operations/daemon-health.ts`. A reachable daemon answers a `status`
   request (`client/control.ts` `requestExpecting`) that
   `daemon/runtime/server.ts` serves from `Broker.report`: lane statuses
   from `lane-exec.ts`, admission from the scheduler, counters from
   `daemon/reporting/*` (`broker-metrics.ts`, `savings.ts`,
   `wait-split.ts`, `disk-stats.ts`, `tail-preview.ts`), kache from
   `integrations/kache/status.ts`, metrics windows from the ledger.
3. A daemon that is stopped or unresponsive is reported as exactly that
   (`DaemonHealth`), and the recent rows come from
   `storage/ledger.ts` `openLedgerDatabaseReadOnly`; daemon-only sections
   are absent, never empty successes.
4. The result is validated against `contracts/tool-schemas.ts`
   (`statusResultSchema`) and rendered by `ui/documents/documents.tsx`
   (`StatusDocument`) over `ui/documents/view-models.ts`; `surface.ts` picks
   the MCP or CLI spelling of follow-up commands.

The dashboard App (`mcp/hauler/apps/dashboard.tsx`) polls the same
`hauler_status` tool and projects the result with `ui/dashboard/lib.ts` and
`ui/shared/format.ts`; it never imports daemon or storage code.

## Walkthrough 3: processing a shell hook

`tool/before` is Walkthrough 1 steps 1–2. `tool/after`:

1. `events/tool/after.preflight.ts` reads the command and its output
   (`host-hooks/tool-input.ts`), and — once per call — pings the daemon for
   finished tickets with `host-hooks/session-ping.ts` over the native
   socket client in `host-hooks/rpc.ts`, using the cursor from
   `host-hooks/hook-state.ts`. Nothing here imports React or Effect.
2. `events/tool/after.tsx` calls `host-hooks/after-shell.ts`: it records the
   cargo command (`host-hooks/record.ts`), injects finished background
   tickets as context (`host-hooks/finished-ticket.ts`,
   `host-hooks/shared.ts` for the wording), advances the cursor, and flags
   cargo that ran unbrokered inside a wrapper (`tokens.ts`
   `hiddenCargoRun`).
3. `events/stop.tsx` → `host-hooks/stop-hold.ts` holds the stop while a
   foreground ticket is pending, bounded by `awaitCeilingMs` from
   `contracts/protocol.ts` and the deny counters in `hook-state.ts`.

Hook diagnostics are fixed codes (`host-hooks/best-effort.ts`), never
commands or paths.

## Boundaries the layout must keep

- **Preflights stay light.** `events/tool/*.preflight.ts` and everything
  they reach (`host-hooks/tokens.ts`, `tool-input.ts`, `session-ping.ts`,
  `rpc.ts`, `hook-state.ts`, `platform/*`, `util/*`) must not import React,
  Effect, or server-only modules. No `index.ts` barrels under `internal/`
  that could pull them in. `tests/integration/event-preflight.test.ts` and
  `tests/integration/hooks-simulate.test.ts` prove the compiled entries.
- **Two renderers.** `ui/documents/` renders for agents (JSX, server side);
  `ui/dashboard/` and `mcp/hauler/apps/dashboard.tsx` render in a browser.
  They share `ui/shared/` and `integrations/kache/pressure-model.ts` only.
- **Route metadata is static.** Tool configs, the dashboard's
  `template: './dashboard.html'`, and `constants.ts` stay literal in the
  entrypoints; the implementation they mount moves, the metadata does not.
- **Executable location is path-sensitive.** `scripts/hauler.ts` resolves
  its sibling routed CLI relative to `import.meta.url`;
  `client/ensure-daemon.ts` resolves the daemon entry from the bundled
  module's URL. Pass anchors explicitly when extracting from either.
- **Two outputs.** The composite plugin root is `artifact/`; the npm
  package is `dist/`. `agent-bundle.config.ts` keeps them separate on
  purpose.
- **Broker state has one owner.** `makeLaneRuntime` owns the lane map,
  workers, admission semaphore, and counters; the broker's submission keeps
  its interruptible-then-atomic shape. Extract functions around that state,
  never a second owner of it.

`tests/unit/boundaries.test.ts` checks the cheap half of this on value
imports: contracts import nothing below them, browser-side code imports no
`node:` or daemon/storage/client code, and the preflight closure reaches no
React, Effect, daemon, storage, client, or document module.

## Known seams still to extract

Move-only work left these where they were; each is its own change:

- `contracts/tool-schemas.ts` takes the `ShutdownOutcome` *type* from
  `client/shutdown.ts`; the type belongs in contracts.
- `operations/status.ts` combines the snapshot read, the read-only ledger
  open, and the display projections (`displayStatusRows`, guidance text);
  the projections belong in `ui/`.
- `platform/state-paths.ts` still resolves the kache index path, which
  belongs under `integrations/kache/`.
- `daemon/broker/broker.ts`, `lane-exec.ts`, `storage/ledger.ts`,
  `client/exec.ts`, and `mcp/hauler/apps/dashboard.tsx` + `ui/dashboard/lib.ts`
  are the large modules whose internal split is planned around the seams
  named above (state ownership, database mechanics vs query families,
  lifecycle phases, dashboard panels).

## Tests

`tests/` mirrors the ownership map: `unit/<owner>/` for pure tests,
`integration/` for tests that run a real broker through
`tests/support/harness.ts`, `packaging/` for the built artifact and package
entries, `acceptance/` for the real-cargo evals against `evals/fixtures/`,
plus the framework suites `route-unit/` and `browser-app/`. Run
`pnpm run check` for any change that crosses an owner boundary.
