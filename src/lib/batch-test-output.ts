import { open } from 'node:fs/promises';
import { StringDecoder } from 'node:string_decoder';

import { parseCargoArgv } from '../daemon/intent-normalizer.js';
import type { RequestRecord } from '../daemon/protocol.js';

import { stripAnsi } from './ansi.js';

export interface TestBinarySummary {
  /** The Cargo heading, including the executable path when Cargo supplies it. */
  readonly binary: string;
  readonly result: string;
}

export interface BatchTestOutput {
  readonly kind: 'available' | 'unavailable';
  readonly summaries: readonly TestBinarySummary[];
  /** The index is observational, never a proof that a particular ticket passed. */
  readonly incomplete: boolean;
}

const maxScanBytes = 64 * 1024 * 1024;
// At most ~64 KiB: leave room for a full-log document and its existing card.
const maxSummaries = 64;
const maxLineLength = 16 * 1024;
const maxLabelLength = 512;

/** Use the existing Cargo parser, not another product-side argument grammar. */
export const isSharedTestRun = (
  record: Pick<RequestRecord, 'argv' | 'execArgv' | 'attachMode'>,
): boolean => {
  if (record.execArgv === null) return false;
  const requested = parseCargoArgv(record.argv);
  const actual = parseCargoArgv(record.execArgv);
  if (requested.subcommand !== 'test' || actual.subcommand !== 'test') return false;
  const same = (left: readonly string[], right: readonly string[]) =>
    left.length === right.length && left.every((value, index) => value === right[index]);
  return record.attachMode === 'batch' || requested.workspace !== actual.workspace ||
    !same(requested.packages, actual.packages) || !same(requested.excludes, actual.excludes) ||
    !same(requested.testFilters, actual.testFilters);
};

/**
 * Incremental, bounded index of libtest results. Keep ALL observed binary
 * summaries, not just the last binary, and never guess a package from a
 * crate-name substring. A summary without its Cargo heading stays unattributed.
 */
export const createTestSummaryIndex = () => {
  const summaries: TestBinarySummary[] = [];
  let binary: string | null = null;
  let incomplete = false;
  return {
    skipLine(): void {
      binary = null;
      incomplete = true;
    },
    line(raw: string): void {
      if (raw.length > maxLineLength) {
        this.skipLine();
        return;
      }
      const line = stripAnsi(raw).trim();
      // Cargo announces each libtest binary on stderr before its stdout.
      if (/^Running\s+.+\([^)]+\)$/u.test(line) || /^Doc-tests\s+\S/u.test(line)) {
        binary = line.slice(0, maxLabelLength);
        if (binary.length !== line.length) incomplete = true;
      } else if (/^test result:\s+(?:ok|FAILED)\./u.test(line)) {
        if (summaries.length < maxSummaries) {
          summaries.push({ binary: binary ?? 'unattributed (Cargo binary heading unavailable)', result: line.slice(0, maxLabelLength) });
        } else incomplete = true;
        if (binary === null || line.length > maxLabelLength) incomplete = true;
        // A second result without a fresh heading must not inherit the first.
        binary = null;
      } else if (/cargo-hauler.*(?:truncat|log.*limit)/iu.test(line)) {
        incomplete = true;
      }
    },
    result(): BatchTestOutput {
      return { kind: 'available', summaries, incomplete };
    },
  };
};

/**
 * Scan a snapshot from the START of the retained log: the requested binary
 * can finish far before the final tail. Reads are asynchronous and bounded;
 * neither file size nor a single long output line can grow memory unbounded.
 * Missing logs do not silently degrade into another binary's tail.
 */
export const loadBatchTestOutput = async (
  path: string | null,
  limitBytes = maxScanBytes,
): Promise<BatchTestOutput> => {
  if (path === null) return { kind: 'unavailable', summaries: [], incomplete: true };
  let file: Awaited<ReturnType<typeof open>> | undefined;
  try {
    file = await open(path, 'r');
    const stat = await file.stat();
    if (!stat.isFile()) return { kind: 'unavailable', summaries: [], incomplete: true };
    const limit = Number.isFinite(limitBytes) ? Math.max(0, Math.min(maxScanBytes, Math.floor(limitBytes))) : maxScanBytes;
    const end = Math.min(stat.size, limit);
    const buffer = Buffer.alloc(64 * 1024);
    const decoder = new StringDecoder('utf8');
    const index = createTestSummaryIndex();
    let position = 0;
    let pending = '';
    let skippingLine = false;
    while (position < end) {
      const { bytesRead } = await file.read(buffer, 0, Math.min(buffer.length, end - position), position);
      if (bytesRead === 0) break;
      position += bytesRead;
      const parts = decoder.write(buffer.subarray(0, bytesRead)).split('\n');
      for (let i = 0; i < parts.length; i += 1) {
        if (!skippingLine) {
          pending += parts[i] ?? '';
          if (pending.length > maxLineLength) {
            index.skipLine();
            pending = '';
            skippingLine = true;
          }
        }
        if (i < parts.length - 1) {
          if (!skippingLine) index.line(pending);
          pending = '';
          skippingLine = false;
        }
      }
    }
    // Only parse a final unterminated line at the observed file's real end.
    // Never turn a byte-budget cut in the middle of a result into a summary.
    if (position === stat.size && !skippingLine && pending.length > 0) index.line(pending + decoder.end());
    const result = index.result();
    return { ...result, incomplete: result.incomplete || position < stat.size || skippingLine };
  } catch {
    return { kind: 'unavailable', summaries: [], incomplete: true };
  } finally {
    await file?.close().catch(() => undefined);
  }
};
