---
'cargo-hauler': patch
---

The `tool/before` hook no longer loads its rendered view for shell commands without `cargo`, so `hauler await` and `hauler result` calls skip about 450 ms of hook time.
