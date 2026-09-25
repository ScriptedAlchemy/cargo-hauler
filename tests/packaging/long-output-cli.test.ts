import { spawn } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'effect-rstest';

import { removeTestPath } from '../support/tmp-guard.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const haulerEntry = join(repoRoot, 'dist', 'bin', 'hauler.js');

const chattyCargo = `#!/usr/bin/env bash
seq -f "   Compiling crate-%g v0.1.0 (/workspace/crates/crate)" 1 50000
echo "last-line:$3"
`;

interface Invocation {
  readonly code: number;
  readonly stderr: string;
  readonly stdout: string;
}

const run = (args: readonly string[], cwd: string, env: Readonly<Record<string, string>>): Promise<Invocation> =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [haulerEntry, ...args], {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.once('error', reject);
    child.once('close', (code) => {
      resolvePromise({
        code: code ?? 1,
        stderr: Buffer.concat(stderr).toString('utf8'),
        stdout: Buffer.concat(stdout).toString('utf8'),
      });
    });
  });

describe.skipIf(!existsSync(haulerEntry))('a long build streamed to a reader that keeps up', () => {
  it('delivers every line, down to the last, with no truncation notice', async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'ch-long-output-')));
    const workspace = join(root, 'ws');
    mkdirSync(workspace);
    writeFileSync(join(workspace, 'Cargo.toml'), '[package]\nname = "ws"\n');
    writeFileSync(join(root, 'cargo'), chattyCargo);
    chmodSync(join(root, 'cargo'), 0o755);
    const env = {
      CARGO_HAULER_BATCH_WINDOW_MS: '0',
      CARGO_HAULER_CARGO_BIN: join(root, 'cargo'),
      CARGO_HAULER_CPU_PRESSURE_THRESHOLD: '0',
      CARGO_HAULER_KACHE_INDEX: '',
      CARGO_HAULER_MEM_AVAILABLE_MIN_GB: 'off',
      CARGO_HAULER_MEM_PRESSURE_HARD: 'off',
      CARGO_HAULER_MEM_PRESSURE_SOFT: 'off',
      CARGO_HAULER_STATE_DIR: join(root, 'state'),
    };
    try {
      // Demuxed `cargo build` makes every line its own message; the drops
      // this guards against showed up on a warm daemon, so run it thrice.
      for (const attempt of [1, 2, 3]) {
        const exec = await run(['exec', '--', 'cargo', 'build', '--bin', `long-${attempt}`], workspace, env);
        const lines = exec.stdout.split('\n');
        expect({ code: exec.code, truncated: exec.stderr.includes('output truncated') }).toEqual({
          code: 0,
          truncated: false,
        });
        expect(lines.filter((line) => line.startsWith('   Compiling crate-'))).toHaveLength(50_000);
        expect(lines.slice(-3)).toEqual([
          '   Compiling crate-50000 v0.1.0 (/workspace/crates/crate)',
          `last-line:long-${attempt}`,
          '',
        ]);
      }
    } finally {
      await run(['daemon', 'stop'], workspace, env);
      removeTestPath(root);
    }
  }, 60_000);
});
