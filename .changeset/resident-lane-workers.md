---
"cargo-hauler": minor
---

GitHub Action throughput: route mode delegates a trusted head that leaves policy untouched at once instead of waiting for lane checks, and the `route-wait-minutes` input is removed (drain still verifies checks before admission; run `mode: enqueue` on a schedule to recover missed enqueues). Drain workers are resident: a new `idle-polls` input (default 5, 0 to 60) makes a worker rescan after an empty admission scan, one poll interval apart, before exiting with its warm sandbox. A snapshot superseded by a new PR head now keeps the warm sandbox for the next snapshot.
