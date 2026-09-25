---
'cargo-hauler': patch
---

Build against agent-bundle main (`1d661b4`). The `hauler_*` MCP tools are `defineTool` definitions, which agent-bundle now requires. Tool names, inputs, results, and `hauler` CLI commands are unchanged. Built artifacts no longer embed the checkout path, so the same commit builds to the same bytes in any directory.
