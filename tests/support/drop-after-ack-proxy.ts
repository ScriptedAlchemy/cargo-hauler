import { connect, createServer, type Server, type Socket } from 'node:net';

import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import type * as Scope from 'effect/Scope';

import type { ClientMessage, ServerMessage } from '../../src/internal/contracts/protocol.js';
import { LineBuffer } from '../../src/internal/platform/ndjson.js';

class DropProxyError extends Data.TaggedError('DropProxyError')<{
  readonly cause: unknown;
}> {}

export interface DropAfterAckProxy {
  readonly dropped: Promise<string>;
  readonly messages: () => readonly ClientMessage[];
}

interface DropProxyResource extends DropAfterAckProxy {
  readonly server: Server;
  readonly sockets: Set<Socket>;
}

/** Forward one exec ack, drop that transport, then pass reconnects through. */
export const dropAfterAckProxy = (
  daemonSocketPath: string,
  socketPath: string,
): Effect.Effect<DropAfterAckProxy, DropProxyError, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.tryPromise({
      try: () =>
        new Promise<DropProxyResource>((resolvePromise, reject) => {
          const messages: ClientMessage[] = [];
          const sockets = new Set<Socket>();
          let dropped = false;
          let resolveDropped: (ticket: string) => void = () => undefined;
          const droppedPromise = new Promise<string>((resolve) => {
            resolveDropped = resolve;
          });
          const server = createServer((client) => {
            const upstream = connect(daemonSocketPath);
            sockets.add(client);
            sockets.add(upstream);
            const clientLines = new LineBuffer();
            const serverLines = new LineBuffer();
            client.on('data', (chunk) => {
              for (const line of clientLines.push(chunk)) {
                messages.push(JSON.parse(line) as ClientMessage);
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
                if (message.type === 'ack') {
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
              dropped: droppedPromise,
              messages: () => messages,
              server,
              sockets,
            });
          });
        }),
      catch: (cause) => new DropProxyError({ cause }),
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
  ).pipe(Effect.map(({ dropped, messages }) => ({ dropped, messages })));
