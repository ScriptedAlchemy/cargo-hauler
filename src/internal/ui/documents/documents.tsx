import { Agent } from '@agent-bundle/runtime';
import React from 'react';

import { APP_RESOURCE_URI } from '../../../constants.js';
import { awaitCeilingMs, defaultAwaitMs } from '../../contracts/protocol.js';
import { formatMs } from '../shared/format.js';
import { documentValue } from '../../util/json.js';
import { countWord } from '../../util/text.js';
import type {
  AwaitResult,
  DaemonStatus,
  KillResult,
  LastResult,
  LogResult,
  RequestSubmitResult,
  ResultFetchResult,
  StatusResult,
} from '../../contracts/tool-schemas.js';
import type { TicketOutputModel } from '../../operations/ticket-output.js';

import { AdmissionState } from './admission-state.js';
import { DashboardLink } from './dashboard-link.js';
import { FullOutput } from './full-output.js';
import { KacheStats } from './kache-stats.js';
import { LaneBoard } from './lane-board.js';
import { DataList } from './primitives.js';
import { ErrorState, UnavailableState } from './states.js';
import type { SurfaceNames } from './surface.js';
import { TicketCard } from './ticket-card.js';
import { TicketGuidance } from './ticket-guidance.js';
import { TicketList } from './ticket-list.js';
import { lineageLine, type LineageModel } from './view-models.js';

/**
 * One document per hauler result, shared by the MCP tool and CLI routes so
 * both surfaces show the same cards, boards, tails, and next-step guidance;
 * only the command spellings in `names` differ.
 */
interface DocumentProps<Result> {
  readonly names: SurfaceNames;
  readonly nowMs: number;
  readonly result: Result;
}

const OrphanedStatus = ({ result }: { readonly result: StatusResult }) => {
  const count = result.recent.filter((row) => row.status === 'orphaned').length;
  if (count === 0) {
    return null;
  }
  const tickets = countWord(count, 'orphaned ticket');
  return (
    <Agent.Context>
      {result.daemon === 'unresponsive'
        ? `${tickets} ${count === 1 ? 'has' : 'have'} unconfirmed ownership because the daemon did not answer. Check daemon health before you resubmit.`
        : `The stopped daemon stranded ${tickets}, and ${count === 1 ? 'it' : 'they'} will not finish. Resubmit any you still need.`}
    </Agent.Context>
  );
};

export const StatusDocument = ({
  filtered,
  names,
  nowMs,
  result,
}: DocumentProps<StatusResult> & { readonly filtered: boolean }) => (
  <Agent.Result value={documentValue(result)}>
    <Agent.Text>{result.summary.split('\n', 1)[0] ?? result.summary}</Agent.Text>
    <AdmissionState status={result} />
    <LaneBoard active={result.active} lanes={result.lanes} nowMs={nowMs} />
    <TicketList
      empty={filtered ? 'No active requests match these filters.' : 'Nothing queued or running.'}
      heading="In flight"
      nowMs={nowMs}
      records={result.active}
    />
    <TicketList
      {...(filtered ? { empty: 'No recent requests match these filters.' } : {})}
      heading="Recent"
      nowMs={nowMs}
      records={result.recent}
    />
    <KacheStats kache={result.kache} nowMs={nowMs} />
    <OrphanedStatus result={result} />
    {result.active.length > 0 ? (
      <Agent.Context>
        {`Do not start a duplicate cargo run for anything listed in flight. Submit through ${names.request} or run cargo normally, and the hauler attaches you to the existing run. Wait with ${names.await} <ticket>.`}
      </Agent.Context>
    ) : null}
    <DashboardLink names={names} />
  </Agent.Result>
);

/**
 * The `hauler_dashboard` text. The App opens beside it on hosts that render
 * MCP Apps, so the model gets the daemon's summary line and where the text
 * form is, not a second copy of the status document.
 */
export const DashboardDocument = ({ names, result }: Omit<DocumentProps<StatusResult>, 'nowMs'>) => (
  <Agent.Result value={documentValue(result)}>
    <Agent.Text>{result.summary.split('\n', 1)[0] ?? result.summary}</Agent.Text>
    <Agent.Context>
      {`Dashboard: ${APP_RESOURCE_URI}. It opens beside this result on hosts that render MCP Apps. On other hosts, run the browser preview from the hauler-dashboard skill. For the queue, lanes, and tickets as text, call ${names.status}.`}
    </Agent.Context>
  </Agent.Result>
);

export const LogDocument = ({ nowMs, result }: DocumentProps<LogResult>) => (
  <Agent.Result value={documentValue(result)}>
    <Agent.Text>{result.summary}</Agent.Text>
    <TicketList empty="The ledger has no requests yet." nowMs={nowMs} records={result.requests} />
  </Agent.Result>
);

const TicketNotKnown = ({
  daemon,
  names,
  ticket,
}: {
  readonly daemon: DaemonStatus;
  readonly names: SurfaceNames;
  readonly ticket: string;
}) => (
  <UnavailableState what={ticket}>
    {`${daemon === 'running' ? 'not known to the daemon' : `not in the ledger, and the daemon is ${daemon}`}. Tickets look like cc-123. Check ${names.log} for recent ids.`}
  </UnavailableState>
);

export const LastDocument = ({ names, nowMs, result }: DocumentProps<LastResult>) => (
  <Agent.Result value={documentValue(result)}>
    <Agent.Text>{result.summary}</Agent.Text>
    {result.request === null ? null : (
      <>
        <TicketCard nowMs={nowMs} record={result.request} />
        <TicketGuidance names={names} record={result.request} />
      </>
    )}
  </Agent.Result>
);

export interface ResultDocumentProps extends DocumentProps<ResultFetchResult> {
  /** The ticket's on-disk full output log, as a pointer by default and as the log itself under `--full`. */
  readonly output: TicketOutputModel;
}

/**
 * `hauler result` renders the ticket card with the stored tail, then where the
 * whole output lives. Under `--full` the log replaces the tail as the document body
 * (the tail would only repeat its last lines).
 */
export const ResultDocument = ({ names, nowMs, output, result }: ResultDocumentProps) => (
  <Agent.Result value={documentValue(result)}>
    <Agent.Text>{result.summary}</Agent.Text>
    {result.request === null ? (
      <TicketNotKnown daemon={result.daemon} names={names} ticket={result.ticket} />
    ) : (
      <>
        <TicketCard hideTail={output.kind === 'full'} nowMs={nowMs} record={result.request} />
        <FullOutput names={names} output={output} ticket={result.request.ticket} />
        <TicketGuidance names={names} record={result.request} />
      </>
    )}
  </Agent.Result>
);

export const KillDocument = ({ names, nowMs, result }: DocumentProps<KillResult>) => (
  <Agent.Result value={documentValue(result)}>
    <Agent.Text>{result.summary}</Agent.Text>
    {result.request === null ? null : <TicketCard nowMs={nowMs} record={result.request} />}
    <Agent.Context>
      {result.killed
        ? `Riders attached to ${result.ticket} return to their lane or fail with it. Confirm with ${names.result} ${result.ticket}, which shows status killed. Resubmit only if you still need the work.`
        : result.daemon === 'stopped'
          ? 'Nothing changed. The daemon is stopped, so no ticket holds a lane.'
          : `Nothing changed. Use ${names.status} to find the ticket that holds the lane.`}
    </Agent.Context>
  </Agent.Result>
);

export const AwaitDocument = ({
  maxWaitMs,
  names,
  nowMs,
  result,
}: DocumentProps<AwaitResult> & { readonly maxWaitMs: number }) => (
  <Agent.Result value={documentValue(result)}>
    <Agent.Text>{result.summary}</Agent.Text>
    {result.request === null ? null : <TicketCard nowMs={nowMs} record={result.request} />}
    {result.timedOut ? (
      <Agent.Context>
        {`The ${formatMs(maxWaitMs)} wait expired before ${result.ticket} finished. Call ${names.await} again instead of polling ${names.result} in a tight loop. A plain call waits ${formatMs(defaultAwaitMs)}, and ${names.awaitMaxWait} raises that up to ${formatMs(awaitCeilingMs)}.`}
      </Agent.Context>
    ) : result.request === null ? (
      <TicketNotKnown daemon={result.daemon} names={names} ticket={result.ticket} />
    ) : (
      <TicketGuidance names={names} record={result.request} />
    )}
  </Agent.Result>
);

export interface RequestDocumentProps extends Omit<DocumentProps<RequestSubmitResult>, 'nowMs'> {
  readonly argv: readonly string[];
  readonly lineage: LineageModel | null;
}

/** `behind cc-3281 (2 ahead, wait ~13m)`, or null when the lane was idle or the request attached. */
const requestQueueText = (result: RequestSubmitResult): string | null => {
  const queue = result.queue;
  if (queue === undefined || queue.ahead.length === 0) {
    return null;
  }
  const wait = queue.waitEtaMs === undefined ? '' : `, wait ~${formatMs(queue.waitEtaMs)}`;
  return `behind ${queue.ahead.join(', ')} (${queue.position} ahead${wait})`;
};

export const RequestDocument = ({ argv, lineage, names, result }: RequestDocumentProps) => (
  <Agent.Result value={documentValue(result)}>
    <Agent.Text>{result.summary}</Agent.Text>
    {result.ticket === null ? (
      <ErrorState code="submit-failed">
        {`The daemon did not accept ${argv.join(' ')}. Run hauler daemon status or check the daemon log.`}
      </ErrorState>
    ) : (
      <>
        <DataList
          fields={[
            { label: 'Ticket', value: result.ticket },
            { label: 'Attributed to', value: `${result.attribution.host}${result.attribution.session === null ? '' : ` / ${result.attribution.session}`}` },
            { label: 'Lineage', value: lineage === null ? null : lineageLine(lineage) },
            { label: 'Queue', value: requestQueueText(result) },
            {
              label: 'Waits for',
              value: result.waitingFor === undefined || result.waitingFor.length === 0 ? null : result.waitingFor.join(', '),
            },
          ]}
        />
        <Agent.Context>
          {result.waitingFor === undefined || result.waitingFor.length === 0
            ? `Ticket ${result.ticket} is running in the background. Continue other work. When the session has a hold-stop ticket, the stop hook waits for it. Read the result with ${names.result} ${result.ticket}, or block on it with ${names.await} ${result.ticket}.`
            : `Ticket ${result.ticket} is queued behind ${result.waitingFor.join(', ')} and starts once they finish. It fails with "prerequisite cc-N failed" if one of them fails or is killed. Read the result with ${names.result} ${result.ticket}, or block on it with ${names.await} ${result.ticket}.`}
        </Agent.Context>
      </>
    )}
  </Agent.Result>
);
