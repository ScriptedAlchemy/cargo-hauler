import type { LaneStatus, StatusQuery, TicketSummary } from '../contracts/protocol.js';
import { commandDisplay } from '../ui/shared/format.js';

import type { DaemonStatus } from '../contracts/tool-schemas.js';

export const hasStatusFilters = (input: StatusQuery): boolean =>
  input.cwd !== undefined ||
  input.session !== undefined ||
  input.laneKey !== undefined ||
  input.tickets !== undefined ||
  input.statuses !== undefined ||
  input.commandContains !== undefined;

export const filterStatusRows = <Row extends TicketSummary>(
  rows: readonly Row[],
  input: StatusQuery,
): readonly Row[] => {
  const tickets = input.tickets === undefined ? null : new Set(input.tickets);
  const statuses = input.statuses === undefined ? null : new Set(input.statuses);
  return rows.filter(
    (row) =>
      (input.cwd === undefined || row.cwd === input.cwd) &&
      (input.session === undefined || row.session === input.session) &&
      (input.laneKey === undefined || row.laneKey === input.laneKey) &&
      (tickets === null || tickets.has(row.ticket)) &&
      (statuses === null || statuses.has(row.status)) &&
      (input.commandContains === undefined ||
        row.argv.join(' ').includes(input.commandContains)),
  );
};

export const filterStatusLanes = (
  lanes: readonly LaneStatus[],
  rows: readonly TicketSummary[],
  blockers: readonly TicketSummary[] = [],
): readonly LaneStatus[] => {
  const keys = new Set([...rows, ...blockers].map((row) => row.laneKey));
  return lanes.filter((lane) => keys.has(lane.key));
};

export const statusBlockerTickets = (rows: readonly TicketSummary[]): readonly string[] =>
  [...new Set(rows.flatMap((row) => [
    ...(row.queue?.headTicket === undefined ? [] : [row.queue.headTicket]),
    ...(row.waitingFor?.map((prerequisite) => prerequisite.ticket) ?? []),
    ...(row.attachedTo === null ? [] : [row.attachedTo]),
  ]))];

export const boundedStatusQueue = <Row extends TicketSummary>(row: Row): Row =>
  row.queue === undefined || row.queue.aheadTickets.length <= 20 ? row : {
    ...row,
    queue: { ...row.queue, aheadTickets: row.queue.aheadTickets.slice(0, 20), aheadTicketsTotal: row.queue.aheadTicketsTotal ?? row.queue.aheadTickets.length },
  };

const daemonHeader = (daemon: DaemonStatus): string => {
  switch (daemon) {
    case 'running':
      return 'cargo-hauler daemon is running';
    case 'stopped':
      return 'cargo-hauler daemon is not running';
    case 'unresponsive':
      return 'cargo-hauler daemon is unresponsive (showing ledger data)';
    case 'skewed':
      return 'cargo-hauler daemon is running but its status report is unreadable (showing ledger data)';
    default: {
      const exhaustive: never = daemon;
      return exhaustive;
    }
  }
};

export const statusSummary = (
  daemon: DaemonStatus,
  active: readonly TicketSummary[],
  recent: readonly TicketSummary[],
): string => {
  const commandLimit = 160;
  const header = `${daemonHeader(daemon)}; ${active.length} active, ${recent.length} recent`;
  if (active.length === 0) {
    return header;
  }
  return [
    header,
    ...active.map((row) => {
      const fullCommand = commandDisplay(row.argv);
      const command =
        fullCommand.length <= commandLimit
          ? fullCommand
          : `${fullCommand.slice(0, commandLimit - 1)}…`;
      const location = row.session ?? row.cwd;
      return `${row.ticket} ${row.status} ${command} (${location})`;
    }),
  ].join('\n');
};
