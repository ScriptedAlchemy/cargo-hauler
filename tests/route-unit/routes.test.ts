import { join } from 'node:path';

import { describe, expect, it } from 'effect-rstest';
import { cliJson, expectDocument, invokeCli, renderRoute, renderRouteEvents, testManifest } from 'agent-bundle/test';
import * as Effect from 'effect/Effect';

import { requestOverSocket } from '../../src/internal/client/control.js';
import type { RequestRecord, StatusRow } from '../../src/internal/contracts/protocol.js';
import { resolveDaemonConfig } from '../../src/internal/daemon/config.js';
import { scopedDaemon, scopedEnv, scopedLedger } from '../support/harness.js';

import { documentMetadata, fakeCargoEnv, withDaemon, withIsolatedStateDir } from './support.js';

/**
 * Route-unit proof: the hauler routes render the Agent Documents they claim,
 * through the framework compiler's own route compilation (no artifact build).
 * Daemon-backed cases run a real broker in-process and hand its connection to
 * the routes through the `haulerDaemon` provider seam.
 */
const manifest = testManifest();

describe('route manifest', () => {
  it('compiles every hauler surface with no build and no errors', () => {
    expect(manifest.proofLevel).toBe('route-unit');
    expect(manifest.diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toEqual([]);
    const routes = Object.keys(manifest.routes);
    for (const id of [
      'event:tool/before',
      'event:tool/after',
      'tool:hauler/hauler_status',
      'tool:hauler/hauler_dashboard',
      'tool:hauler/hauler_log',
      'tool:hauler/hauler_last',
      'tool:hauler/hauler_await',
      'tool:hauler/hauler_result',
      'tool:hauler/hauler_request',
      'tool:hauler/hauler_kill',
      'event:session/start',
      'event:stop',
      'cli:daemon',
    ]) {
      expect(routes).toContain(id);
    }
    // `hauler status` and its siblings are the tools' own `.cli.ts`
    // projections, not routes of their own.
    expect(routes.filter((id) => id.startsWith('cli:'))).toEqual(['cli:daemon']);
  });

  it('declares the hauler shell layout and the daemon provider', () => {
    expect(manifest.layouts.map((layout) => layout.scope)).toContain('root');
    expect(manifest.providers?.map((provider) => provider.key)).toEqual(['haulerDaemon']);
  });
});

describe('tool documents without a daemon', () => {
  it('renders status as a stopped daemon with nothing in flight, under the shell', async () => {
    await withIsolatedStateDir(async () => {
      const rendered = await renderRoute('tool:hauler/hauler_status', { input: {} });
      expectDocument(rendered)
        .toHaveStatus('success')
        .toContainText('daemon is not running')
        .toContainText('Nothing queued or running.')
        .toContainContext('Dashboard: ui://cargo-hauler/dashboard.html');
      expect(rendered.result).toMatchObject({ active: [], daemon: 'stopped', operation: 'status' });
      expect(documentMetadata(rendered.document)).toMatchObject({
        hauler: {
          lineage: null,
          route: 'tool:hauler/hauler_status',
          server: 'mcp:hauler',
          surface: 'tool',
        },
      });
    });
  });

  it('projects ledger-active rows as orphaned when the daemon is stopped', async () => {
    await withIsolatedStateDir(async (stateDir) => {
      const config = resolveDaemonConfig({ CARGO_HAULER_STATE_DIR: stateDir });
      await Effect.runPromise(Effect.scoped(Effect.gen(function* () {
        const ledger = yield* scopedLedger(config);
        const input = {
          argv: ['cargo', 'check'],
          createdAtMs: 1_000,
          cwd: '/repo',
          host: 'cursor',
          intentJson: null,
          intentKey: 'k',
          laneKey: '/repo::/repo/target',
          session: 's',
          targetDir: '/repo/target',
          workspaceRoot: '/repo',
        };
        yield* ledger.createRequest(input);
        yield* ledger.markQueued(1, 1_100);
        yield* ledger.markRunning(1, 1_200);
        yield* ledger.createRequest({ ...input, createdAtMs: 2_000 });
        yield* ledger.markQueued(2, 2_100);
      })));

      const rendered = await renderRoute('tool:hauler/hauler_status', { input: {} });
      expect(rendered.result).toMatchObject({
        active: [],
        daemon: 'stopped',
        recent: [
          { error: 'stranded by a stopped daemon', status: 'orphaned', ticket: 'cc-2' },
          { error: 'stranded by a stopped daemon', status: 'orphaned', ticket: 'cc-1' },
        ],
        summary: 'cargo-hauler daemon is not running; 0 active, 2 recent',
      });
      expectDocument(rendered)
        .toContainText('Nothing queued or running.')
        .toContainMarkdown('cc-1')
        .toContainMarkdown('orphaned')
        .toContainContext(
          '2 orphaned tickets were stranded by the stopped daemon and will not finish; resubmit the ones still wanted.',
        );
      expect(JSON.stringify(rendered.document)).not.toContain('Do not start a duplicate cargo run');
    });
  });

  it('renders the last ledger-active ticket as orphaned when the daemon is stopped', async () => {
    await withIsolatedStateDir(async (stateDir) => {
      const config = resolveDaemonConfig({ CARGO_HAULER_STATE_DIR: stateDir });
      await Effect.runPromise(Effect.scoped(Effect.gen(function* () {
        const ledger = yield* scopedLedger(config);
        yield* ledger.createRequest({
          argv: ['cargo', 'check'],
          createdAtMs: 1_000,
          cwd: '/repo',
          host: 'cursor',
          intentJson: null,
          intentKey: 'k',
          laneKey: '/repo::/repo/target',
          session: 's',
          targetDir: '/repo/target',
          workspaceRoot: '/repo',
        });
        yield* ledger.markQueued(1, 1_100);
        yield* ledger.markRunning(1, 1_200);
      })));

      const rendered = await renderRoute('tool:hauler/hauler_last', { input: {} });
      expect(rendered.result).toMatchObject({
        daemon: 'stopped',
        request: {
          error: 'stranded by a stopped daemon',
          status: 'orphaned',
          ticket: 'cc-1',
        },
        summary: 'cc-1 orphaned',
      });
      expectDocument(rendered)
        .toContainText('cc-1 orphaned')
        .toContainMarkdown('stranded by a stopped daemon');
      expect(JSON.stringify(rendered.document)).not.toContain('cc-1 running');
      expect(JSON.stringify(rendered.document)).not.toContain('hauler_await');
    });
  });

  it('renders the dashboard tool as one summary line beside the App link, never the status document', async () => {
    await withIsolatedStateDir(async () => {
      const rendered = await renderRoute('tool:hauler/hauler_dashboard', { input: {} });
      expectDocument(rendered)
        .toHaveStatus('success')
        .toContainText('daemon is not running')
        .toContainContext('Dashboard: ui://cargo-hauler/dashboard.html opens beside this result');
      expect(rendered.result).toMatchObject({ active: [], daemon: 'stopped', operation: 'status' });
      expect(JSON.stringify(rendered.document)).not.toContain('Nothing queued or running.');
    });
  });

  it('renders log and last as empty ledgers', async () => {
    await withIsolatedStateDir(async () => {
      const log = await renderRoute('tool:hauler/hauler_log', { input: { limit: 5 } });
      expectDocument(log)
        .toHaveStatus('success')
        .toContainText('no hauler requests recorded')
        .toContainText('The ledger has no requests yet.');
      expect(log.result).toMatchObject({ operation: 'log', requests: [] });

      const last = await renderRoute('tool:hauler/hauler_last', { input: {} });
      expectDocument(last).toHaveStatus('success').toContainText('no hauler requests recorded');
      expect(last.result).toMatchObject({ operation: 'last', request: null });
    });
  });

  it('answers ticket lookups from the ledger when the daemon is stopped, labelled as such', async () => {
    await withIsolatedStateDir(async () => {
      const result = await renderRoute('tool:hauler/hauler_result', { input: { ticket: 'cc-1' } });
      expect(result.result).toEqual({
        daemon: 'stopped',
        operation: 'result',
        request: null,
        summary: 'cc-1 not found',
        ticket: 'cc-1',
      });
      const awaited = await renderRoute('tool:hauler/hauler_await', { input: { maxWaitMs: 100, ticket: 'cc-1' } });
      expect(awaited.result).toEqual({
        daemon: 'stopped',
        operation: 'await',
        request: null,
        summary: 'cc-1 not found',
        ticket: 'cc-1',
        timedOut: false,
      });
    });
  });
});

describe('tool documents against a live daemon', () => {
  it.live('submits a request, streams await progress, and shows the ticket in status', () =>
      Effect.gen(function* () {
        const fixture = yield* scopedDaemon(2);
        // Background submits carry no env, so the job is started over the
        // socket with the fake cargo pinned; the routes then observe it.
        const ack = yield* requestOverSocket({
          isTerminal: (message) => message.type === 'ack' || message.type === 'error',
          message: {
            argv: ['cargo', 'check', '-p', 'ws1'],
            background: true,
            cwd: fixture.ws1,
            env: fakeCargoEnv(fixture.binDir, { FAKE_SLEEP: '1' }),
            host: 'test',
            id: 'route-unit-1',
            session: 's-1',
            type: 'exec',
          },
          socketPath: fixture.config.socketPath,
          timeoutMs: 8_000,
        });
        const acked = ack.find((message) => message.type === 'ack');
        if (acked === undefined || acked.type !== 'ack') {
          throw new Error(`daemon did not ack: ${JSON.stringify(ack)}`);
        }
        const ticket = acked.ticket;

        yield* Effect.promise(async () => {
          const daemon = await withDaemon(fixture.config);
          const submitted = await renderRoute('tool:hauler/hauler_request', {
            context: {
              ...daemon.context,
              workspace: { source: 'native', state: 'available', value: { root: fixture.ws1 } },
            },
            input: { argv: ['cargo', 'check', '-p', 'ws1'], host: 'test', session: 's-1' },
          });
          // Identical request while the first runs: the broker attaches it,
          // and the document still hands the agent a ticket to wait on.
          const attached = (submitted.result as { readonly ticket: string | null }).ticket;
          expect(attached).toMatch(/^cc-\d+$/u);
          expectDocument(submitted)
            .toHaveStatus('success')
            .toContainText(`${attached} submitted`)
            .toContainMarkdown('**Attributed to:** test / s-1')
            .toContainContext(`hauler_await ${attached}`);
          expect(submitted.result).toMatchObject({
            attribution: { host: 'test', lineage: null, session: 's-1' },
          });

          const status = await renderRoute('tool:hauler/hauler_status', {
            ...daemon,
            input: { session: 's-1' },
          });
          const statusValue = status.result as { readonly active: readonly StatusRow[]; readonly daemon: string };
          expect(statusValue.daemon).toBe('running');
          expect([...statusValue.active.map((record) => record.ticket)]).toContain(ticket);
          expectDocument(status)
            .toContainMarkdown('In flight')
            .toContainMarkdown('### Lanes')
            .toContainContext('Do not start a duplicate');

          const awaited = await renderRouteEvents('tool:hauler/hauler_await', {
            ...daemon,
            input: { maxWaitMs: 20_000, ticket },
          });
          const awaitedValue = awaited.result as {
            readonly request: RequestRecord | null;
            readonly timedOut: boolean;
          };
          expect(awaitedValue.timedOut).toBe(false);
          expect(awaitedValue.request?.status).toBe('done');
          expect(awaited.progress.length).toBeGreaterThan(0);
          expect(awaited.progress.every((update) => update.total === 20_000)).toBe(true);
          expectDocument(awaited)
            .toHaveStatus('success')
            .toContainMarkdown(ticket)
            .toContainContext(`${ticket} succeeded`);

          const fetched = await renderRoute('tool:hauler/hauler_result', {
            ...daemon,
            input: { ticket },
          });
          expect(fetched.result).toMatchObject({ operation: 'result', ticket });
          expectDocument(fetched).toHaveStatus('success').toContainContext(`${ticket} succeeded`);

          // The finished ticket names its full on-disk log (#68): the JSON
          // carries the path, the document points at it and how to read it.
          const outputPath = join(fixture.config.ticketLogDir, `${ticket}.log`);
          expect(fetched.result).toMatchObject({ request: { outputPath } });
          expectDocument(fetched)
            .toContainText(`Full output: ${outputPath} (`)
            .toContainText(`hauler_result { ticket: "${ticket}", full: true }`);

          const full = await renderRoute('tool:hauler/hauler_result', {
            ...daemon,
            input: { full: true, ticket },
          });
          expect(full.result).toMatchObject({ operation: 'result', request: { outputPath }, ticket });
          expectDocument(full)
            .toHaveStatus('success')
            .toContainText(`Full output (`)
            .toContainMarkdown('fake-out:check -p ws1')
            .toContainMarkdown('fake-err:check -p ws1')
            .toContainContext(`${ticket} succeeded`);
          expect(JSON.stringify(full.document)).not.toContain('Output tail:');
        });
      }), 30_000);

  it.live('queues a request behind its --after prerequisite and rejects an unknown one', () =>
      Effect.gen(function* () {
        const fixture = yield* scopedDaemon(2);
        const ack = yield* requestOverSocket({
          isTerminal: (message) => message.type === 'ack' || message.type === 'error',
          message: {
            argv: ['cargo', 'build', '-p', 'ws1'],
            background: true,
            cwd: fixture.ws1,
            env: fakeCargoEnv(fixture.binDir, { FAKE_SLEEP: '1.5' }),
            host: 'test',
            id: 'route-unit-after-1',
            session: 's-2',
            type: 'exec',
          },
          socketPath: fixture.config.socketPath,
          timeoutMs: 8_000,
        });
        const acked = ack.find((message) => message.type === 'ack');
        if (acked === undefined || acked.type !== 'ack') {
          throw new Error(`daemon did not ack: ${JSON.stringify(ack)}`);
        }
        const prerequisite = acked.ticket;

        yield* Effect.promise(async () => {
          const daemon = await withDaemon(fixture.config);
          const submitted = await renderRoute('tool:hauler/hauler_request', {
            ...daemon,
            input: {
              after: [prerequisite],
              argv: ['cargo', 'test', '-p', 'ws1'],
              cwd: fixture.ws1,
              host: 'test',
              session: 's-2',
            },
          });
          const value = submitted.result as {
            readonly ticket: string | null;
            readonly waitingFor?: readonly string[];
          };
          expect(value.ticket).toMatch(/^cc-\d+$/u);
          expect(value.waitingFor).toEqual([prerequisite]);
          expectDocument(submitted)
            .toHaveStatus('success')
            .toContainText(`${value.ticket} submitted, waiting for ${prerequisite}`)
            .toContainMarkdown(`**Waits for:** ${prerequisite}`)
            .toContainContext(`queued behind ${prerequisite}`);

          const status = await renderRoute('tool:hauler/hauler_status', {
            ...daemon,
            input: { tickets: [value.ticket ?? ''] },
          });
          const statusValue = status.result as { readonly active: readonly StatusRow[] };
          const dependent = statusValue.active.find((record) => record.ticket === value.ticket);
          expect(dependent?.status).toBe('queued');
          expect(dependent?.after).toEqual([prerequisite]);
          expect(dependent?.waitingFor?.map((entry) => entry.ticket)).toEqual([prerequisite]);
          expectDocument(status).toContainMarkdown(`waits for ${prerequisite}`);

          await expect(
            renderRoute('tool:hauler/hauler_request', {
              ...daemon,
              input: { after: ['cc-999999'], argv: ['cargo', 'test', '-p', 'ws1'], cwd: fixture.ws1 },
            }),
          ).rejects.toThrow(/bad-intent.*cc-999999/u);
        });
      }), 30_000);

  it.live('attributes hauler request to the agent session its shell environment names', () =>
    Effect.gen(function* () {
      const fixture = yield* scopedDaemon(2);
      const agentEnv = {
        CARGO_HAULER_CARGO_BIN: join(fixture.binDir, 'cargo'),
        CARGO_HAULER_HOST: undefined,
        CARGO_HAULER_SESSION: undefined,
        CLAUDE_CODE_SESSION_ID: undefined,
        CODEX_THREAD_ID: undefined,
        CURSOR_CONVERSATION_ID: undefined,
      };
      const cases = [
        { env: { CLAUDE_CODE_SESSION_ID: 'claude-sess-1' }, flags: [], stored: { host: 'claude', session: 'claude-sess-1' } },
        { env: { CODEX_THREAD_ID: 'codex-thread-1' }, flags: [], stored: { host: 'codex', session: 'codex-thread-1' } },
        { env: { CURSOR_CONVERSATION_ID: 'cursor-conv-1' }, flags: [], stored: { host: 'cursor', session: 'cursor-conv-1' } },
        {
          env: { CARGO_HAULER_HOST: 'env-host', CARGO_HAULER_SESSION: 'env-sess', CURSOR_CONVERSATION_ID: 'cursor-conv-1' },
          flags: [],
          stored: { host: 'env-host', session: 'env-sess' },
        },
        {
          env: { CLAUDE_CODE_SESSION_ID: 'claude-sess-1' },
          flags: ['--host', 'flag-host', '--session', 'flag-sess'],
          stored: { host: 'flag-host', session: 'flag-sess' },
        },
        { env: {}, flags: [], stored: { host: 'cli', session: null } },
      ];
      const stored = [];
      for (const [index, item] of cases.entries()) {
        stored.push(yield* Effect.scoped(Effect.gen(function* () {
          yield* scopedEnv({ ...agentEnv, ...item.env, CARGO_HAULER_STATE_DIR: fixture.config.stateDir });
          const submitted = yield* Effect.promise(() => invokeCli([
            'request', '--json', '--cwd', fixture.ws1, ...item.flags, '--', 'cargo', 'check', '-p', `attr-${index}`,
          ]));
          const { ticket } = cliJson(submitted) as { readonly ticket: string };
          const result = yield* Effect.promise(() => invokeCli(['result', ticket, '--json']));
          const { request } = cliJson(result) as { readonly request: RequestRecord };
          return { host: request.host ?? null, session: request.session ?? null };
        })));
      }
      expect(stored).toEqual(cases.map((item) => item.stored));
    }), 30_000);
});
