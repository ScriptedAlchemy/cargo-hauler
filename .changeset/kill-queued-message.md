---
"cargo-hauler": patch
---

`hauler kill` now says what happened to the ticket. A queued ticket reads `killed before it started; no cargo process ran`, a rider reads `killed; detached from cc-N`, and only a running leader still reads `the daemon stops its cargo process and frees the lane`.
