import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { test } from 'node:test';

import { inspect, readArtifactManifest } from 'agent-bundle/api';

test('committed artifact matches every current source input and executable mode', async () => {
  const root = resolve(import.meta.dirname, '../..');
  const committed = await readArtifactManifest(resolve(root, 'artifact'));
  assert.equal(committed.status, 'ok');
  const current = await inspect({ root });
  assert.equal(current.state, 'ready');
  assert.deepEqual(
    committed.manifest.compiler.project.sourceInputs,
    current.projectContext.sourceInputs,
    'Run pnpm build and commit the generated artifact and repository marketplaces.',
  );
});
