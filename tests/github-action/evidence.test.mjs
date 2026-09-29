import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { junitCounts, aggregateJUnit, snapshotEvidence } from '../../src/internal/github-action/evidence.mjs';
test('JUnit exposes numeric counts only, supports empty wrappers and avoids nested double counts', () => {
  const child = '<testsuite name="private" tests="5" failures="1" errors="2" skipped="1"><testcase name="secret"><failure>private diagnostic</failure></testcase></testsuite>';
  const expected = { tests: 5, failures: 1, errors: 2, skipped: 1 };
  assert.deepEqual(junitCounts(`<testsuites>${child}</testsuites>`), expected);
  assert.deepEqual(junitCounts(`<testsuites tests="5" failures="1" errors="2" skipped="1">${child}</testsuites>`), expected);
  assert.deepEqual(junitCounts(`<testsuites><testsuite tests="5" failures="1" errors="2" skipped="1">${child}</testsuite></testsuites>`), expected);
  assert.deepEqual(junitCounts(`<testsuites>${child}${child}</testsuites>`), { tests: 10, failures: 2, errors: 4, skipped: 2 });
  assert.equal(junitCounts('<testsuites name="private"/>'), null);
  assert.throws(() => junitCounts('<testsuite tests="999999999999999999"/>'), /Invalid JUnit/);
});
test('aggregated reports and public snapshot evidence exclude raw errors, logs, names and paths', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hauler-evidence-'));
  try {
    await writeFile(join(directory, 'private.xml'), '<testsuites><testsuite tests="3" failures="1"><testcase name="secret"><failure>private token</failure></testcase></testsuite></testsuites>');
    await writeFile(join(directory, 'private.json'), '{"secret":"private token"}');
    assert.deepEqual(await aggregateJUnit(directory), { tests: 3, failures: 1, errors: 0, skipped: 0 });
    const safe = JSON.stringify(snapshotEvidence({ pr: 1, junit: await aggregateJUnit(directory), error: 'private token', logPath: '/private/log', reportsPath: '/private/reports' }));
    assert.ok(!/private|secret/.test(safe));
    await writeFile(join(directory, 'large.xml'), 'x'.repeat(4 * 1024 * 1024));
    await assert.rejects(aggregateJUnit(directory), /report limit/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
