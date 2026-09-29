---
"cargo-hauler": patch
---

Add read-only CI planning that starts workers only for lanes with eligible tests or queued-check maintenance. Drains share admission logic and revalidate the advisory plan under their lane lock.
