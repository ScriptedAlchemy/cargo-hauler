import { Agent } from '@agent-bundle/runtime';
import React from 'react';

import type { LaneStatus, TicketSummary } from '../../contracts/protocol.js';
import { sharedTargetWarning } from '../shared/shared-target.js';
import { countWord } from '../../util/text.js';

import { Heading, Table } from './primitives.js';
import { EmptyState } from './states.js';
import { laneBoardModel } from './view-models.js';

export interface LaneBoardProps {
  readonly active: readonly TicketSummary[];
  readonly lanes: readonly LaneStatus[];
  readonly nowMs: number;
}

/**
 * Work grouped by resolved (workspace root, target dir). Only lanes with
 * queued or running work get a row; idle lanes are counted, never listed.
 */
export const LaneBoard = ({ active, lanes, nowMs }: LaneBoardProps) => {
  const model = laneBoardModel(lanes, active, nowMs);
  if (lanes.length === 0) {
    return null;
  }
  return (
    <>
      {model.sharedTargets.map((shared) => (
        <Agent.Context key={shared.targetDir}>{sharedTargetWarning(shared)}</Agent.Context>
      ))}
      {model.rows.length === 0 ? (
        <EmptyState>{`${countWord(lanes.length, 'lane')} known, none busy.`}</EmptyState>
      ) : (
        <>
          <Heading>Lanes</Heading>
          <Table
            columns={['Lane', 'Running', 'For', 'Command', 'Queued', 'Executing', 'Shared target with']}
            rows={model.rows.map((row) => [
              row.name,
              row.running,
              row.runningFor === null ? '—' : `${row.runningFor}${row.stalled === null ? '' : ` · ${row.stalled}`}`,
              row.runningCommand ?? '—',
              String(row.queued),
              row.executing ?? '—',
              row.sharedWith ?? '—',
            ])}
          />
        </>
      )}
    </>
  );
};
