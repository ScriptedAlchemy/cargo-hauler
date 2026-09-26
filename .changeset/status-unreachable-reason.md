---
"cargo-hauler": patch
---

`hauler status`, `log`, `last`, and the dashboard now lead with why an unresponsive daemon could not be read, such as `socket could not be opened (EACCES)`, instead of claiming the daemon is up but slow.
