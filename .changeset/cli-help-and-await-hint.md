---
"cargo-hauler": patch
---

`hauler --help` now lists the routed `kill` and `web` commands. The await timeout notice and the pending-ticket guidance now say a plain await waits 30s and name the option that raises it up to 2h (`--max-wait-ms` on the CLI, `maxWaitMs` for the MCP tool).
