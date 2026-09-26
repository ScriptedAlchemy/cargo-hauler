---
'cargo-hauler': patch
---

A lane head now folds compatible queued requests when it wins its admission permit instead of when the lane first takes it. Under a saturated permit pool the head could wait half an hour or more for a permit while a sibling `cargo test -p other --lib -- filter` or `cargo check -p other` submitted a second later sat behind it, then waited out a permit of its own; those requests now ride the head's composite run. The fold rules themselves are unchanged.
