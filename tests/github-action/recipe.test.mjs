import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRecipe } from '../../src/internal/github-action/recipe.mjs';
export const recipe = { version: 1, trustedAuthors: ['owner'], sharedBuilds: true, requiredChecks: ['Gates'], image: { dockerfile: 'Dockerfile', context: '.' }, prepare: [], compatibilityPaths: ['Cargo.lock', '.cargo/'], lanes: [{ id: 'linux', checkName: 'Hauler Linux', tasks: [{ id: 'first', run: 'cargo test', timeoutSeconds: 60 }, { id: 'second', run: 'cargo check', timeoutSeconds: 60 }] }] };
test('accepts bounded recipe and rejects escaping paths or ambiguous ownership', () => {
  assert.deepEqual(parseRecipe(recipe), { ...recipe, reports: [] });
  assert.deepEqual(parseRecipe({ ...recipe, reports: ['target/reports/'] }).reports, ['target/reports']);
  assert.throws(() => parseRecipe({ ...recipe, reports: Array(33).fill('reports') }), TypeError);
  for (const bad of [ { ...recipe, image: { dockerfile: '../Dockerfile', context: '.' } }, { ...recipe, compatibilityPaths: ['/tmp/x'] }, { ...recipe, lanes: [...recipe.lanes, recipe.lanes[0]] }, { ...recipe, lanes: [{ ...recipe.lanes[0], tasks: [recipe.lanes[0].tasks[0], recipe.lanes[0].tasks[0]] }] }, { ...recipe, lanes: [{ ...recipe.lanes[0], checkName: 'Gates' }] } ]) assert.throws(() => parseRecipe(bad), TypeError);
});
