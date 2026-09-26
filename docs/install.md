# Install cargo-hauler

The npm package (`npm install -g cargo-hauler`) carries one ready-made plugin
root, `dist/`, that Claude Code, Codex, Cursor, and Agent Plugins hosts
all read. Its `.claude-plugin/`, `.codex-plugin/`, `.cursor-plugin/`, and
`.agents/` manifests point at one set of files. The package also carries three
executables in `dist/bin/`, which are `hauler` (the CLI), `cargo-hauler` (the
routed commands), and `cargo-hauler-install`. Installing needs only Node and
the host. The agent-bundle framework that builds the root is only a
development dependency, and the plugin and installer never load it.

The CLI entry point is `hauler` on PATH from `npm i -g cargo-hauler`. Never
run `scripts/hauler.mjs` or a path under `.claude/plugins/cache`,
`.codex/plugins/cache`, `.cursor/plugins`, or `artifact/` directly.

After an upgrade, reads (`status`, `log`, `last`, `result`, `await`, their MCP
tools, and dashboard data) never request daemon shutdown. They use the
running daemon when its wire-protocol identity is compatible. The client
reports an incompatible daemon with its pid and release version. Submissions
(`exec`, `request`, the shim, and hook rewrites) replace a protocol-compatible
older daemon only when its atomic idle check finds no running, queued,
executing, or attached work. Otherwise the client submits the request to that
daemon, and one diagnostic says the upgrade will happen when the daemon is
idle. A daemon from 0.7.1 through 0.7.3 does not advertise its protocol.
After upgrading, stop it once with `hauler daemon stop` or replace it with
`hauler daemon restart` from the new install. `restart` remains the explicit
forced replacement path.

Linux and macOS are supported. Windows is experimental and untested. There,
the daemon endpoint resolves to a named pipe, but the cargo PATH shim is
POSIX-only and refuses to install. cargo-hauler requires Node >= 22.19
(`node:sqlite`).

## Build

```sh
pnpm install
pnpm run build   # or `pnpm run check` to also run the typecheck and test gate
```

The root ships these parts:

- `mcp/`, the `hauler` MCP server.
- `hooks/`, with one hook document per host and the four event routes.
  The routes are `session/start`, `stop`, and the `tool/before` and
  `tool/after` shell routes, whose cheap handlers decide on the raw command
  before their rendered views load.
- `skills/`.
- `scripts/hauler.mjs`, the internal `exec` and `daemon run` entry that hooks
  use.
- `bin/cargo-hauler.mjs`, the routed CLI with `status`, `log`, `last`,
  `await`, `result`, `request`, `kill`, `daemon`, and `web`, which serves the
  dashboard App in a browser.
- `mcp-apps/dashboard.html`.
- An `INSTALL.md` with the exact compiled names.

The hooks never introduce a permission prompt. The `tool/before` hook answers
`allow` only when every command in the input is a cargo invocation that it
has rewritten onto the hauler exec path (or that already runs through it). In
that case the daemon governs the whole command. The hook still rewrites a
cargo command beside something the daemon does not govern
(`cd crates/foo && cargo build`, `cargo test | tail -20`) but returns it as
`continue`. The host's own permission flow then decides the rewritten command
exactly as it would have decided the original. The hook returns `deny` only
for a destructive cargo command that would race in-flight builds, and plain
`continue` (no decision) for every other tool call. No hook returns `ask`.

## Install

Every pack installs through its host's own plugin commands. The package also
ships `cargo-hauler-install`, which runs those commands for you and handles
same-version replacement. Neither needs the agent-bundle framework.

From the npm package:

```sh
npm install -g cargo-hauler
cargo-hauler-install install claude --scope user
cargo-hauler-install install codex
cargo-hauler-install install cursor --mode local
```

From GitHub, you need no checkout build or framework dependency:

```sh
claude plugin marketplace add ScriptedAlchemy/cargo-hauler
claude plugin install cargo-hauler@cargo-hauler-marketplace --scope user
codex plugin marketplace add ScriptedAlchemy/cargo-hauler
codex plugin add cargo-hauler@cargo-hauler-marketplace
```

In Cursor, open **Customize**, choose **From GitHub Repository**, and select
`ScriptedAlchemy/cargo-hauler`. The repository-root marketplaces point at the
committed `artifact/` plugin root. `pnpm build` generates both from the same
configuration. Commit the generated output with source changes. `pnpm check`
compares its full source-input inventory, digests, and executable modes before
rebuilding. Changesets release versioning rebuilds it with the new package
version in its version PR. Never edit these generated files manually.

You can also run the host commands directly from `dist/` in the npm package,
or from `artifact/` in a checkout. Each root's `INSTALL.md` repeats them with
the compiled names:

```sh
PLUGIN_ROOT="$(npm root -g)/cargo-hauler/dist" # use PLUGIN_ROOT=artifact in a checkout
(cd "$PLUGIN_ROOT" && claude plugin marketplace add ./ && claude plugin install cargo-hauler@cargo-hauler-marketplace --scope user)
(cd "$PLUGIN_ROOT" && codex plugin marketplace add ./  && codex plugin add cargo-hauler@cargo-hauler-marketplace)
node "$PLUGIN_ROOT/install.mjs" [--mode local|marketplace] [--replace]
```

- `--replace` (alias `--force`) on `cargo-hauler-install` and on the Cursor
  `install.mjs` replaces a different installed version or adopts a
  pre-receipt copy. The installer replaces a same-version rebuild in place
  (owned files only, and `state/` survives). Claude's `plugin update` is
  version-gated, so a same-version rebuild needs
  `claude plugin uninstall … --keep-data` and then a fresh install. Codex
  refreshes with `marketplace add` and `plugin add` without removing its
  settings. The installer runs these sequences itself. Codex add re-enables
  disabled plugins, so the installer refuses disabled or unknown-enabled
  installs (`AB7004`). Enable the plugin first, then retry.
- `cargo-hauler-install doctor --host <host>` reports the real installed
  status without changing anything.
  `cargo-hauler-install uninstall <host> --plan` reports the exact
  receipt-owned removals. Both accept `--json`. `npm install` itself never
  changes a host.
- Contributors with the framework available can also use
  `pnpm exec agent-bundle install <host> --from artifact` and
  `agent-bundle doctor --host <host>`. The doctor compares the installed copy
  with the artifact and reports `current`, `stale`, `version-mismatch`,
  `foreign`, or `not-installed`. Both commands apply the same policy.

## Per-host notes

### Claude Code

- The installer adds the pack as a local marketplace and installs
  `cargo-hauler@cargo-hauler-marketplace` at the requested scope (`user`,
  `project`, or `local`). The pack's `INSTALL.md` lists the equivalent
  `claude plugin marketplace add` and `claude plugin install` commands.
- The hook events are `SessionStart`, `PreToolUse`, `PostToolUse`, and `Stop`
  (matcher `^Bash$` for the tool hooks). Their timeouts are 5 s, 10 s, 10 s,
  and 900 s. The stop-hold implementation bounds each wait to ~30 s and
  denies again, so no single hook process holds the stop for more than one
  bounded wait.
- Claude's shell tool has historically killed cargo around 10 minutes. The
  client auto-backgrounds when a measured cost-model ETA (not the cold-start
  default) exceeds 9 minutes, and it exits 75 so the caller knows nothing ran
  yet.

### Cursor

- `--mode local` (default) safe-copies the pack into
  `~/.cursor/plugins/local/cargo-hauler`, records an install receipt, and
  refuses foreign directories. Cursor registers the plugin's hooks from the
  manifest alone (`hooks/hooks.json`). Those hooks are `sessionStart`,
  `preToolUse` and `postToolUse` (matcher `^Shell$`), and `stop`. Reload
  Cursor (`Developer: Reload Window`) so new sessions load them.
- `--mode marketplace` stages a committed Git repository at
  `~/.cursor/agent-bundle/marketplaces/cargo-hauler` and prints the one step
  that Cursor owns. In Cursor, open **Customize**, then **Plugins**, choose
  **Add Plugins from Local Repository**, select that directory, and click
  **Install**. Cursor then lists the plugin under **Customize** as a
  marketplace install rather than "local".
- The PATH shim (below) also covers Cargo that Cursor runs outside the hooked
  shell tool.

### Codex CLI

- The installer adds the pack as a local marketplace snapshot and installs
  `cargo-hauler@cargo-hauler-marketplace`.
- The hook schema matches Claude (`SessionStart`, `PreToolUse`,
  `PostToolUse`, `Stop`).
- A live probe **verified the stop-hook behavior on Codex 0.147.0**. Holds of
  ~29 s and ~72 s ran to their own wait bound and delivered their deny
  intact, and the re-deny loop (`stopHookActive` re-entry) works.
  [codex-hooks.md](codex-hooks.md) has the details and quirks.
- **Hook trust controls whether hooks run.** Without persisted trust in
  `~/.codex/config.toml` (`[hooks.state]`) or
  `--dangerously-bypass-hook-trust`, Codex does not run the hooks at all.
- If Codex ever cuts off a Stop hook mid-hold anyway, shorten the in-hook wait
  (`CARGO_HAULER_STOP_WAIT_MS`, default 30000) and rely on the re-deny loop.

### Portable (Agent Plugins 1.0.0)

The root's `.agents/` projection is the open-standard view. It holds skills
and the MCP server only, because the standard defines no hooks. Cursor,
Codex, VS Code, GitHub Copilot, Kiro, and ChatGPT load it natively, and the
agent-bundle Workbench playground uses it. `install.mjs` copies it for
Cursor-compatible hosts.

## Optional PATH shim

Hooks cannot see `cargo` spawned from scripts. Install the global package and
run the CLI from PATH. The shim embeds the realpath of that global entry:

```sh
npm i -g cargo-hauler
hauler install-shim            # defaults to ~/.local/bin
hauler install-shim --dir DIR  # or pick another user-writable dir
```

`install-shim` refuses unknown flags instead of installing on, for example,
`--help`. The shim works only if its directory resolves `cargo` **before**
rustup's `~/.cargo/bin` on `PATH`. Prepend it in your shell profile
(`export PATH="$HOME/.local/bin:$PATH"`). `install-shim` checks this after
installing and warns when `cargo` still resolves elsewhere.

The generated shim is self-contained
([issue #2](https://github.com/ScriptedAlchemy/cargo-hauler/issues/2)). It
embeds the absolute `node <script>` invocation of the `hauler` found on PATH
and an absolute real-cargo path. An npm-shaped `dist/bin/hauler.js` entry
embeds itself only when no `hauler` on PATH resolves to a regular `.js`,
`.mjs`, or `.cjs` file outside a plugin copy, so a checkout never shadows an
installed global that PATH can see. The real-cargo path is the
`~/.cargo/bin/cargo` link, not its canonical rustup target, because rustup
dispatches on `argv[0]`. The shim submits with `--host shim` and passes
daemon-spawned cargo straight through (`CARGO_HAULER_INSIDE=1`). On the daemon
side, bare `cargo` argv never resolves through PATH. The daemon uses
`CARGO_HAULER_CARGO_BIN` when set, otherwise `$CARGO_HOME/bin/cargo`, and
otherwise a bare `cargo` as the last resort.

Those absolute paths go stale when you upgrade Node or cargo-hauler. The
`cargo` shim found first on PATH is stale when the nearest `package.json`
above its embedded `hauler.js` names another cargo-hauler version, or when its
embedded `node` is not executable or its `hauler.js` is gone.
`cargo-hauler-install install <host>` rewrites a stale shim to the `hauler`
that `hauler install-shim` would embed when that `hauler` is this version, and
to the installer's own `dist/bin/hauler.js` otherwise. It writes through a
symlinked `cargo` and keeps the Cargo path the shim already runs. A second run
leaves the same bytes.
`cargo-hauler-install doctor` adds a `HAULER-SHIM-STALE` or
`HAULER-SHIM-MISSING` error to its report, text or `--json`, and exits `1`. A
shim that runs the same version under another working `node` is current, so
doctor and install agree across per-directory Node pins. A development
checkout leaves a same-version shim alone. It repoints a stale one at the
checkout's `dist/bin/hauler.js` unless a `hauler` of the same version is on
PATH.

## State

The daemon socket and ledger live under a per-user cache directory. That
directory is `$XDG_CACHE_HOME/cargo-hauler` when `XDG_CACHE_HOME` is set,
otherwise `~/.cache/cargo-hauler` on Linux, `~/Library/Caches/cargo-hauler` on
macOS, and `%LOCALAPPDATA%\cargo-hauler` on Windows. Set
`CARGO_HAULER_STATE_DIR` to relocate it.

The daemon serves the one user who owns that directory. It is not a shared
multi-user service. On Linux and macOS, cargo-hauler creates the directory
`0700` and its sensitive files `0600`, independent of your umask. The
sensitive files are complete command output under `tickets/`, the ledger and
its WAL sidecars, the daemon log, the passthrough spool, the hook records, the
pid lock, and the jobserver FIFO. On the next start, cargo-hauler tightens an
existing directory you already own. It never modifies a parent you point
`CARGO_HAULER_STATE_DIR` at. It refuses by name a state path that is a symlink
or belongs to another user, instead of following or deleting it. Fix or
remove that path and start again. If the directory is too deep for the
kernel's unix-socket path limit, the control socket moves into a
`cargo-hauler-<uid>` directory (`0700`) under `XDG_RUNTIME_DIR`, `TMPDIR`, or
the system temporary directory rather than into a shared temporary root.
Windows has no POSIX modes or uids and uses a named pipe, so none of this
applies there.

kache is optional. When `CARGO_HAULER_KACHE_INDEX` is unset, the daemon
reads kache's own config (`$XDG_CONFIG_HOME/kache/config.toml`, else
`~/.config/kache/config.toml`) for the `local_store` path under `[cache]` and
uses `<local_store>/index.db`. Without that config, it falls back to
`kache/index.db` under the same per-user cache base. An empty string disables
the lookup entirely. A missing file reports kache as unavailable.
