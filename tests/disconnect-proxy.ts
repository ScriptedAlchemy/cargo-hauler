import { connect, createServer, type Server, type Socket } from 'node:net';
import { join } from 'node:path';

import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import type * as Scope from 'effect/Scope';

import type { DaemonConfigShape } from '../src/daemon/config.js';
import type { ClientMessage, ServerMessage } from '../src/daemon/protocol.js';
import { LineBuffer } from '../src/lib/ndjson.js';

class DisconnectProxyError extends Data.TaggedError('DisconnectProxyError')<{
  readonly cause: unknown;
}> {}

export interface DisconnectProxy {
  readonly config: DaemonConfigShape;
  readonly dropped: Promise<string>;
  readonly messages: () => readonly ClientMessage[];
  readonly reattached: Promise<void>;
}

interface DisconnectProxyResource extends DisconnectProxy {
  readonly server: Server;
  readonly sockets: Set<Socket>;
}

export const disconnectOnceProxy = (
  config: DaemonConfigShape,
  trigger: 'ack' | 'started',
  socketPath = join(config.stateDir, `disconnect-${trigger}.sock`),
): Effect.Effect<DisconnectProxy, DisconnectProxyError, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.tryPromise({
      try: () =>
        new Promise<DisconnectProxyResource>((resolvePromise, reject) => {
          const messages: ClientMessage[] = [];
          const sockets = new Set<Socket>();
          let dropped = false;
          let resolveDropped: (ticket: string) => void = () => undefined;
          let resolveReattached: () => void = () => undefined;
          const droppedPromise = new Promise<string>((resolve) => {
            resolveDropped = resolve;
          });
          const reattached = new Promise<void>((resolve) => {
            resolveReattached = resolve;
          });
          const server = createServer((client) => {
            const upstream = connect(config.socketPath);
            sockets.add(client);
            sockets.add(upstream);
            const clientLines = new LineBuffer();
            const serverLines = new LineBuffer();
            client.on('data', (chunk) => {
              for (const line of clientLines.push(chunk)) {
                const message = JSON.parse(line) as ClientMessage;
                messages.push(message);
                if (message.type === 'await' && message.reattach === true) {
                  resolveReattached();
                }
              }
              upstream.write(chunk);
            });
            upstream.on('data', (chunk) => {
              if (dropped) {
                client.write(chunk);
                return;
              }
              for (const line of serverLines.push(chunk)) {
                const message = JSON.parse(line) as ServerMessage;
                const encoded = `${line}\n`;
                if (message.type === trigger) {
                  dropped = true;
                  upstream.pause();
                  client.write(encoded, () => {
                    resolveDropped(message.ticket);
                    client.destroy();
                    upstream.destroy();
                  });
                  return;
                }
                client.write(encoded);
              }
            });
            client.on('error', () => undefined);
            upstream.on('error', () => client.destroy());
            client.on('close', () => {
              sockets.delete(client);
              upstream.destroy();
            });
            upstream.on('close', () => {
              sockets.delete(upstream);
              client.destroy();
            });
          });
          server.once('error', reject);
          server.listen(socketPath, () => {
            resolvePromise({
              config: { ...config, socketPath },
              dropped: droppedPromise,
              messages: () => messages,
              reattached,
              server,
              sockets,
            });
          });
        }),
      catch: (cause) => new DisconnectProxyError({ cause }),
    }),
    (resource) =>
      Effect.promise(
        () =>
          new Promise<void>((resolvePromise) => {
            for (const socket of resource.sockets) {
              socket.destroy();
            }
            resource.server.close(() => resolvePromise());
          }),
      ),
  ).pipe(
    Effect.map(({ config: proxyConfig, dropped, messages, reattached }) => ({
      config: proxyConfig,
      dropped,
      messages,
      reattached,
    })),
  );
