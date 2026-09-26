import { Agent } from '@agent-bundle/runtime';
import React from 'react';

import type { StatusResult } from '../../contracts/tool-schemas.js';

import { DataList } from './primitives.js';
import { admissionModel, savingsLine } from './view-models.js';

export interface AdmissionStateProps {
  readonly status: Pick<StatusResult, 'active' | 'maxConcurrent' | 'savings' | 'system'>;
}

/**
 * The admission meter shows permits in use, machine load, memory clamp, and
 * how much work attachment has saved. The meter names a hard memory clamp as
 * a paused admission gate, so a reader sees a stalled queue as policy, not a
 * hang.
 */
export const AdmissionState = ({ status }: AdmissionStateProps) => {
  const model = admissionModel(status);
  return (
    <>
      <DataList
        fields={[
          { label: 'Admission', value: model.permits },
          { label: 'System', value: model.load },
          { label: 'Memory', value: model.memory },
          { label: 'Sharing', value: savingsLine(status) },
        ]}
      />
      {model.paused ? (
        <Agent.Context>
          Hard memory pressure has paused admission. Queued tickets resume when MemAvailable recovers. Do not kill cargo to free memory.
        </Agent.Context>
      ) : null}
    </>
  );
};
