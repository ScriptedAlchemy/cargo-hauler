---
'cargo-hauler': patch
---

`hauler result` and `hauler await` answer from the ledger when the daemon is stopped instead of exiting with `render-failed`. A ticket the stopped daemon left in flight reads as `orphaned` with the reason `stranded by a stopped daemon`, the same projection `hauler status` and `hauler last` show. A ticket missing from the ledger says so and names the stopped daemon. Both results now carry `daemon` (`running` or `stopped`), and an orphaned ticket gets next-step guidance on every detail surface.
