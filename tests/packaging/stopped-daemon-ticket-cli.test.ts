import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { createServer, type Server } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'effect-rstest';
import * as Effect from 'effect/Effect';

import { createLedgerApi, openLedgerDatabase } from '../../src/internal/storage/ledger.js';
import { removeTestPath } from '../support/tmp-guard.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const haulerEntry = join(repoRoot, 'dist', 'bin', 'hauler.js');

const seededRecord = {
  after: [],
  argv: ['cargo', 'check'],
  attachMode: null,
  attachedTo: null,
  background: true,
  createdAtMs: 1_000,
  cwd: '/repo',
  diagnostics: null,
  errorCount: null,
  estimateMs: null,
  execArgv: ['cargo', 'check'],
  exitCode: null,
  finishedAtMs: null,
  holdStop: false,
  host: 'cli',
  id: 1,
  intentJson: null,
  intentKey: 'k',
  laneKey: '/repo::/repo/target',
  outputPath: null,
  outputTail: null,
  queuedAtMs: 1_100,
  runMs: null,
  savedComputeMs: null,
  savedComputeSource: null,
  savedLatencyMs: null,
  session: null,
  signal: null,
  startedAtMs: 1_200,
  targetDir: '/repo/target',
  ticket: 'cc-1',
  waitMs: 100,
  warningCount: null,
  workspaceRoot: '/repo',
};

describe.skipIf(!existsSync(haulerEntry))('ticket reads on a stopped daemon', () => {
  let root = '';
  let env: Record<string, string | undefined> = {};

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'ch-stopped-ticket-'));
    const stateDir = join(root, 'state');
    mkdirSync(stateDir, { recursive: true });
    env = { ...process.env, CARGO_HAULER_KACHE_INDEX: '', CARGO_HAULER_STATE_DIR: stateDir };
    const db = openLedgerDatabase(join(stateDir, 'ledger.db'));
    const ledger = createLedgerApi(db);
    Effect.runSync(
      Effect.gen(function* () {
        const { id } = yield* ledger.createRequest({
          argv: ['cargo', 'check'],
          background: true,
          createdAtMs: 1_000,
          cwd: '/repo',
          host: 'cli',
          intentJson: null,
          intentKey: 'k',
          laneKey: '/repo::/repo/target',
          session: null,
          targetDir: '/repo/target',
          workspaceRoot: '/repo',
        });
        yield* ledger.markQueued(id, 1_100);
        yield* ledger.markRunning(id, 1_200, ['cargo', 'check']);
      }),
    );
    db.close();
  });

  afterEach(() => {
    removeTestPath(root);
  });

  const hauler = (...args: string[]) => {
    const run = spawnSync(process.execPath, [haulerEntry, ...args], { encoding: 'utf8', env });
    return { code: run.status, stderr: run.stderr, stdout: run.stdout };
  };

  const haulerJson = (...args: string[]) => {
    const { code, stderr, stdout } = hauler(...args, '--json');
    return { code, json: stdout === '' ? null : (JSON.parse(stdout) as unknown), stderr };
  };

  const orphaned = { ...seededRecord, error: 'stranded by a stopped daemon', status: 'orphaned' };

  it('shows last the same orphaned record', () => {
    expect(haulerJson('last')).toEqual({
      code: 0,
      json: { daemon: 'stopped', operation: 'last', request: orphaned, summary: 'cc-1 orphaned' },
      stderr: '',
    });
  });

  it('reads a stranded ticket from the ledger as orphaned', () => {
    expect(haulerJson('result', 'cc-1')).toEqual({
      code: 0,
      stderr: '',
      json: {
        daemon: 'stopped',
        operation: 'result',
        request: orphaned,
        summary: 'cc-1 orphaned — stranded by a stopped daemon',
        ticket: 'cc-1',
      },
    });
  });

  it('ends an await on a stranded ticket instead of failing', () => {
    expect(haulerJson('await', 'cc-1')).toEqual({
      code: 0,
      stderr: '',
      json: {
        daemon: 'stopped',
        operation: 'await',
        request: orphaned,
        summary: 'cc-1 orphaned — stranded by a stopped daemon',
        ticket: 'cc-1',
        timedOut: false,
      },
    });
  });

  it('prints the orphaned headline and reason without an error line', () => {
    const run = hauler('result', 'cc-1');
    expect(run.code).toBe(0);
    expect(run.stderr).toBe('');
    expect(run.stdout.split('\n').slice(0, 1)).toEqual(['cc-1 orphaned — stranded by a stopped daemon']);
    expect(run.stdout).toContain('- **Error:** stranded by a stopped daemon');
  });

  describe.skipIf(process.getuid?.() === 0)('with a live socket this client may not open', () => {
    let server: Server;
    let socketPath = '';

    beforeEach(async () => {
      socketPath = join(root, 'state', 'daemon.sock');
      server = createServer();
      await new Promise<void>((resolve) => server.listen(socketPath, resolve));
      chmodSync(socketPath, 0o000);
    });

    afterEach(async () => {
      await new Promise((resolve) => server.close(resolve));
    });

    const unreachable = () => ({
      code: 1,
      json: null,
      stderr: `${JSON.stringify({
        error: {
          code: 'render-failed',
          message: `hauler daemon socket at ${socketPath} could not be opened (EACCES). The daemon may still be running, so check hauler daemon status`,
        },
      })}\n`,
    });

    it('fails result instead of calling the running ticket orphaned', () => {
      expect(haulerJson('result', 'cc-1')).toEqual(unreachable());
    });

    it('fails await instead of ending it on a stopped daemon', () => {
      expect(haulerJson('await', 'cc-1')).toEqual(unreachable());
    });

    it('reports last on an unresponsive daemon, not a stopped one', () => {
      expect(haulerJson('last')).toEqual({
        code: 0,
        json: {
          daemon: 'unresponsive',
          operation: 'last',
          request: { ...seededRecord, error: 'daemon did not answer, so ownership is unconfirmed', status: 'orphaned' },
          summary: 'cc-1 orphaned',
        },
        stderr: '',
      });
    });
  });
});
