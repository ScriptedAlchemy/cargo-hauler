---
'cargo-hauler': patch
---

Identity, coverage, and batch/fold now refuse to share when the forwarded caller environment differs, so two `cargo test`/`check` runs that differ only in `OUT` (or any other variable cargo will see) no longer coalesce onto one result (#222). Duration estimates still key on the compile surface — including when the variable arrives via `env OUT=…` — so one-off output paths do not cold-start EWMA. The PATH shim stays in the foreground for non-TTY callers instead of returning exit 75 and running later against torn-down state; `CARGO_HAULER_SHIM_BACKGROUND=1` restores auto-background for scripts that consume tickets (#223).
