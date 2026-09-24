import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { expect, it } from 'effect-rstest';

import { removeTestPath } from '../support/tmp-guard.js';

const hauler = join(resolve(import.meta.dirname, '../..'), 'dist/bin/hauler.js');

const alive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

it.skipIf(!existsSync(hauler))(
  'daemon stop escalates to SIGKILL for cargo processes that ignore SIGTERM',
  async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'hauler-stubborn-')));
    const pidsFile = join(root, 'pids');
    const cargo = join(root, 'cargo');
    writeFileSync(cargo, `#!/bin/sh\ntrap '' TERM\necho $$ >> '${pidsFile}'\nexec sleep 600\n`, { mode: 0o755 });
    const workspace = join(root, 'ws');
    mkdirSync(workspace);
    writeFileSync(join(workspace, 'Cargo.toml'), '[package]\nname = "ws"\n');
    const env = {
      ...process.env,
      CARGO_HAULER_CARGO_BIN: cargo,
      CARGO_HAULER_CPU_PRESSURE_THRESHOLD: '0',
      CARGO_HAULER_HEAVY_MEM_AVAILABLE_GB: 'off',
      CARGO_HAULER_KACHE_INDEX: '',
      CARGO_HAULER_KILL_GRACE_MS: '200',
      CARGO_HAULER_MEM_AVAILABLE_MIN_GB: 'off',
      CARGO_HAULER_MEM_PRESSURE_HARD: 'off',
      CARGO_HAULER_MEM_PRESSURE_SOFT: 'off',
      CARGO_HAULER_STATE_DIR: join(root, 'state'),
    };
    const run = (...args: string[]) => spawnSync(process.execPath, [hauler, ...args], { encoding: 'utf8', env });
    const cargoPids = (): number[] =>
      existsSync(pidsFile) ? readFileSync(pidsFile, 'utf8').trim().split('\n').map(Number) : [];
    const daemonPid = (JSON.parse(run('daemon', 'start').stdout) as { readonly pid: number }).pid;
    try {
      expect(run('exec', '--bg', '--cwd', workspace, '--', 'cargo', 'check', '-p', 'ws').status).toBe(0);
      const deadline = Date.now() + 10_000;
      while (cargoPids().length < 2 && Date.now() < deadline) {
        await new Promise((settle) => setTimeout(settle, 50));
      }
      expect(cargoPids().filter(alive)).toHaveLength(2);

      const stopStartedMs = Date.now();
      const stop = run('daemon', 'stop');
      expect(Date.now() - stopStartedMs).toBeLessThan(5_000);
      expect(stop.status).toBe(0);
      expect(JSON.parse(stop.stdout)).toMatchObject({
        message: 'cargo-hauler daemon stopped',
        previousPid: daemonPid,
        running: false,
      });
      expect(alive(daemonPid)).toBe(false);
      expect(cargoPids().filter(alive)).toEqual([]);
    } finally {
      for (const pid of [daemonPid, ...cargoPids()].filter(alive)) {
        process.kill(pid, 'SIGKILL');
      }
      removeTestPath(root);
    }
  },
  30_000,
);
