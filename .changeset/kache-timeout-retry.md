---
'cargo-hauler': patch
---

A kache index scan that times out once no longer sticks. The next status refresh scans the index again instead of reporting it as timed out until the index changes or the daemon restarts.
