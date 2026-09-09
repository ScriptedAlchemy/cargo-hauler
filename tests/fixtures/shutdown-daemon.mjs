import { mkdirSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname } from 'node:path';

const [socketPath, mode] = process.argv.slice(2);
const modes = new Set([
  'acknowledged',
  'acknowledged-stubborn',
  'refused',
  'silent',
  'internal',
  'bad-message',
  'disconnect',
  'probe-silent',
  'probe-disconnect',
]);
if (socketPath === undefined || mode === undefined || !modes.has(mode)) {
  throw new Error('usage: shutdown-daemon.mjs <socket> <mode>');
}

mkdirSync(dirname(socketPath), { recursive: true });
rmSync(socketPath, { force: true });

const server = createServer((socket) => {
  let buffered = '';
  socket.setEncoding('utf8');
  socket.on('data', (chunk) => {
    buffered += chunk;
    for (;;) {
      const newline = buffered.indexOf('\n');
      if (newline === -1) return;
      const line = buffered.slice(0, newline);
      buffered = buffered.slice(newline + 1);
      const message = JSON.parse(line);
      if (message.type === 'ping') {
        if (mode === 'probe-silent') continue;
        if (mode === 'probe-disconnect') {
          socket.destroy();
          continue;
        }
        socket.write(`${JSON.stringify({
          id: message.id,
          pid: process.pid,
          startedAtMs: 1,
          type: 'pong',
          version: '999.0.0',
        })}\n`);
        continue;
      }
      if (message.type !== 'shutdown') continue;
      switch (mode) {
        case 'acknowledged':
          socket.end(
            `${JSON.stringify({ id: message.id, type: 'shutting-down' })}\n`,
            () => server.close(() => process.exit(0)),
          );
          break;
        case 'acknowledged-stubborn':
          socket.write(`${JSON.stringify({ id: message.id, type: 'shutting-down' })}\n`);
          break;
        case 'refused':
          socket.write(`${JSON.stringify({
            id: message.id,
            type: 'error',
            code: 'shutdown-refused',
            message: 'fixture refused shutdown',
          })}\n`);
          break;
        case 'silent':
          break;
        case 'internal':
        case 'bad-message':
          socket.write(`${JSON.stringify({
            id: message.id,
            type: 'error',
            code: mode,
            message: `fixture ${mode} error`,
          })}\n`);
          break;
        case 'disconnect':
          socket.destroy();
          break;
        default:
          throw new Error(`unhandled mode: ${mode}`);
      }
    }
  });
});

server.listen(socketPath, () => {
  process.stdout.write('ready\n');
});
