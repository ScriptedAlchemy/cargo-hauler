import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

for (const name of Object.keys(process.env)) {
  if (name.startsWith('CARGO_HAULER_')) {
    delete process.env[name];
  }
}
process.env.CARGO_HAULER_STATE_DIR = mkdtempSync(join(tmpdir(), 'cargo-hauler-test-'));
process.env.XDG_CACHE_HOME = mkdtempSync(join(tmpdir(), 'cargo-hauler-test-cache-'));
process.env.CARGO_HAULER_KACHE_INDEX = '';
