---
"cargo-hauler": patch
---

A background process that outlives cargo no longer keeps the daemon from stopping. A test that spawns `sleep 30 &` or a build script that forks used to leave the daemon holding that ticket's output pipes until the process exited, so `hauler daemon stop` reported the daemon as still running and restarts stalled. Once cargo exits and its short output drain ends, the daemon closes the ticket's pipes. The background process keeps running, and a write it makes to the closed output fails as it would for any closed pipe. The same applies to `hauler exec` runs without a daemon.
