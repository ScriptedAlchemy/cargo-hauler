---
'cargo-hauler': patch
---

Batch folding now accepts `--locked`, `--frozen`, and `--offline` when every participant passes the same ones. These flags only assert things about the lockfile and network access for the whole invocation, but until now any of them kept a request out of every compile batch and test composite. In the last day a quarter of brokered `build`/`check`/`clippy`/`test` leaders carried `--locked`. A one-sided flag still refuses the fold, because the composite runs with the leader's flags.
