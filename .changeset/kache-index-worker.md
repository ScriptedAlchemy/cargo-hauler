---
'cargo-hauler': patch
---

The daemon scans the kache index in a worker thread, so a large index no longer stalls `hauler status`, ticket reads, or pings while it refreshes. A 4.5 GB index held the socket for about 590 ms per refresh; it now answers within a few milliseconds. The kache section names why the index could not be read (`not detected`, `index unreadable`, or `index read timed out` after 30 s) instead of reporting every failure as not detected.
