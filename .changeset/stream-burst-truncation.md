---
"cargo-hauler": patch
---

A foreground `hauler exec` now receives every line of a long build. A `cargo build` with a few hundred or thousand output lines used to lose a run of lines near the end, with `output truncated for slow client`, even when the reader kept up. The daemon capped each connection at 128 queued messages, and one burst of demuxed lines reached that cap before the connection's writer got a turn, while the socket was idle. Output is now dropped only while a write to the client is still waiting to be accepted and more than 1 MiB of output has queued behind it. The notice then reads `output truncated: client fell behind; N bytes dropped; full output: hauler result cc-N --full`, and the whole run stays in the ticket log.
