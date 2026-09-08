---
'cargo-hauler': patch
---

`hauler exec --allow-shared-target` (and `CARGO_HAULER_ALLOW_SHARED_TARGET=1`
in the caller's environment) now reaches the daemon: the server dropped the
request field, so only the daemon-side setting could admit a shared target dir.
The shared-target warning has one wording everywhere — the daemon's refusal
and ack line, the lane board, and the dashboard's lane cell (other roots, full
text on hover) — and `hauler request` shows the daemon's warning in its summary
when the daemon admitted a shared target. The `hauler status` summary string
no longer carries extra warning lines the document never rendered; the lane
board is where the warning shows.
Detection no longer re-resolves already-canonical lane paths on every submit
and status poll.
