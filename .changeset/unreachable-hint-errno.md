---
'cargo-hauler': patch
---

`hauler result`, `hauler await`, `hauler kill`, and `hauler request` against a live daemon whose socket cannot be opened now name the errno and point at `hauler daemon status`. They no longer say the daemon starts on demand or to run `hauler daemon start`.
