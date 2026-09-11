import { Agent } from '@agent-bundle/runtime';
import React from 'react';

import { APP_RESOURCE_URI } from '../../../constants.js';

import type { SurfaceNames } from './surface.js';

export interface DashboardLinkProps {
  readonly names: SurfaceNames;
}

/**
 * Where the live dashboard is. Deliberately a context line, not an
 * `Agent.Resource` block: the App is attached to `hauler_dashboard` through
 * its `_meta.ui.resourceUri`, and hosts that cannot render MCP Apps must not
 * fail the whole document over a resource link they cannot show.
 */
export const DashboardLink = ({ names }: DashboardLinkProps) => (
  <Agent.Context>
    {`Dashboard: ${APP_RESOURCE_URI} — ${names.dashboard} opens it on hosts that render MCP Apps; elsewhere run the browser preview (see the hauler-dashboard skill).`}
  </Agent.Context>
);
