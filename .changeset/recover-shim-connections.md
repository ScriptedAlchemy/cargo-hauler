---
'cargo-hauler': patch
---

Reconnect `hauler exec` and PATH-shim callers to an accepted ticket after a daemon transport loss, preserving queued work and Cargo's eventual exit result; report an unrecoverable daemon loss as `brokered run aborted` with `EX_TEMPFAIL` instead of claiming the ticket continues (#187).
