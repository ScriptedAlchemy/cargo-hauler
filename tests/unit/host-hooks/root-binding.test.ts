import { describe, expect, it } from 'effect-rstest';

import { handleBeforeShell, type HookServices } from '../../../src/internal/host-hooks/before-shell.js';
import { haulerArgvForRoot, resolveHaulerArgv } from '../../../src/internal/platform/hauler-binding.js';

const fallback = { root: '/relocated/plugin with spaces' };
const run = (command: string, services: HookServices = {}) => handleBeforeShell(
  { sessionId: 'root-test', toolInput: { command, timeout: 120 } },
  { target: 'claude' },
  { diagnostic: () => undefined, record: () => undefined, recordAttempt: () => undefined, ...services },
);

describe('hauler executable binding (#168)', () => {
  it('keeps the declared script identity and code root separate from state', () => {
    expect(haulerArgvForRoot('/code root')).toEqual([process.execPath, '/code root/scripts/hauler.mjs']);
    expect(resolveHaulerArgv({
      env: { AGENT_BUNDLE_PLUGIN_ROOT: '/code root', AGENT_BUNDLE_STATE_ROOT: '/state root' }, fallback,
    })).toEqual([process.execPath, '/code root/scripts/hauler.mjs']);
  });

  for (const anchor of ['', '   ', '${CLAUDE_PLUGIN_ROOT}']) {
    it(`uses the explicit artifact fallback for ${JSON.stringify(anchor)}, never an alias or PATH`, () => {
      expect(resolveHaulerArgv({
        env: { AGENT_BUNDLE_PLUGIN_ROOT: anchor, CLAUDE_PLUGIN_ROOT: '/wrong',
          CURSOR_PLUGIN_ROOT: '/also-wrong', PLUGIN_ROOT: '/not-this' },
        fallback, warn: () => undefined,
      })).toEqual([process.execPath, `${fallback.root}/scripts/hauler.mjs`]);
    });
  }

  it('makes PATH a deliberate standalone policy, not an installed-plugin fallback', () => {
    expect(resolveHaulerArgv({ env: {}, fallback: 'path' })).toEqual(['hauler']);
    expect(resolveHaulerArgv({ env: { AGENT_BUNDLE_PLUGIN_ROOT: '${PLUGIN_ROOT}' }, fallback: 'path', warn: () => undefined })).toEqual(['hauler']);
    expect(resolveHaulerArgv({ env: { AGENT_BUNDLE_PLUGIN_ROOT: '/installed' }, fallback: 'path' }))
      .toEqual([process.execPath, '/installed/scripts/hauler.mjs']);
  });

  it('resolves relative canonical roots from the client cwd without trimming valid paths', () => {
    expect(resolveHaulerArgv({ env: { AGENT_BUNDLE_PLUGIN_ROOT: '.' }, cwd: '/client', fallback: 'path' }))
      .toEqual([process.execPath, '/client/scripts/hauler.mjs']);
    expect(resolveHaulerArgv({ env: { AGENT_BUNDLE_PLUGIN_ROOT: '/code with trailing space ' }, fallback }))
      .toEqual([process.execPath, '/code with trailing space /scripts/hauler.mjs']);
  });

  it('uses a lazily injected binding and preserves literal command arguments', async () => {
    const command = "cargo test -- --exact 'literal $HOME'";
    const result = await run(command, { resolveHaulerArgv: async () => haulerArgvForRoot(fallback.root) });
    expect(result.outcome).toBe('allow');
    expect(result.updatedInput?.command).toContain(`'${fallback.root}/scripts/hauler.mjs'`);
    expect(result.updatedInput?.command).toContain(`-- ${command}`);
    expect(result.updatedInput?.timeout).toBe(120);
  });

  it('does not reinterpret injected argv literals as paths', async () => {
    let calls = 0;
    const result = await run('cargo test', {
      haulerArgv: ['hauler', '--literal', '$HOME'],
      resolveHaulerArgv: () => { calls += 1; throw new Error('must not resolve'); },
    });
    expect(calls).toBe(0);
    expect(result.updatedInput?.command).toContain("hauler --literal '$HOME' exec");
  });

  it('does not resolve an executable for irrelevant input or an established clean denial', async () => {
    let calls = 0;
    const services: HookServices = {
      probeDaemon: () => 'active',
      resolveHaulerArgv: () => { calls += 1; throw new Error('missing binding'); },
    };
    expect(await run('ls -la', services)).toEqual({ outcome: 'continue' });
    expect((await run('cargo clean', services)).outcome).toBe('deny');
    expect(calls).toBe(0);
  });

  it('never silently selects PATH when an installed route has no binding', async () => {
    const result = await run('cargo test', {
      resolveHaulerArgv: () => Promise.reject(new Error('plugin binding unavailable')),
    });
    expect(result).toEqual({ outcome: 'continue' });
  });
});
