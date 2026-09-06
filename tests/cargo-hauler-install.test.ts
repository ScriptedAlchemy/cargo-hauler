import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'effect-rstest';

import { runInstallCli } from '../src/cargo-hauler-install.js';

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
});
