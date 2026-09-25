import { spawn } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'effect-rstest';

import { removeTestPath } from '../support/tmp-guard.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const haulerEntry = join(repoRoot, 'dist', 'bin', 'hauler.js');

const orphaningCargo = `#!/usr/bin/env bash
echo "fake-out:$*"
sleep 30 &
echo "$!" > "$ORPHAN_PID_FILE"
exit 0
`;

interface Invocation {
  readonly code: number;
  readonly stdout: string;
}

const run = (args: readonly string[], cwd: string, env: Readonly<Record<string, string>>): Promise<Invocation> =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [haulerEntry, ...args], {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      resolvePromise({ code: code ?? 1, stdout });
    });
  });

const isAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

describe.skipIf(!existsSync(haulerEntry))('a descendant that outlives cargo', () => {
  it('neither delays settlement nor keeps the daemon from stopping', async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'ch-orphan-')));
    const workspace = join(root, 'ws');
    const orphanPidFile = join(root, 'orphan.pid');
    mkdirSync(workspace);
    writeFileSync(join(workspace, 'Cargo.toml'), '[package]\nname = "ws"\n');
    writeFileSync(join(root, 'cargo'), orphaningCargo);
    chmodSync(join(root, 'cargo'), 0o755);
    const env = {
      CARGO_HAULER_CARGO_BIN: join(root, 'cargo'),
      CARGO_HAULER_CPU_PRESSURE_THRESHOLD: '0',
      CARGO_HAULER_KACHE_INDEX: '',
      CARGO_HAULER_MEM_AVAILABLE_MIN_GB: 'off',
      CARGO_HAULER_MEM_PRESSURE_HARD: 'off',
      CARGO_HAULER_MEM_PRESSURE_SOFT: 'off',
      CARGO_HAULER_STATE_DIR: join(root, 'state'),
      ORPHAN_PID_FILE: orphanPidFile,
    };
    let orphan: number | undefined;
    try {
      const exec = await run(['exec', '--', 'cargo', 'check'], workspace, env);
      orphan = Number(readFileSync(orphanPidFile, 'utf8').trim());
      expect(exec.code).toBe(0);
      expect(exec.stdout).toContain('fake-out:check');
      expect(isAlive(orphan)).toBe(true);

      const stop = await run(['daemon', 'stop'], workspace, env);
      const result = JSON.parse(stop.stdout) as { previousPid: number };
      expect({ code: stop.code, result }).toMatchObject({
        code: 0,
        result: { pid: null, running: false, shutdown: { kind: 'acknowledged' } },
      });
      expect(isAlive(result.previousPid)).toBe(false);
      expect(isAlive(orphan)).toBe(true);
    } finally {
      if (orphan !== undefined && isAlive(orphan)) process.kill(orphan, 'SIGKILL');
      await run(['daemon', 'stop'], workspace, env);
      removeTestPath(root);
    }
  }, 30_000);
});
