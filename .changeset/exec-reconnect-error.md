---
"cargo-hauler": patch
---

A foreground `hauler exec` that loses its daemon during `hauler daemon restart` now names what failed while it reconnects, for example that the daemon closed the connection before answering its readiness ping. It no longer prints `daemon startup failed: ConnectionClosed: ` with an empty message.
