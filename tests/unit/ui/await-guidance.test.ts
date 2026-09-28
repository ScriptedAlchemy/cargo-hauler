import { Agent } from '@agent-bundle/runtime';
import { describe, expect, it } from 'effect-rstest';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';

import type { RequestRecord } from '../../../src/internal/contracts/protocol.js';
import { AwaitDocument } from '../../../src/internal/ui/documents/documents.js';
import { cliSurface, mcpSurface } from '../../../src/internal/ui/documents/surface.js';
import { TicketGuidance, type TicketGuidanceProps } from '../../../src/internal/ui/documents/ticket-guidance.js';

type Element = ReactElement<{ readonly children?: ReactNode }>;

const contextText = (root: Element): unknown =>
  Children.toArray(root.props.children)
    .filter((child): child is Element => isValidElement(child))
    .find((child) => child.type === Agent.Context)?.props.children;

const expiredAwait = (names: typeof cliSurface) =>
  contextText(AwaitDocument({
    maxWaitMs: 30_000,
    names,
    nowMs: 0,
    result: { daemon: 'running', operation: 'await', request: null, summary: 'cc-7 still pending', ticket: 'cc-7', timedOut: true },
  }));

const queued = {
  after: [], argv: ['cargo', 'build'], attachMode: null, attachedTo: null,
  background: true, createdAtMs: 1, cwd: '/tmp/ws', diagnostics: [],
  error: null, errorCount: 0, estimateMs: null,
  execArgv: null, exitCode: null, finishedAtMs: null, holdStop: false, host: 'test',
  id: 7, intentJson: null, intentKey: null, laneKey: 'ws:target',
  outputPath: null, outputTail: null, queuedAtMs: 1, runMs: null,
  savedComputeMs: null, savedComputeSource: null, savedLatencyMs: null,
  session: 'test', signal: null, startedAtMs: null, status: 'queued',
  targetDir: '/tmp/ws/target', ticket: 'cc-7', waitMs: null, warningCount: 0,
  workspaceRoot: '/tmp/ws',
} satisfies RequestRecord;

const pendingGuidance = (names: typeof cliSurface): unknown => {
  const selected = TicketGuidance({ names, record: queued });
  const Component = selected.type as (props: TicketGuidanceProps) => Element;
  return Component(selected.props as TicketGuidanceProps).props.children;
};

describe('await wait guidance', () => {
  it('keeps continuation and longer-wait guidance on both surfaces', () => {
    expect(expiredAwait(cliSurface)).toBe(
      'Wait expired (30.0s). Continue: hauler await cc-7. Longer wait: --max-wait-ms. Do not resubmit.',
    );
    expect(expiredAwait(mcpSurface)).toBe(
      'Wait expired (30.0s). Continue: hauler_await cc-7. Longer wait: maxWaitMs. Do not resubmit.',
    );
    expect(pendingGuidance(cliSurface)).toBe(
      'cc-7 is still queued. Do not rerun the same cargo command. Call hauler await with ticket cc-7, or check hauler result later. A plain call waits 1m, and --max-wait-ms raises that up to 2h. Call again to keep waiting.',
    );
    expect(pendingGuidance(mcpSurface)).toBe(
      'cc-7 is still queued. Do not rerun the same cargo command. Call hauler_await with ticket cc-7, or check hauler_result later. A plain call waits 1m, and maxWaitMs raises that up to 2h. Call again to keep waiting.',
    );
  });
});
