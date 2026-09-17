---
"cargo-hauler": patch
---

Resolve a symlinked default cache directory before daemon startup while retaining the strict no-symlink policy for explicit `CARGO_HAULER_STATE_DIR` paths.
