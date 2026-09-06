---
'cargo-hauler': patch
---

Hand the `tool/after` preflight's session-completed answer to the route as `preflight` data so the after-shell hook does not query the daemon a second time, and pin `agent-bundle` and `@agent-bundle/runtime` to the preview of main `9197015b9` (agent-bundle #661/#664).
