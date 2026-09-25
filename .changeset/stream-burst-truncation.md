---
"cargo-hauler": patch
---

A foreground `hauler exec` now receives every line of a long build. A `cargo build` with a few hundred or thousand output lines used to lose a run of lines near the end, with `output truncated for slow client`, even when the reader kept up. The daemon capped each connection at 128 queued messages, and a burst of demuxed lines filled that cap before the connection's writer got a turn, while the socket was idle. The daemon now keeps output for a client that is still accepting writes, up to 64 MiB behind. It sheds output only after a write has waited 2 seconds on a client that accepts nothing, and then keeps 1 MiB queued. The notice reads `output truncated: client fell behind; N bytes dropped; full output: hauler result cc-N --full`, and the whole run stays in the ticket log.
