---
"cargo-hauler": patch
---

A ticket that ended before cargo started (killed while queued, a failed prerequisite, or daemon shutdown) no longer reports "0 errors, 0 warnings". Its result now shows no diagnostic counts because no cargo ran.
