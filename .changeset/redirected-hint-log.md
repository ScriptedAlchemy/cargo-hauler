---
'cargo-hauler': patch
---

The auto-background notice for a caller whose stdout is redirected no longer sends them to `hauler result cc-N --full`, which shows only the last 768 KiB of a larger log. It now says `hauler result cc-N` names the ticket's full log once the run starts; the ticket is still queued when the notice prints, so its log does not exist yet.
