---
'cargo-hauler': patch
---

Install and doctor now skip a non-executable `cargo` file earlier on PATH, as the shell does. The installed shim is no longer reported as shadowed, and doctor finds a stale shim behind it.
