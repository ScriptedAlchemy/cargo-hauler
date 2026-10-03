---
"cargo-hauler": minor
---

Lanes now follow the directory cargo locks: one lane per workspace root, target dir, and profile output dir, so `cargo build` and `cargo build --profile perf` run at once while `build` and `check` still queue. A whole-target `cargo clean` waits for every build on its target dir, and builds that arrive meanwhile wait for it with a `target-clean` admission hold.
