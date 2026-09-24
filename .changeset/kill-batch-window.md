---
"cargo-hauler": patch
---

`hauler kill` on a ticket waiting in its lane's batch window now settles it killed right away. The kill used to wait out the whole window (`CARGO_HAULER_BATCH_WINDOW_MS`) before the ticket settled.
