---
'cargo-hauler': minor
---

The metrics window's queue-wait split now reports `prerequisiteBoundMs`, the wait a leader spent behind unfinished `--after` prerequisites, which "other" used to absorb. The dashboard shows it as a prerequisite-bound part.
