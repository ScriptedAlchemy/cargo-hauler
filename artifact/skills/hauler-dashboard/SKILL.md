---
description: Explains how to open the cargo-hauler dashboard, read its panels,
  and diagnose contention from it. Use when opening, previewing, interpreting,
  or troubleshooting the dashboard, its metrics windows, admission state, lanes,
  kache data, or live ticket output.
name: hauler-dashboard
---

# hauler-dashboard

The dashboard shows machine-wide state for cargo-hauler 0.9.13. To submit, scope, or wait on work, use the `cargo-hauler` skill.

## Open it

- **In an MCP App host.** Call `hauler_dashboard`. Hosts that render MCP Apps attach `ui://cargo-hauler/dashboard.html` beside its result. The text result is one summary line. To read the queue as text, call `hauler_status`. It returns the daemon badge, admission meter, lane board, in-flight and recent tickets, and kache summary, and it never opens the App.
- **In a plain browser.** Run the installed plugin's `web` command, `node <plugin root>/bin/cargo-hauler.mjs web`. The plugin root is the directory that holds `agent-bundle.manifest.json`. In a checkout, the root is `artifact/`. The command serves the App standalone against the plugin's own `hauler` server, opens it, and stays in the foreground until Ctrl-C. The panels show the daemon's data and poll every five seconds. In the plugin checkout, `pnpm run dev` and the Workbench's MCP page preview `ui://cargo-hauler/dashboard.html` the same way.

## Read the panels

- **Contention.** This panel shows machine load, CPU I/O wait, disk pressure, and admission permits. `3/5 +1 riding` means three running Cargo processes hold three of five permits, and one request is attached to existing work.
- **In flight and Queue.** These panels list active leaders and waiting tickets with their workspace, submitter, elapsed or wait time, and cost estimate.
- **Metrics.** Switch among `1h`, `24h`, and `all`. Run counts, outcomes, and percentiles use the selected window. Compute avoided, latency saved, and riders served are all-time totals from the SQLite ledger. Latency saved compares each rider's solo estimate with the time it spent attached to a started leader. Time spent behind a leader that had not started yet counts as lane wait, not as a cost of attaching. The total includes negative values, where the leader ran longer than the rider would have run alone. A batch rider credits no compute avoided, because its packages compiled inside the leader's run. Its solo run counts from after the leader's compile estimate.
- **Queue wait vs run.** For each window, this panel compares total queue wait with total leader run time and splits the wait by cause. *Lane-bound* is time when a leader in the same lane was still compiling, before its `Finished` line or exit. *Permit-bound* is time when every admission permit was in use and no compile in the same lane explains the wait. *Other* covers admission holds, `--after` prerequisites, and scheduling latency. The permit split assumes the daemon's current permit count, and the caption says so. The "lane time released by hand-back" stat is the execution time of test and run leaders that had already handed their lane to the next compile.
- **By command.** This panel shows run timings per subcommand and profile, each with its own n. The test, run, and bench commands execute after they build, so they add a compile-vs-exec line from the leaders that handed their lane back. Compile-only commands never add one, so `cargo check` shows none.
- **Kache.** This optional panel shows machine-wide cache freshness, active compile roots, and the slowest crates grouped by profile. It also compares store blob bytes with kache's `local_max_size`, which hauler reads from `KACHE_MAX_SIZE` or the kache config. When hauler cannot read the limit, the panel shows "limit unknown" with the reason. The panel also shows the last GC from `gc_stats.json`, any `skipping eviction` warnings matched from kache's logs, and the mean and p95 of `key_ms` from the events sidecar. Warnings appear when the store is over its limit or the last GC declined or skipped evictions. A missing panel means kache is unavailable or disabled. It does not mean the daemon failed.
- **Lanes.** This panel groups work by resolved `(workspace root, target dir)`. Only lanes with queued or running work are active.
- **History.** This panel lists finished tickets and the command each request ran as, including composite batch expansion.

Click an in-flight row to open its live output drawer. The drawer refreshes every three seconds. Completed and queued rows show their state from the durable ledger.

## Diagnose contention

1. Check the admission meter before you assume the daemon is stalled.
2. Match queued work to its lane and current leader.
3. Filter with `hauler status` `--session`, `--cwd`, `--ticket`, `--status`, `--command-contains`, or with the matching structured fields of `hauler_status`. Do not poll `ps` in place of the dashboard.
4. Await or attach to the ticket with `hauler_await` or `hauler await`. Do not kill Cargo to clear a lane.
