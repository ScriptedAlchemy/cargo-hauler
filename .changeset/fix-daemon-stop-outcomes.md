---
"cargo-hauler": patch
---

Make `hauler daemon stop` and `cargo-hauler daemon stop` preserve typed shutdown outcomes and fail when the daemon refuses, times out, returns a protocol error, disconnects before acknowledgement, or remains alive (#200).
