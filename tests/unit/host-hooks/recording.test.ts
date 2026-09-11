import { describe, expect, it } from 'effect-rstest';

import { handleBeforeShell, type HookServices } from '../../../src/internal/host-hooks/before-shell.js';
import type { HookDiagnostic } from '../../../src/internal/host-hooks/shared.js';

const run = (command: string, services: HookServices = {}) => handleBeforeShell(
  { cwd: '/tmp/ws', sessionId: 'record-test', toolInput: { command, timeout: 120 }, toolName: 'Bash' },
  { target: 'claude' },
  { haulerArgv: ['hauler'], probeDaemon: () => 'active', record: () => undefined,
    recordAttempt: () => undefined, diagnostic: () => undefined, ...services },
);

const recorders: Readonly<Record<string, () => void | Promise<void>>> = {
  throwing: () => { throw new Error('command-secret'); },
  rejecting: () => Promise.reject(new Error('command-secret')),
  stuck: () => new Promise<void>(() => undefined),
};

describe('before-shell decisions survive observability failures', () => {
  for (const [name, record] of Object.entries(recorders)) {
    it(`keeps an active-build clean denial with a ${name} recorder`, async () => {
      const diagnostics: HookDiagnostic[] = [];
      const result = await run('cargo clean', { record, diagnostic: (code) => { diagnostics.push(code); } });
      expect(result.outcome).toBe('deny');
      expect(result.reason).toContain('cargo clean is blocked');
      expect(result.updatedInput).toBeUndefined();
      expect(diagnostics).toEqual([name === 'stuck' ? 'record-timeout' : 'record-failed']);
    });

    it(`keeps a fully governed rewrite with a ${name} recorder`, async () => {
      const result = await run('cargo test', { record });
      expect(result).toEqual({ outcome: 'allow', updatedInput: {
        command: 'hauler exec --session record-test --host claude -- cargo test', timeout: 120,
      } });
    });

    it(`never approves an ungoverned segment with a ${name} recorder`, async () => {
      const result = await run('cargo test && echo outside', { record });
      expect(result).toEqual({ outcome: 'continue', updatedInput: {
        command: 'hauler exec --session record-test --host claude -- cargo test && echo outside', timeout: 120,
      } });
    });
  }

  it('cancels a recording wait without cancelling an established denial', async () => {
    const controller = new AbortController();
    const diagnostics: HookDiagnostic[] = [];
    const result = await run('cargo clean', {
      signal: controller.signal,
      diagnostic: (code) => { diagnostics.push(code); },
      record: () => { controller.abort(); return new Promise<void>(() => undefined); },
    });
    expect(result.outcome).toBe('deny');
    expect(diagnostics).toContain('record-cancelled');
  });

  it('keeps both rewrite outcomes when cancellation precedes recording', async () => {
    const controller = new AbortController();
    controller.abort();
    for (const [command, outcome] of [['cargo test', 'allow'], ['cargo test && echo outside', 'continue']] as const) {
      const result = await run(command, {
        signal: controller.signal,
        record: () => { throw new Error('cancelled recorder must not run'); },
      });
      expect(result.outcome).toBe(outcome);
      expect(result.updatedInput?.command).toContain('-- cargo test');
    }
  });

  it('observes a late rejection after the recorder times out', async () => {
    let rejectRecording: (error: Error) => void = () => { throw new Error('recorder was not called'); };
    const diagnostics: HookDiagnostic[] = [];
    const result = await run('cargo clean', {
      diagnostic: (code) => { diagnostics.push(code); },
      record: () => new Promise<void>((_resolve, reject) => { rejectRecording = reject; }),
    });
    expect(result.outcome).toBe('deny');
    rejectRecording(new Error('late command-secret'));
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(diagnostics).toEqual(['record-timeout']);
  });

  it('keeps attempt recording detached, including stuck and rejecting attempts', async () => {
    for (const recordAttempt of Object.values(recorders)) {
      const result = await run('cargo clean', { recordAttempt });
      expect(result.outcome).toBe('deny');
    }
  });

  it('does not lose a decision when the clock or diagnostic sink fails', async () => {
    const result = await run('cargo clean', {
      nowMs: () => { throw new Error('clock'); },
      diagnostic: () => { throw new Error('diagnostic'); },
    });
    expect(result.outcome).toBe('deny');
    const rejectedDiagnostic = await run('cargo test', {
      record: recorders.rejecting,
      diagnostic: () => Promise.reject(new Error('diagnostic')),
    });
    expect(rejectedDiagnostic.outcome).toBe('allow');
  });

  it('distinguishes failed probes from confirmed absence without inventing approval', async () => {
    const diagnostics: HookDiagnostic[] = [];
    const diagnostic = (code: HookDiagnostic) => { diagnostics.push(code); };
    expect(await run('cargo clean', { probeDaemon: () => 'absent', diagnostic })).toEqual({ outcome: 'continue' });
    expect(diagnostics).toEqual([]);
    expect(await run('cargo clean', {
      probeDaemon: () => Promise.reject(new Error('probe-secret')), diagnostic,
    })).toEqual({ outcome: 'continue' });
    expect(diagnostics).toEqual(['probe-failed']);
  });

  it('does no recording for irrelevant input and still records successful decisions', async () => {
    let calls = 0;
    const record = () => { calls += 1; };
    expect(await run('ls -la', { record })).toEqual({ outcome: 'continue' });
    expect(calls).toBe(0);
    expect((await run('cargo clean', { record })).outcome).toBe('deny');
    expect(calls).toBe(1);
  });
});
