---
'cargo-hauler': patch
---

Different agents running the same cargo command in the same workspace share one run again. Request identity no longer hashes the per-conversation ids that Cursor, Claude Code, and Codex export, such as `CURSOR_CONVERSATION_ID`, `CLAUDE_CODE_SESSION_ID`, and `CODEX_THREAD_ID`, and cargo still receives them.
