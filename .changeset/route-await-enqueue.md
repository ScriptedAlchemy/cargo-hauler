---
'cargo-hauler': patch
---

Route mode can outwait a late manager enqueue run. With `route-wait-minutes` set, route keeps waiting while the manager's `pull_request_target` run for the head is still queued or running, so a saturated runner pool no longer locks the head to native CI. Delegation still requires manager-owned checks.
