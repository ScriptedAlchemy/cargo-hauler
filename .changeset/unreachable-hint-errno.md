---
'cargo-hauler': patch
---

`hauler result` and `hauler await` against a live daemon whose socket cannot be opened now name the errno and point at `hauler daemon status`. They no longer say the daemon starts on demand or to run `hauler daemon start`.
