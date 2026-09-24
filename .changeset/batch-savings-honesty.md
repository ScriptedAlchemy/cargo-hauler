---
'cargo-hauler': patch
---

Status and the dashboard no longer count a batch rider's solo estimate as compute avoided. A batch rider's packages compile inside the leader's combined run, so it now credits no avoided compute. Its latency saved now counts its solo run from after the leader's own estimate, because it was queued behind the leader. A batch that beats both runs back to back no longer shows as "finished later than alone". Rows written before this release keep their old credit.
