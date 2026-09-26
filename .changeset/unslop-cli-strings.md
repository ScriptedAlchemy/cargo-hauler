---
"cargo-hauler": patch
---

CLI help, MCP tool descriptions, rendered documents, hook notices, and daemon and client messages now use whole sentences instead of semicolons, dashes, and arrows. For example, `hauler daemon restart` prints `restarted from pid 41 (0.4.1) to pid 42 (0.4.4)`, a passthrough prints `running cargo directly: daemon unreachable`, and a finished-ticket notice ends with `Call hauler_result cc-42.`. Status values, exit codes, ticket ids, `prefix: detail` error shapes, and field labels are unchanged.
