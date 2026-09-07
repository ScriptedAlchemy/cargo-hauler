import { Agent } from '@agent-bundle/runtime';
import React from 'react';

import type { RequestRecord } from '../daemon/protocol.js';
import { isSharedTestRun, loadBatchTestOutput } from '../lib/batch-test-output.js';

import { CodeBlock, Heading } from './primitives.js';

/** Shared by result, await, and last through TicketCard. No execution policy. */
export const BatchTestSummary = async ({ record }: { readonly record: RequestRecord }) => {
  if (!isSharedTestRun(record)) return null;
  const output = await loadBatchTestOutput(record.outputPath);
  return (
    <>
      <Heading>Shared test-run summaries (all observed binaries)</Heading>
      <Agent.Context>
        {`This ticket used the composite invocation shown in Ran as. Its output and exit are shared, not a separately executed per-package run. Folding may widen packages and apply the union of test filters across binaries; these counts are not counts for this ticket's original filter alone. The trailing output below can belong to another binary.`}
      </Agent.Context>
      {output.summaries.length === 0 ? (
        <Agent.Text>
          {output.kind === 'unavailable'
            ? 'Binary summaries unavailable: the retained log is missing or unreadable. The tail alone cannot establish this package’s result.'
            : 'No complete binary summaries were observed in the retained log. This is not evidence that this package ran zero tests or passed.'}
        </Agent.Text>
      ) : (
        <CodeBlock lang="text">
          {output.summaries.map((entry) => `${entry.binary}\n${entry.result}`).join('\n\n')}
        </CodeBlock>
      )}
      {output.incomplete || record.status === 'running' ? (
        <Agent.Context>
          The index is partial: the run may still be active, or log retention, a missing heading, or the bounded scan omitted output. No per-ticket test verdict is inferred.
        </Agent.Context>
      ) : null}
    </>
  );
};
