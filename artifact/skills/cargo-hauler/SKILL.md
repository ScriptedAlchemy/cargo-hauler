---
name: cargo-hauler
description: Submits, scopes, and waits on Cargo work through the shared hauler daemon so agents reuse in-flight runs instead of starting duplicates. Use when Cargo work is queued, shared, backgrounded, or stalled, or when a cc-N ticket appears.
---
# cargo-hauler

cargo-hauler coordinates expensive Cargo work across agents. The hauler daemon
owns shared Cargo processes. Read ticket state and output instead of probing
processes or starting duplicate runs.

Use the `hauler` command on `PATH` or the equivalent `hauler_*` tool. If a flag
is unclear, run `hauler <command> --help`. Paths under plugin caches,
`artifact/`, and `scripts/hauler.mjs` are not public CLI entry points.

## Choose the next action

- Find your work with scoped status filters, such as
  `hauler status --session <id>` or `hauler status --ticket cc-N`.
- Reuse an in-flight run that is identical to your command or covers it. If one
  package answers the question, scope new work with `-p <crate>`.
- Submit long work with `hauler exec --bg -- cargo …`. Wait with
  `hauler await cc-N` instead of polling or starting another run.
- To order a test run after a build, pass `--after cc-N`.
- Read failures with `hauler result cc-N --full`. A shared run can include
  output from other agents' requests. Identify the failing package or test
  filter before you edit code.
- If hauler explicitly reports a ticket as `stalled`, run `hauler kill` on the
  leader ticket that the diagnostic names, then resubmit. An `overrun` ticket is
  still active. Background it or await it.
- A reattaching message reports progress, not failure. Exit 69 with
  `brokered run aborted: daemon connection lost` means the run has no usable
  result. Resubmit it.
- If the daemon is unreachable, run the original Cargo command.

## Safety boundaries

- Never kill Cargo by PID. `hauler kill cc-N` lets riders and ledger state
  settle correctly. Use it only for work that hauler reports as stalled or that
  you intend to cancel.
- Do not bypass the daemon with an absolute path to a toolchain's Cargo. For
  wrappers or toolchain pins, prefix the normal Cargo command.
- Do not restart or replace a busy daemon that is compatible. Work that the
  daemon accepted stays valid until it settles.
