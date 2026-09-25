import { appendFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname } from 'node:path';

const [socketPath, logPath, mode] = process.argv.slice(2);
if (
  socketPath === undefined ||
  logPath === undefined ||
  (mode !== 'idle-older' &&
    mode !== 'busy-older' &&
    mode !== 'incompatible-older' &&
    mode !== 'newer' &&
    mode !== 'newer-compatible' &&
    mode !== 'skewed-older' &&
    mode !== 'skewed-same' &&
    mode !== 'skewed-newer')
) {
  throw new Error(
    'usage: stale-daemon.mjs <socket> <log> <idle-older|busy-older|incompatible-older|newer|newer-compatible|skewed-older|skewed-same|skewed-newer>',
  );
}

mkdirSync(dirname(socketPath), { recursive: true });
rmSync(socketPath, { force: true });

const log = (message) => {
  appendFileSync(logPath, `${message}\n`);
};

const daemonVersion = mode === 'skewed-same'
  ? JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version
  : mode.startsWith('newer') || mode === 'skewed-newer'
    ? '999.0.0'
    : mode === 'incompatible-older'
      ? '0.6.0'
      : '0.7.1';
// 0.9.7 reported kache readiness as `available`; 0.9.8 reads `indexState`.
const olderKache = {
  available: true,
  distinctCrates: 0,
  entryCount: 0,
  eventsFreshMs: null,
  indexSizeBytes: 0,
  pressure: {
    gc: { kind: 'unavailable', reason: 'missing' },
    keyTiming: null,
    limit: { detail: '', kind: 'unknown', reason: 'not-configured' },
    storeBytes: null,
  },
  recentHeartbeatRoots: [],
  topCrates: [],
};
const emptyHistogram = {
  buckets: [],
  count: 0,
  max: null,
  min: null,
  sum: 0,
};
const statusReport = () => ({
  active: [],
  kache: mode.startsWith('skewed') ? olderKache : null,
  lanes:
    mode === 'busy-older'
      ? [
          {
            executingTickets: [],
            key: '["/fixture","/fixture/target"]',
            queued: 1,
            runningTicket: null,
            targetDir: '/fixture/target',
            workspaceRoot: '/fixture',
          },
        ]
      : [],
  maxConcurrent: 1,
  metrics: {
    attach_mode: {},
    attach_rejections: {},
    cargo_run_ms: emptyHistogram,
    cargo_run_ms_by_kind: {},
    job_outcome: {},
    wait_ms_summary: { count: 0, max: null, min: null, quantiles: [], sum: 0 },
    windows: [],
  },
  pid: process.pid,
  recent: [],
  savings: {
    byMode: [],
    totals: {
      negativeLatencyRiders: 0,
      ridersServed: 0,
      savedComputeEstimatedMs: 0,
      savedComputeExactMs: 0,
      savedComputeMs: 0,
      savedLatencyMs: 0,
    },
  },
  socketPath,
  startedAtMs: 1,
  system: {
    clampThresholdPerCore: null,
    cores: 1,
    loadAvg1: 0,
    memClamp: 'none',
  },
  version: daemonVersion,
});

const server = createServer((socket) => {
  let buffered = '';
  socket.setEncoding('utf8');
  socket.on('data', (chunk) => {
    buffered += chunk;
    for (;;) {
      const newline = buffered.indexOf('\n');
      if (newline === -1) {
        return;
      }
      const line = buffered.slice(0, newline);
      buffered = buffered.slice(newline + 1);
      const message = JSON.parse(line);
      log(message.type);
      if (message.type === 'ping') {
        socket.write(`${JSON.stringify({
          id: message.id,
          pid: process.pid,
          ...(mode === 'newer'
            ? {}
            : { protocol: mode === 'incompatible-older' ? 2 : 1 }),
          startedAtMs: 1,
          type: 'pong',
          version: daemonVersion,
        })}\n`);
      } else if (message.type === 'status') {
        socket.write(`${JSON.stringify({
          id: message.id,
          report: statusReport(),
          type: 'status-result',
        })}\n`);
      } else if (message.type === 'result' && mode.startsWith('skewed')) {
        socket.write(`${JSON.stringify({
          id: message.id,
          request: { status: 'done', ticket: message.ticket },
          type: 'result-result',
        })}\n`);
      } else if (message.type === 'exec') {
        socket.write(`${JSON.stringify({
          id: message.id,
          laneKey: '["/fixture","/fixture/target"]',
          position: 0,
          ticket: 'cc-old',
          type: 'ack',
        })}\n`);
        if (!message.background) {
          socket.write(`${JSON.stringify({
            id: message.id,
            runMs: 0,
            signal: null,
            status: 'done',
            ticket: 'cc-old',
            type: 'exit',
            waitMs: 0,
            error: null,
            exitCode: 0,
          })}\n`);
        }
      } else if (message.type === 'shutdown') {
        if (mode === 'idle-older' || mode === 'skewed-older') {
          socket.write(`${JSON.stringify({ id: message.id, type: 'shutting-down' })}\n`);
          server.close(() => process.exit(0));
        } else {
          socket.write(`${JSON.stringify({
            code: 'shutdown-refused',
            id: message.id,
            message: 'fixture refused shutdown',
            type: 'error',
          })}\n`);
        }
      }
    }
  });
});

server.listen(socketPath, () => {
  process.stdout.write('ready\n');
});
