---
"cargo-hauler": patch
---

The notice a client gets when it falls behind now names the ticket's log file: `output truncated: client fell behind; N bytes dropped; full log: <stateDir>/tickets/cc-N.log`. It used to say `full output: hauler result cc-N --full`, but `--full` renders at most the last 768 KiB of the log, so the dropped output was often not there. A rider's notice names its leader's log. When no log is kept, the notice points at `hauler result cc-N`. `hauler result` and the `--full` help now say that `--full` shows the last 768 KiB of a larger log.
