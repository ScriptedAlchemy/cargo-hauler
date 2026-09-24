import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { expect, it } from 'effect-rstest';

import { removeTestPath } from '../support/tmp-guard.js';

const projectRoot = resolve(import.meta.dirname, '../..');

it('registers one source-free GitHub artifact for every native marketplace', () => {
  const repository = mkdtempSync(join(tmpdir(), 'hauler-repository-plugin-'));
  try {
    cpSync(join(projectRoot, 'artifact'), join(repository, 'artifact'), { recursive: true });
    for (const marketplacePath of [
      '.claude-plugin/marketplace.json',
      '.agents/plugins/marketplace.json',
      '.cursor-plugin/marketplace.json',
    ]) {
      const marketplace = JSON.parse(readFileSync(join(projectRoot, marketplacePath), 'utf8'));
      expect(marketplace.name).toBe('cargo-hauler-marketplace');
      expect(marketplace.plugins).toHaveLength(1);
      const plugin = marketplace.plugins[0];
      expect(plugin.name).toBe('cargo-hauler');
      const source = typeof plugin.source === 'string' ? plugin.source : plugin.source.path;
      expect(source).toBe('./artifact');
      expect(existsSync(join(repository, source, 'agent-bundle.manifest.json'))).toBe(true);
    }
    expect(existsSync(join(repository, 'src'))).toBe(false);
    expect(existsSync(join(repository, 'node_modules'))).toBe(false);
    const help = spawnSync(process.execPath, [join(repository, 'artifact/bin/cargo-hauler.mjs'), '--help'], {
      cwd: repository,
      encoding: 'utf8',
    });
    expect(help.status).toBe(0);
    expect(help.stdout).toContain('cargo-hauler');
  } finally {
    removeTestPath(repository);
  }
});
