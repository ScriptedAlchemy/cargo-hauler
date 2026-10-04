---
"cargo-hauler": patch
---

Refuse identity and coverage reuse of running Cargo work after workspace source changes, including same-size edits with restored mtime. Unknown source snapshots fail closed while unchanged sources and queued work retain sharing. Report active GitHub worker stages as in progress with refreshed elapsed time instead of cancelled with zero duration.
