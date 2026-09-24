---
'cargo-hauler': patch
---

`cargo-hauler-install install <host>` now rewrites an existing PATH `cargo` shim to embed the current `hauler`, keeping its Cargo path, so a Node or cargo-hauler upgrade no longer leaves scripted cargo on an old client that falls back to passthrough. `cargo-hauler-install doctor` exits `1` while the shim runs another `hauler` or one that no longer exists.
