import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it } from 'effect-rstest';

import {
  defaultArtifactRoot,
  runInstallCli,
} from '../src/cargo-hauler-install.js';

const withArtifact = async (
  run: (artifactRoot: string) => Promise<void>,
): Promise<void> => {
  const artifactRoot = mkdtempSync(join(tmpdir(), 'hauler-install-cli-'));
  try {
    writeFileSync(join(artifactRoot, 'agent-bundle.manifest.json'), JSON.stringify({
      application: { id: 'cargo-hauler', name: 'cargo-hauler', version: '0.6.11' },
    }));
    await run(artifactRoot);
  } finally {
    rmSync(artifactRoot, { force: true, recursive: true });
  }
};

const unsafeManifestCandidate = (
  pathKind: 'escaping' | 'symlinked-ancestor',
): { readonly artifactRoot: string; readonly cleanup: () => void; readonly sentinel: string } => {
  const root = mkdtempSync(join(tmpdir(), 'hauler-install-untrusted-'));
  const artifactRoot = join(root, 'candidate');
  const outside = join(root, 'outside');
  mkdirSync(artifactRoot);
  mkdirSync(outside);
  const sentinel = join(outside, 'sentinel');
  writeFileSync(sentinel, 'outside\n');
  chmodSync(sentinel, 0o644);
  if (pathKind === 'symlinked-ancestor') {
    symlinkSync(outside, join(artifactRoot, 'linked'), 'dir');
  }
  // Deliberately incomplete: Agent Bundle must reject it before either untrusted path is followed.
  writeFileSync(join(artifactRoot, 'agent-bundle.manifest.json'), JSON.stringify({
    application: { id: 'cargo-hauler', name: 'cargo-hauler', version: '0.6.14' },
    files: [{
      mode: 0o600,
      path: pathKind === 'escaping' ? '../outside/sentinel' : 'linked/sentinel',
    }],
  }));
  chmodSync(join(artifactRoot, 'agent-bundle.manifest.json'), 0o444);
  chmodSync(artifactRoot, 0o555);
  return {
    artifactRoot,
    cleanup: () => {
      chmodSync(artifactRoot, 0o755);
      rmSync(root, { force: true, recursive: true });
    },
    sentinel,
  };
};

describe('cargo-hauler-install', () => {
  it('prints usage for --help', async () => {
    let stdout = '';
    const code = await runInstallCli({
      argv: ['--help'],
      write: (value) => {
        stdout += value;
      },
    });
    expect(code).toBe(0);
    expect(stdout).toContain('Usage: cargo-hauler-install install <host>');
    expect(stdout).toContain('--plan');
  });

  it('plans an install without calling a host', async () => {
    await withArtifact(async (artifactRoot) => {
      let stdout = '';
      const code = await runInstallCli({
        artifactRoot,
        argv: ['install', 'claude', '--plan', '--json'],
        write: (value) => {
          stdout += value;
        },
      });
      expect(code).toBe(0);
      expect(JSON.parse(stdout)).toMatchObject({
        host: 'claude',
        plugin: 'cargo-hauler',
        scope: 'user',
        state: 'planned',
        version: '0.6.11',
      });
    });
  });

  it('refuses an unknown host', async () => {
    let stderr = '';
    const code = await runInstallCli({
      argv: ['install', 'windsurf', '--plan'],
      writeStderr: (value) => {
        stderr += value;
      },
    });
    expect(code).toBe(1);
    expect(stderr).toContain('Cannot install host "windsurf"');
  });

  it('prefers a sibling artifact/ over dist/ when both exist', () => {
    const pkg = mkdtempSync(join(tmpdir(), 'hauler-install-layout-'));
    try {
      mkdirSync(join(pkg, 'dist', 'bin'), { recursive: true });
      mkdirSync(join(pkg, 'artifact'), { recursive: true });
      writeFileSync(join(pkg, 'artifact', 'agent-bundle.manifest.json'), '{}');
      writeFileSync(join(pkg, 'dist', 'bin', 'cargo-hauler-install.js'), '');
      expect(defaultArtifactRoot(pathToFileURL(join(pkg, 'dist', 'bin', 'cargo-hauler-install.js')).href))
        .toBe(join(pkg, 'artifact'));
    } finally {
      rmSync(pkg, { force: true, recursive: true });
    }
  });

  it.each([
    ['install', 'escaping', ['install', 'cursor']],
    ['install', 'symlinked-ancestor', ['install', 'cursor']],
    ['plan', 'escaping', ['uninstall', 'cursor', '--plan']],
    ['plan', 'symlinked-ancestor', ['uninstall', 'cursor', '--plan']],
    ['uninstall', 'escaping', ['uninstall', 'cursor']],
    ['uninstall', 'symlinked-ancestor', ['uninstall', 'cursor']],
  ] as const)(
    'rejects an invalid candidate without pre-validation mutation during %s: %s path entry',
    async (_operation, pathKind, argv) => {
      const fixture = unsafeManifestCandidate(pathKind);
      let stderr = '';
      try {
        const content = readFileSync(fixture.sentinel, 'utf8');
        const mode = statSync(fixture.sentinel).mode & 0o777;
        const code = await runInstallCli({
          artifactRoot: fixture.artifactRoot,
          argv,
          write: () => undefined,
          writeStderr: (value) => {
            stderr += value;
          },
        });
        expect(code).toBe(1);
        expect(stderr).toContain('AB7001');
        expect(readFileSync(fixture.sentinel, 'utf8')).toBe(content);
        expect(statSync(fixture.sentinel).mode & 0o777).toBe(mode);
      } finally {
        fixture.cleanup();
      }
    },
  );
});
