---
"cargo-hauler": patch
---

Make daemon state and relocated control sockets owner-private on Linux and
macOS. The state directory, `tickets/`, and the socket's runtime directory
are created `0700` and sensitive files — complete ticket output, the ledger
and its WAL sidecars, the daemon log, the passthrough spool, `hook-state.json`,
`hook-events.jsonl`, the pid lock, and the jobserver FIFO — `0600`,
independent of the invoking shell's umask, instead of inheriting `0755`/`0644`.
An existing state directory the running user owns is tightened in place; a
parent named by `CARGO_HAULER_STATE_DIR` is never chmod'ed, and a state path
that is a symlink, the wrong kind of entry, or owned by another user is
refused by name rather than followed, chmod'ed, or deleted. A state directory
too deep for `sun_path` now puts its socket in a `cargo-hauler-<uid>`
directory under `XDG_RUNTIME_DIR`/`TMPDIR`/the system temporary directory
instead of directly in a possibly shared temporary root, and the socket
digest no longer lowercases Unix paths, so case-distinct state directories no
longer share one control endpoint. A daemon left listening at the previous
relocated path is retired by the next client under the existing one-version
rule and stopped by `hauler daemon stop`, so the moved endpoint needs no
manual cleanup on upgrade. Windows keeps its named pipe and gains no POSIX
modes or uids. (#203)
