---
'cargo-hauler': patch
---

Build against Effect `4.0.0-rc.117` and agent-bundle main (`1a77058`). The daemon and its clients read the socket through Effect's new pull-based reader. Requests, streaming output, reattach, kill, and shutdown behave as before. The bundle carries one Effect copy, so the CLI stays near its previous size.
