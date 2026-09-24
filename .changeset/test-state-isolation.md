---
'cargo-hauler': patch
---

The test suites no longer write into the operator's state. Each test file now gets a fresh temporary `CARGO_HAULER_STATE_DIR` and `XDG_CACHE_HOME` and drops every inherited `CARGO_HAULER_*` variable, so fixture hook records and kache probes stay out of a live dashboard.
