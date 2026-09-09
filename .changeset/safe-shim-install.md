---
"cargo-hauler": patch
---

Install PATH shims without following existing symlinks or overwriting other hard links to Cargo executables. Refuse dangling destination links unless `--force` is supplied, publish complete executable files atomically, and prevent an existing destination symlink from being embedded as the shim's own real Cargo path.
