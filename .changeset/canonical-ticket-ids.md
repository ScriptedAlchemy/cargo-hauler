---
"cargo-hauler": patch
---

Ticket ids must now be written exactly as hauler prints them, like `cc-1`. A zero-padded id such as `cc-01` is rejected as unknown instead of queueing an `--after` dependent that never wakes or making `await` sleep its full wait.
