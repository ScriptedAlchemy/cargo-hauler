---
"cargo-hauler": patch
---

`hauler request` now attributes its ticket to the calling agent. It reads `CARGO_HAULER_HOST` and `CARGO_HAULER_SESSION` like `hauler exec`, then the session id the agent host exports to its shell (`CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`, `CURSOR_CONVERSATION_ID`). Background requests and PATH-shim runs from an agent shell no longer land in the ledger with a null session.
