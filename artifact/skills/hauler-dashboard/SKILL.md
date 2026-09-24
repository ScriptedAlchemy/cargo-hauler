---
description: Use when opening, previewing, interpreting, or troubleshooting the
  cargo-hauler dashboard, its metrics windows, admission state, lanes, kache
  data, or live ticket output.
name: hauler-dashboard
---

# hauler-dashboard

Use the dashboard for machine-wide fleet state (cargo-hauler 0.9.5). Use the `cargo-hauler` Skill for submitting, scoping, or waiting on work.

## Open it

- **MCP App host:** call `hauler_dashboard`. Hosts that render MCP Apps attach `ui://cargo-hauler/dashboard.html` beside its result; the text result is one summary line. For the queue as text — daemon badge, admission meter, lane board, in-flight and recent tickets, kache summary — call `hauler_status`, which never opens the App.
- **Plain browser:** run `node <plugin root>/bin/cargo-hauler.mjs web` — the installed plugin's own `web` command (the root is the directory holding `agent-bundle.manifest.json`; in a checkout, `artifact/`). It serves the App standalone against the plugin's own `hauler` server, opens it, and stays in the foreground until Ctrl-C; the panels show the daemon's own data and poll every five seconds. From the plugin checkout, `pnpm run dev` and the Workbench's MCP page preview `ui://cargo-hauler/dashboard.html` the same way.

## Read the panels

- **Contention:** machine load, CPU I/O wait, disk pressure, and admission permits. `3/5 +1 riding` means three real Cargo processes hold permits and one request is sharing existing work.
- **In flight / Queue:** active leaders and waiting tickets, including workspace, submitter, elapsed/wait time, and cost estimate.
- **Metrics:** switch among `1h`, `24h`, and `all`. Run counts, outcomes, and percentiles use the selected window. Compute avoided, latency saved, and riders served are all-time SQLite-ledger totals. Latency compares each rider's solo estimate with the time it rode a started leader — waiting behind a leader that had not started yet is lane wait, not a cost of attaching — and negative values (the leader ran longer than the rider alone would have) are included.
- **Queue wait vs run:** per window, total queue wait against total run time for leaders, and the wait split by cause. *Lane-bound* is time a same-lane leader was still compiling (before its `Finished` line or exit); *permit-bound* is time every admission permit was held with no same-lane compile to blame; *other* is admission holds, `--after` prerequisites, and scheduling latency. The permit split assumes the daemon's current permit count — the caption says so — and "lane time released by hand-back" is the execution time of test and run leaders that ran with their lane already handed to the next compile.
- **By command:** run timings per subcommand and profile, each with its own n. Commands that execute after building (test, run, bench) add a compile-vs-exec line from the leaders that handed back; pure compiles never do, so `cargo check` shows none.
- **Kache:** optional machine-wide cache freshness, active compile roots, and slowest crates grouped by profile, plus store pressure: blob bytes against kache's `local_max_size` (read from `KACHE_MAX_SIZE` or its config; "limit unknown" names why when it cannot be), the last GC from `gc_stats.json` with any `skipping eviction` warnings matched from kache's logs, and `key_ms` mean/p95 from the events sidecar. Warnings appear when the store is over its limit or the last GC declined or skipped evictions. No panel means kache is unavailable or disabled, not that the daemon failed.
- **Lanes:** work grouped by resolved `(workspace root, target dir)`. Only lanes with queued or running work are active.
- **History:** finished tickets and the command each request actually ran as, including composite batch expansion.

Click an in-flight row to open its live output drawer. It refreshes every three seconds. Completed and queued rows show their durable ledger state.

## Diagnose contention

1. Check the admission meter before assuming the daemon is stalled.
2. Match queued work to its lane and current leader.
3. Filter with `hauler status` `--session`, `--cwd`, `--ticket`, `--status`, `--command-contains` (or the equivalent structured fields of `hauler_status`); do not replace the dashboard with `ps` polling.
4. Await or attach to the ticket with `hauler_await` / `hauler await`. Do not kill Cargo to clear a lane.
