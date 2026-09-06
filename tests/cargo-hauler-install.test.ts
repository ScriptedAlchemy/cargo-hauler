import { chmodSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it } from 'effect-rstest';

import {
  defaultArtifactRoot,
  restoreManifestModes,
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

  it('restores npm-stripped executable bits from the manifest', async () => {
    const root = mkdtempSync(join(tmpdir(), 'hauler-install-modes-'));
    try {
      const path = join(root, 'tool.sh');
      writeFileSync(path, '#!/bin/sh\n');
      chmodSync(path, 0o644);
      writeFileSync(join(root, 'agent-bundle.manifest.json'), JSON.stringify({
        files: [{ mode: 0o755, path: 'tool.sh' }],
      }));
      expect(await restoreManifestModes(root)).toBe(1);
      expect(statSync(path).mode & 0o777).toBe(0o755);
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });
});
