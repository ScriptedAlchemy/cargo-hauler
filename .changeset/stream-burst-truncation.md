---
"cargo-hauler": patch
---

A foreground `hauler exec` now receives every line of a long build. A `cargo build` with a few hundred or more output lines used to lose a run of lines, with `output truncated for slow client`, even when the reader kept up. The daemon capped each connection at 128 queued messages, and a burst of demuxed lines filled that cap before the connection's writer got its next turn. The daemon now keeps output for a client that is still accepting writes, up to 64 MiB of queued messages per connection. Once a write has waited 2 seconds on a client that accepts nothing, further output is shed down to 1 MiB of queue. The notice reads `output truncated: client fell behind; N bytes dropped; full output: hauler result cc-N --full`, and the whole run stays in the ticket log.
