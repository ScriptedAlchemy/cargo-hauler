---
'cargo-hauler': patch
---

Identical cargo requests share one run again when only shell bookkeeping differs. Request identity no longer hashes `PWD`, `OLDPWD`, `SHLVL`, `_`, or mise's `__MISE_*` session state, which change on every tool call. Other forwarded variables, such as an `OUT` path, still keep requests apart.
