---
'cargo-hauler': patch
---

`cargo nextest --profile` no longer keys the compile lane. The lane follows `--cargo-profile` and `--release`. Nextest's own profile stays in request identity so `ci` and `default` do not coalesce.
