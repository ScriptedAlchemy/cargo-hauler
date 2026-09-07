import type { AppRouteResult } from 'agent-bundle/app';

import type {
  DashboardRequestRow,
  DashboardStatusResult,
} from '../src/mcp/hauler/apps/dashboard.js';

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
    (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false;
type Assert<Value extends true> = Value;

type StatusResult = AppRouteResult<'tool:hauler/hauler_status'>;

type _StatusResultIsGenerated = Assert<Equal<DashboardStatusResult, StatusResult>>;
type _RequestRowIsGenerated = Assert<
  Equal<DashboardRequestRow, StatusResult['active'][number]>
>;
