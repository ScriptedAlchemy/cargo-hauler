---
"cargo-hauler": patch
---

A running daemon from another release whose status report this client cannot read no longer makes `hauler status`, `hauler daemon status`, `hauler log`, `hauler last`, the dashboard, or the MCP tools print a raw schema error or a stack trace. They render the new `skewed` daemon state: the daemon's pid and version, whether it is older, newer, or another build, the command that replaces it, and its tickets from the ledger with their recorded status. `hauler result` and `hauler await` name a ticket record they cannot read instead of dumping the schema error.
