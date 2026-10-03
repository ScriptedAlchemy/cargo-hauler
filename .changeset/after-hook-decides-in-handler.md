---
"cargo-hauler": patch
---

The `tool/after` hook now records telemetry and looks up finished tickets in the cheap handler. It loads the rendered view only when there is additional context to inject, so a cargo command with nothing to announce skips the Flight worker.
