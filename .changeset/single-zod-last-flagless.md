---
"cargo-hauler": patch
---

Track Agent Bundle `62ffe403c5`, whose runtime declares `zod` as a peer, so the plugin's own `zod@4.6.5` is the only copy the framework types against. `hauler last` is flagless again instead of advertising an unusable `--input <json>` option, and the `kill --ticket`, `request --after`, and `result --full` fields carry their schema descriptions in host forms once more; `hauler_dashboard` gains the `limit` form field it always accepted; and a unit test now re-derives every tool's and CLI route's input metadata from its zod schema so the two cannot drift.
