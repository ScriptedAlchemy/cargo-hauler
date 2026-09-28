import { Agent } from '@agent-bundle/runtime';
import React, { Suspense } from 'react';

import { formatMs } from '../shared/format.js';
import type { AwaitResult, LogResult } from '../../contracts/tool-schemas.js';

import { AwaitDocument, LogDocument } from './documents.js';
import type { SurfaceNames } from './surface.js';

/*
 * Progressive documents. Each stream is a valueless `Agent.Result` container
 * that holds one Suspense boundary. The fallback is the document the reader sees
 * while the daemon is still working (a progress node), and
 * the settled child is the ordinary result document, whose `Agent.Result
 * value` the runtime merges up into the container. The MCP projector emits
 * the fallback's progress as notifications and the merged value as
 * `structuredContent`; the routed CLI updates the terminal in place.
 */

export interface AwaitStreamProps {
  /** Resolves when the daemon-side wait settles (finished, or the wait expired). */
  readonly awaited: Promise<AwaitResult>;
  readonly maxWaitMs: number;
  readonly names: SurfaceNames;
  readonly ticket: string;
}

const AwaitPending = ({ maxWaitMs, names, ticket }: Omit<AwaitStreamProps, 'awaited'>) => (
  <>
    <Agent.Text>
      {`Waiting up to ${formatMs(maxWaitMs)} for ${ticket}.`}
    </Agent.Text>
    <Agent.Progress completed={0} message={`${names.await} ${ticket}: waiting`} total={maxWaitMs} />
  </>
);

const AwaitSettled = async ({ awaited, maxWaitMs, names }: Pick<AwaitStreamProps, 'awaited' | 'maxWaitMs' | 'names'>) => (
  <AwaitDocument maxWaitMs={maxWaitMs} names={names} nowMs={Date.now()} result={await awaited} />
);

export const AwaitStream = ({ awaited, ...pending }: AwaitStreamProps) => (
  <Agent.Result>
    <Suspense fallback={<AwaitPending {...pending} />}>
      <AwaitSettled awaited={awaited} maxWaitMs={pending.maxWaitMs} names={pending.names} />
    </Suspense>
  </Agent.Result>
);

export interface LogStreamProps {
  readonly loading: Promise<LogResult>;
  readonly names: SurfaceNames;
}

const LogSettled = async ({ loading, names }: LogStreamProps) => (
  <LogDocument names={names} nowMs={Date.now()} result={await loading} />
);

/** `hauler_log` and `hauler log` render a progress frame while the ledger is read, then the listing. */
export const LogStream = ({ loading, names }: LogStreamProps) => (
  <Agent.Result>
    <Suspense fallback={<Agent.Progress completed={0} message={`${names.log}: reading the ledger`} />}>
      <LogSettled loading={loading} names={names} />
    </Suspense>
  </Agent.Result>
);
