---
'cargo-hauler': patch
---

Move to agent-bundle's composite plugin root and framework surfaces: `artifact/` is the one root every host installs from (`cargo-hauler-install install <host>`, `node artifact/install.mjs`, the host plugin commands) in place of `artifact/<host>`; `hauler dashboard` is replaced by the installed plugin's own `bin/cargo-hauler.mjs web`; the dashboard App talks to its host through `createAppClient`; the `tool/before` and `tool/after` shell hooks are event routes with preflight gates instead of config-declared handlers; and `hauler status`, `log`, `last`, `await`, `result`, `request`, and `kill` are the MCP tools' own CLI projections, with unchanged flags and output (#107)
