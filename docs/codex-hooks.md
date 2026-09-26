# Codex hook timeout verification

Status is **verified on Codex CLI 0.147.0** (live probe, 2026-09-01, Linux,
Node v22.23.1, model gpt-5.6-sol, plugin 0.1.6 and 0.1.7 against a production
hauler daemon).

The probe used a scratch crate whose `build.rs` sleeps 90s. It submitted the
crate as a background ticket tagged with the real Codex session id
(`hauler request --session <uuid> -- cargo build`), then resumed the session
with `codex exec resume <uuid>` so its Stop event fired while the ticket was
pending. The probe sampled hook process lifetimes at 200ms, read deny
bookkeeping from `hook-state.json`, and read delivery timing from the session
rollout log (`~/.codex/sessions/...`).

## Measured behavior

| Scenario | Result |
| --- | --- |
| Stop with no pending tickets | hook lives ~0.05s, exits silently (continue) |
| Stop hold, default `CARGO_HAULER_STOP_WAIT_MS` (30000) | hook lived ~29s, denied, not killed |
| Stop hold, `CARGO_HAULER_STOP_WAIT_MS=120000` | hook lived **72.4s**, denied, not killed |
| Deny handling | reason injected as a `<hook_prompt hook_run_id="stop:...">` user message. The model answers again inside the same `codex exec` run (`stop_hook_active` re-entry works). |
| Release | session exited 3 to 4s after the ticket completed |
| Standalone hook loop (no Codex, live daemon) | pending deny after 30.06s, "finished" deny 18.0s into the next hold (event-driven at ticket completion), no-pending continue 0.05s |

## Findings

- Codex 0.147.0 runs plugin `hooks.json` hooks natively. PreToolUse rewrote
  `cargo build` to a session-tagged `hauler exec`, and PostToolUse and Stop
  both fired. Tickets tagged with the session uuid associate correctly with
  the Stop hold.
- **No per-hook kill was observed.** Invocations of ~29s and 72.4s ran to
  their own wait bound and delivered their deny intact. Codex accepts
  `stop.timeout = 900` without complaint. The probe did not test whether
  Codex would enforce a kill somewhere between 72s and 900s, because a
  15-minute hold is impractical to probe. Treat budgets above ~72s as
  plausible but unmeasured.
- Codex respects deny decisions. `{"decision":"block","reason":...}` keeps the
  session alive and re-prompts the model, and the run ends only once a Stop
  passes with no output.
- `CARGO_HAULER_STOP_WAIT_MS` propagates from the Codex process
  environment into hook processes (the 120000 override took effect).
- **Hook trust controls whether hooks run.** This machine had no
  `[hooks.state]` trust entries for the plugin. The probes ran hooks only
  because `codex exec` was invoked with `--dangerously-bypass-hook-trust`.
  Codex emits "Enabled hooks may run without review for this invocation", and
  the flag does not persist trust. Headless automation must pass that flag or
  ship persisted trust, otherwise Stop holds do not run. The probe did not
  test the interactive trust-prompt flow.

## Quirks observed

- The deny reason captures the ETA at invocation start. A hold that expires
  1s before the build finishes still reports the start-time ETA ("ETA 30s").
- With a wait bound above ~58s, the daemon answered the single `await` early
  (deny bookkeeping landed at 58.2s). The hook process then stayed on the
  half-closed await socket until ticket completion before exiting. This was
  observed once. The deny was composed at 58.2s and delivered at 72.4s
  alongside completion, as a "results pending" deny where "finished" would
  have been accurate. Codex tolerated the delay. The cost is fidelity, not a
  kill. The follow-up belongs in `waitForTickets`, which should destroy the
  socket once a response arrives and re-check pending tickets after a
  timed-out await.

## Practical guidance

- Keep the generated `stop.timeout = 900`, because Codex enforced nothing
  shorter.
- The default 30s `CARGO_HAULER_STOP_WAIT_MS` is safe on Codex, and the
  re-deny loop works, so long waits are unnecessary. Values up to ~60s are
  also verified-safe (a 72.4s invocation survived). With the current daemon
  await behavior, anything above ~58s buys no extra hold fidelity.
- No `~/.codex/config.toml` hook-timeout override exists or was needed. The
  config only stores per-hook trust hashes under `[hooks.state]`.
