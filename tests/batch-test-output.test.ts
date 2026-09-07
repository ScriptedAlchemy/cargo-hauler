import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'effect-rstest';

import { createTestSummaryIndex, isSharedTestRun, loadBatchTestOutput } from '../src/lib/batch-test-output.js';

const daemon = 'Running unittests src/lib.rs (target/debug/deps/tracedecay_daemon_service-a1)';
const runtime = 'Running unittests src/lib.rs (target/debug/deps/tracedecay_runtime_core-b2)';
const daemonResult = 'test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 138 filtered out; finished in 0.01s';
const runtimeResult = 'test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 725 filtered out; finished in 0.02s';
const result = (text: string) => {
  const index = createTestSummaryIndex();
  for (const line of text.split('\n')) index.line(line);
  return index.result();
};
const withLog = async (text: string, run: (path: string) => Promise<void>) => {
  const root = mkdtempSync(join(tmpdir(), 'hauler-test-index-'));
  try {
    const path = join(root, 'cc-9499.log');
    writeFileSync(path, text);
    await run(path);
  } finally { rmSync(root, { recursive: true, force: true }); }
};

describe('batched test report attribution (#178)', () => {
  it('retains the requested binary before the unrelated final tail', async () => {
    const text = `${daemon}\n${daemonResult}\n${'unrelated output\n'.repeat(5000)}${runtime}\n${runtimeResult}\n`;
    await withLog(text, async (path) => {
      const output = await loadBatchTestOutput(path);
      expect(output.summaries).toEqual([
        { binary: daemon, result: daemonResult }, { binary: runtime, result: runtimeResult },
      ]);
      expect(output.incomplete).toBe(false);
    });
  });

  it('labels both passing and failing binaries, without inventing a ticket verdict', () => {
    const failed = 'test result: FAILED. 1 passed; 1 failed; 0 ignored; finished in 0.01s';
    expect(result(`${daemon}\n${failed}\n${runtime}\n${runtimeResult}`).summaries).toEqual([
      { binary: daemon, result: failed }, { binary: runtime, result: runtimeResult },
    ]);
  });

  it('strips ANSI and accepts CRLF and doc-test headings', () => {
    const output = result(`\u001b[32m${daemon}\u001b[0m\r\n${daemonResult}\r\nDoc-tests my_crate\r\n${runtimeResult}`);
    expect(output.summaries[0]?.binary).toBe(daemon);
    expect(output.summaries[1]?.binary).toBe('Doc-tests my_crate');
  });

  it('does not attribute a summary without a fresh binary heading', () => {
    const output = result(`${daemonResult}\n${daemon}\n${daemonResult}\n${runtimeResult}`);
    expect(output.summaries[0]?.binary).toContain('unattributed');
    expect(output.summaries[2]?.binary).toContain('unattributed');
    expect(output.incomplete).toBe(true);
  });

  it('marks missing logs unavailable instead of substituting the tail', async () => {
    expect((await loadBatchTestOutput(null)).kind).toBe('unavailable');
    const root = mkdtempSync(join(tmpdir(), 'hauler-missing-index-'));
    try {
      expect((await loadBatchTestOutput(join(root, 'missing'))).kind).toBe('unavailable');
      expect((await loadBatchTestOutput(root)).kind).toBe('unavailable');
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('marks byte-budget truncation and never parses a cut summary', async () => {
    const text = `${daemon}\n${daemonResult}\n${runtime}\n${runtimeResult}`;
    await withLog(text, async (path) => {
      const output = await loadBatchTestOutput(path, Buffer.byteLength(text) - 30);
      expect(output.summaries).toEqual([{ binary: daemon, result: daemonResult }]);
      expect(output.incomplete).toBe(true);
    });
  });

  it('bounds oversized lines and does not inherit a stale heading after them', async () => {
    await withLog(`${daemon}\n${'x'.repeat(200_000)}\n${runtimeResult}\n`, async (path) => {
      const output = await loadBatchTestOutput(path);
      expect(output.incomplete).toBe(true);
      expect(output.summaries[0]?.binary).toContain('unattributed');
    });
  });

  it('marks the persisted log-retention notice as partial', () => {
    const output = result(`${daemon}\n${daemonResult}\n[cargo-hauler] output log truncated at 4096 bytes (CARGO_HAULER_TICKET_LOG_MAX_BYTES); later output was not written`);
    expect(output.summaries.length).toBe(1);
    expect(output.incomplete).toBe(true);
  });

  it('bounds the summary count and marks omitted entries', () => {
    const output = result(`${daemon}\n${daemonResult}\n`.repeat(300));
    expect(output.summaries.length).toBe(64);
    expect(output.incomplete).toBe(true);
  });

  it('recognizes the widened leader and rider but leaves ordinary commands alone', () => {
    const argv = ['cargo', 'test', '-p', 'a', '--lib', 'filter_a'];
    const execArgv = [...argv, '-p', 'b', '--no-fail-fast', '--', 'filter_b'];
    expect(isSharedTestRun({ argv, execArgv, attachMode: null })).toBe(true);
    expect(isSharedTestRun({ argv, execArgv, attachMode: 'batch' })).toBe(true);
    expect(isSharedTestRun({ argv, execArgv: argv, attachMode: null })).toBe(false);
    expect(isSharedTestRun({ argv, execArgv: null, attachMode: 'batch' })).toBe(false);
    expect(isSharedTestRun({ argv: ['cargo', 'build'], execArgv: ['cargo', 'build', '-p', 'a'], attachMode: 'batch' })).toBe(false);
  });
});
