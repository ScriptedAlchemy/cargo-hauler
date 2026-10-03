import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { junitCounts, junitFailingTests, failingTestsSummary, aggregateJUnit, snapshotEvidence } from '../../src/internal/github-action/evidence.mjs';
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
test('failing testcases are named from failure and error elements only', () => {
  const xml = `<testsuites tests="5" failures="1" errors="1"><testsuite name="storage" tests="5" failures="1" errors="1">
    <testcase name="tests::passes" classname="storage"/>
    <testcase name="tests::passes_with_output" classname="storage"><system-out>no failure here</system-out></testcase>
    <testcase name="tests::breaks" classname="storage"><failure message="assertion failed" type="test failure">left != right</failure></testcase>
    <testcase name="tests::panics&lt;u8&gt;" classname='storage::bin/it'><error message="panicked"/></testcase>
    <testcase name="tests::skipped" classname="storage"><skipped/></testcase>
  </testsuite></testsuites>`;
  assert.deepEqual(junitFailingTests(xml), ['storage::tests::breaks', 'storage::bin/it::tests::panics<u8>']);
  assert.deepEqual(junitFailingTests('<testcase name="a`b\nc"><failure/></testcase><testcase><error/></testcase>'), ['a b c', 'unnamed']);
  const [long] = junitFailingTests(`<testcase name="${'x'.repeat(500)}"><failure/></testcase>`);
  assert.equal(long, `${'x'.repeat(119)}…`);
});
test('aggregated failing names are capped with an omitted count and summarized as code spans', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hauler-evidence-'));
  const failing = (prefix, count) => Array.from({ length: count }, (_, index) => `<testcase classname="${prefix}" name="t${index}"><failure/></testcase>`).join('');
  try {
    await writeFile(join(directory, 'a.xml'), `<testsuite tests="8" failures="7"><testcase name="ok"/>${failing('a', 7)}</testsuite>`);
    await writeFile(join(directory, 'b.xml'), `<testsuite tests="5" failures="5">${failing('b', 5)}</testsuite>`);
    const junit = await aggregateJUnit(directory);
    assert.deepEqual({ ...junit, failingTests: junit.failingTests.length }, { tests: 13, failures: 12, errors: 0, skipped: 0, failingTests: 10, failingTestsOmitted: 2 });
    assert.ok(!junit.failingTests.includes('ok'));
    assert.match(failingTestsSummary(junit), /^ Failing tests: `[ab]::t\d`(, `[ab]::t\d`){9} \(\+2 more\)\.$/);
    assert.equal(failingTestsSummary({ tests: 1, failures: 1, errors: 0, skipped: 0, failingTests: ['x::y'], failingTestsOmitted: 0 }), ' Failing tests: `x::y`.');
    assert.equal(failingTestsSummary({ tests: 1, failures: 0, errors: 0, skipped: 0 }), '');
    assert.equal(failingTestsSummary(undefined), '');
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('aggregated reports and public snapshot evidence exclude raw errors, logs, passing names and paths', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hauler-evidence-'));
  try {
    await writeFile(join(directory, 'private.xml'), '<testsuites><testsuite tests="3" failures="1"><testcase name="secret"/><testcase name="visible_failure"><failure>private token</failure></testcase></testsuite></testsuites>');
    await writeFile(join(directory, 'private.json'), '{"secret":"private token"}');
    assert.deepEqual(await aggregateJUnit(directory), { tests: 3, failures: 1, errors: 0, skipped: 0, failingTests: ['visible_failure'], failingTestsOmitted: 0 });
    const safe = JSON.stringify(snapshotEvidence({ pr: 1, junit: await aggregateJUnit(directory), error: 'private token', logPath: '/private/log', reportsPath: '/private/reports' }));
    assert.ok(!/private|secret/.test(safe));
    assert.ok(safe.includes('visible_failure'));
    await writeFile(join(directory, 'large.xml'), 'x'.repeat(4 * 1024 * 1024));
    await assert.rejects(aggregateJUnit(directory), /report limit/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
