import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

export function snapshotEvidence(record) {
  return { pr: record.pr, head: record.head, base: record.base, merge: record.merge, conclusion: record.conclusion,
    readyAt: record.readyAt, admittedAt: record.admittedAt, completedAt: record.completedAt,
    queueSeconds: record.queueSeconds, durationSeconds: record.durationSeconds,
    compatibleSandboxReuse: record.compatibleSandboxReuse, compatibilityKey: record.compatibilityKey, imageReference: record.imageReference,
    stages: record.stages, tasks: record.tasks, ...(record.junit ? { junit: record.junit } : {}),
    ...(record.infrastructureError ? { infrastructureError: true } : {}) };
}

export function junitCounts(xml) {
  const counts = { tests: 0, failures: 0, errors: 0, skipped: 0 };
  const stack = [];
  let found = false;
  for (const tag of xml.matchAll(/<(\/?)(testsuite|testsuites)\b([^>]*)>/g)) {
    if (tag[1]) { stack.pop(); continue; }
    const accounted = stack.some(Boolean), values = {};
    for (const name of Object.keys(counts)) {
      const value = new RegExp(`(?:^|\\s)${name}\\s*=\\s*["']([0-9]+)["']`).exec(tag[3])?.[1];
      if (value !== undefined) {
        const number = Number(value);
        if (!Number.isSafeInteger(number) || number > 100000000) throw new Error('Invalid JUnit counts');
        values[name] = number;
      }
    }
    const aggregate = values.tests !== undefined;
    if (!accounted && aggregate) { for (const name of Object.keys(counts)) counts[name] += values[name] ?? 0; found = true; }
    if (!tag[3].endsWith('/')) stack.push(accounted || aggregate);
  }
  if (Object.values(counts).some(value => value > 100000000)) throw new Error('Invalid JUnit totals');
  return found ? counts : null;
}

const entities = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
function junitAttribute(attributes, name) {
  const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(attributes);
  return match && (match[1] ?? match[2]).replace(/&(lt|gt|amp|quot|apos);/g, (_, entity) => entities[entity]);
}

function junitTestName(attributes) {
  const name = [junitAttribute(attributes, 'classname'), junitAttribute(attributes, 'name')].filter(Boolean).join('::').replace(/[\u0000-\u001f\u007f`]/g, ' ') || 'unnamed';
  return name.length > 120 ? `${name.slice(0, 119).replace(/[\ud800-\udbff]$/, '')}…` : name;
}

export function junitFailingTests(xml) {
  const names = [];
  let open = null, failing = false;
  for (const [tag, attributes] of xml.matchAll(/<testcase\b([^<>]*)>|<\/testcase>|<(?:failure|error)\b/g)) {
    if (attributes !== undefined) { open = attributes.endsWith('/') ? null : attributes; failing = false; }
    else if (tag === '</testcase>') { if (open !== null && failing) names.push(junitTestName(open)); open = null; }
    else failing = true;
  }
  return names;
}

export function failingTestsSummary(junit) {
  if (!junit?.failingTests?.length) return '';
  return ` Failing tests: ${junit.failingTests.map(name => `\`${name}\``).join(', ')}${junit.failingTestsOmitted ? ` (+${junit.failingTestsOmitted} more)` : ''}.`;
}

export async function aggregateJUnit(directory) {
  const total = { tests: 0, failures: 0, errors: 0, skipped: 0 }, failingTests = [];
  let found = false, files = 0, bytes = 0, visited = 0, failingTestsOmitted = 0;
  async function visit(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (++visited > 10000) throw new Error('JUnit traversal limit exceeded');
      const file = join(path, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile() && entry.name.endsWith('.xml')) {
        bytes += (await stat(file)).size;
        if (++files > 100 || bytes > 4 * 1024 * 1024) throw new Error('JUnit report limit exceeded');
        const xml = await readFile(file, 'utf8'), counts = junitCounts(xml);
        if (counts) { for (const name of Object.keys(total)) total[name] += counts[name]; found = true; }
        if (Object.values(total).some(value => value > 100000000)) throw new Error('Invalid JUnit totals');
        for (const name of junitFailingTests(xml)) if (failingTests.length < 10) failingTests.push(name); else failingTestsOmitted++;
      }
    }
  }
  await visit(directory);
  if (!found) return null;
  return failingTests.length ? { ...total, failingTests, failingTestsOmitted } : total;
}
