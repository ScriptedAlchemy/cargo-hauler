import { describe, expect, it } from 'effect-rstest';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';

import { BatchTestSummary } from '../src/components/batch-test-summary.js';
import { TicketCard } from '../src/components/ticket-card.js';
import type { RequestRecord } from '../src/daemon/protocol.js';

const record = (overrides: Partial<RequestRecord> = {}): RequestRecord => ({
  after: ['cc-9395'], argv: ['cargo', 'build'], attachMode: null, attachedTo: null,
  background: true, createdAtMs: 1, cwd: '/tmp/ws', diagnostics: [],
  error: 'prerequisite cc-9395 failed', errorCount: 0, estimateMs: null,
  execArgv: null, exitCode: null, finishedAtMs: 2, holdStop: false, host: 'test',
  id: 9421, intentJson: null, intentKey: null, laneKey: 'ws:target',
  outputPath: null, outputTail: null, queuedAtMs: 1, runMs: null,
  savedComputeMs: null, savedComputeSource: null, savedLatencyMs: null,
  session: 'test', signal: null, startedAtMs: null, status: 'failed',
  targetDir: '/tmp/ws/target', ticket: 'cc-9421', waitMs: 1, warningCount: 0,
  workspaceRoot: '/tmp/ws', ...overrides,
});

const shared = () => record({
  argv: ['cargo', 'test', '-p', 'a'], execArgv: ['cargo', 'test', '-p', 'a', '-p', 'b'],
  attachMode: 'batch', attachedTo: 'cc-9499', status: 'done', exitCode: 0, error: null,
});

const text = (node: ReactNode): string => {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(text).join(' ');
  if (isValidElement<{ children?: ReactNode }>(node)) return text(node.props.children);
  return '';
};

describe('shared test-run report component', () => {
  it('states shared exit, widened filters, and missing evidence instead of a guessed verdict', async () => {
    const rendered = await BatchTestSummary({ record: shared() });
    expect(text(rendered)).toContain('output and exit are shared');
    expect(text(rendered)).toContain('union of test filters');
    expect(text(rendered)).toContain('log is missing or unreadable');
    expect(text(rendered)).toContain('tail alone cannot establish');
  });

  it('does not read logs or render shared advice for an ordinary run', async () => {
    expect(await BatchTestSummary({ record: record({ argv: ['cargo', 'test'], execArgv: ['cargo', 'test'] }) })).toBeNull();
  });

  it('wires the index into the card shared by result/await/last even when full output hides the tail', () => {
    for (const hideTail of [false, true]) {
      const card = TicketCard({ record: shared(), nowMs: 3, hideTail });
      const children = Children.toArray(card.props.children as ReactNode);
      expect(children.some((child) => isValidElement(child) && (child as ReactElement).type === BatchTestSummary)).toBe(true);
    }
  });
});
