import { describe, expect, it } from 'effect-rstest';
import { runScript, testManifest } from 'agent-bundle/test';

import { withIsolatedStateDir } from './support.js';

/**
 * script-dispatch proof: `src/scripts/hauler.ts` — the hook rewrite target
 * shipped as `scripts/hauler.mjs` in every host pack and as the `hauler`
 * package bin — runs through its `main` envelope as a Node process of its
 * own, with the daemon down in an isolated state dir.
 */
describe('hauler process entry', () => {
  it('is the one conventional plain script and prints usage on --help', async () => {
    expect(testManifest().scripts.map((script) => [script.name, script.rendered])).toEqual([['hauler', false]]);
    const run = await runScript('hauler', ['--help']);
    expect(run.exitCode).toBe(0);
    expect(run.provenance.proofLevel).toBe('script-dispatch');
    expect(run.provenance.execution).toBe('main-envelope');
    expect(run.stdout).toBe(`Usage: hauler <command>

Commands:
  exec [--session ID] [--host HOST] [--cwd DIR] [--bg] [--after TICKET[,TICKET…]]
       [--allow-shared-target] -- <cargo command>
      Run cargo through the hauler daemon. --after holds the run until those
      tickets finish, and the run fails if one of them fails or is killed.
  daemon <run|start|stop|status|restart>
      Control the hauler daemon. restart replaces the running daemon and
      ends in-flight tickets as killed with "daemon shutdown".
  install-shim [--dir DIR] [--real-cargo PATH] [--force]
      Install an optional PATH cargo shim.
  status | log | last | await <ticket> | result <ticket> | kill <ticket> | web
  request [--after TICKET] -- <cargo command>
      Routed commands. Run \`cargo-hauler --help\` for their options.
`);
  });

  it('exits 2 with usage when no command is given', async () => {
    const run = await runScript('hauler', []);
    expect(run.exitCode).toBe(2);
    expect(run.stdout).toContain('Usage: hauler <command>');
  });

  it('reports a stopped daemon through the daemon subcommand exit-code policy', async () => {
    await withIsolatedStateDir(async () => {
      const run = await runScript('hauler', ['daemon', 'status']);
      expect(run.exitCode).toBe(1);
      expect(JSON.parse(run.stdout.trim().split('\n').at(-1) ?? '{}')).toMatchObject({
        operation: 'daemon',
        running: false,
        subcommand: 'status',
      });
    });
  });

  it('refuses install-shim flags it does not know instead of installing', async () => {
    const run = await runScript('hauler', ['install-shim', '--help']);
    expect(run.exitCode).toBe(2);
    expect(run.stdout).toContain('Usage: hauler install-shim');
  });
});
