---
'cargo-hauler': patch
---

Point the published `bin` map at the files the tarball ships (`cargo-hauler` → `dist/bin/cargo-hauler.mjs`) and stage `cargo-hauler-install` so `cargo-hauler-install install <host>` works after `npm i -g` (#143).
