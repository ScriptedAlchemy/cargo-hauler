---
"cargo-hauler": patch
---

`hauler kill` with no daemon running now exits 0 and reports `nothing to kill (the daemon is stopped)` with the ticket's ledger record, like `result` and `await`, instead of failing with `[render-failed]`. The kill result now carries a `daemon` field.
