---
'cargo-hauler': patch
---

The GitHub Action admission scan reads open pull requests, their check runs and admission receipts through paginated GraphQL queries instead of per-PR REST calls, so a scan costs a constant number of requests and no longer exhausts the `GITHUB_TOKEN` REST quota.
