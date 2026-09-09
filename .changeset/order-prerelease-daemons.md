---
"cargo-hauler": patch
---

Compare prerelease versions by SemVer identifiers when deciding whether a client may replace a daemon. Numeric counters such as `rc.10` now sort after `rc.9`, preventing an older prerelease client from being mistaken for a newer install.
