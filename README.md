<p align="center"><img src="docs/media/logo-transparent.png" width="240" alt="cargo-hauler logo"></p>

# cargo-hauler

**One Cargo, many agents.** cargo-hauler is a broker for `cargo` on a machine
where several AI coding sessions (Claude Code, Codex, Cursor), scripts, and
terminals build the same Rust workspaces at once. It keeps them from blocking
each other on the build directory, runs the shared work once, and hands every
requester its own result.

## The problem

Agents run `cargo check`, `cargo test`, and `cargo build` often and
independently. On a shared machine, the same crates compile five times over,
and everyone blocks on `Blocking waiting for file lock on build directory`.
The CPU saturates, and shell tools kill a build at their ten-minute timeout
with no result. Nobody can see what is running, what is queued, or why their
command is slow.

## What it does

- **Intercepts every Cargo invocation.** Hooks rewrite `cargo …` in agent
  shells, an optional PATH shim covers scripts and terminals, and MCP tools
  let agents submit work directly.
- **Coalesces compatible requests.** A byte-identical command attaches to the
  run already in flight, a narrower `check` attaches to a broader `build`, and
  queued tests with the same selection fold into one `--no-fail-fast` run.
  Riders receive the leader's streamed output and exit code as if they had
  run it themselves.
- **Schedules and admits work per workspace lane.** A machine-wide permit cap
  and load, memory-pressure, and heavy-profile gates control admission. Cost
  estimates come from run history and [kache](https://github.com/ScriptedAlchemy/kache)
  priors, and `--after cc-N` dependencies order a test after the build it
  needs.
- **Keeps a ticket (`cc-N`) for every request.** The ticket records status,
  exit code, live output tail, the whole output log on disk, timings, and the
  session that asked. Long builds become background tickets that agents
  `await`, and a stop hook holds an agent's turn until its build finishes.
- **Protects the machine.** cargo-hauler refuses `cargo clean` while builds are
  in flight and flags stalled processes (and kills them when their owner is
  gone). `hauler kill` frees a stuck lane through the broker instead of by
  PID.
- **Shows everything in a live dashboard.** The dashboard shows contention,
  in-flight and queued work, lanes, per-command timings, compute avoided, and
  kache data.

![cargo-hauler dashboard with active and queued requests](docs/media/dashboard-overview.png)

## Quick start

Install from npm. The package carries a ready-made plugin for each host and
its own installer, so you need nothing else:

```sh
npm install -g cargo-hauler

cargo-hauler-install install claude --scope user   # Claude Code
cargo-hauler-install install codex                 # Codex
cargo-hauler-install install cursor --mode local   # Cursor
hauler install-shim                                # optional: cargo from scripts and terminals too
```

Restart the host (or reload the window) so new sessions load the hooks. The
daemon starts on demand with the first brokered request. `hauler status` and
the `hauler_status` tool show what is running as text, and the
`hauler_dashboard` tool opens the dashboard in hosts that render MCP Apps. To
use the hosts' own plugin commands or build from a checkout, see
[Install](#install).

The CLI is `hauler` on PATH from `npm i -g cargo-hauler`. Never run
`scripts/hauler.mjs` or any path under `.claude/plugins/cache`,
`.codex/plugins/cache`, `.cursor/plugins`, or `artifact/` directly.

## Commands and tools

`hauler` is the command line. Agents reach the same operations as MCP tools
(`hauler_status`, `hauler_await`, …), and hooks rewrite plain `cargo …` into
`hauler exec` automatically. Every command except `exec`, `daemon`, and
`install-shim` also accepts `--json` for the machine-readable value.

| Command | Behavior |
| --- | --- |
| `hauler exec [--session ID] [--host HOST] [--cwd DIR] [--bg] [--after TICKET[,TICKET…]] [--allow-shared-target] -- <cargo …>` | Submit Cargo through the daemon and stream output. Hooks rewrite commands to this form. The client resolves a relative `--cwd` against the caller's directory. `--after` (repeatable or comma-separated) keeps the request queued until every named ticket has finished. It fails with `prerequisite cc-N <status>` if one of them fails or is killed, and the daemon rejects an unknown ticket as a bad intent. `--allow-shared-target` accepts the stale-artifact risk described below and prints a warning. The command exits with cargo's code, with `130` or `143` after a SIGINT or SIGTERM (the client kills the ticket first), with `75` when auto-backgrounded, and with `69` when the daemon connection was lost and the client could not reattach the ticket (see below). |
| `hauler status [--limit N] [--cwd DIR] [--session ID] [--lane KEY] [--ticket ID …] [--status S …] [--command-contains TEXT]` | Queue, active runs, lanes, admission, and kache, optionally filtered. Lanes that share one external target directory across workspace roots carry `sharedTargetWith` and render a warning that names the target and roots. Rows are bounded summaries, and no row carries an output tail. A running row carries `outputPreview`, the last 8 lines (at most 512 bytes) of its live output, cut at a line boundary. Every other row has `outputPreview: null`. Read a ticket's whole tail with `hauler result`. |
| `hauler log [--limit N]` | Recent requests from the ledger, as the same bounded summary rows. |
| `hauler last` | The most recent request as a detail record, including its output tail. The record comes from the daemon while the daemon is running, otherwise from the ledger. |
| `hauler await <ticket> [--max-wait-ms N]` | Long-poll until the ticket finishes or the wait expires. The default wait is 30 s, and the ceiling is 2 h per call, which is the daemon's await ceiling. Call again to keep waiting. A host with its own per-call deadline still bounds one call. Codex stops a tool call at `tool_timeout_sec` (60 s unless raised). |
| `hauler result <ticket> [--full]` | A stored ticket in full, with the settled 16 KiB output tail, or the whole live in-memory tail while it runs (not the status preview). The document names the full on-disk output log (`Full output: <path> (size)`), and `--json` carries it as `request.outputPath`. `--full` prints that whole log instead of the tail. When the log does not fit, `--full` prints the last ~768 KiB and the path for the rest. |
| `hauler kill <ticket>` | Stop a ticket. The daemon drops it from the queue or sends SIGTERM (then SIGKILL) to its cargo process group, which frees the lane. Riders return to their lane or fail with it. |
| `hauler request [--session ID] [--host HOST] [--cwd DIR] [--after TICKET …] -- <cargo …>` | Submit a background request and return its ticket with where it landed in its lane (`queued behind cc-3281 (~13m)`, `waiting for cc-3281`, or `attached to cc-3281`). `--cwd` overrides the current CLI workspace. `--after` works as for `exec`. |
| `hauler daemon <run\|start\|stop\|status\|restart>` | Manage the daemon lifecycle. `stop` records its typed `shutdown` outcome in JSON. It exits `0` only after a `shutting-down` acknowledgement followed by the exit of the original pid, or when the daemon was already absent. Refusal, timeout, protocol error, disconnect before acknowledgement, and an acknowledged daemon still alive after 5 s exit `1`. `running` stays `true` when the original pid is alive and is `null` when the client could not establish liveness. `restart` is the explicit replacement path. It sends the graceful stop, waits up to 5 s for the old pid to exit, then starts a daemon from this install and prints both (`restarted from pid 741314 (0.8.5) to pid 742001 (0.8.6)`). The daemon does not hand over tickets in flight. The old daemon settles them itself as it shuts down, as `killed` with error `daemon shutdown`, and callers resubmit. Automatic upgrades are gentler. Read-only commands and MCP and dashboard reads never retire a daemon, and a protocol-compatible older or newer daemon serves them directly. Submission commands replace a protocol-compatible older daemon only after its atomic idle check. A busy or slow-to-retire daemon keeps serving the submission and emits one line such as `daemon 0.8.5 will be replaced by 0.8.6 when idle`. The client reports a daemon that does not advertise the current wire protocol with its pid and version and does not parse its payload. After upgrading from 0.7.1 through 0.7.3, stop that daemon once with `hauler daemon stop` or replace it with `hauler daemon restart` from the new install. |
| `hauler install-shim [--dir DIR] [--real-cargo PATH] [--force]` | Install the optional PATH shim. |
| `hauler web [--port N] [--no-open]` | Open the dashboard from the checkout, npm package, or installed plugin. Agent Bundle's generated web command serves the built App against the plugin's own `hauler` server, opens it populated by `hauler_dashboard`, and stays in the foreground until Ctrl-C. In an MCP host, call `hauler_dashboard` instead. |

The `hauler` MCP server exposes the same operations as `hauler_status`,
`hauler_log`, `hauler_last`, `hauler_await`, `hauler_result`, `hauler_kill`,
and `hauler_request`, with the same filters as the CLI. It also has
`hauler_dashboard`, which carries the MCP App (below) and answers with one
summary line, so opening the dashboard never pastes the status text into the
model's context. `hauler_status` and `hauler_log` rows are the same bounded
summaries (`outputPreview`, never a tail). `hauler_result`, `hauler_await`,
and `hauler_last` carry the whole tail. `hauler_request.cwd` is an optional
override. Agent Bundle's authoritative workspace supplies it when available,
and callers must provide it when the host supplied none. The server does not
treat its own process directory as the caller's workspace.

## Dashboard

The dashboard is an MCP App (`ui://cargo-hauler/dashboard.html`) attached to
`hauler_dashboard`. `hauler_status` returns the same data as text for the
model and never opens it. The dashboard shows contention and admission,
in-flight and queued work, metrics over one-hour, 24-hour, and all-time
windows, per-command timings, optional kache data, lanes, and history. Each
running row shows the last line of its output preview, and each ticket's
drawer shows the whole tail fetched through `hauler_result`. The dashboard
polls `hauler_status` every 5 s while open. Outside an MCP host, the installed
plugin's own `web` command serves the same App in a plain browser tab against
the running daemon:

```sh
node <plugin root>/bin/cargo-hauler.mjs web
```

The plugin root is the directory that `cargo-hauler-install install <host>`
printed (the one that holds `agent-bundle.manifest.json`), or `artifact/` in a
checkout after `pnpm run build`.

![cargo-hauler metrics for one-hour, 24-hour, and all-time windows](docs/media/dashboard-metrics.png)

## How the broker works

Requests enter through the `hauler` CLI, `tool/before` hooks that rewrite
shell commands, an optional PATH shim, or the `hauler_request` MCP tool. The
daemon normalizes the Cargo command into an intent, records a ticket in the
SQLite ledger, and assigns the request to a lane.

The hook parses the shell command and rewrites each Cargo invocation to
`hauler exec --session … --host … -- cargo …`. It recognizes `cargo` behind an
absolute path (`~/.cargo/bin/cargo`) and behind the wrappers agents use:
`env -u VAR X=y cargo …`, `timeout 600 cargo …`,
`rustup run <toolchain> [--] cargo …`, `stdbuf`, `nice`, `ionice`, `nohup`,
`/usr/bin/time`, `strace`, `sudo`, `xargs`, `command`, `exec`, `builtin`,
and a negated test (`while ! cargo build; do …`). The hook leaves other
`rustup` subcommands, lookups (`command -v cargo`, `type cargo`,
`which cargo`), and already-wrapped invocations alone. In a partially wrapped
list (`hauler exec -- cargo build && cargo test`), it rewrites only the
unwrapped half. The rewrite never passes `--cwd`. The command runs in the same
shell, so `hauler exec` inherits the working directory, and
`cd crates/foo && cargo build` builds in `crates/foo`.

Before rewriting, the hook checks that the parser can reproduce the original
command token for token. The hook leaves untouched every construct the pinned
parser cannot round-trip, and that command runs as plain Cargo rather than
risk a changed command. Those constructs are a background `&`
(`nohup cargo build … &`, `cargo build & pid=$!`), the `time` keyword, `|&`,
`coproc`, a heredoc that feeds a pipeline or is followed by another
statement, `elif`, and `function name { … }`.

Both shell hooks run on every shell tool call, so each decides cheaply before
it does anything else. The `tool/before` entry reads `tool_input.command` and
answers `continue` for a command with no `cargo` or `hauler` word in it. The
test is word-boundary aware. `mycargo` and `CARGO_HOME=… ls` do not match,
while `~/.cargo/bin/cargo`, `cargo-hauler`, and `echo cargo` do. A false
negative would bypass the broker, so anything that looks like a mention takes
the full path. Only a matching command evaluates the parser and the rewrite.
The `tool/after` entry runs the token test and one bounded socket ping to the
daemon (the `session-completed` request with the session's hook-state cursor,
500 ms, no Effect runtime). It loads the telemetry and notification code only
when the command was cargo-related, the daemon reported finished tickets, or
the command's output carries cargo's own status lines (`   Compiling …`,
`    Finished … profile`) without the command naming cargo. That last case is
cargo run through a wrapper script, an alias, or a shell variable. Neither the
rewrite nor the PATH shim sees that case, since a script can call the
toolchain's `cargo` binary by absolute path. The hook records it in the hook
log with its reason and tells the agent to name `cargo` in the command or use
`hauler exec -- cargo …`. The hook does not mistake a file reader that shows a
saved log (`tail build.log`) for a run. A non-cargo call with nothing
finished, or with no daemon at all, exits with no output. Measured with
`/usr/bin/time -v` on a Claude `ls -la` envelope, the compiled entries take
~50 ms wall and ~49 MB RSS. The 0.4.8 event-route wrappers took ~100 ms and
64 MB with a shared runtime available and ~560 ms and 144 MB without one.

The daemon keys each lane by workspace root and resolved target directory. A
lane compiles one job at a time, because Cargo's own build-directory lock
would serialize them anyway. Once a `test`, `nextest`, `bench`, or `run`
leader reports its build finished, Cargo has dropped that lock. The lane then
hands its slot to the next request, and that compile overlaps the leader's
test run (`CARGO_HAULER_OVERLAP_EXECUTION=0` restores strict one-at-a-time).
Different lanes may run concurrently after each acquires one of the global
admission permits. `CARGO_HAULER_MAX_CONCURRENT` controls the machine-wide
permit count. The default is one permit per eight cores, clamped between five
and sixteen, since the shared jobserver already bounds compile parallelism and
the pressure arms defer admission under load. Attached requests (riders) do
not hold permits. The admission meter counts permit holders and reports riders
separately.

By default, different workspace roots must not share a target directory
outside the requesting workspace. Cargo's `-C metadata` hash is relative to
the workspace root, so same-layout git worktrees can write identical artifact
filenames there. Another worktree may then treat the binary from whichever
worktree compiled last as fresh and run it. This is a stale-binary collision,
not a kache miss. Use a target directory per worktree, or opt in with
`--allow-shared-target` or `CARGO_HAULER_ALLOW_SHARED_TARGET=1` when you
accept that risk.

Within a lane, the daemon can reduce work in three ways:

1. **Identity attachment.** A byte-identical request attaches to an in-flight
   run.
2. **Coverage attachment.** A narrower `check` attaches to a compatible
   `build` or `check` that covers its package and target scope (`--tests`
   under `--tests` or `--all-targets` included). A compile-only
   `test --no-run` or `bench --no-run` attaches to a running `test` or `bench`
   with the same packages, target selection, features, and profile. The
   leader's test filters and `--test-threads` select what runs, not what
   compiles. The daemon releases such a request as soon as the leader prints
   its `Finished` line rather than when its tests end. Flags the daemon does
   not model (`--locked`, `--offline`, …) and arguments after `--`
   disqualify a pair only when they differ between the two requests. `check`
   never attaches to `clippy`, because a lint failure would misreport the
   check.
3. **Batch folding.** The daemon combines compatible queued compile or test
   requests into one invocation.
   The lane head folds when it wins its admission permit, so requests that
   join the lane while it waits for one still ride it.

A leading `env NAME=value … cargo …` folds into the request environment, so
the daemon schedules, estimates, attaches, and phase-tracks the cargo behind
it as that cargo command (the assignments are part of its identity). The
daemon also schedules and estimates a `bash -c` or `sh -c` script whose single
cargo statement it can read as that cargo command. It never shares or folds
that script, because the rest of the script is opaque.

The daemon logs a request that could not attach at debug level, with the gate
that refused it (`subcommand`, `opaque-arguments`, `passthrough`,
`compile-surface`, `packages`, `targets`, `channels`,
`leader-build-finished`) and both tickets. `hauler status --json` counts
refusals per gate under `metrics.attach_rejections` (the nearest miss when the
daemon considered several leaders).

Each admitted leader starts one Cargo process. Identity, coverage, and folded
batch requests share that process and receive its streamed output. A failed
stronger compile does not satisfy a coverage or compile-batch attachment. The
attached request returns to its lane unless the daemon already observed its
required compilation units as successful. Compile batches (`build`, `check`,
`clippy`) require the same target selection and features, and the same
arguments after `--`. For example, `cargo clippy -p a -- -D warnings` and
`cargo clippy -p b -- -D warnings` become
`cargo clippy -p a -p b -- -D warnings`, with the trailer once. Under
`-D warnings`, another participant's warnings fail the composite. The daemon
still releases a participant whose own units compiled cleanly as done, and the
rest rerun alone. Folded tests share the composite process and output.

`cargo test` requests fold when their `--test` or `--lib` selection and
harness flags match. `--test-threads=N`, `--nocapture`, `--quiet`, and
`--exact` are the only flags a composite carries, and only when every
participant asked for the same set. Requests that name different packages may
also differ in bare name filters. `cargo test -p a -- f1` and
`cargo test -p b -- f2` become
`cargo test -p a -p b --no-fail-fast -- f1 f2`, a run over the union of
packages with the union of filters (a filter for one package may also match
test names in another). The same holds under `--exact`, which libtest applies
to each filter it OR-s. `cargo test -p a -- x::y --exact` and
`cargo test -p b -- z::w --exact` become
`cargo test -p a -p b --no-fail-fast -- x::y z::w --exact`, with the flag
once. The only cross-package spill is a test of the same full name in the
other package. Exact and substring runs never mix. A run with `--exact` never
joins a composite without it, and a run without it never joins a composite
with it.

Requests that name the same packages share no compile and still need the same
filters. Unfiltered runs fold only with unfiltered runs. `--skip`,
`--ignored`, `--include-ignored`, `--list`, `--format`, `--logfile`, or any
other harness flag keeps a run out of composites. `cargo nextest run`
requests fold only on an identical filterset. Of the cargo flags the daemon
does not model, only `--locked`, `--frozen`, and `--offline` fold, and only
when every participant passes the same ones. On success, every participant
shares the exit. When the composite fails, a participant inherits that
failure only if it named every package and every filter the composite ran.
Otherwise the failing tests may belong to another participant's package or
filter, so the daemon requeues the participant and runs it alone (cargo's test
output does not attribute failures to packages). The leader keeps the
composite exit, as compile-batch leaders do.

Brokered output keeps cargo's stdout and stderr as separate channels. When the
caller's own stdout and stderr are the same open file (`cargo run 2>&1`, a
shared terminal, `| tee`), the client asks the daemon to run the child with
stderr on the stdout pipe. The program's write order across the two streams
then matches direct cargo exactly. Demultiplexed `build`, `check`, and
`clippy` runs keep separate channels because the JSON stream owns stdout.

![cargo-hauler request normalization, lane-local serialization, scheduling, admission, and concurrent Cargo processes](docs/media/how-it-works.png)

The scheduler estimates run cost from per-intent EWMA history. Once the ledger
has seen `buildFinishedAtMs` on an intent, the estimate splits into a compile
phase and an execution phase. The scheduler can also use per-crate timing data
from kache. Lower-cost work, requests with more attached callers,
dependency-unblocking work, and recently edited packages receive a lower
scheduling score. The scheduler scores a request at 1.5× its estimate when its
compile surface (profile, features, target, toolchain, compile-relevant
environment) differs from the one the lane built last. Similar work then runs
back to back instead of alternating test and dev profiles or flipping feature
sets on every ticket. Waiting time lowers the score further, so broad work
eventually runs.

Admission within a lane is therefore cost-ordered, not first-in-first-out. A
queued `cargo test -p foo` (a cheap estimate) normally starts before a queued
`cargo build --workspace` submitted a minute earlier, even when the test
spawns a binary that build produces. The acknowledgement shows the order, as
`ticket cc-3289 queued behind cc-3281 (1 ahead, wait ~780s)` on `exec` and
`cc-3289 submitted, queued behind cc-3281 (~13m)` on `request`. `--after`
makes the dependency explicit. `hauler exec --after cc-3281 -- cargo test …`
(or `hauler request --after`, or `after: ["cc-3281"]` on `hauler_request`)
stays `queued`, and admission and batch folding skip it until every named
ticket has settled. Prerequisites may live in any lane. A prerequisite in the
same lane also scores higher while a ticket waits on it, like a
dependency-closure leaf. A prerequisite that ends `failed` or `killed` settles
the dependent as `failed` with `prerequisite cc-N failed` and no exit code,
without spawning cargo. The dependent's riders follow the normal attachment
rules. A prerequisite that already finished resolves immediately. The daemon
rejects an unknown ticket as a bad intent. A blocked ticket never attaches to
a run already in flight, because that run started before the prerequisite
finished. `hauler status`, `hauler result`, and await heartbeats show
`waits for cc-N (running 2m/~5m)` while the daemon holds the ticket.

Admission is separate from lane scheduling. It observes one-minute load per
core and, on Linux, CPU PSI `some avg10`, then applies the configured
thresholds and the global permit cap. Load and CPU pressure never defer below
`CARGO_HAULER_LOAD_MIN` running processes, so a saturated machine still makes
progress. Memory pressure is a separate admission input. On Linux, the daemon
reads memory PSI `full avg10` and `MemAvailable`. On macOS, it reads the
kernel VM pressure level. Soft pressure defers admission like load does and
respects the same floor. Hard pressure defers admission regardless of the
floor, and the `<AdmissionState>` component shows it as a paused gate. While
Linux `MemAvailable` is below 16 GiB, the daemon also caps heavy leaders
(`--release` or `-r`, non-dev `--profile`, `cargo bench`, `--workspace` or
`--all`) to one at a time. Other leaders, riders, and machines without the
signal are unaffected, and a held ticket says why (`waiting: …`) in its card
and in heartbeats. Non-compiling cargo subcommands (`fmt`, `update`, `fetch`,
`add`, `remove`, `generate-lockfile`, `vendor`, `new`, `init`, `info`,
`uninstall`) run locally instead of queueing for a permit.

When the daemon acquires the singleton lock, it arms one GNU make jobserver
FIFO with `cores - 1` tokens and passes it to every Cargo it spawns through
`MAKEFLAGS`. Concurrent lanes then share one global rustc parallelism budget.
While the FIFO is armed, the daemon injects no `CARGO_BUILD_JOBS`, because
Cargo joins an inherited jobserver only when neither `-j` nor `build.jobs` is
set. The per-run `CARGO_BUILD_JOBS` grant is the fallback for a daemon that
could not arm the FIFO (no `mkfifo`, unwritable state directory). That grant
is the available cores divided across the configured permit count, with a
floor of four jobs. A caller's own `-j` flag or `CARGO_BUILD_JOBS` always wins
over both.

| Capability | Behavior |
| --- | --- |
| Work sharing | Identical requests attach, covered checks and compile-only `test --no-run` requests attach, and compatible queued compile or test requests fold. |
| Lane isolation | The daemon serializes each workspace-root and target-directory pair independently from other lanes. |
| Shared target safety | If different workspace roots use the same target directory outside the requesting workspace, the daemon refuses the later request unless explicitly allowed, and status flags both lanes. |
| Admission | Per-core load, Linux CPU PSI, Linux memory PSI and `MemAvailable`, macOS VM pressure, configured thresholds, and the global permit cap control new starts. |
| Parallelism | One daemon-owned jobserver FIFO is shared by every spawned Cargo. A per-run `CARGO_BUILD_JOBS` grant applies only when the daemon could not arm the FIFO. |
| Scheduling | Per-phase EWMA estimates (compile and execute), optional kache priors, fan-out, dependency topology, recent edits, and request age determine lane order. `--after cc-N` holds a request until the named tickets settle. |
| Persistence | SQLite stores tickets, output tails, timings, outcomes, and savings. The daemon keeps every leader run's whole combined output on disk as `<state dir>/tickets/<ticket>.log`. |
| Caller output and status | Output streams to attached callers, and late callers receive buffered replay. After 30 seconds without output, the client emits a progress heartbeat every 15 seconds with lane queue position, the lane-head ticket, and an aggregate wait ETA. |
| Wait escalation | The daemon flags a queued request as delayed when it has waited longer than the larger of twice its own estimate and ten minutes. Running jobs silent for more than five minutes show a quiet-duration hint. The daemon flags a live head past three times its estimate that still uses CPU or prints output as `estimateState: overrun`, and its followers see `queue.headEstimateState`. It contributes its history p90 remaining, never less than one more estimate's worth, to the queue ETA instead of zero. The daemon flags a running job as `stalled` when it is past three times its estimate and its process tree has used no CPU and printed nothing for ten minutes. The daemon kills a stalled job automatically only when its submitting connection is gone. |
| Daemon status | `running`, `stopped`, `unresponsive`, or `skewed`. The client reports a socket that exists but does not answer within its budget as unresponsive, never as stopped. It reports a daemon of another release whose status report it cannot read as skewed, with its pid, version, and the command that replaces it. |

### Tickets and long-running requests

![cargo-hauler dashboard detail drawer streaming a running ticket's live output](docs/media/dashboard-live-output.png)

Every request has a durable ticket (`cc-<n>`). SQLite stores its status, exit
code, output tail, estimate, and timestamps, and later sessions can read them.
The ledger keeps only a bounded tail (16 KiB), and the tail is a detail.
`hauler result` or `hauler_result`, `hauler await`, and `hauler last` carry
it. They return the settled tail of a finished ticket, or the whole live
in-memory tail while the run is in progress. The summary documents
(`hauler status`, `hauler_status`, `hauler log`, the dashboard's 5 s poll)
never carry a tail. A running row has `outputPreview`, the last 8 lines (at
most 512 bytes) of its live output cut at a line boundary, and every other row
has `outputPreview: null`. A running ticket therefore adds at most 512 bytes
of output to a status document instead of up to 16 KiB.

The daemon writes the run's whole combined stdout and stderr to
`<state dir>/tickets/<ticket>.log` as it emits them, up to
`CARGO_HAULER_TICKET_LOG_MAX_BYTES` (64 MiB by default, after which the file
ends with one truncation line). For a demultiplexed `check`, `build`, or
`clippy`, the log holds the rendered diagnostics stream, not cargo's JSON. A
request that attached to an in-flight run shares its leader's log, and the row
records that path. `hauler result cc-N` names the file and its size, and
`--json` carries it as `request.outputPath`. `hauler result cc-N --full` (or
`hauler_result` with `full: true`) renders the log itself, or its last 768 KiB
when larger. You can then triage a failed `cargo test` from the ticket's own
`failures:` list and panic sections instead of a second run. The startup
retention pass that prunes old ledger rows also removes their logs, along with
any log whose row is gone.

`hauler exec --bg -- cargo …` and `hauler_request` return the ticket
immediately. A synchronous request also switches to background mode when a
*measured* estimate exceeds the host's shell-tool cap (nine minutes for
Claude, ten for Codex, fourteen for Cursor). A measured estimate comes from
EWMA history or kache priors, never from the cold-start default. The PATH shim
(`--host shim`) behaves as cargo toward its caller. A non-TTY invocation (a
script, `spawnSync`, `make`) waits for the ticket to finish and returns
cargo's exit code. An interactive shim (stdout is a TTY) still
auto-backgrounds on the cap. It uses the cap of `CARGO_HAULER_HOST` when that
variable is exported, otherwise the Claude cap.
`CARGO_HAULER_SHIM_BACKGROUND=1` restores auto-backgrounding for scripts that
consume tickets themselves. The compared estimate is the whole wait, which is
the work queued ahead in the lane plus the job's own runtime. The queued line
reports it as `wait ~Ns, run ~Ns`. That conversion exits `75`
(`EX_TEMPFAIL`) with the ticket on stderr, so `cargo build && …` chains and
scripts cannot mistake "submitted" for "built". Explicit `--bg` keeps exit
`0`. When the caller's stdout is not a terminal (`cargo test > out.log`), the
notice adds that the redirect receives no output and that `hauler result cc-N`
names the ticket's full log once it runs. Failed runs also feed the estimate
history, so the scheduler does not estimate a broken build cold on every
retry.

A foreground `hauler exec` that receives SIGINT or SIGTERM (Ctrl-C, or a
`timeout N …` wrapper) asks the daemon to kill its ticket, waits for the
answer, and exits `130` or `143`. In a direct run, it terminates the cargo
process group the same way. The client reports a ticket that ends other than
`done` on stderr as `ticket cc-N <status>[ (signal)][: reason]`. Its exit code
is cargo's, `128 + signal` for a signaled run, or `1` when the daemon could
not start cargo at all.

If the connection drops after the daemon accepted the ticket (a daemon restart
or replacement, a dropped socket), the client keeps the ticket rather than the
connection. It prints `connection to daemon lost; reattaching to ticket cc-N…`,
reconnects, and sends `reattach`. It starts the daemon again if the daemon is
gone, with a few attempts one second apart. Meanwhile, the daemon holds a
ticket whose submitter vanished. A ticket that is still queued keeps its place
for `CARGO_HAULER_REATTACH_GRACE_MS` (30 s), and it may start in the meantime.
The daemon kills it as
`killed while queued: submitter disconnected and did not reattach within 30s`
only if nobody comes back. A ticket that is already running continues and is
marked orphaned as before. A reattach rebinds the ticket to the new
connection, clears the orphan flag, replays the output the client had not yet
received from the replay buffer, and streams the rest. The exit code is
cargo's only when the client restored the complete stdout and stderr stream.
If the replay buffer no longer holds every missed byte, or the ticket finished
before its output stream could be rebound, the client names the full log and
fails closed rather than return success with truncated machine-readable
output.

The client cannot reattach a ticket in these cases. Its output is incomplete,
it never ran cargo and was killed at the daemon's shutdown, it is
`orphaned by daemon restart`, the daemon that answered does not know it, the
daemon predates the message, or no daemon answered within the budget. The
client then exits `69` (`EX_UNAVAILABLE`) with
`brokered run aborted: daemon connection lost; ticket cc-N <reason>` and never
claims the build ran. `CARGO_HAULER_REATTACH_GRACE_MS=0` restores the earlier
policy of killing a queued ticket the moment its connection closes. `--bg` and
auto-backgrounded tickets are detached, not owned, and none of this affects
them.

A deadlocked test binary holds its lane forever at 0% CPU with nothing on
stdout, and neither the estimate overrun nor the output silence alone can
tell it from a slow build. The daemon therefore samples the CPU time of every
running ticket's process tree every 30 seconds, through `/proc` on Linux and
`ps` on macOS. Other platforms do not detect stalls. The daemon flags a ticket
`stalled` when its elapsed time exceeds `CARGO_HAULER_STALL_ESTIMATE_FACTOR`
(3) times its estimate, the tree's CPU time has not changed for
`CARGO_HAULER_STALL_IDLE_MS` (ten minutes), and it printed nothing in that
window. The daemon instead flags a head that has crossed that estimate
multiple but still uses CPU or prints output as `estimateState: overrun`, with
the intent's `p90Ms`. The tickets behind it carry `queue.headEstimateState: overrun`. The
queue ETA then uses the intent's p90 remaining, never less than one more
estimate's worth, rather than zero. Agents can background such a ticket
without treating it as deadlocked. `hauler status`, `hauler_status`, and the
dashboard show `stalled` with the idle duration. `hauler result` and
`hauler_result` answer
`ticket looks stalled (no CPU for Nm) — hauler kill cc-N`, and `hauler await`
heartbeats say the same. Riders of a stalled leader report the leader's stall
and its ticket, since killing a rider only detaches it. The daemon only flags
a stalled ticket whose submitting connection is still open. When that
connection has disconnected (a dead agent shell, a killed hook), the daemon
marks the ticket orphaned. Once the ticket is also stalled, the daemon kills
it through the normal `hauler kill` path with the error
`stalled: no CPU for Nm after owner disconnected, so the daemon killed it`.
Riders settle or requeue as for any kill. `CARGO_HAULER_STALL_AUTO_KILL=0`
keeps the flag and never kills. Background tickets (`--bg`, `hauler_request`)
have no streaming connection, and the daemon only ever flags them.

Tickets do not survive a daemon stop, and a daemon never hands runs over to
the next daemon. How a ticket ends depends on how the daemon stopped. A
graceful stop is the shutdown request. `hauler daemon restart`,
`hauler daemon stop`, and the automatic replacement of an idle older daemon by
the next `hauler exec`, `hauler request`, hook submission, or
`hauler daemon start` all send it. Automatic replacement checks for queued,
running, executing, or attached work first, and the daemon keeps admission
closed through that decision. When a stop does proceed, the old daemon
settles every queued, running, and attached ticket itself as it exits. It
terminates its cargo processes (SIGTERM, then SIGKILL after
`CARGO_HAULER_KILL_GRACE_MS`) and marks each row `killed` with the error
`daemon shutdown`. `hauler result cc-N` then shows the ticket `killed` with
`daemon shutdown` as its error and ends with
`cc-N was killed before finishing; resubmit only if the work is still needed.`

A daemon that died without shutting down (SIGKILL, a crash, an out-of-memory
kill, a power loss) never marked its rows. They still read `queued` or
`running` in the ledger until the next daemon's first ledger pass marks each
of them `killed` with the error `orphaned by daemon restart`.
`hauler result cc-N` then answers
`cc-N killed — orphaned by daemon restart: the daemon stopped while it was in flight and does not hand runs over; resubmit if the work is still needed`
rather than looking like a failure of the command itself. Either way the work
is gone. Finish or `hauler kill` what matters before you upgrade or restart,
and resubmit what is still needed.

The `tool/after` hook checks the session's background tickets. Those are
`--bg` tickets, `hauler_request` tickets, and synchronous requests the client
converted to a ticket. On the first tool call after one finishes, the hook
adds the ticket's result to the agent context. A foreground ticket already
streamed its exit to the shell the agent watched, so the hook never announces
it again. For foreground tickets, the `stop` route waits for the lower of the
remaining estimate and `CARGO_HAULER_STOP_WAIT_MS` (clamped to the daemon's
two-hour await ceiling). If the ticket finishes, the route denies the stop and
returns the result. Otherwise it denies with status and ETA. `stopHookActive`
and a cap of eight denials per ticket prevent a repeated stop loop. The
per-ticket counters live in `hook-state.json`, which the hook writes
atomically and prunes once a session's tickets are no longer pending. `--bg`
tickets never hold a stop. [docs/codex-hooks.md](docs/codex-hooks.md) records
the verified stop-hold behavior on Codex 0.147.0.

### PATH shim

At installation, the shim embeds absolute paths for both the `hauler` CLI and
the Cargo binary. It embeds the `~/.cargo/bin/cargo` link, not its rustup
proxy target, because rustup dispatches on `argv[0]`. The shim tags requests
with `--host shim`. When the daemon starts Cargo, it sets
`CARGO_HAULER_INSIDE=1`, and the shim then invokes the embedded Cargo
directly, so the daemon's own Cargo never returns through the broker. The shim
is POSIX-only. Its directory must appear before rustup's Cargo directory on
`PATH`, and replacing an existing destination requires `--force`.
`hauler install-shim` walks PATH for a `hauler` whose realpath is a regular
`.js`, `.mjs`, or `.cjs` file outside any plugin copy and embeds that
realpath. A version-manager shim such as `mise/shims/hauler`, which resolves
to a native binary, does not count. An npm `dist/bin/hauler.js` entry embeds
itself only when that walk finds nothing. `hauler install-shim` refuses to run
from a plugin-local `scripts/hauler.mjs`.

The shim is stale when its embedded `hauler.js` belongs to another
cargo-hauler version, or when its embedded `node` or `hauler.js` is gone.
`cargo-hauler-install install <host>` rewrites a stale shim, through a symlink
if `cargo` is one, and keeps its Cargo path. `cargo-hauler-install doctor`
reports a stale shim as an error. The same version under another working
`node` is current, so a per-directory Node pin does not make the shim stale.

### Caller environment

`hauler exec` (and therefore the shim and the hook rewrites) forwards the
caller's whole environment to the daemon, except the `CARGO_HAULER_*`
settings, which configure the broker itself. The daemon lays the forwarded
variables over its own environment when it spawns Cargo, so
`FOO=bar cargo build` reaches `build.rs`, `env!()`, `cargo run`, and
`cargo test` processes exactly as a direct invocation would. The daemon
digests request identity for coalescing from the build-relevant subset only
(`CARGO_*`, `RUST*`, `CC`, `CXX`, `AR`, `CFLAGS`, `CXXFLAGS`, and `LDFLAGS`
with their target-suffixed forms, and `PKG_CONFIG_PATH`). When a knob that a
`build.rs` reads must also split identity, pass it through
`--config 'env.FOO="bar"'`.

The daemon filters one value rather than forwarding it. A `MAKEFLAGS`,
`MFLAGS`, or `CARGO_MAKEFLAGS` that carries a descriptor-based jobserver
(`--jobserver-auth=R,W`, `--jobserver-fds=R,W`) names file descriptors that
exist only in the caller. The daemon drops it, and its shared FIFO jobserver
applies. A `fifo:PATH` jobserver travels as-is. `hauler request` and
`hauler_request` submit without a caller environment, and their Cargo
processes run with the daemon's environment.

The daemon's own environment is small by design. When a client starts the
daemon, the daemon receives only `PATH`, `HOME`, `USER`, `LOGNAME`, `SHELL`,
`TMPDIR`, `LANG` and `LC_*`, `XDG_*`, `CARGO_HOME`, `RUSTUP_HOME`,
`SSL_CERT_*`, the `*_proxy` variables, and every `CARGO_HAULER_*` setting,
with the state directory as its working directory. The daemon does not
inherit the starting shell's `RUSTFLAGS`, `CARGO_TARGET_DIR`, `RUSTC_WRAPPER`,
`CARGO_BUILD_*`, `MAKEFLAGS`, `CC`, and similar build knobs, so they cannot
silently become the base environment of every other session's builds.

### Kache integration

When [kache](https://github.com/ScriptedAlchemy/kache) is available,
cargo-hauler reads its machine-wide index for per-crate compile-time priors and
reports the slowest crates by profile (`<KacheStats>`). Without that index,
estimates come from the daemon's EWMA history. cargo-hauler reports a missing
or incompatible index as unavailable, and such an index never rejects a
request.

The same panel shows store pressure. It compares blob bytes recorded in the
index against kache's `local_max_size`, which comes from `KACHE_MAX_SIZE` or
`$XDG_CONFIG_HOME/kache/config.toml`. When neither applies, the panel says
"limit unknown" and why. The panel shows the last GC from `gc_stats.json`
beside the index, with when it ran, how long it took, what it evicted, and any
`gc: skipping eviction` warnings from kache's `auto-gc.log` or `daemon.log`
during that run. It also shows `key_ms` mean and p95 over the tail of the
events sidecar. Warnings appear when the store is over its limit or the last
GC declined or skipped evictions. A missing or unparsable file renders as
unavailable with its reason, never as an empty store.

![cargo-hauler dashboard kache timing panel](docs/media/dashboard-kache.png)

## Install

cargo-hauler requires Node 22.19 or newer, Cargo, and Linux or macOS. Windows
is experimental, with named-pipe transport and no PATH shim.

The npm package ships one plugin root, `dist/`, that every host reads. That
root holds the Claude Code plugin with its local marketplace, the Codex
plugin, the Cursor plugin with its `install.mjs`, and the Agent Plugins
`portable` projection. The package also ships three executables, `hauler`
(the CLI), `cargo-hauler` (the routed commands), and `cargo-hauler-install`.
The root's `INSTALL.md` has the exact commands for each host. The package
declares no runtime dependencies, because the packs and executables bundle
every library they use. `npm install` therefore fetches this one tarball and
nothing else.

### With the bundled installer

```sh
npm install -g cargo-hauler        # or run each command as: npx -p cargo-hauler <command>

cargo-hauler-install install claude --scope user       # user, project, or local
cargo-hauler-install install codex
cargo-hauler-install install cursor --mode local        # ~/.cursor/plugins/local/cargo-hauler
cargo-hauler-install install cursor --mode marketplace  # stage a local marketplace repo for Customize → Add Plugins from Local Repository
```

`cargo-hauler-install` runs the host's own plugin commands for you (below). It
detects an installed copy with the same version but different content and
replaces it. It takes `--replace` (alias `--force`) to replace a different
installed version. `doctor --host <host>` reports the real installed status
without changing anything. `uninstall <host> --plan` reports the exact
receipt-owned removals. Both accept `--json`.

### With the hosts' own plugin commands

You get the same result without the installer, from `dist/` in the package or
`artifact/` in a checkout:

```sh
PLUGIN_ROOT="$(npm root -g)/cargo-hauler/dist" # use PLUGIN_ROOT=artifact in a checkout
cd "$PLUGIN_ROOT"

# Claude Code: a local marketplace plus a plugin install
claude plugin marketplace add ./
claude plugin install cargo-hauler@cargo-hauler-marketplace --scope user

# Codex: a local marketplace snapshot
codex plugin marketplace add ./
codex plugin add cargo-hauler@cargo-hauler-marketplace

# Cursor has no non-interactive plugin command, so the root ships one
node ./install.mjs                     # local plugin (default)
node ./install.mjs --mode marketplace  # local marketplace repository
```

To upgrade Claude Code to a new version, run
`claude plugin marketplace update cargo-hauler-marketplace && claude plugin update cargo-hauler@cargo-hauler-marketplace`.
To upgrade Codex, run `codex plugin marketplace add ./ && codex plugin add …`,
which keeps its settings. To upgrade Cursor, run
`node "$PLUGIN_ROOT/install.mjs" --replace`. `claude plugin update` is
version-gated. After a rebuild that did not bump the version, run
`claude plugin uninstall … --keep-data` and install again (the installer does
this automatically). Restart or reload the host after installing.

### From GitHub

The repository includes the generated `artifact/` plugin root and native
marketplaces, so GitHub installs need no local build or framework dependency:

```sh
claude plugin marketplace add ScriptedAlchemy/cargo-hauler
claude plugin install cargo-hauler@cargo-hauler-marketplace --scope user
codex plugin marketplace add ScriptedAlchemy/cargo-hauler
codex plugin add cargo-hauler@cargo-hauler-marketplace
```

In Cursor, open **Customize**, choose **From GitHub Repository**, and select
`ScriptedAlchemy/cargo-hauler`. Contributors commit native build output with
source changes. `pnpm check` rejects stale committed artifacts before
rebuilding. Release versioning rebuilds the artifacts with the new version in
its version PR.

### Developing from a checkout

```sh
pnpm install
pnpm run build      # artifact/ (one root, every host) + dist/bin
```

Then run `node dist/bin/cargo-hauler-install.js install <host>` or use the
direct host commands above from `artifact/`. For the PATH shim, run
`hauler install-shim` from the globally installed CLI. Building needs the
repository's dev dependencies, including the agent-bundle framework, which is
pinned as a pkg.pr.new preview until it is on npm. The published package does
not need them.

The first brokered request makes one daemon-start attempt. Hooks cover Cargo
commands submitted through supported agent shells. The optional PATH shim
(`hauler install-shim`) also covers Cargo invoked by scripts and terminals.
[docs/install.md](docs/install.md) has per-host notes and hook timeouts.

## Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `CARGO_HAULER_STATE_DIR` | Per-user cache directory | Unix socket or Windows named pipe source, SQLite ledger, daemon log, pid lock, `hook-state.json`, `hook-events.jsonl`, and the per-ticket output logs under `tickets/`. The directory is owner-private on Linux and macOS. It is `0700`, its sensitive files are `0600`, and the daemon refuses an unsafe or unowned path rather than reusing it. |
| `CARGO_HAULER_CARGO_BIN` | `$CARGO_HOME/bin/cargo` | Cargo binary for daemon-started work. Bare `cargo` is the last fallback. The daemon never resolves it through `PATH`. The daemon reads it from its own environment (export it where the daemon starts, or before `hauler daemon start`), and clients do not forward it. |
| `CARGO_HAULER_MAX_CONCURRENT` | cores ÷ 8, clamped to 5 through 16 | Global admission permits for Cargo processes across all lanes, as an integer >= 1. |
| `CARGO_HAULER_OVERLAP_EXECUTION` | `1` | Hand a lane to its next request once a `test`, `nextest`, `bench`, or `run` leader reports its build finished, which overlaps the next compile with the leader's execution phase. `0` keeps a lane strictly one process at a time. |
| `CARGO_HAULER_ALLOW_SHARED_TARGET` | `0` | Allow different workspace roots to use one external target directory. The daemon still warns, and status flags the lanes, because Cargo artifacts can collide. Set it on the request as `1`, or in the daemon environment to allow all requests. |
| `CARGO_HAULER_JOBS_GRANT` | `max(4, cores / max concurrent)` | `CARGO_BUILD_JOBS` added to each Cargo process only while the shared jobserver FIFO is not armed. An armed daemon injects `MAKEFLAGS` instead and leaves `CARGO_BUILD_JOBS` unset. `0` disables injection. |
| `CARGO_HAULER_JOBSERVER` | `auto` | Machine-wide fifo jobserver for daemon-spawned cargo. `auto` arms it only when the host `make` is 4.4+ (or absent), because older makes reject `--jobserver-auth=fifo:` in build scripts. `fifo` forces it on, and `off` disables it (per-run `CARGO_BUILD_JOBS` grants apply instead). |
| `CARGO_HAULER_LOAD_THRESHOLD` | Disabled | Per-core one-minute load threshold for deferring new admissions. |
| `CARGO_HAULER_LOAD_MIN` | `2` | Active Cargo processes below which load, CPU PSI, and soft memory pressure do not defer admission. |
| `CARGO_HAULER_CPU_PRESSURE_THRESHOLD` | `75` | Linux CPU PSI `some avg10` percentage for deferring new admissions. `0` or `off` disables it. |
| `CARGO_HAULER_MEM_PRESSURE_SOFT` | `10` (Linux) | Memory PSI `full avg10` percentage for soft deferral. `0` or `off` disables it. The value must stay below the hard threshold, otherwise both revert to their defaults. |
| `CARGO_HAULER_MEM_PRESSURE_HARD` | `20` (Linux) | Memory PSI `full avg10` percentage for hard deferral, confirmed by `full avg60` at half the value. `0` or `off` disables it. |
| `CARGO_HAULER_MEM_AVAILABLE_MIN_GB` | `8` (Linux) | `MemAvailable` floor in GiB for hard deferral. `0` or `off` disables it. |
| `CARGO_HAULER_MEM_PRESSURE_LEVEL` | `2` (macOS) | Kernel VM pressure level that starts soft deferral (`2` warn, `4` critical). `0` or `off` disables it. |
| `CARGO_HAULER_HEAVY_MEM_AVAILABLE_GB` | `16` (Linux) | `MemAvailable` in GiB below which the daemon caps concurrent heavy leaders (release, perf, and bench profiles, and workspace-wide runs). `0` or `off` disables the cap. |
| `CARGO_HAULER_HEAVY_MAX_CONCURRENT` | `1` | Heavy leaders admitted at once while the cap is active. |
| `CARGO_HAULER_REPLAY_BUFFER_BYTES` | `4194304` | Leader output retained in memory for late-attacher replay. |
| `CARGO_HAULER_KACHE_INDEX` | kache's configured store | kache index for per-crate timing priors. An empty string disables it. |
| `CARGO_HAULER_BATCH` | Enabled | `0`, `false`, `off`, or `no` disables the batch composer. |
| `CARGO_HAULER_BATCH_WINDOW_MS` | `150` | Delay applied to a batchable lane head so nearby requests can fold. `0` disables it. |
| `CARGO_HAULER_KILL_GRACE_MS` | `8000` | Time between SIGTERM and SIGKILL when the daemon stops a Cargo process. |
| `CARGO_HAULER_STALL_ESTIMATE_FACTOR` | `3` | A running ticket becomes a stall candidate once its elapsed time exceeds this multiple of its estimate. |
| `CARGO_HAULER_STALL_IDLE_MS` | `600000` | Window with no process-tree CPU time and no output after which the daemon flags a stall candidate `stalled`. `0` or `off` disables stall detection. |
| `CARGO_HAULER_STALL_AUTO_KILL` | Enabled | Kill a stalled ticket automatically once the connection that submitted it has disconnected. `0`, `false`, `off`, or `no` only flags it. |
| `CARGO_HAULER_REATTACH_GRACE_MS` | `30000` | How long a queued ticket keeps its place after its submitting connection dropped, while it waits for the client to `reattach`. After that, the daemon kills it as abandoned. `0` kills it the moment the connection closes. |
| `CARGO_HAULER_STOP_WAIT_MS` | `30000` | Maximum wait for one stop-hook invocation. Values above the 7200000 ms await ceiling are clamped. |
| `CARGO_HAULER_LEDGER_RETENTION_DAYS` | `30` | The daemon deletes finished ledger rows older than this many days when it starts. `0` disables the age limit. |
| `CARGO_HAULER_LEDGER_MAX_ROWS` | `50000` | Total ledger rows beyond which the daemon deletes the oldest finished rows when it starts. `0` disables the row cap. Pruned rows take their `tickets/<ticket>.log` files with them. |
| `CARGO_HAULER_TICKET_LOG_MAX_BYTES` | `67108864` (64 MiB) | Bytes of a leader run's combined output written to `<state dir>/tickets/<ticket>.log` before the log stops with one truncation line. `0` writes no ticket logs (`hauler result` then has only the tail). |
| `CARGO_HAULER_LOG_LEVEL` | `Info` | Daemon log level. |
| `CARGO_HAULER_HOST`, `CARGO_HAULER_SESSION` | Unset | Default `--host` and `--session` attribution for `hauler exec` and `hauler request`. Without them, the session id the agent host exports to its shell (`CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`, `CURSOR_CONVERSATION_ID`) attributes the request to `claude`, `codex`, or `cursor`. The PATH shim also borrows the shell cap of `CARGO_HAULER_HOST` when auto-background is allowed. |
| `CARGO_HAULER_SHIM_BACKGROUND` | Unset | `1`, `true`, `on`, or `yes` lets a non-TTY PATH shim auto-background over the host cap (exit 75). Without it, a shim that is not a TTY waits for cargo's exit. |

The daemon reports a numeric value that does not parse or falls outside its
range as a warning (in the daemon log, or on stderr for hand-run commands),
and the default applies. Only `0` or `off` disables an arm that documents that
contract. The state directory defaults to `$XDG_CACHE_HOME/cargo-hauler`,
otherwise `~/.cache/cargo-hauler` on Linux, `~/Library/Caches/cargo-hauler` on
macOS, and `%LOCALAPPDATA%\cargo-hauler` on Windows. Its contents are
owner-private, and the daemon serves a single user, not a shared service. See
[State directory ownership](#state-directory-ownership). When
`CARGO_HAULER_KACHE_INDEX` is unset, the daemon reads kache's configured local
store from `$XDG_CONFIG_HOME/kache/config.toml` or
`~/.config/kache/config.toml` and opens `<local_store>/index.db` read-only.

### State directory ownership

The daemon is local control for the user who owns its state directory, not a
shared multi-user service. Everything under the state directory belongs to
that one account. That includes complete command output in `tickets/`, the
ledger, the daemon log, the passthrough spool, the hook records, the
jobserver FIFO, and the control socket. No mechanism lets a second user
submit work to another user's daemon.

On Linux and macOS, the daemon enforces that boundary rather than inheriting
it from the umask:

- Directories that cargo-hauler creates are `0700`, and sensitive files are
  `0600`, whatever umask the invoking shell had. On the next start, the daemon
  tightens an existing state directory that the running user already owns in
  place and preserves its contents.
- cargo-hauler changes only the state directory and the entries it owns. It
  never changes the mode of a parent you configured through
  `CARGO_HAULER_STATE_DIR`, such as a shared volume or a RAM disk.
- cargo-hauler refuses by name a state path that is a symbolic link, is the
  wrong kind of entry, or is owned by another user. It does not follow,
  change the mode of, or delete that path. Fix or remove the path and start
  again. cargo-hauler does not act on another account's file on your behalf.
- When the state directory is too deep for the kernel's socket path limit,
  the control socket moves to a `cargo-hauler-<uid>` directory (mode `0700`)
  under `XDG_RUNTIME_DIR`, `TMPDIR`, or the system temporary directory. It
  never moves directly into a shared temporary root. Two accounts that share
  one temporary root get separate directories.
- If you upgrade directly from 0.7.2 or earlier with a deeply nested state
  directory and the old daemon stays on its former relocated socket, stop that
  daemon from the old install (or terminate its recorded pid) before you start
  the current version.
- Daemons from 0.7.1 through 0.7.3 do not advertise their wire protocol. For
  an old daemon that still serves the current socket, run `hauler daemon stop`
  or `hauler daemon restart` once from the new install after upgrading.

Windows has neither POSIX modes nor uids, and its control endpoint is a named
pipe rather than a filesystem entry, so none of the above applies there. State
files keep the permissions the filesystem gives them.

## Runtime behavior and caveats

- Hook and client transport failures fail open. A hook passes the original
  command through, and a client that cannot reach the daemon makes one
  auto-start attempt and then invokes Cargo directly. The client does not
  treat a daemon that is alive but too loaded to accept within 2 seconds as
  absent. `exec` retries for up to 60 seconds, then runs Cargo directly
  without a start attempt or a second retry cycle.
- The plugin's own documents never fail open. `hauler_result` and
  `hauler_await` read a stopped daemon's tickets from the ledger. When a live
  daemon's socket cannot be opened, they fail with the errno instead of
  reporting a ticket as not found. `hauler_status`, `hauler_log`, and
  `hauler_last` read the ledger with the daemon marked `stopped`,
  `unresponsive`, or `skewed`. Reads never request daemon shutdown. They use
  an older or newer daemon when its wire-protocol identity is compatible. A
  daemon whose status report this client cannot read is `skewed`, and the
  client reports a truly incompatible daemon with its pid and version.
  Submissions and
  mutations from a client older than the daemon, such as a session still on a
  previous plugin, keep the directional `DaemonNewer` behavior and never
  write to or shut down that daemon.
- cargo-hauler does not migrate the state directory between installs. Every
  rendered document names the one in use (`state dir …` in the header,
  `stateRoot` in `--json`), so a `CARGO_HAULER_STATE_DIR` change is visible on
  the next command rather than discovered from an empty ledger.
- Coverage attachment never shares test execution. A `test`, `nextest`, or
  `bench` that runs tests attaches only by identity or batch folding. Only a
  compile-only `test --no-run` or `bench --no-run` attaches to a running
  `test` or `bench`, and the leader's build alone releases it. Folded `test`
  and `nextest` requests receive the composite output, and a composite may
  run more than one participant asked for (another package, another name
  filter). Only participants that asked for everything the composite ran
  inherit its failure, and the rest rerun alone.
- The `cargo clean` guard probes the daemon for 250 ms. Active work denies
  the clean, and an idle daemon brokers it. A daemon that accepts but does
  not answer in time is busy, so the hook brokers the clean, and the lane
  serializes it behind the builds it would otherwise race. Only a socket
  nobody listens on (`ECONNREFUSED`, `ENOENT`) lets a raw `cargo clean` run.
- cargo-hauler records hook rewrites, policy denials such as `cargo clean`
  during an active build, and malformed requests (in `hook-events.jsonl`, or
  as a failed ledger row).
- Linux and macOS are supported. Windows named-pipe transport is
  experimental. On Windows, the POSIX PATH shim is unavailable and jobserver
  integration is disabled.
- cargo-hauler is licensed under MIT.

## Architecture

<details>
<summary><strong>How the app is built.</strong> Expand for the agent-bundle application structure, testing, and development.</summary>

The plugin is an [agent-bundle](https://github.com/ScriptedAlchemy/agent-bundle)
application. It has eight MCP tools, a routed CLI, two hook routes plus two
declared shell hooks, two skills, and a browser dashboard, all rendered from
one component library through one shared layout. This section is for
contributors. Using cargo-hauler needs none of it.

### Application structure

Everything an agent sees is a React Server Component. The agent-bundle
runtime renders it into an Agent Document and then lowers that document to MCP
content, CLI Markdown, `--json`, or a host hook envelope. There is no
hand-written server, argv parser, or string-concatenated Markdown. The `src/`
tree is the app.

```text
src/
  layout.tsx                    the hauler shell around every rendered route
  providers/hauler-daemon.ts    request-scoped daemon configuration
  mcp/hauler/tools/*.tsx        hauler_status, _dashboard, _log, _last, _await, _result, _request, _kill
  mcp/hauler/tools/*.cli.ts     each tool's `hauler <command>` projection (flags, positionals)
  mcp/hauler/apps/dashboard.tsx the MCP App (ui://cargo-hauler/dashboard.html)
  cli/daemon.ts                 the one plain CLI command
  events/{session/start,stop}.tsx   rendered hook routes
  events/tool/{before,after}.ts     cheap shell hook handlers
  events/tool/{before,after}.view.tsx   rendered shell hook views
  skills/cargo-hauler/SKILL.md, skills/hauler-dashboard/SKILL.tsx
  scripts/hauler.ts             the `hauler` process entry hooks rewrite cargo to
  internal/                     the implementation the entrypoints import, by owner
    contracts/                  wire protocol, tool schemas, wire version
    cargo/                      argv, intent, workspace, topology, execution/
    daemon/                     composition (main, config), runtime/, broker/, scheduling/, reporting/
    storage/                    the SQLite ledger and per-ticket output logs
    client/                     socket clients: control, exec, tickets, ensure-daemon
    operations/                 what the routes call: tickets, status, inspection
    host-hooks/                 the shell/session hook handlers and their small RPC client
    integrations/kache/         kache status and store pressure
    platform/                   state and socket paths, private-file policy, executable location
    shim/                       the PATH shim installer
    ui/documents/, ui/dashboard/, ui/shared/   agent documents, the browser App, shared formatters
    util/                       guards, ids, text, ANSI
```

The framework discovers everything above `internal/` by convention. Everything
under `internal/` is ordinary imported code.
[docs/architecture.md](docs/architecture.md) is the ownership map and walks
the three main paths (submitting cargo, reading status, processing a shell
hook) file by file.

#### The shell (`src/layout.tsx`)

Every rendered route (MCP tool, CLI command, rendered script) composes through
one layout, the way a page framework's `layout.tsx` wraps every page:

- **Body.** The body is the route's own document, unchanged. The route keeps
  its `<Agent.Result value>`, and the runtime merges it into the shell, so
  `structuredContent` and `--json` are exactly what the route declared.
- **Footer.** `<LineageFooter>` names the conversation the request belongs to
  (`Requested by conversation conv-7f (depth 1 under conv-2a; registry)`). It
  reads the lineage synchronously with `useAgent()`. When the host cannot
  place the request, the footer stays silent rather than guessing.
- **`_meta.hauler` on every MCP result.** It carries `route`, `surface`,
  `server`, `version`, and `lineage: { conversation, root, depth } | null`.
  Daemon state comes from each operation's result, so the shell does not pay
  for or report a separate request-start health probe.

Event routes are host protocol responses, and the layout never wraps them.

#### The shell hooks (`src/events/tool/`)

`tool/before` and `tool/after` are split into cheap `events.*` handlers and
sibling `.view.tsx` modules. The framework compiles each `.ts` handler into
the hook entry itself, `hooks/event-route-tool-before.<host>.mjs`. That entry
is about 1 MiB with the lazy provider registry but no React or Flight worker.
It loads the rendered view only when the handler calls `context.render`. The
handler decides on the raw command (`src/internal/host-hooks/tokens.ts`, plus
`session-ping.ts` for the one bounded completion ping after a tool ran). It
returns `continue` for the shell calls that name neither cargo nor hauler, and
a rendered view for the rest. Neither handler resolves the daemon-config
provider. The rendered view calls `before-shell.ts` (the rewrite, the
`cargo clean` guard) or `after-shell.ts` (telemetry, finished-ticket
context). It returns `allow`, `continue` with `updatedInput`, `deny` with a
reason, or `additionalContext` through the framework's host projection.

#### The daemon provider (`src/providers/hauler-daemon.ts`)

One request-context provider supplies `await context.provider('haulerDaemon')`
to rendered tools, commands, and scripts. It resolves only cheap `config` data
(state directory, socket, and ledger paths). Active health and status I/O
belongs to the operation that needs it. Routes read the config through
`requestDaemonConfig(context)`, and tests inject a fixture by initializing the
harness's `context.providers`.

#### Components (`src/internal/ui/documents/`)

Components render view-models and nothing else. The models are pure functions
in `view-models.ts`, so the MCP document, the CLI Markdown, and a test
assertion share one derivation.

| Component | Renders |
| --- | --- |
| `<TicketCard>` | one ticket's headline, attribution, lane, queue position, attach mode, timings, and exit, followed by `<BuildDiagnostics>`, `<BatchTestSummary>`, and `<LogTail>` |
| `<TicketList>` | the in-flight and recent tables of status, and the whole of log |
| `<LaneBoard>` | busy lanes with their leader ticket, its command, and how long it has run |
| `<AdmissionState>` | permits in use, load, memory clamp, and sharing savings, with a paused admission gate shown as paused |
| `<KacheStats>` | kache coverage and freshness, slowest crates by profile, or an explicit "not detected" |
| `<LogTail>` | the captured output tail of a detail record, labeled live while the run is in progress. Summary rows carry only `outputPreview` and render no tail. |
| `<FullOutput>` | where the ticket's whole output log lives and how large it is. Under `full`, it renders the log itself (its last 768 KiB when larger) in code-block chunks. |
| `<BuildDiagnostics>` | an index of cargo `error[E…]` and `warning:` blocks (level, code, message, location) followed by every captured block verbatim |
| `<BatchTestSummary>` | every observed binary result from a shared test log, with explicit composite-run and partial-evidence warnings |
| `<DashboardLink>` | where the MCP App lives and how to open it elsewhere |
| `<TicketGuidance>` | what to do next, one component per ticket status |
| `<LineageFooter>` | the shell footer |
| `<EmptyState>`, `<UnavailableState>`, `<ErrorState>` | the three non-happy shapes every document may take |

`documents.tsx` composes them into one document per hauler result
(`StatusDocument`, `LogDocument`, `LastDocument`, `ResultDocument`,
`AwaitDocument`, `RequestDocument`). The MCP tool and the CLI command for the
same operation render the same document with different command spellings
(`surface.ts`).

#### Streaming (`src/internal/ui/documents/streaming.tsx`)

`hauler_await` and `hauler_log` are progressive documents. Each is a
valueless `Agent.Result` container around one `Suspense` boundary:

- `<AwaitStream>` renders the ticket **as it is now** as its fallback, with
  its live output tail and a progress node, before the daemon-side wait
  blocks. Its settled child is the ordinary `AwaitDocument`. MCP hosts receive
  the fallback's progress as notifications and the settled value as
  `structuredContent`, and the routed CLI updates the terminal in place.
  Heartbeats (queue position, elapsed time, cost estimate) still flow through
  `context.progress`.
- `<LogStream>` renders a "reading the ledger" progress frame, then the
  listing.

#### Attribution and lineage

`hauler_request` resolves `cwd` from an explicit input first, then from Agent
Bundle's authoritative workspace. A caller must provide it when neither
exists. The MCP server's derived process directory is not a caller workspace.
`hauler_request` attributes tickets from the same request context. An
explicit `host` or `session` wins. Otherwise the tool uses the negotiated host
and native session. When the transport publishes no session id (bare stdio
MCP), the conversation from `request.lineage` becomes the session of record.
That rule makes parallel agents' builds attributable in the ledger, the
dashboard, and `hauler status --session <conversation>` (the `hauler_status`
tool takes the same filter as its `session` field). Results carry
`attribution: { host, session, lineage }`.

The CLI `hauler request` reads its caller's shell instead. Explicit flags
win, then `CARGO_HAULER_HOST` and `CARGO_HAULER_SESSION`, then the session id
the agent host exports to its shell tool. The MCP tool never reads its own
process environment, which belongs to the server and not to the calling
conversation.

#### Routes

| Route | Surface | Document |
| --- | --- | --- |
| `tool:hauler/hauler_status` (`hauler status`) | queue, lanes, admission, kache, and filters, as bounded summary rows (`StatusRow`) with `outputPreview` on running rows and never a tail | `StatusDocument`, text for the model |
| `tool:hauler/hauler_dashboard` (`hauler web`) | the same `StatusResult`, `limit` only. The tool advertises the dashboard App (`_meta.ui.resourceUri`) so hosts open it beside the result. | `DashboardDocument`, one summary line plus where the App and the text form are |
| `tool:hauler/hauler_log` (`hauler log`) | recent requests, as summary rows | `LogStream`, then `LogDocument` |
| `tool:hauler/hauler_last` (`hauler last`) | most recent request, as a detail record with its tail | `LastDocument` |
| `tool:hauler/hauler_await` (`hauler await`) | long-poll a ticket (up to 2 h) | `AwaitStream`, then `AwaitDocument` |
| `tool:hauler/hauler_result` (`hauler result`) | one ticket as a detail record, with the settled tail, or the whole live tail while running. `full` renders the on-disk output log, or its last ~768 KiB when larger. | `ResultDocument` (`<FullOutput>`) |
| `tool:hauler/hauler_kill` (`hauler kill`) | stop a queued or running ticket | `KillDocument` |
| `tool:hauler/hauler_request` (`hauler request`) | submit a background request | `RequestDocument` |
| `cli:daemon` | `run`, `start`, `stop`, `status`, or `restart` | plain JSON, exit code from the result |
| `event:session/start` | new session | daemon state and the no-kill rule as context |
| `event:stop` | agent stopping | holds the stop while a foreground ticket is pending (bounded, re-deniable) |
| `event:tool/before` | shell tool about to run | the cheap handler continues a non-cargo command without loading the view. Otherwise the view rewrites `cargo …` to `hauler exec --session … --host … -- cargo …`, denies `cargo clean` during in-flight builds, and brokers it while the daemon is too busy to answer. |
| `event:tool/after` | shell tool finished | the cheap handler pings the daemon once per call. The view records cargo commands, injects finished background-ticket results once per session, and flags cargo that ran unbrokered through a wrapper script (cargo status lines in the output of a command that never named cargo). |

#### Skills

`skills/cargo-hauler/SKILL.md` is the operating rule set (do not kill
in-flight cargo, scope with `-p`, await tickets, fail open when the daemon is
unreachable). `skills/hauler-dashboard/SKILL.tsx` is a rendered skill. The
build computes its Markdown from the tool and CLI spellings and the App
resource URI it describes, so the skill cannot fall out of date with those
tools.

#### Dashboard

`src/mcp/hauler/apps/dashboard.tsx` is the MCP App at
`ui://cargo-hauler/dashboard.html`, attached to `hauler_dashboard` on hosts
that render MCP Apps. The opening result is that tool's status payload.
`hauler_status` carries no App, so its text reaches the model alone. The App
shows contention and admission, in-flight and queued work, metrics windows,
optional kache data, lanes, and history, with a live output drawer per
ticket. It polls `hauler_status` every 5 s. Its rows are summaries, so a
running row's `outputPreview` shows as one line under the command, and no row
carries a tail. The drawer always fetches `hauler_result` for the whole tail
and refreshes it while the ticket runs, so the poll never carries 16 KiB per
running ticket.

Each metrics window also reports queue wait against run time for leaders,
with the wait split by cause. *Lane-bound* wait means a same-lane leader was
still compiling, before its `Finished` line or exit. *Permit-bound* wait
means every admission permit was held and no same-lane compile was to blame.
*Other* wait covers admission holds, `--after` prerequisites, and scheduling
latency. The classification is a pure sweep over ledger rows
(`src/internal/daemon/reporting/wait-split.ts`). It runs once per status
refresh against the daemon's current permit count, which the tile states, so
runs admitted under an earlier cap are classified against today's cap. With
`buildFinishedAtMs` on the row, the by-command split adds compile and
execution time for test, run, and bench leaders, and the window reports the
lane time that the execution-phase hand-back released.

### Testing

```sh
pnpm run check   # validate + build + typecheck + Effect diagnostics + rstest + route tests
```

`tests/` groups tests by what they execute:

- `unit/<subsystem>/` is scoped to one owner under `src/internal/`.
- `integration/` runs a real broker in-process through
  `tests/support/harness.ts`.
- `packaging/` reads the built `artifact/` or spawns the package entries.
- `acceptance/` drives real `cargo` against the workspaces under
  `evals/fixtures/`.
- `route-unit/` and `browser-app/` are the framework-level suites below.

`tests/route-unit/` renders the app through the framework compiler with no
artifact build, at the harness proof levels:

| Level | Suite | What it proves |
| --- | --- | --- |
| route-unit | `routes`, `layout`, `streaming`, `events` | documents, shell metadata, Suspense fallbacks and settled values, lineage attribution, event decisions (the shell routes' cheap handlers are unit-tested in `tests/integration/event-handler.test.ts` and against their compiled entries in `tests/integration/hooks-simulate.test.ts`) |
| cli-dispatch | `cli-dispatch`, `layout` | argv through the routed CLI shell, with Markdown wrapped by the shell and `--json` bare |
| script-dispatch | `script-dispatch` | the `hauler` entry through its `main` envelope as its own process |
| mcp-in-memory | `mcp-surface`, `layout` | tool names, `outputSchema`, the dashboard resource link, `_meta.hauler`, and a live fixture broker over the in-memory transport |
| packed-stdio | `packed-contract` | the built `artifact/` server as a real process against a live broker, every tool through the wire-contract matrix |
| host-install | `packed-install` | the npm tarball installed without source or framework dependencies. The suite covers package-bound install for Claude, Codex, and Cursor, plus replacement, doctor, uninstall plan and removal, the installed MCP server, and the dashboard web process. |
| workbench-surface | `workbench-surface` | the catalog, provider, lifecycles per host, and counts that `agent-bundle dev` would show |

Daemon-backed cases run a real broker in-process with a fake `cargo`
(`tests/support/harness.ts`) and reach it either through the `haulerDaemon`
provider or through `CARGO_HAULER_STATE_DIR`.

### Development

```sh
pnpm run dev       # agent-bundle workbench with live rebuilds
pnpm run build     # artifact/ (one root, every host) and dist/bin
pnpm run inspect   # per-host component accounting
pnpm run doctor    # installed copies versus the artifact
pnpm run check     # the gate
```

To see the dashboard outside an MCP host, run
`node artifact/bin/cargo-hauler.mjs web` after a build. The framework's `web`
command (configured under `web` in `agent-bundle.config.ts`) launches the
artifact's own `hauler` server and calls `hauler_dashboard` once so the App
opens populated. It approves `call-tool` so the panels may poll, and it serves
`ui://cargo-hauler/dashboard.html` on a loopback origin until Ctrl-C, so the
data is the daemon's own. `pnpm run dev` and the Workbench's MCP page preview
the same App with live rebuilds. The repository ships no dashboard preview
code of its own.

This repository pins the [pkg.pr.new](https://pkg.pr.new) preview of Agent
Bundle main commit
[`4f62216`](https://github.com/ScriptedAlchemy/agent-bundle/commit/4f62216f307e3d70e82ac2c25bbd55e72c0880a8)
for `agent-bundle`, `@agent-bundle/runtime`, and their paired
`rsc-markdown-stream` preview. This pin emits manifest v6. `inspect` reports
the `agent` component kind as unavailable on every host (agent-bundle G5
deferral). This plugin defines no agents.

`repos/effect` is a read-only subtree that contains the Effect v4 source
pinned to `effect@4.0.0-rc.117`. Read `AGENTS.md` before you work with Effect
code in this repository.

</details>
