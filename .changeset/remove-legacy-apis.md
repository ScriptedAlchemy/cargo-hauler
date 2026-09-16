---
'cargo-hauler': minor
---

Require explicit wire-protocol identity, with a one-time daemon stop or restart after upgrading from 0.7.1–0.7.3; remove the `hauler daemon stop --force` alias and stop probing pre-hardening daemon socket paths (#243).
