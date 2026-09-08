---
'cargo-hauler': patch
---

The `cargo-hauler` skill no longer tells agents how to set `CARGO_TARGET_DIR`. The one bullet that did ("do not hand-roll `CARGO_TARGET_DIR` isolation … the daemon already serializes per (workspace, target dir)") read as if sharing one target dir across checkouts were safe because runs are serialized; it is not — cargo's `-C metadata` hash is relative to the workspace root, so worktrees of one repo with the same layout collide on artifact names and stale binaries run silently (#185). Target-dir policy belongs to the operator and, where hauler can detect the footgun, to the daemon, not to the prompt. (#186)
