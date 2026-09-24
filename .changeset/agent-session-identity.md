---
'cargo-hauler': patch
---

Different agents running the same cargo command in the same workspace share one run again. Request identity no longer hashes the `CURSOR_*`, `__CURSOR_*`, `CLAUDE_*`, `CLAUDECODE`, and `CODEX_*` session variables each agent host exports, and cargo still receives them.
