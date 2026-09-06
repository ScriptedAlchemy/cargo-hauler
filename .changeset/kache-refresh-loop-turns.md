---
'cargo-hauler': patch
---

Make the kache snapshot-reader event-loop test count observed loop turns during a large refresh instead of bounding a 1 ms `setInterval` gap, so the check stays deterministic on shared runners including macOS.
