---
'cargo-hauler': minor
---

A `hauler exec` whose daemon connection drops after the ticket was accepted now
reattaches instead of giving up. The client prints `connection to daemon lost;
reattaching to ticket cc-N…`, reconnects (starting the daemon again if it is
gone, a few attempts one second apart), and sends the new `reattach` message;
the daemon rebinds the ticket, replays the output the client had not yet
received, and streams the rest, so the caller's exit code is cargo's as if the
connection had held. Output the replay buffer no longer holds is announced as
`N bytes of output missed while reconnecting; full log: <path>`, never
invented. A ticket that finished in the meantime yields its exit code and log
path.

The daemon no longer kills a queued ticket the moment its submitter
disconnects: it keeps its queue position (and may start) for
`CARGO_HAULER_REATTACH_GRACE_MS` (default 30000; `0` restores the immediate
kill) and is killed as `killed while queued: submitter disconnected and did
not reattach within 30s` only if nobody reattaches. A running ticket continues
as before, marked orphaned; a reattach clears the flag.

When the ticket cannot be reattached — it never ran cargo and was killed at
the daemon's shutdown or `orphaned by daemon restart`, the daemon does not
know it, the daemon predates this release and answers the message with
`bad-message`, or no daemon answered within the budget — the client fails
closed with `brokered run aborted: daemon connection lost; ticket cc-N
<reason>` and the new exit code `69` (`EX_UNAVAILABLE`), distinct from cargo's
`1` and from `2`/`75`/`130`/`143`. It no longer prints `ticket cc-N continues
— hauler result cc-N` and exits `1` while the daemon records `killed while
queued`. `--bg` and auto-backgrounded tickets are detached, not owned, and
are unchanged. (#187)
