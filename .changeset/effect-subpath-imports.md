---
"cargo-hauler": patch
---

Effect modules are imported by subpath, so `hauler` run from TypeScript source no longer loads every `@effect/platform-node` module at startup, and a lint rejects Effect package-root imports. The bundled binaries are unchanged.
