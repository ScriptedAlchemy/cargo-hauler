import { spawn, spawnSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'effect-rstest';
import { openInstalledHostMcpServer, testManifest } from 'agent-bundle/test';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Schedule from 'effect/Schedule';

import { pingDaemon } from '../../src/internal/client/control.js';
import { runDaemon } from '../../src/internal/daemon/main.js';

import { dropAfterAckProxy } from '../support/drop-after-ack-proxy.js';
import { fakeCargoEnv, scopedEnv, scopedFixture } from '../support/harness.js';

/**
 * Host-install proof from the actual npm shape: pack a source staging copy,
 * install it without dev dependencies, delete that source, and drive the
 * package-bound installer from another cwd.
 */
const projectRoot = resolve(import.meta.dirname, '../..');
const agentBundleImport = /(?:\bfrom\s*|\bimport\s*\(\s*)['"]agent-bundle(?:\/[^'"]*)?['"]/u;

type Host = 'claude' | 'codex' | 'cursor';

class Pending extends Data.TaggedError('Pending') {}

const waitUntil = (condition: () => boolean): Effect.Effect<void, Pending> =>
  Effect.suspend(() => (condition() ? Effect.void : Effect.fail(new Pending()))).pipe(
    Effect.retry(Schedule.spaced('10 millis').pipe(Schedule.upTo({ times: 1_000 }))),
  );

const hasBinary = (name: string): boolean => spawnSync(name, ['--version'], { stdio: 'ignore' }).status === 0;

const isolatedHome = (host: Host): { readonly env: Record<string, string>; readonly home: string } => {
  const home = mkdtempSync(join(tmpdir(), `hauler-install-${host}-`));
  mkdirSync(join(home, `.${host}`), { recursive: true });
  mkdirSync(join(home, 'state'), { recursive: true });
  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
    CARGO_HAULER_KACHE_INDEX: '',
    CARGO_HAULER_STATE_DIR: join(home, 'state'),
    HOME: home,
  };
  if (host === 'claude') {
    env.CLAUDE_CONFIG_DIR = join(home, '.claude');
  }
  if (host === 'codex') {
    env.CODEX_HOME = join(home, '.codex');
  }
  return { env, home };
};

const installedRootFor = (host: Host, home: string, version: string): string => {
  switch (host) {
    case 'claude':
      return join(home, '.claude', 'plugins', 'cache', 'cargo-hauler-marketplace', 'cargo-hauler', version);
    case 'codex':
      return join(home, '.codex', 'plugins', 'cache', 'cargo-hauler-marketplace', 'cargo-hauler', version);
    case 'cursor':
      return join(home, '.cursor', 'plugins', 'local', 'cargo-hauler');
    default: {
      const exhaustive: never = host;
      return exhaustive;
    }
  }
};

interface WebReady {
  readonly app: string;
  readonly tool: string;
  readonly url: string;
}

const serveWeb = async (installedRoot: string, env: Record<string, string>): Promise<{ readonly ready: WebReady; readonly status: number }> => {
  const child = spawn(process.execPath, [join(installedRoot, 'bin', 'cargo-hauler.mjs'), 'web', '--json', '--no-open'], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8');
  });
  try {
    const ready = await new Promise<WebReady>((resolvePromise, reject) => {
      let stdout = '';
      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8');
        const newline = stdout.indexOf('\n');
        if (newline !== -1) {
          resolvePromise(JSON.parse(stdout.slice(0, newline)) as WebReady);
        }
      });
      child.once('exit', (code) => reject(new Error(`web exited ${code} before its ready line: ${stderr}`)));
    });
    const response = await fetch(ready.url);
    return { ready, status: response.status };
  } finally {
    child.kill('SIGTERM');
  }
};

interface Invocation {
  readonly status: number | null;
  readonly stderr: string;
  readonly stdout: string;
}

let consumer = '';
let fixtureRoot = '';
let installer = '';
let packageRoot = '';
let pluginRoot = '';
let sourceRoot = '';

const setTreeWritable = (root: string, writable: boolean): void => {
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const metadata = lstatSync(path);
    if (metadata.isSymbolicLink()) continue;
    if (metadata.isDirectory()) setTreeWritable(path, writable);
    chmodSync(path, writable ? metadata.mode | 0o200 : metadata.mode & ~0o222);
  }
  const metadata = lstatSync(root);
  chmodSync(root, writable ? metadata.mode | 0o200 : metadata.mode & ~0o222);
};

const runInstaller = (argv: readonly string[], env: Record<string, string> = process.env as Record<string, string>): Invocation => {
  const result = spawnSync(process.execPath, [installer, ...argv], {
    cwd: consumer,
    encoding: 'utf8',
    env,
  });
  return { status: result.status, stderr: result.stderr, stdout: result.stdout };
};

const runProcess = (
  command: string,
  argv: readonly string[],
  env: Record<string, string>,
  cwd = consumer,
): Promise<Invocation> =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(command, [...argv], {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    let stdout = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.once('error', reject);
    child.once('exit', (status) => resolvePromise({ status, stderr, stdout }));
  });

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), 'hauler-packed-install-'));
  sourceRoot = join(fixtureRoot, 'source');
  const tarballs = join(fixtureRoot, 'tarballs');
  consumer = join(fixtureRoot, 'consumer');
  mkdirSync(sourceRoot);
  mkdirSync(tarballs);
  mkdirSync(consumer);
  const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8')) as {
    readonly files: readonly string[];
  };
  for (const relativePath of ['package.json', ...packageJson.files]) {
    const source = join(projectRoot, relativePath);
    if (!existsSync(source)) continue;
    const destination = join(sourceRoot, relativePath);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(source, destination, { recursive: true });
  }
  const packed = spawnSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', tarballs], {
    cwd: sourceRoot,
    encoding: 'utf8',
  });
  expect(packed.status).toBe(0);
  const output = JSON.parse(packed.stdout) as unknown;
  const row = Array.isArray(output)
    ? output[0]
    : typeof output === 'object' && output !== null && !('filename' in output)
      ? Object.values(output)[0]
      : output;
  if (typeof row !== 'object' || row === null || !('filename' in row) || typeof row.filename !== 'string') {
    throw new TypeError(`npm pack returned no filename: ${packed.stdout}`);
  }
  const filename = row.filename;
  writeFileSync(join(consumer, 'package.json'), '{"private":true}\n');
  const installed = spawnSync(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', join(tarballs, filename)],
    { cwd: consumer, encoding: 'utf8' },
  );
  expect(installed.status).toBe(0);
  rmSync(sourceRoot, { force: true, recursive: true });
  packageRoot = join(consumer, 'node_modules', 'cargo-hauler');
  pluginRoot = join(packageRoot, 'dist');
  installer = join(pluginRoot, 'bin', 'cargo-hauler-install.js');
  setTreeWritable(packageRoot, false);
}, 120_000);

afterAll(() => {
  if (packageRoot !== '' && existsSync(packageRoot)) setTreeWritable(packageRoot, true);
  if (fixtureRoot !== '') rmSync(fixtureRoot, { force: true, recursive: true });
});

describe('packed install', () => {
  it('ships one source-free generated root with the framework CLI bundled', () => {
    expect(existsSync(sourceRoot)).toBe(false);
    expect(existsSync(join(packageRoot, 'artifact'))).toBe(false);
    expect(existsSync(join(consumer, 'node_modules', 'agent-bundle'))).toBe(false);
    expect(readFileSync(installer, 'utf8')).not.toMatch(agentBundleImport);
    expect(readFileSync(installer, 'utf8')).not.toContain('agent-bundle-src');
    expect(lstatSync(packageRoot).mode & 0o222).toBe(0);
    expect(lstatSync(join(pluginRoot, 'agent-bundle.manifest.json')).mode & 0o222).toBe(0);

    const help = runInstaller(['--help']);
    expect(help.status).toBe(0);
    expect(help.stdout).toContain('Usage: cargo-hauler-install');
    expect(help.stdout).toContain('doctor');
    expect(help.stdout).not.toContain('--from');

    const unselected = runInstaller(['install', 'amp']);
    expect(unselected.status).toBe(1);
    expect(unselected.stderr).toContain('"code":"AB7001"');
    const from = runInstaller(['install', 'cursor', '--from', projectRoot]);
    expect(from.status).toBe(2);
    expect(from.stderr).toContain("unknown option '--from'");
    const approximatePlan = runInstaller(['install', 'cursor', '--plan']);
    expect(approximatePlan.status).toBe(2);
    expect(approximatePlan.stderr).toContain("unknown option '--plan'");
  });

  it('returns Cargo’s result through the packed PATH shim after a post-ack disconnect', async () => {
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const fixture = yield* scopedFixture(1);
          const cargo = join(fixture.binDir, 'cargo');
          const releaseFile = join(fixture.root, 'packed.release');
          yield* Effect.addFinalizer(() =>
            Effect.sync(() => {
              writeFileSync(releaseFile, '');
            }),
          );
          yield* scopedEnv({ CARGO_HAULER_CARGO_BIN: cargo });
          const daemonConfig = {
            ...fixture.config,
            // Keep below macOS's 104-byte unix-socket path limit.
            socketPath: join(fixture.root, 'd.sock'),
          };
          yield* Effect.forkScoped(runDaemon(daemonConfig));
          yield* pingDaemon(daemonConfig.socketPath, 500).pipe(
            Effect.retry(Schedule.spaced('20 millis').pipe(Schedule.upTo({ times: 500 }))),
          );
          const proxy = yield* dropAfterAckProxy(
            daemonConfig.socketPath,
            fixture.config.socketPath,
          );
          const shimDir = join(fixture.root, 'shim');
          mkdirSync(shimDir);
          const hauler = join(pluginRoot, 'bin', 'hauler.js');
          const env = {
            ...(process.env as Record<string, string>),
            ...fakeCargoEnv(fixture, {
              FAKE_EXIT: '17',
              FAKE_RELEASE_FILE: releaseFile,
            }),
            CARGO_HAULER_STATE_DIR: fixture.config.stateDir,
          };
          const installed = spawnSync(
            process.execPath,
            [hauler, 'install-shim', '--dir', shimDir, '--real-cargo', cargo],
            { encoding: 'utf8', env: { ...env, PATH: fixture.binDir } },
          );
          expect(installed.status).toBe(0);

          const running = runProcess(
            join(shimDir, 'cargo'),
            ['check', '-p', 'packed-reconnect'],
            env,
            fixture.ws1,
          );
          const ticket = yield* Effect.promise(() => proxy.dropped);
          yield* waitUntil(() => proxy.messages().some((message) => message.type === 'reattach'));
          writeFileSync(releaseFile, '');
          const result = yield* Effect.promise(() => running);
          expect(result.status).toBe(17);
          expect(result.stdout).toContain('fake-out:check -p packed-reconnect');
          expect(result.stderr).toContain(
            `connection to daemon lost; reattaching to ticket ${ticket}`,
          );
          expect(result.stderr).not.toContain('continues');
          expect(proxy.messages().filter((message) => message.type === 'exec')).toHaveLength(1);
        }),
      ),
    );
  }, 30_000);

  const hosts: readonly Host[] = ['claude', 'codex', 'cursor'];

  for (const host of hosts) {
    it.skipIf(host !== 'cursor' && !hasBinary(host))(
      `installs the packed root for ${host}, runs its MCP server, and serves the dashboard`,
      async () => {
        const { env, home } = isolatedHome(host);
        try {
          const installed = runInstaller(['install', host, '--replace', '--json'], env);
          expect(installed.stderr).toBe('');
          expect(installed.status).toBe(0);
          const receipt = JSON.parse(installed.stdout) as {
            readonly bundleRoot: string;
            readonly state: string;
            readonly version: string;
          };
          expect(receipt).toMatchObject({ bundleRoot: realpathSync(pluginRoot), state: 'installed' });
          const installedRoot = installedRootFor(host, home, receipt.version);
          expect(existsSync(join(installedRoot, 'agent-bundle.manifest.json'))).toBe(true);

          const session = await openInstalledHostMcpServer({
            artifactRoot: pluginRoot,
            env,
            host,
            installedRoot,
            manifest: testManifest(),
            server: 'hauler',
          });
          try {
            const failed = Object.entries(session.observation.checks)
              .filter(([, outcome]) => outcome.status === 'failed')
              .map(([check, outcome]) => `${check}: ${outcome.reason ?? ''}`);
            expect(failed).toEqual([]);
            const tools = await session.client.listTools();
            expect(tools.tools.map((tool) => tool.name)).toContain('hauler_status');
            const status = await session.client.callTool({ arguments: {}, name: 'hauler_status' });
            expect(status.isError ?? false).toBe(false);
            expect(status.structuredContent).toMatchObject({ daemon: 'stopped', operation: 'status' });
            const requested = await session.client.callTool({
              arguments: { argv: ['cargo', 'check'] },
              name: 'hauler_request',
            });
            expect(requested.isError).toBe(true);
            expect(JSON.stringify(requested.content)).toContain(
              'cwd is required when Agent Bundle has no authoritative workspace',
            );
          } finally {
            await session.close();
          }

          const web = await serveWeb(installedRoot, env);
          expect(web.ready).toMatchObject({ app: 'hauler/dashboard', tool: 'hauler_dashboard' });
          expect(web.status).toBe(200);
        } finally {
          rmSync(home, { force: true, recursive: true });
        }
      },
      120_000,
    );
  }

  it('replaces, reports, plans, and uninstalls through the package-bound lifecycle', () => {
    const { env, home } = isolatedHome('cursor');
    try {
      const first = runInstaller(['install', 'cursor', '--json'], env);
      expect(first.status).toBe(0);
      expect(first.stderr).toBe('');
      const installed = JSON.parse(first.stdout) as { readonly destination: string; readonly state: string };
      expect(installed).toMatchObject({ state: 'installed' });
      const ownedFile = join(installed.destination, 'skills', 'cargo-hauler', 'SKILL.md');
      chmodSync(ownedFile, lstatSync(ownedFile).mode | 0o200);
      writeFileSync(ownedFile, 'edited\n');

      const replacement = runInstaller(['install', 'cursor', '--json'], env);
      expect(replacement.status).toBe(0);
      expect(JSON.parse(replacement.stdout)).toMatchObject({ state: 'replaced' });
      expect(readFileSync(ownedFile, 'utf8')).not.toBe('edited\n');

      const doctor = runInstaller(['doctor', '--host', 'cursor', '--json'], env);
      expect(doctor.status).toBe(0);
      const report = JSON.parse(doctor.stdout) as {
        readonly hosts: readonly {
          readonly bundle?: { readonly comparison?: { readonly status: string } };
          readonly host: string;
        }[];
      };
      expect(report.hosts).toEqual([
        expect.objectContaining({
          bundle: expect.objectContaining({ comparison: expect.objectContaining({ status: 'current' }) }),
          host: 'cursor',
        }),
      ]);

      const plan = runInstaller(['uninstall', 'cursor', '--plan', '--json'], env);
      expect(plan.status).toBe(0);
      expect(JSON.parse(plan.stdout)).toMatchObject({ state: 'planned' });
      expect(existsSync(installed.destination)).toBe(true);

      const removed = runInstaller(['uninstall', 'cursor', '--json'], env);
      expect(removed.status).toBe(0);
      expect(JSON.parse(removed.stdout)).toMatchObject({ state: 'uninstalled' });
      expect(existsSync(installed.destination)).toBe(false);
    } finally {
      rmSync(home, { force: true, recursive: true });
    }
  }, 120_000);
});
