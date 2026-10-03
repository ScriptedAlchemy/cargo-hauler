---
'cargo-hauler': patch
---

The kache status refresh now scans kache's index table in order instead of walking its crate_name index. On a 275k entry index the refresh query drops from about 5.4 s to 0.84 s of CPU.
