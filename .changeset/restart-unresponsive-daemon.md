---
"cargo-hauler": patch
---

`hauler daemon restart` against a daemon that accepts the connection but never answers now reports that its running state is unknown and that it was not restarted. It no longer claims no daemon was serving or tries to start a second one.
