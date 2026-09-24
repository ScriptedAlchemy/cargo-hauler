import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { expect, it } from 'effect-rstest';

import { appendHookRecord, hookEventsFileName } from '../../src/internal/host-hooks/record.js';
import { defaultStateDir, resolveStateDir } from '../../src/internal/platform/state-paths.js';

const projectRoot = resolve(import.meta.dirname, '../..');
const probeName = 'records hooks at both state roots';

it(probeName, () => {
  for (const stateDir of [resolveStateDir(), defaultStateDir()]) {
    appendHookRecord({ atMs: 1, command: 'cargo check', host: 'claude', outcome: 'allow', phase: 'beforeTool' }, stateDir);
    expect(readFileSync(join(stateDir, hookEventsFileName), 'utf8')).toBe(
      '{"atMs":1,"command":"cargo check","host":"claude","outcome":"allow","phase":"beforeTool"}\n',
    );
  }
});

it('never writes into an inherited CARGO_HAULER_STATE_DIR or XDG_CACHE_HOME', () => {
  const inherited = mkdtempSync(join(tmpdir(), 'hauler-inherited-'));
  try {
    const child = spawnSync(
      process.execPath,
      [join(projectRoot, 'node_modules/@rstest/core/bin/rstest.js'), 'tests/setup/isolate-state.test.ts', '-t', probeName],
      {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          CARGO_HAULER_STATE_DIR: join(inherited, 'state'),
          XDG_CACHE_HOME: join(inherited, 'cache'),
        },
      },
    );
    expect(child.status).toBe(0);
    expect(readdirSync(inherited, { recursive: true })).toEqual([]);
  } finally {
    rmSync(inherited, { force: true, recursive: true });
  }
}, 60_000);
