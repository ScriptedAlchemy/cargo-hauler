import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'effect-rstest';
import { openInstalledHostMcpServer, testManifest } from 'agent-bundle/test';

/**
 * Host-install proof: the packed installer (`dist/bin/cargo-hauler-install.js
 * install <host> --replace`) places the one composite `artifact/` root into an
 * isolated home for each host, the framework discovers the installed MCP
 * command from that host's own layout and runs it as a real process, and the
 * installed root's own `bin/cargo-hauler.mjs web` serves the dashboard App on a
 * loopback origin. Claude and Codex install through their CLIs, so those
 * lanes run only where the binary is on PATH (CI has neither).
 */
const projectRoot = resolve(import.meta.dirname, '../..');
const artifactRoot = join(projectRoot, 'artifact');
const installer = join(projectRoot, 'dist', 'bin', 'cargo-hauler-install.js');

type Host = 'claude' | 'codex' | 'cursor';

const hasBinary = (name: string): boolean => spawnSync(name, ['--version'], { stdio: 'ignore' }).status === 0;

/** An isolated home the host CLIs and the installer write into, with the daemon state beside it. */
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

/** Where each host keeps the installed plugin root the installer just placed. */
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

/** `bin/cargo-hauler.mjs web --json --no-open` from the installed root: the ready line, then the host page. */
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

describe('packed install', () => {
  const hosts: readonly Host[] = ['claude', 'codex', 'cursor'];
  const available = (host: Host): boolean => existsSync(installer) && (host === 'cursor' || hasBinary(host));

  for (const host of hosts) {
    it.skipIf(!available(host))(
      `installs the composite root for ${host} with --replace, runs its MCP server, and serves the dashboard with web`,
      async () => {
        const { env, home } = isolatedHome(host);
        try {
          const installed = spawnSync(process.execPath, [installer, 'install', host, '--replace', '--json'], {
            encoding: 'utf8',
            env,
          });
          expect(installed.stderr).toBe('');
          expect(installed.status).toBe(0);
          const receipt = JSON.parse(installed.stdout) as { readonly state: string; readonly version: string };
          expect(receipt.state).toBe('installed');
          const installedRoot = installedRootFor(host, home, receipt.version);
          expect(existsSync(join(installedRoot, 'agent-bundle.manifest.json'))).toBe(true);

          const session = await openInstalledHostMcpServer({
            artifactRoot,
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
          expect(web.ready).toMatchObject({ app: 'hauler/dashboard', tool: 'hauler_status' });
          expect(web.status).toBe(200);
        } finally {
          rmSync(home, { force: true, recursive: true });
        }
      },
      120_000,
    );
  }
});
