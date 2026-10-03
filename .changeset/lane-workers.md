---
"cargo-hauler": minor
---

The GitHub Action runs more than one worker per lane. Set the new `worker` input
(1 to 100) and name the job `Hauler pool / <lane> / <worker>` with a
`hauler-ci-<lane>-<worker>` concurrency group. Ownership records and verifies the
worker index, planning counts every live worker's remaining capacity, and workers
that race for one head agree on a single holder that finishes it. Jobs
without `worker` keep the `Hauler pool / <lane>` name.
