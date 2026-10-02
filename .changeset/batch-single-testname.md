---
'cargo-hauler': patch
---

A `cargo test` run with two positional test names no longer leads, joins, or rides a shared run. Cargo rejects that invocation, and valid runs folded onto it used to inherit its usage error as a false failure.
