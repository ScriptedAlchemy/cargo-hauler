---
'cargo-hauler': patch
---

The Hauler CI GitHub Action now prints the failing error, its stack, and the GitHub rate-limit headers of a rejected request when the controller fails, instead of only the generic failure line.
