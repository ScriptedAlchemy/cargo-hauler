---
"cargo-hauler": patch
---

Let `hauler status`, `hauler log`, `hauler daemon status`, `hauler_status`, `hauler_dashboard`, `hauler_last`, `hauler_log`, `hauler_result`, and `hauler_await` read a protocol-compatible newer daemon without `DaemonNewerError`, while `hauler_request`, `hauler_kill`, and Cargo admission keep rejecting it; default omitted `hauler_log` arguments (#234).
