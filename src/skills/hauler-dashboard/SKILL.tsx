import { version } from 'agent-bundle/meta';
import React from 'react';

import { cliSurface, mcpSurface } from '../../internal/ui/documents/surface.js';
import { APP_RESOURCE_URI } from '../../constants.js';

/**
 * The build renders this component to `skills/hauler-dashboard/SKILL.md` for every host.
 * It reads the release version, the MCP App resource URI, and the tool and CLI spellings
 * from the sources the plugin ships, so the document cannot drift from the commands it describes.
 */
export const frontmatter = {
  description:
    'Explains how to open the cargo-hauler dashboard, read its panels, and diagnose contention from it. Use when opening, previewing, interpreting, or troubleshooting the dashboard, its metrics windows, admission state, lanes, kache data, or live ticket output.',
  name: 'hauler-dashboard',
};

const filters = ['--session', '--cwd', '--ticket', '--status', '--command-contains'] as const;

export default () => (
  <>
    <h1>hauler-dashboard</h1>
    <p>
      The dashboard shows machine-wide state for cargo-hauler {version}. To submit, scope, or wait on work, use
      the <code>cargo-hauler</code> skill.
    </p>
    <h2>Open it</h2>
    <ul>
      <li>
        <strong>In an MCP App host.</strong> Call <code>{mcpSurface.dashboard}</code>. Hosts that render MCP Apps
        attach <code>{APP_RESOURCE_URI}</code> beside its result. The text result is one summary line. To read the
        queue as text, call <code>{mcpSurface.status}</code>. It returns the daemon badge, admission meter, lane
        board, in-flight and recent tickets, and kache summary, and it never opens the App.
      </li>
      <li>
        <strong>In a plain browser.</strong> Run the installed plugin's <code>web</code> command,{' '}
        <code>node &lt;plugin root&gt;/bin/cargo-hauler.mjs web</code>. The plugin root is the directory that holds{' '}
        <code>agent-bundle.manifest.json</code>. In a checkout, the root is <code>artifact/</code>. The command
        serves the App standalone against the plugin's own <code>hauler</code> server, opens it, and stays in the
        foreground until Ctrl-C. The panels show the daemon's data and poll every five seconds. In the plugin
        checkout, <code>pnpm run dev</code> and the Workbench's MCP page preview <code>{APP_RESOURCE_URI}</code>{' '}
        the same way.
      </li>
    </ul>
    <h2>Read the panels</h2>
    <ul>
      <li>
        <strong>Contention.</strong> This panel shows machine load, CPU I/O wait, disk pressure, and admission
        permits. <code>3/5 +1 riding</code> means three running Cargo processes hold three of five permits, and one
        request is attached to existing work.
      </li>
      <li>
        <strong>In flight and Queue.</strong> These panels list active leaders and waiting tickets with their
        workspace, submitter, elapsed or wait time, and cost estimate.
      </li>
      <li>
        <strong>Metrics.</strong> Switch among <code>1h</code>, <code>24h</code>, and <code>all</code>. Run
        counts, outcomes, and percentiles use the selected window. Compute avoided, latency saved, and riders
        served are all-time totals from the SQLite ledger. Latency saved compares each rider's solo estimate with
        the time it spent attached to a started leader. Time spent behind a leader that had not started yet counts
        as lane wait, not as a cost of attaching. The total includes negative values, where the leader ran longer
        than the rider would have run alone. A batch rider credits no compute avoided, because its packages
        compiled inside the leader's run. Its solo run counts from after the leader's compile estimate.
      </li>
      <li>
        <strong>Queue wait vs run.</strong> For each window, this panel compares total queue wait with total
        leader run time and splits the wait by cause. <em>Lane-bound</em> is time when a leader in the same lane
        was still compiling, before its <code>Finished</code> line or exit. <em>Permit-bound</em> is time when
        every admission permit was in use and no compile in the same lane explains the wait. <em>Other</em> covers
        admission holds, <code>--after</code> prerequisites, and scheduling latency. The permit split assumes the
        daemon's current permit count, and the caption says so. The "lane time released by hand-back" stat is
        the execution time of test and run leaders that had already handed their lane to the next compile.
      </li>
      <li>
        <strong>By command.</strong> This panel shows run timings per subcommand and profile, each with its own
        n. The test, run, and bench commands execute after they build, so they add a compile-vs-exec line from
        the leaders that handed their lane back. Compile-only commands never add one, so{' '}
        <code>cargo check</code> shows none.
      </li>
      <li>
        <strong>Kache.</strong> This optional panel shows machine-wide cache freshness, active compile roots, and
        the slowest crates grouped by profile. It also compares store blob bytes with kache's{' '}
        <code>local_max_size</code>, which hauler reads from <code>KACHE_MAX_SIZE</code> or the kache config.
        When hauler cannot read the limit, the panel shows "limit unknown" with the reason. The panel also shows
        the last GC from <code>gc_stats.json</code>, any <code>skipping eviction</code> warnings matched from
        kache's logs, and the mean and p95 of <code>key_ms</code> from the events sidecar. Warnings appear when
        the store is over its limit or the last GC declined or skipped evictions. A missing panel means kache is
        unavailable or disabled. It does not mean the daemon failed.
      </li>
      <li>
        <strong>Lanes.</strong> This panel groups work by resolved <code>(workspace root, target dir)</code>.
        Only lanes with queued or running work are active.
      </li>
      <li>
        <strong>History.</strong> This panel lists finished tickets and the command each request ran as,
        including composite batch expansion.
      </li>
    </ul>
    <p>
      Click an in-flight row to open its live output drawer. The drawer refreshes every three seconds. Completed
      and queued rows show their state from the durable ledger.
    </p>
    <h2>Diagnose contention</h2>
    <ol>
      <li>Check the admission meter before you assume the daemon is stalled.</li>
      <li>Match queued work to its lane and current leader.</li>
      <li>
        Filter with <code>{cliSurface.status}</code>{' '}
        {filters.map((flag, index) => (
          <React.Fragment key={flag}>
            {index === 0 ? '' : ', '}
            <code>{flag}</code>
          </React.Fragment>
        ))}
        , or with the matching structured fields of <code>{mcpSurface.status}</code>. Do not poll{' '}
        <code>ps</code> in place of the dashboard.
      </li>
      <li>
        Await or attach to the ticket with <code>{mcpSurface.await}</code> or <code>{cliSurface.await}</code>. Do
        not kill Cargo to clear a lane.
      </li>
    </ol>
  </>
);
