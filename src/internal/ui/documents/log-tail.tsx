import { Agent } from '@agent-bundle/runtime';
import React from 'react';

import { CodeBlock } from './primitives.js';

export interface LogTailProps {
  /** Whether the daemon captured this tail from a run still in progress. */
  readonly live: boolean;
  readonly maxLines?: number;
  readonly text: string | null;
}

const lastLines = (text: string, limit: number): string => {
  const lines = text.replace(/\n$/u, '').split('\n');
  return lines.length <= limit
    ? lines.join('\n')
    : `… (${lines.length - limit} earlier lines omitted)\n${lines.slice(-limit).join('\n')}`;
};

/**
 * The captured cargo output tail. `live` marks a snapshot of a run that still
 * produces output, as opposed to the settled tail of a finished one.
 * `hauler_await` streams that snapshot while it waits, and `hauler_result`
 * returns it for a running ticket.
 */
export const LogTail = ({ live, maxLines = 40, text }: LogTailProps) => {
  if (text === null || text.trim() === '') {
    return null;
  }
  return (
    <>
      <Agent.Text>{live ? 'Live output tail:' : 'Output tail:'}</Agent.Text>
      <CodeBlock lang="text">{lastLines(text, maxLines)}</CodeBlock>
    </>
  );
};
