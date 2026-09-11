import { recordBestEffort, reportHookDiagnostic } from './best-effort.js';
import { prepareShellCommand } from './inspect.js';
import { resolveHaulerArgv } from '../platform/hauler-binding.js';
import { probeActiveBuilds, type DaemonProbe } from './probe.js';
import { appendHookRecord } from './record.js';
import { recordDeniedAttempt } from './rpc.js';
import {
  extractShellCommand,
  isRecord,
  resolveHookHost,
  type HookContext,
  type HookServices,
} from './shared.js';

export type { HookContext, HookServices };

export interface BeforeShellEvent {
  readonly cwd?: string;
  readonly sessionId?: string;
  /** The pending call's input as the host sent it: an object on Claude and Cursor, any JSON on Codex. */
  readonly toolInput?: unknown;
  readonly toolName?: string;
  readonly toolUseId?: string;
}

/**
 * The hauler never introduces a permission prompt. `continue` is the
 * no-decision answer for every shell call the hook does not govern (the host's
 * own permission flow applies, exactly as without the plugin). `allow` is
 * returned only when every command in the input has been rewritten onto (or
 * already runs through) the hauler exec path: the daemon governs the whole
 * command, so the host is not asked again. A rewrite that leaves ungoverned
 * segments beside cargo is `continue` + `updatedInput`: brokered, but decided
 * by the host. `deny` blocks a destructive cargo command that would race
 * in-flight builds. The hook never returns `ask`.
 */
export interface BeforeShellResult {
  readonly additionalContext?: string;
  readonly outcome: 'continue' | 'allow' | 'deny';
  readonly reason?: string;
  readonly updatedInput?: Readonly<Record<string, unknown>>;
}

const continueResult = (): BeforeShellResult => ({ outcome: 'continue' });

const denyCleanReason =
  'cargo clean is blocked while cargo-hauler has in-flight builds; wait for them to finish or run hauler status';

// Telemetry only: whitespace splitting intentionally does not preserve quoted arguments.
const attemptArgv = (command: string): readonly string[] => command.trim().split(/\s+/u);

interface DenyCleanInput {
  readonly command: string;
  readonly cwd: string | undefined;
  readonly host: string;
  readonly nowMs: () => number;
  readonly record: NonNullable<HookServices['record']>;
  readonly session: string;
  readonly services: HookServices;
  readonly submitAttempt: NonNullable<HookServices['recordAttempt']>;
  readonly toolName: string | undefined;
}

const denyClean = async (input: DenyCleanInput): Promise<BeforeShellResult> => {
  const result: BeforeShellResult = { outcome: 'deny', reason: denyCleanReason };
  await recordBestEffort(() => input.record({
    atMs: input.nowMs(),
    command: input.command,
    host: input.host,
    outcome: 'deny',
    phase: 'beforeTool',
    reason: denyCleanReason,
    session: input.session,
    ...(input.cwd === undefined ? {} : { cwd: input.cwd }),
    ...(input.toolName === undefined ? {} : { toolName: input.toolName }),
  }), input.services);
  // Attempt telemetry remains detached, with rejection and timeout observed.
  void recordBestEffort(() => input.submitAttempt({
    argv: attemptArgv(input.command),
    cwd: input.cwd ?? process.cwd(),
    host: input.host,
    reason: denyCleanReason,
    session: input.session,
  }), input.services, 'recordAttempt');
  return result;
};

const decideBeforeShell = async (
  event: BeforeShellEvent,
  context: HookContext,
  services: HookServices,
): Promise<BeforeShellResult> => {
  const command = extractShellCommand(event.toolInput);
  if (command === undefined) {
    return continueResult();
  }

  // Every shell tool call lands here. `hasCargo` needs a word ending in
  // `cargo`, so the substring test is exact and spares the bash parse.
  if (!command.includes('cargo')) {
    return continueResult();
  }

  const prepared = prepareShellCommand(command);
  const inspection = prepared.inspection;
  // `alreadyWrapped` alone is not a short-circuit: `hauler exec -- cargo build
  // && cargo test` still has an unbrokered half.
  if (!inspection.hasCargo) {
    return continueResult();
  }

  const host = resolveHookHost(context);
  const session = event.sessionId ?? 'unknown';
  const cwd = event.cwd;
  const nowMs = services.nowMs ?? Date.now;
  const record = services.record ?? appendHookRecord;

  if (inspection.destructive) {
    const probe = services.probeDaemon ?? probeActiveBuilds;
    let verdict: DaemonProbe;
    try {
      verdict = await probe();
    } catch {
      // Unknown is not absence. Preserve the existing host-decided policy:
      // no explicit allow, no invented active-build verdict, and no rewrite
      // that could start a daemon solely because its probe failed.
      reportHookDiagnostic(services, 'probe-failed');
      return continueResult();
    }
    switch (verdict) {
      case 'idle':
      case 'busy':
        // Idle: broker it like any other cargo command. Busy: the daemon is
        // alive but saturated, which is when a raw clean would race its
        // lanes; the rewrite lets the lane serialize the clean instead.
        break;
      case 'absent':
        // No daemon: nothing to race, and brokering would only auto-start one
        // for a clean.
        return continueResult();
      case 'active':
        return denyClean({
          command,
          cwd,
          host,
          nowMs,
          record,
          session,
          services,
          submitAttempt: services.recordAttempt ?? recordDeniedAttempt,
          toolName: event.toolName,
        });
      default: {
        const exhaustive: never = verdict;
        return exhaustive;
      }
    }
  }

  const rewritten = prepared.rewrite({
    haulerArgv: services.haulerArgv ?? (services.resolveHaulerArgv === undefined
      ? resolveHaulerArgv({ fallback: 'path' })
      : await services.resolveHaulerArgv()),
    host,
    session,
  });
  if (rewritten === command) {
    return continueResult();
  }

  const toolInput = isRecord(event.toolInput) ? { ...event.toolInput, command: rewritten } : { command: rewritten };
  // Every segment brokered: the daemon governs the whole command, so an
  // explicit allow keeps the host from prompting for it (a pass-through result
  // carries no decision since agent-bundle#461). A command that also runs
  // something the daemon does not govern (`cargo test && rm -rf target`) is
  // still rewritten, but never approved as a whole: `continue` hands the
  // rewritten input to the host's own permission flow, exactly as it would
  // have decided the original.
  const outcome = inspection.ungoverned ? 'continue' : 'allow';
  const result: BeforeShellResult = { outcome, updatedInput: toolInput };
  await recordBestEffort(() => record({
    atMs: nowMs(),
    command,
    host,
    outcome,
    phase: 'beforeTool',
    rewritten,
    session,
    ...(cwd === undefined ? {} : { cwd }),
    ...(event.toolName === undefined ? {} : { toolName: event.toolName }),
  }), services);
  return result;
};

export const handleBeforeShell = async (
  event: BeforeShellEvent,
  context: HookContext = {},
  services: HookServices = {},
): Promise<BeforeShellResult> => {
  try {
    return await decideBeforeShell(event, context, services);
  } catch {
    // Parsing/binding failures before a decision remain host-decided. Known
    // protective decisions cannot arrive here through a recording failure.
    reportHookDiagnostic(services, 'decision-failed');
    return continueResult();
  }
};

export default handleBeforeShell;
