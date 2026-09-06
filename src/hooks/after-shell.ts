import { extractShellOutput } from '../lib/tool-input.js';

import { readCursor, writeCursor } from './hook-state.js';
import { appendHookRecord } from './record.js';
import { listSessionCompleted } from './rpc.js';
import type { FinishedTicket } from './rpc.js';
import {
  extractShellCommand,
  formatFinishedTicket,
  isRecord,
  resolveHookHost,
  type HookContext,
  type HookServices,
} from './shared.js';
import { hiddenCargoRun } from './tokens.js';

export interface AfterShellEvent {
  readonly cwd?: string;
  readonly sessionId?: string;
  readonly finishedAsOfMs?: number;
  readonly finishedTickets?: readonly FinishedTicket[];
  /** The completed call's input as the host sent it: an object on Claude and Cursor, any JSON on Codex. */
  readonly toolInput?: unknown;
  readonly toolName?: string;
  readonly toolResponse?: unknown;
  readonly toolUseId?: string;
}

export interface AfterShellResult {
  readonly additionalContext?: string;
  readonly outcome: 'continue';
}

const hiddenCargoReason = 'cargo ran outside cargo-hauler (wrapper script, alias, or shell variable)';
const hiddenCargoContext =
  'cargo-hauler: this command ran cargo outside the broker — through a wrapper script, alias, or shell variable the hook cannot see — so it skipped lane serialization, attach, and the ledger. Name `cargo` in the command itself (env prefixes are fine: `RUSTC_WRAPPER= cargo test …`) or run `hauler exec -- cargo …` so the daemon brokers it.';

const extractExitCode = (toolResponse: unknown): number | undefined => {
  if (!isRecord(toolResponse)) {
    return undefined;
  }
  const value = toolResponse.exitCode ?? toolResponse.exit_code;
  return typeof value === 'number' ? value : undefined;
};

const notifyContext = async (
  session: string | undefined,
  services: HookServices,
  known?: readonly FinishedTicket[],
  asOfMs?: number,
): Promise<string | undefined> => {
  if (session === undefined || session.length === 0) {
    return undefined;
  }
  const write = services.writeCursor ?? writeCursor;
  const nowMs = (services.nowMs ?? Date.now)();
  let finished: readonly FinishedTicket[];
  if (known !== undefined) {
    finished = known;
  } else {
    const read = services.readCursor ?? readCursor;
    const completedSince = services.completedSince ?? listSessionCompleted;
    try {
      finished = await completedSince(session, read(session));
    } catch {
      return undefined;
    }
  }
  if (finished.length === 0) {
    // The query is `finished_at_ms >= cursor`, so leaving the cursor where it
    // was returns the same (empty) set next time; skip the state-file write.
    return undefined;
  }
  write(session, asOfMs ?? nowMs);
  return finished.map(formatFinishedTicket).join('\n');
};

const decideAfterShell = async (
  event: AfterShellEvent,
  context: HookContext,
  services: HookServices,
): Promise<AfterShellResult> => {
  const command = extractShellCommand(event.toolInput);
  if (command === undefined) {
    return { outcome: 'continue' };
  }
  // Only cargo/hauler activity belongs in the telemetry log; every other
  // shell command still flows through so completion notifications inject.
  // A command that never named cargo but printed cargo's status lines ran it
  // unbrokered; it is recorded with the reason and the agent is told.
  const hidden = hiddenCargoRun(command, extractShellOutput(event.toolResponse));
  if (hidden || command.includes('cargo') || command.includes('hauler')) {
    const record = services.record ?? appendHookRecord;
    const exitCode = extractExitCode(event.toolResponse);
    await record({
      atMs: (services.nowMs ?? Date.now)(),
      command,
      host: resolveHookHost(context),
      outcome: 'continue',
      phase: 'afterTool',
      ...(hidden ? { reason: hiddenCargoReason } : {}),
      ...(event.cwd === undefined ? {} : { cwd: event.cwd }),
      ...(exitCode === undefined ? {} : { exitCode }),
      ...(event.sessionId === undefined ? {} : { session: event.sessionId }),
      ...(event.toolName === undefined ? {} : { toolName: event.toolName }),
    });
  }
  const finished = await notifyContext(event.sessionId, services, event.finishedTickets, event.finishedAsOfMs);
  const notices = [...(hidden ? [hiddenCargoContext] : []), ...(finished === undefined ? [] : [finished])];
  return notices.length === 0
    ? { outcome: 'continue' }
    : { additionalContext: notices.join('\n'), outcome: 'continue' };
};

export const handleAfterShell = async (
  event: AfterShellEvent,
  context: HookContext = {},
  services: HookServices = {},
): Promise<AfterShellResult> => {
  try {
    return await decideAfterShell(event, context, services);
  } catch {
    return { outcome: 'continue' };
  }
};

export default handleAfterShell;
