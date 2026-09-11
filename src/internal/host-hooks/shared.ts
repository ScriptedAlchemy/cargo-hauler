import { diagnosticCounts } from '../ui/documents/headlines.js';
import { isRecord } from '../util/guards.js';
import { countWord } from '../util/text.js';
import { extractShellCommand } from './tool-input.js';

import type { DaemonProbe } from './probe.js';
import type { HookRecord } from './record.js';
import type { DeniedAttempt, FinishedTicket } from './rpc.js';

export { extractShellCommand, isRecord, countWord };

export interface HookContext {
  readonly nativeEvent?: string;
  readonly target?: string;
}

/** Safe observability codes; never include commands, arguments, or exception text. */
export type HookDiagnostic =
  | 'probe-failed'
  | 'decision-failed'
  | `${'record' | 'recordAttempt'}-${'failed' | 'timeout' | 'cancelled'}`;

export interface HookServices {
  readonly completedSince?: (session: string, sinceMs: number) => Promise<readonly FinishedTicket[]>;
  readonly diagnostic?: (code: HookDiagnostic) => void | Promise<void>;
  readonly haulerArgv?: readonly string[];
  readonly nowMs?: () => number;
  readonly probeDaemon?: () => DaemonProbe | Promise<DaemonProbe>;
  readonly readCursor?: (session: string) => number;
  readonly record?: (event: HookRecord) => void | Promise<void>;
  readonly recordAttempt?: (attempt: DeniedAttempt) => void | Promise<void>;
  /** Resolved lazily after the clean guard, so binding failure cannot discard a denial. */
  readonly resolveHaulerArgv?: () => readonly string[] | Promise<readonly string[]>;
  readonly signal?: AbortSignal;
  readonly writeCursor?: (session: string, atMs: number) => void;
}

export const formatFinishedTicket = (ticket: FinishedTicket): string => {
  const counts = diagnosticCounts(ticket);
  switch (ticket.status) {
    case 'done':
      return `ticket ${ticket.ticket} finished: success${counts === null ? '' : `, ${counts}`} — call hauler_result ${ticket.ticket}`;
    case 'failed': {
      const detail =
        ticket.error === null || ticket.error.length === 0 ? '' : ` (${ticket.error})`;
      return `ticket ${ticket.ticket} finished: failed${counts === null ? '' : `, ${counts}`}${detail} — call hauler_result ${ticket.ticket}`;
    }
    case 'killed':
      return `ticket ${ticket.ticket} finished: killed${counts === null ? '' : `, ${counts}`} — call hauler_result ${ticket.ticket}`;
    default: {
      const exhaustive: never = ticket.status;
      return exhaustive;
    }
  }
};

export const resolveHookHost = (
  context: HookContext | undefined,
  env: Readonly<Record<string, string | undefined>> = process.env,
): string => {
  const nativeEvent = context?.nativeEvent;
  if (nativeEvent === 'preToolUse' || nativeEvent === 'postToolUse') {
    return 'cursor';
  }
  const target = context?.target;
  if (target === 'claude' || target === 'codex' || target === 'cursor') {
    return target;
  }
  const declared = env.AGENT_BUNDLE_HOOK_HOST;
  if (declared === 'claude' || declared === 'codex' || declared === 'cursor') {
    return declared;
  }
  return target ?? 'plugin';
};
