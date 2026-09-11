---
'cargo-hauler': patch
---

Internal: the implementation behind the Agent Bundle entrypoints now lives
under `src/internal/<owner>/` (contracts, cargo, daemon/{runtime,broker,
scheduling,reporting}, storage, client, operations, host-hooks,
integrations/kache, platform, shim, ui/{documents,dashboard,shared}, util)
instead of `daemon/`, `lib/`, `hooks/`, and friends; `tests/` is grouped by
what a test executes (unit, integration, packaging, acceptance). A move-only
change: no route, executable, protocol, or scheduling behaviour changed.
`docs/architecture.md` is the ownership map and walkthrough.
