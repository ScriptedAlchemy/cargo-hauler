---
"cargo-hauler": patch
---

The daemon no longer freezes when a client stops reading a large build. Once a write has waited 2 seconds on such a client, the daemon cuts that connection's queued output to 1 MiB. With tens of MiB queued, the cut used to evict one message at a time and rebuild the truncation notice on each eviction, which held the daemon's event loop for about 170 ms. Every other client, hook, and status call waited that long. The cut is now one pass, and the notice text is rendered once when it is written. A second connection's ping measured 164 to 172 ms at worst during the cut before and 15 to 27 ms after.
