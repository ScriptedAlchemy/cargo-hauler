---
'cargo-hauler': patch
---

Dashboard: the Contention panel's CPU stat is labelled `1-min load average`
instead of `loadavg (1m)`, which read as a stuck "loading" timer. Same value:
the machine's Unix 1-minute load average over its cores.
