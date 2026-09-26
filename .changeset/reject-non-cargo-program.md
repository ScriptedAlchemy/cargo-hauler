---
"cargo-hauler": patch
---

`hauler exec` and `hauler request` now refuse a program that is not cargo, such as `hauler exec -- ls -la`, with `program must be cargo, got ls` and exit code 2. Before, the daemon or the local passthrough ran it and reported it as a cargo run.
