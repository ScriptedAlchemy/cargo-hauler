import { Agent } from '@agent-bundle/runtime';
import React from 'react';

import {
  awaitCeilingMs,
  defaultAwaitMs,
  isOrphanedByRestart,
  type DisplayRequestRecord,
  type StatusRowStatus,
} from '../../contracts/protocol.js';
import { formatMs } from '../shared/format.js';

import { failedPrerequisite } from './headlines.js';
import type { SurfaceNames } from './surface.js';

export interface TicketGuidanceProps {
  readonly names: SurfaceNames;
  readonly record: DisplayRequestRecord;
}

type GuidanceComponent = (props: TicketGuidanceProps) => React.JSX.Element;

/*
 * One component per ticket status. The record keyed by `StatusRowStatus` is
 * exhaustive by construction. Adding a status to the daemon protocol fails
 * this module's type-check until its guidance exists.
 */

const PendingGuidance: GuidanceComponent = ({ names, record }) => (
  <Agent.Context>
    {`${record.ticket} is still ${record.status}. Do not rerun the same cargo command. Call ${names.await} with ticket ${record.ticket}, or check ${names.result} later. A plain call waits ${formatMs(defaultAwaitMs)}, and ${names.awaitMaxWait} raises that up to ${formatMs(awaitCeilingMs)}. Call again to keep waiting.`}
  </Agent.Context>
);

const DoneGuidance: GuidanceComponent = ({ record }) => (
  <Agent.Context>{`${record.ticket} succeeded. The output above is the result of that cargo run.`}</Agent.Context>
);

const FailedGuidance: GuidanceComponent = ({ record }) => {
  const prerequisite = failedPrerequisite(record);
  return (
    <Agent.Context>
      {prerequisite === null
        ? `${record.ticket} failed (exit ${record.exitCode ?? 'unknown'}). Fix the diagnostics above before you rerun it. The hauler dedupes identical requests, so an unchanged retry attaches to the same result.`
        : `${record.ticket} never ran: ${record.error}. Fix or rerun ${prerequisite}, then resubmit after the new ticket.`}
    </Agent.Context>
  );
};

const KilledGuidance: GuidanceComponent = ({ names, record }) => (
  <Agent.Context>
    {isOrphanedByRestart(record)
      ? `${record.ticket} did not finish because the daemon restarted while it was in flight. A restart does not hand running cargo processes to the new daemon. Nothing else went wrong with the command, so resubmit it through ${names.request} if you still need the work.`
      : `${record.ticket} was killed before it finished. Resubmit it only if you still need the work.`}
  </Agent.Context>
);

const DeniedGuidance: GuidanceComponent = ({ record }) => (
  <Agent.Context>{`${record.ticket} was denied before cargo ran: ${record.error ?? 'see error above'}.`}</Agent.Context>
);

const PassthroughGuidance: GuidanceComponent = ({ record }) => (
  <Agent.Context>{`${record.ticket} ran directly without broker coordination.`}</Agent.Context>
);

const OrphanedGuidance: GuidanceComponent = ({ names, record }) => (
  <Agent.Context>
    {`${record.ticket} is orphaned. Check ${names.status} for the daemon's state before resubmitting through ${names.request}.`}
  </Agent.Context>
);

const guidanceByStatus: Readonly<Record<StatusRowStatus, GuidanceComponent>> = {
  denied: DeniedGuidance,
  done: DoneGuidance,
  failed: FailedGuidance,
  killed: KilledGuidance,
  orphaned: OrphanedGuidance,
  passthrough: PassthroughGuidance,
  queued: PendingGuidance,
  requested: PendingGuidance,
  running: PendingGuidance,
};

/** What to do next about this ticket, chosen by its status. */
export const TicketGuidance = (props: TicketGuidanceProps) => {
  const Guidance = guidanceByStatus[props.record.status];
  return <Guidance {...props} />;
};
