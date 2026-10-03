import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { JsonValue } from '@agent-bundle/runtime';
import type { EventContext } from 'agent-bundle/routes';
import { describe, expect, it } from 'effect-rstest';
import * as Effect from 'effect/Effect';

import { runExecClient } from '../../src/internal/client/exec.js';
import afterEvent from '../../src/events/tool/after.js';
import beforeEvent from '../../src/events/tool/before.js';

import { fakeCargoEnv, pollReport, scopedDaemon } from '../support/harness.js';
import { removeTestPath } from '../support/tmp-guard.js';

/**
 * The shell routes' handlers decide on the raw command before the rendered
 * view is loaded. `tool/before` renders only for a command that names cargo
 * or hauler. `tool/after` calls `handleAfterShell` and renders only when
 * the result carries additionalContext.
 */
const eventContext = <E extends 'tool/before' | 'tool/after'>(
  event: E,
  payload: Record<string, unknown>,
): EventContext<E> =>
  ({
    canonical: { event, payload, provenance: { host: 'claude', nativeEvent: 'PreToolUse' } },
    native: {},
    render: (module: string, data: JsonValue) => ({ data, module, outcome: 'render' }),
    signal: new AbortController().signal,
  }) as unknown as EventContext<E>;

const shellPayload = (command: string | undefined, session = 'sess-claude'): Record<string, unknown> => ({
  cwd: { value: '/tmp/ws' },
  sessionId: { value: session },
  toolInput: command === undefined ? { value: { file_path: '/tmp/ws/Cargo.toml' } } : { value: { command } },
  toolName: { value: command === undefined ? 'Read' : 'Bash' },
});

describe('tool/before event handler', () => {
  it('continues a non-cargo command and a tool input without a command', async () => {
    expect(await beforeEvent(eventContext('tool/before', shellPayload('ls -la')))).toEqual({ outcome: 'continue' });
    expect(await beforeEvent(eventContext('tool/before', shellPayload('hauler status')))).toEqual({ outcome: 'continue' });
    expect(await beforeEvent(eventContext('tool/before', shellPayload('git status && pnpm test')))).toEqual({
      outcome: 'continue',
    });
    expect(await beforeEvent(eventContext('tool/before', shellPayload(undefined)))).toEqual({ outcome: 'continue' });
  });

  it('renders the view for cargo commands', async () => {
    for (const command of ['cargo test -p foo', 'cargo clean', 'cd crates/foo && cargo build', 'hauler exec -- cargo check']) {
      expect(await beforeEvent(eventContext('tool/before', shellPayload(command)))).toEqual({
        data: {},
        module: './before.view.js',
        outcome: 'render',
      });
    }
  });
});

describe('tool/after event handler', () => {
  it('continues a cargo command when nothing finished', async () => {
    expect(await afterEvent(eventContext('tool/after', shellPayload('cargo test -p foo')))).toEqual({
      outcome: 'continue',
    });
  });

  it('renders hidden-cargo context for a wrapper script whose output is cargo status lines', async () => {
    const cargoOutput = { exit_code: 0, stdout: '   Compiling foo v0.1.0\n    Finished `test` profile target(s) in 2.00s\n' };
    const hidden = await afterEvent(
      eventContext('tool/after', { ...shellPayload('/tmp/scratch/cg.sh test -p foo', ''), toolResponse: { value: cargoOutput } }),
    );
    expect(hidden).toEqual({
      data: {
        additionalContext: expect.stringContaining('outside the broker'),
      },
      module: './after.view.js',
      outcome: 'render',
    });
    expect(
      await afterEvent(eventContext('tool/after', { ...shellPayload('tail -30 build.log', ''), toolResponse: { value: cargoOutput } })),
    ).toEqual({ outcome: 'continue' });
  });

  it('continues when the host names no session', async () => {
    expect(await afterEvent(eventContext('tool/after', shellPayload('ls -la', '')))).toEqual({ outcome: 'continue' });
  });

  it('continues quietly when no daemon listens', async () => {
    const root = mkdtempSync(join(tmpdir(), 'hauler-event-handler-'));
    try {
      const previous = process.env.CARGO_HAULER_STATE_DIR;
      process.env.CARGO_HAULER_STATE_DIR = root;
      try {
        expect(await afterEvent(eventContext('tool/after', shellPayload('ls -la')))).toEqual({ outcome: 'continue' });
        expect(await afterEvent(eventContext('tool/after', shellPayload('cargo test -p foo')))).toEqual({
          outcome: 'continue',
        });
      } finally {
        if (previous === undefined) {
          delete process.env.CARGO_HAULER_STATE_DIR;
        } else {
          process.env.CARGO_HAULER_STATE_DIR = previous;
        }
      }
    } finally {
      removeTestPath(root);
    }
  });

  it.live('injects finished background tickets as additionalContext', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(1);
      const session = 'sess-live-ping';
      const submitted = yield* runExecClient({
        argv: ['cargo', 'check'],
        autoSpawn: false,
        background: true,
        config: fixture.config,
        cwd: fixture.ws1,
        env: fakeCargoEnv(fixture),
        host: 'claude',
        io: { writeStderr: () => undefined, writeStdout: () => undefined },
        session,
      });
      expect(submitted.ticket).toMatch(/^cc-\d+$/u);
      yield* pollReport(fixture, (report) =>
        report.recent.some((request) => request.ticket === submitted.ticket && request.status === 'done'),
      );

      const previous = process.env.CARGO_HAULER_STATE_DIR;
      process.env.CARGO_HAULER_STATE_DIR = fixture.config.stateDir;
      try {
        expect(yield* Effect.promise(() => Promise.resolve(afterEvent(eventContext('tool/after', shellPayload('ls -la', session)))))).toEqual({
          data: {
            additionalContext: expect.stringContaining(`${submitted.ticket} finished: success`),
          },
          module: './after.view.js',
          outcome: 'render',
        });
        expect(yield* Effect.promise(() => Promise.resolve(afterEvent(eventContext('tool/after', shellPayload('ls -la', 'sess-other')))))).toEqual({
          outcome: 'continue',
        });
      } finally {
        if (previous === undefined) {
          delete process.env.CARGO_HAULER_STATE_DIR;
        } else {
          process.env.CARGO_HAULER_STATE_DIR = previous;
        }
      }
    }), 20_000);
});
