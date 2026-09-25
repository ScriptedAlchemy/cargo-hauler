import { describe, expect, it } from 'effect-rstest';

import { LineBuffer, LineBufferOverflowError } from '../../../src/internal/platform/ndjson.js';

const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

describe('LineBuffer bounds', () => {
  it('defaults to a 16 MiB cap on the pending line', () => {
    const buffer = new LineBuffer();
    expect(buffer.push(new Uint8Array(16 * 1024 * 1024).fill(0x78))).toEqual([]);
    expect(() => buffer.push(encode('x'))).toThrow(LineBufferOverflowError);
  });

  it('throws once the unterminated line exceeds the cap and drops the pending bytes', () => {
    const buffer = new LineBuffer({ maxLineBytes: 16 });
    expect(buffer.push(encode('0123456789'))).toEqual([]);
    expect(buffer.pendingBytes).toBe(10);
    let thrown: unknown;
    try {
      buffer.push(encode('0123456789'));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(LineBufferOverflowError);
    expect(thrown).toMatchObject({ _tag: 'LineBufferOverflow', maxLineBytes: 16, pendingBytes: 20 });
    expect(buffer.pendingBytes).toBe(0);
    // The buffer is reusable afterwards; the offending bytes are gone.
    expect(buffer.push(encode('{"ok":1}\n'))).toEqual(['{"ok":1}']);
  });

  it('accepts a line exactly at the cap and completes it on the newline', () => {
    const buffer = new LineBuffer({ maxLineBytes: 8 });
    expect(buffer.push(encode('abcd'))).toEqual([]);
    expect(buffer.push(encode('efgh'))).toEqual([]);
    expect(buffer.push(encode('\nnext\n'))).toEqual(['abcdefgh', 'next']);
    expect(buffer.pendingBytes).toBe(0);
  });

  it('counts only the bytes after the last newline as pending', () => {
    const buffer = new LineBuffer({ maxLineBytes: 8 });
    expect(buffer.push(encode('{"a":1}\n{"b":2}\nca'))).toEqual(['{"a":1}', '{"b":2}']);
    expect(buffer.pendingBytes).toBe(2);
    expect(buffer.push(encode('fé\n'))).toEqual(['café']);
  });

  it('appends many small chunks of one long line for about the work of splitting as many short lines', () => {
    const chunks = 5_000;
    const lines = new LineBuffer();
    const terminated = encode(`${'x'.repeat(63)}\n`);
    let split = 0;
    const splitting = process.threadCpuUsage();
    for (let index = 0; index < chunks; index += 1) {
      split += lines.push(terminated).length;
    }
    const splitCpu = process.threadCpuUsage(splitting);
    const long = new LineBuffer();
    const piece = encode('x'.repeat(64));
    let early = 0;
    const appending = process.threadCpuUsage();
    for (let index = 0; index < chunks; index += 1) {
      early += long.push(piece).length;
    }
    const [line] = long.push(encode('\n'));
    const appendCpu = process.threadCpuUsage(appending);

    expect(split).toBe(chunks);
    expect(early).toBe(0);
    expect(line).toBe('x'.repeat(64 * chunks));
    // This thread's CPU time leaves out other processes' turns on the host,
    // and splitting as many chunks into short lines is the yardstick for host
    // speed. Appending pieces measures 0.3 to 1.3 times that work, and
    // re-concatenating the pending text per chunk 33 to 200 times.
    expect((appendCpu.user + appendCpu.system) / (splitCpu.user + splitCpu.system)).toBeLessThan(5);
  });
});
