import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

import { ensurePrivateDir, ensurePrivateFile } from '../lib/private-state.js';
import { resolveStateDir } from '../status.js';

export interface HookRecord {
  readonly atMs: number;
  readonly command: string;
  readonly cwd?: string;
  readonly exitCode?: number | null;
  readonly host: string;
  readonly outcome: 'continue' | 'allow' | 'deny';
  readonly phase: 'beforeTool' | 'afterTool';
  readonly reason?: string;
  readonly rewritten?: string;
  readonly session?: string;
  readonly toolName?: string;
}

export const hookEventsFileName = 'hook-events.jsonl';

export const appendHookRecord = (
  record: HookRecord,
  stateDir: string = resolveStateDir(),
): void => {
  const path = join(stateDir, hookEventsFileName);
  ensurePrivateDir(stateDir);
  ensurePrivateFile(path);
  appendFileSync(path, `${JSON.stringify(record)}\n`);
};
