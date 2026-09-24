---
'cargo-hauler': patch
---

A live daemon whose socket this client cannot open (`EACCES`, `EMFILE`, `EPERM`) no longer reads as stopped. `hauler result` and `hauler await` fail with `render-failed` instead of calling a running ticket `orphaned` and `stranded by a stopped daemon`. `hauler status`, `hauler log`, and `hauler last` report the daemon `unresponsive` with the errno, and `hauler daemon status` names it. Only a missing socket or a refused connection falls back to the stopped-daemon ledger read.
