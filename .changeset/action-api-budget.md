---
'cargo-hauler': patch
---

Spend less of the GitHub API budget in the CI action. Repeated GETs revalidate with their ETag so unchanged answers come back as free 304s, rate-limited requests wait for the reset or retry-after and retry instead of failing the job, and admission skips the per-PR read for pull requests whose list row shows no Hauler work.
