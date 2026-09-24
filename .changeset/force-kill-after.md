---
'cargo-hauler': patch
---

`hauler daemon stop` and `hauler daemon restart` no longer hang on a cargo or test binary that ignores SIGTERM. Shutdown now escalates to SIGKILL after `CARGO_HAULER_KILL_GRACE_MS`, as an explicit `hauler kill` already did, and the `cargo metadata` lookup behind dependency-aware estimates follows the same rule.
