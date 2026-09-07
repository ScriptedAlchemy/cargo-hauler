---
"cargo-hauler": patch
---

Delegate `cargo-hauler-install` to `agent-bundle/install`, publish the plugin root at `dist/`, and replace `install --plan` with `doctor --host` or `uninstall --plan`. (#160)
