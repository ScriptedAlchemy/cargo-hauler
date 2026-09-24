---
'cargo-hauler': patch
---

`cargo-hauler-install install <host>` now rewrites a PATH `cargo` shim that runs another cargo-hauler version, or a `node` or `hauler.js` that is gone, and keeps its Cargo path. A Node or cargo-hauler upgrade no longer leaves scripted cargo on an old client that falls back to passthrough. `cargo-hauler-install doctor` adds that finding to its report as an error, in text and `--json`, and exits `1`. A newly written shim also runs the real Cargo when its embedded `node` is gone, instead of failing every `cargo` with exit 127.
