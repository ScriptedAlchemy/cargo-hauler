import { appendFileSync, mkdirSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname } from 'node:path';

const [socketPath, logPath, mode] = process.argv.slice(2);
if (
  socketPath === undefined ||
  logPath === undefined ||
  (mode !== 'idle-older' &&
    mode !== 'busy-older' &&
    mode !== 'incompatible-older' &&
    mode !== 'newer')
) {
  throw new Error(
    'usage: stale-daemon.mjs <socket> <log> <idle-older|busy-older|incompatible-older|newer>',
  );
}

mkdirSync(dirname(socketPath), { recursive: true });
rmSync(socketPath, { force: true });

const log = (message) => {
  appendFileSync(logPath, `${message}\n`);
};

const daemonVersion =
  mode === 'newer' ? '999.0.0' : mode === 'incompatible-older' ? '0.6.0' : '0.7.1';
const emptyHistogram = {
  buckets: [],
  count: 0,
  max: null,
  min: null,
  sum: 0,
};
const statusReport = () => ({
  active: [],
  kache: null,
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
        if (mode === 'idle-older') {
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
