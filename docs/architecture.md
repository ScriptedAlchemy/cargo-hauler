# Architecture and code ownership

This is the contributor map. The README explains what cargo-hauler does and
how to install it. This document answers "which file owns this behavior?"
and walks the three main paths through the code.

## Two kinds of files under `src/`

Agent Bundle discovers entrypoints by convention (see the comment in
`agent-bundle.config.ts`). Those paths are fixed and stay at the top of `src/`:

| Path | What the framework makes of it |
| --- | --- |
| `layout.tsx` | the shell around every rendered route |
| `mcp/hauler/tools/*.tsx`, `*.cli.ts` | the `hauler` MCP server's tools and their `hauler <command>` projections |
| `mcp/hauler/apps/dashboard.tsx`, `dashboard.html` | the MCP App (`ui://cargo-hauler/dashboard.html`) |
| `events/session/start.tsx`, `events/stop.tsx`, `events/tool/{before,after}.ts` with `*.view.tsx` | hook routes, whose cheap handlers select rendered views with `context.render` |
| `cli/daemon.ts` | the plain `cargo-hauler daemon` command |
| `providers/hauler-daemon.ts` | request-scoped daemon configuration |
| `scripts/hauler.ts` | the `hauler` process entry (`scripts/hauler.mjs` in the artifact, the `hauler` npm bin) |
| `cargo-hauler-install.ts` | the `cargo-hauler-install` npm bin |
| `skills/*` | skills |
| `constants.ts` | shared runtime literals used by rendered documents and skills |

Everything else is ordinary imported code under `src/internal/<owner>/`.
`internal/` is a namespace, not a layer. A route imports
`internal/operations/tickets.ts` directly. There is no chain from controller
to service to repository, and nobody should add one.

## Ownership map

| Owner | Holds | Must not import |
| --- | --- | --- |
| `internal/contracts/` | the daemon and client NDJSON vocabulary (`protocol.ts`, with records, messages, and status), the tool input and output schemas (`tool-schemas.ts`), `wire-version.ts`, `version-order.ts` | daemon, client, or UI implementation |
| `internal/cargo/` | how a cargo command is understood and run, in `argv.ts`, `env.ts` (which variables travel with the request), `intent.ts` (normalization, the coalescing key), `workspace.ts`, `topology.ts` (`cargo metadata` graph), and `execution/` (`executor.ts` spawns cargo, `real-cargo.ts` finds the real binary, `cargo-json.ts`, `build-phase.ts`) | the broker or the ledger |
| `internal/daemon/` | the daemon process. `main.ts` composes the Effect layers, and `config.ts` resolves them. `runtime/` owns the socket, singleton lock, server connections, and lifecycle. `broker/` owns ticket state (jobs, lanes, riders, dependencies, replay, stall). `scheduling/` is policy (selection, admission pressure, cost estimates, batch folding). `reporting/` builds status-report numbers. | UI |
| `internal/storage/` | the SQLite ledger and per-ticket output logs. The daemon owns the writable open with migration. A stopped-daemon status read uses `openLedgerDatabaseReadOnly` (with its recovery fallback). | broker, UI |
| `internal/client/` | everything that talks to the socket from outside the daemon, which is `control.ts` (one-shot requests, ping), `tickets.ts` (submit, await, fetch, kill), `ensure-daemon.ts` (spawn or replace), `shutdown.ts`, and the streaming foreground run in `exec.ts` | broker internals |
| `internal/operations/` | what the routes call, which is `tickets.ts`, `status.ts` (live report or ledger snapshot), `inspection.ts` (`last`, `log`, `status` results), `daemon-health.ts`, attribution, and output loading | React |
| `internal/host-hooks/` | the shell and session hook handlers (`before-shell.ts`, `after-shell.ts`, `stop-hold.ts`), the cheap event-handler token test (`tokens.ts`, `tool-input.ts`), the small native-socket RPC client (`rpc.ts`, `session-ping.ts`), hook state, and records | React, Effect (see below) |
| `internal/integrations/kache/` | kache index status, store pressure readers, and the pressure presentation model | daemon runtime |
| `internal/platform/` | machine facts, which are state and socket paths, the 0700/0600 private-file policy, socket errno walking, NDJSON line buffering, and `hauler-binding.ts` (where the `hauler` executable is) | anything above it |
| `internal/shim/` | the PATH shim installer and entry classification | daemon |
| `internal/ui/documents/` | agent documents, which are components over `view-models.ts` composed in `documents.tsx`, plus `streaming.tsx` and `surface.ts` | daemon, storage |
| `internal/ui/dashboard/` | the browser App's DOM-free logic (`lib.ts`). The route in `mcp/hauler/apps/` mounts it. | `node:` modules |
| `internal/ui/shared/` | formatters and text both renderers use (`format.ts`, `shared-target.ts`) | `node:` modules |
| `internal/util/` | generic one-liners, which are `guards.ts`, `id.ts`, `text.ts`, `ansi.ts`, and `json.ts` | anything |

Where a current file still spans two owners (for example, `operations/status.ts`
opens the ledger itself), extract it in its own commit rather than moving it
twice.

## Glossary

- **ticket.** The public id (`cc-N`) of one request, live for its whole life
  in the ledger.
- **request record.** The ledger row for a ticket, `RequestRecord` in
  `contracts/protocol.ts`. The status report's `StatusRow` is the bounded
  summary (no output tail).
- **job.** The broker's in-memory unit of work for a leader
  (`daemon/broker/job-state.ts`).
- **leader.** The job that spawns cargo.
- **rider.** A request attached to an in-flight leader instead of running
  (`attachments.ts`). `coverage.ts` decides *how* it may attach, by identity
  or by coverage.
- **lane.** One FIFO per pair of workspace root and resolved target directory
  (`lane-exec.ts`). A lane runs at most one leader's compile at a time.
- **admission permit.** The machine-wide cap on concurrently admitted leaders
  (`config.ts`, `scheduling/scheduler.ts`). The CPU pressure arm in
  `scheduling/pressure.ts` defers admission, and `reporting/disk-stats.ts`
  only reports.
- **prerequisite.** An explicit `--after cc-N` dependency
  (`broker/dependencies.ts`).
- **passthrough.** The client ran cargo itself because it could not reach a
  daemon. The client spools the run, and the ledger ingests it later.

## Walkthrough 1: submitting cargo

Foreground, from a shell hook:

1. `events/tool/before.ts` reads the raw command with
   `host-hooks/tool-input.ts` and `host-hooks/tokens.ts`. A command that
   names neither `cargo` nor `hauler` gets `continue` before anything else
   loads.
2. `events/tool/before.view.tsx` calls `host-hooks/before-shell.ts` after the
   handler selects it with `context.render`.
   `host-hooks/inspect.ts` parses the shell line (bashjsast), and
   `cargo/intent.ts` parses the cargo argv. `host-hooks/probe.ts` pings the
   daemon through `host-hooks/rpc.ts` for the `cargo clean` guard, and the
   rewrite target comes from `platform/hauler-binding.ts`. The result is
   `hauler exec --session … --host … -- cargo …`.
3. `scripts/hauler.ts` dispatches `exec` to `client/exec.ts`
   (`runExecClient`). `client/parse.ts` reads the argv, `client/env.ts`
   selects the environment that travels, and `client/local-invocation.ts`
   runs non-compiling subcommands locally without the daemon.
4. `client/ensure-daemon.ts` finds or starts a daemon (`resolveDaemonEntry`,
   with a version gate through `contracts/version-order.ts` and replacement
   through `client/shutdown.ts`). The client then opens the socket with
   `client/control.ts` helpers and sends an `exec` message from
   `contracts/protocol.ts`.
5. `daemon/runtime/server.ts` (`makeConnectionHandler`) decodes the line and
   calls `Broker.submit` (`daemon/broker/broker.ts`). Submission runs
   `cargo/intent.ts` (`normalizeCargoIntent`) and lane creation
   interruptibly, then the atomic section. That section runs
   `storage/ledger.ts` `createRequest`, attaches the request as a rider
   (`attachments.ts`) or calls `lanesRuntime.enqueueJob` (`lane-exec.ts`),
   and calls `dependencies.block/watch`. The `ack` goes back with the ticket
   and queue position.
6. `lane-exec.ts` admits the next job by `scheduling/scheduler.ts` score
   (estimates from `scheduling/cost.ts`), waits for pressure headroom, and
   runs it with `cargo/execution/executor.ts`. The executor spawns
   `cargo/execution/real-cargo.ts` with the jobserver from
   `daemon/runtime/jobserver.ts`. Output goes to the connection, to
   `broker/replay.ts` for late attachers, and to `storage/ticket-log.ts`.
7. On exit, the ledger row is finished, `attachments.ts` settles the riders,
   and `client/exec.ts` exits with cargo's code. A connection lost after
   `ack` reattaches (`Broker.reattach`, exit `69` when that fails) rather than
   resubmitting. A client that could not reach a daemon at all falls back to
   passthrough (`executeCargo` directly) and spools the record for the
   ledger.

Background, from an MCP host, `mcp/hauler/tools/hauler_request.tsx` calls
`operations/tickets.ts` (`submitTicketRequest`, attribution from
`operations/attribution.ts`), which calls `client/tickets.ts`
(`submitBackgroundAck`), which reaches the same `Broker.submit`.

## Walkthrough 2: reading status

1. `mcp/hauler/tools/hauler_status.tsx` (or `hauler_status.cli.ts`) takes
   the daemon config from `operations/request-config.ts` (the
   `providers/hauler-daemon.ts` provider when mounted, else the environment)
   and calls `operations/inspection.ts` `loadStatusResult`.
2. `operations/status.ts` `loadHaulerSnapshot` first probes the daemon with
   `operations/daemon-health.ts`. A reachable daemon answers a `status`
   request (`client/control.ts` `requestExpecting`) that
   `daemon/runtime/server.ts` serves from `Broker.report`. Lane statuses come
   from `lane-exec.ts`, admission from the scheduler, counters from
   `daemon/reporting/*` (`broker-metrics.ts`, `savings.ts`,
   `wait-split.ts`, `disk-stats.ts`, `tail-preview.ts`), kache from
   `integrations/kache/status.ts`, and metrics windows from the ledger.
3. A daemon that is stopped, unresponsive, or skewed (another release whose
   report this client cannot decode) is reported as exactly that
   (`DaemonHealth`), and the recent rows come from
   `storage/ledger.ts` `openLedgerDatabaseReadOnly`. Daemon-only sections
   are absent, never empty successes.
4. `contracts/tool-schemas.ts` (`statusResultSchema`) validates the result,
   and `ui/documents/documents.tsx` (`StatusDocument`) renders it over
   `ui/documents/view-models.ts`. `surface.ts` picks the MCP or CLI spelling
   of follow-up commands.

The dashboard App (`mcp/hauler/apps/dashboard.tsx`) polls the same
`hauler_status` tool and projects the result with `ui/dashboard/lib.ts` and
`ui/shared/format.ts`. It never imports daemon or storage code.

## Walkthrough 3: processing a shell hook

`tool/before` is steps 1 and 2 of Walkthrough 1. `tool/after` runs these
steps:

1. `events/tool/after.ts` reads the command and its output
   (`host-hooks/tool-input.ts`). Once per call, it pings the daemon for
   finished tickets with `host-hooks/session-ping.ts` over the native
   socket client in `host-hooks/rpc.ts`, using the cursor from
   `host-hooks/hook-state.ts`. Nothing here imports React or Effect.
2. `events/tool/after.view.tsx` receives the handler's `renderInput` and calls
   `host-hooks/after-shell.ts`. That handler records the cargo command
   (`host-hooks/record.ts`), injects finished background tickets as context
   (`host-hooks/finished-ticket.ts`, with `host-hooks/shared.ts` for the
   wording), advances the cursor, and flags cargo that ran unbrokered inside
   a wrapper (`tokens.ts` `hiddenCargoRun`).
3. `events/stop.tsx` calls `host-hooks/stop-hold.ts`, which holds the stop
   while a foreground ticket is pending. `awaitCeilingMs` from
   `contracts/protocol.ts` and the deny counters in `hook-state.ts` bound
   the hold.

Hook diagnostics are fixed codes (`host-hooks/best-effort.ts`), never
commands or paths.

## Boundaries the layout must keep

- **Event handlers stay light.** `events/tool/{before,after}.ts` and everything
  they reach (`host-hooks/tokens.ts`, `tool-input.ts`, `session-ping.ts`,
  `rpc.ts`, `hook-state.ts`, `platform/*`, `util/*`) must not import React,
  Effect, or server-only modules. No `index.ts` barrels under `internal/`
  may pull them in. `tests/integration/event-handler.test.ts` and
  `tests/unit/boundaries.test.ts` prove that source closure.
  `tests/integration/hooks-simulate.test.ts` proves that the compiled
  handlers stay bounded and exclude React and the Flight worker. The wrapper
  bundles Agent Bundle's lazy provider registry, but these handlers do not
  resolve it.
- **Two renderers.** `ui/documents/` renders for agents (JSX, server side).
  `ui/dashboard/` and `mcp/hauler/apps/dashboard.tsx` render in a browser.
  They share only `ui/shared/` and `integrations/kache/pressure-model.ts`.
- **Route metadata is static.** Tool configs and the dashboard's
  `resourceUri` and `template` stay literal in their entrypoints. The
  implementation they mount can move, and the metadata does not.
- **Executable location is path-sensitive.** `scripts/hauler.ts` resolves
  its sibling routed CLI relative to `import.meta.url`.
  `client/ensure-daemon.ts` resolves the daemon entry from the bundled
  module's URL. Pass anchors explicitly when you extract code from either
  file.
- **Two outputs.** The composite plugin root is `artifact/`, and the npm
  package is `dist/`. `agent-bundle.config.ts` keeps them separate on
  purpose.
- **Broker state has one owner.** `makeLaneRuntime` owns the lane map,
  workers, admission semaphore, and counters. The broker's submission keeps
  its interruptible-then-atomic shape. Extract functions around that state,
  never a second owner of it.

`tests/unit/boundaries.test.ts` checks the cheap half of these rules on value
imports. Contracts import nothing below them. Browser-side code imports no
`node:` or daemon, storage, or client code. The cheap event-handler closure
reaches no React, Effect, daemon, storage, client, or document module.

## Known seams still to extract

Move-only work left these where they were. Each is its own change:

- `contracts/tool-schemas.ts` takes the `ShutdownOutcome` *type* from
  `client/shutdown.ts`. The type belongs in contracts.
- `operations/status.ts` combines the snapshot read, the read-only ledger
  open, and the display projections (`displayStatusRows`, guidance text).
  The projections belong in `ui/`.
- `platform/state-paths.ts` still resolves the kache index path, which
  belongs under `integrations/kache/`.
- `daemon/broker/broker.ts`, `lane-exec.ts`, `storage/ledger.ts`,
  `client/exec.ts`, and `mcp/hauler/apps/dashboard.tsx` with
  `ui/dashboard/lib.ts` are the large modules. Their planned internal split
  follows the seams named above (state ownership, database mechanics versus
  query families, lifecycle phases, dashboard panels).

## Tests

`tests/` mirrors the ownership map:

- `unit/<owner>/` holds pure tests.
- `integration/` holds tests that run a real broker through
  `tests/support/harness.ts`.
- `packaging/` covers the built artifact and package entries.
- `acceptance/` holds the real-cargo evals against `evals/fixtures/`.
- `route-unit/` and `browser-app/` are the framework suites.

Run `pnpm run check` for any change that crosses an owner boundary.
