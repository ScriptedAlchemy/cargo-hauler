---
'cargo-hauler': patch
---

Fail closed with exit 69 when a reattached `hauler exec` cannot restore the complete Cargo output stream, and serialize overlapping reattach claims so a stale connection cannot replace the latest ticket owner (#187).
