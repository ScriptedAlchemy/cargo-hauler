import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';

import { findCargoShim } from '../../src/internal/shim/install.js';

// The operator's PATH shim must stay out of reach: `cargo-hauler-install
// install` under test would rewrite it, and `cargo` through it would submit to
// the live broker. A plain `cargo` ahead of it runs the same real cargo.
const shim = findCargoShim();
if (shim !== null) {
  const dir = mkdtempSync(join(tmpdir(), 'cargo-hauler-test-path-'));
  writeFileSync(join(dir, 'cargo'), `#!/bin/sh\nexec '${shim.realCargo.replaceAll("'", `'\\''`)}' "$@"\n`, {
    mode: 0o755,
  });
  process.env.PATH = `${dir}${delimiter}${process.env.PATH ?? ''}`;
}
