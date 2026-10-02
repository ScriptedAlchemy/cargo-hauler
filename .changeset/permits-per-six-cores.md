---
'cargo-hauler': patch
---

The default admission permit count is now one per six cores instead of one per eight, still clamped to 5 through 16. A 96-core machine admits 16 leaders instead of 12. Replaying a week of ledger traffic from such a machine cut summed queue wait from 1,340 h to 571 h and p90 wait from 1,264 s to 695 s. `CARGO_HAULER_MAX_CONCURRENT` still overrides the default.
