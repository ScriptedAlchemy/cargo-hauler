import { Agent } from '@agent-bundle/runtime';
import { describe, expect, it } from 'effect-rstest';
import type { ReactElement } from 'react';

import { failedPrerequisite, ticketHeadline } from '../src/components/headlines.js';
import { cliSurface, mcpSurface, type SurfaceNames } from '../src/components/surface.js';
import { TicketGuidance, type TicketGuidanceProps } from '../src/components/ticket-guidance.js';
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

// These status components are pure: inspect the actual Agent.Context they
// produce, not a duplicate formatter or a mock of the component under test.
const guidanceText = (entry: RequestRecord, names: SurfaceNames): string => {
  const selected = TicketGuidance({ names, record: entry });
  const Component = selected.type as (props: TicketGuidanceProps) => ReactElement<{ children: string }>;
  const context = Component(selected.props as TicketGuidanceProps);
  expect(context.type).toBe(Agent.Context);
  return context.props.children;
};

describe('prerequisite failure guidance (#169)', () => {
  for (const status of ['failed', 'killed', 'denied', 'passthrough', 'unknown']) {
    it(`reports a never-run ticket after a ${status} prerequisite`, () => {
      const entry = record({ error: `prerequisite cc-9395 ${status}` });
      expect(failedPrerequisite(entry)).toBe('cc-9395');
      expect(ticketHeadline(entry, 3)).toContain(`failed — never ran: prerequisite cc-9395 ${status}`);
      expect(ticketHeadline(entry, 3)).not.toContain('0 errors, 0 warnings');
      for (const names of [cliSurface, mcpSurface]) {
        const text = guidanceText(entry, names);
        expect(text).toContain(`cc-9421 never ran: prerequisite cc-9395 ${status}`);
        expect(text).toContain('fix or rerun cc-9395, then resubmit');
        expect(text).toContain('new ticket');
        expect(text).not.toContain('Fix the diagnostics');
        expect(text).not.toContain('dedupes identical');
        expect(text).not.toContain('exit unknown');
      }
    });
  }

  it('reports a rider that attached without declaring the prerequisite', () => {
    const entry = record({ after: [], attachedTo: 'cc-9420' });
    expect(failedPrerequisite(entry)).toBe('cc-9395');
    expect(guidanceText(entry, cliSurface)).toContain('cc-9421 never ran');
    expect(ticketHeadline(entry, 3)).toContain('failed — never ran');
  });

  const unrelated: readonly Partial<RequestRecord>[] = [
    { startedAtMs: 1 }, { exitCode: 101 }, { error: 'compile failed' },
    { error: 'prerequisite cc-9395 failed\nother text' }, { error: null },
    { error: 'prerequisite cc-9395 done' },
  ];
  for (const override of unrelated) {
    it(`keeps existing failed-run guidance for ${JSON.stringify(override)}`, () => {
      const entry = record(override);
      expect(failedPrerequisite(entry)).toBeNull();
      expect(guidanceText(entry, cliSurface)).toContain('Fix the diagnostics');
      expect(ticketHeadline(entry, 3)).not.toContain('never ran');
    });
  }

  it('does not classify a non-failed ticket by error text alone', () => {
    for (const status of ['done', 'queued', 'running', 'killed', 'denied', 'passthrough'] as const) {
      expect(failedPrerequisite(record({ status }))).toBeNull();
    }
  });
});
