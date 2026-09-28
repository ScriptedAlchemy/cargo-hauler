---
"cargo-hauler": minor
---

Make await return compact state and blockers instead of full logs and internal scheduling metadata. The CLI and MCP await default is now 60 seconds; use result for output and diagnostics. Status no longer repeats active tickets in recent rows.
