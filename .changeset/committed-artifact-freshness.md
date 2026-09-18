---
"cargo-hauler": patch
---

Keep GitHub cargo-hauler artifacts current by rejecting stale source inputs and executable modes before `pnpm check` rebuilds, and generate next-version artifacts through `release:version` without main self-pushes. (#261)
