---
'cargo-hauler': patch
---

Identity attach now hashes the forwarded caller environment, so two `cargo test` runs that differ only in `OUT` (or any other variable cargo will see) no longer share a leader and a fake success (#222). Duration estimates still key on the compile surface, so one-off output paths do not cold-start EWMA. The PATH shim stays in the foreground for non-TTY callers instead of returning exit 75 and running later against torn-down state; `CARGO_HAULER_SHIM_BACKGROUND=1` restores auto-background for scripts that consume tickets (#223).
