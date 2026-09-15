---
name: cargo-hauler
description: Use when Cargo work is queued, shared, backgrounded, stalled, or represented by a cc-N ticket.
---
# cargo-hauler

Cargo Hauler coordinates expensive Cargo work across agents. Let the broker
own shared processes; use ticket state and output instead of process probes or
duplicate runs.

Use the `hauler` command on `PATH` or the equivalent `hauler_*` tool. Run
`hauler <command> --help` when a flag is unclear. Paths under plugin caches,
`artifact/`, and `scripts/hauler.mjs` are not public CLI entry points.

## Choose the next action

- Find your work with scoped status filters, such as
  `hauler status --session <id>` or `hauler status --ticket cc-N`.
- Reuse an identical or covering in-flight run. Scope new work with
  `-p <crate>` when one package answers the question.
- Submit long work with `hauler exec --bg -- cargo …`; wait with
  `hauler await cc-N` instead of polling or launching another run.
- Express build-before-test ordering with `--after cc-N`.
- Inspect failures with `hauler result cc-N --full`. Shared runs can include
  other participants' output, so identify the failing package or filter before
  editing code.
- If a ticket is explicitly reported `stalled`, broker-kill the leader ticket
  named by the diagnostic and resubmit. An `overrun` ticket is still active;
  background or await it.
- A reattaching message is progress. Exit 69 with
  `brokered run aborted: daemon connection lost` has no usable result; resubmit.
- If the daemon is unreachable, run the original Cargo command.

## Safety boundaries

- Never kill Cargo by PID. Use `hauler kill cc-N` only for work that is
  explicitly stalled or intentionally cancelled so riders and ledger state
  settle correctly.
- Do not bypass the broker with an absolute toolchain Cargo path. Prefix the
  normal Cargo command for wrappers or toolchain pins.
- Do not restart or replace a busy compatible daemon; accepted work remains
  valid until it settles.
