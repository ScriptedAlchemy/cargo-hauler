---
"cargo-hauler": patch
---

Preserve timestamps for unchanged Git subtrees between managed CI snapshots so Cargo directory watchers do not rebuild solely because checkout directories are fresh. Changed and reverted subtrees retain fresh timestamps.
