import { createServer, type Server } from 'node:net';
import { join } from 'node:path';

import * as NodeSocket from '@effect/platform-node/NodeSocket';
import { describe, expect, it } from 'effect-rstest';
import * as Effect from 'effect/Effect';
import * as Socket from 'effect/unstable/socket/Socket';

import { scopedTempDir } from '../../support/harness.js';

/** A unix-socket peer that sends one line to each connection, then destroys it. */
const closingPeer = Effect.gen(function* () {
  const path = join(yield* scopedTempDir('hauler-node-socket-'), 'peer.sock');
  yield* Effect.acquireRelease(
    Effect.callback<Server>((resume) => {
      const server = createServer((conn) => {
        conn.write('{"type":"ack"}\n', () => conn.destroy());
      });
      server.listen(path, () => resume(Effect.succeed(server)));
    }),
    (server) => Effect.sync(() => server.close()),
  );
  return path;
});

describe('NodeSocket writes', () => {
  it.live('fail with SocketWriteError when the peer has already closed', () =>
    Effect.scoped(
      Effect.gen(function* () {
        const path = yield* closingPeer;
        const socket = yield* NodeSocket.makeNet({ path, openTimeout: 1_000 });
        const { write } = yield* socket.writer;
        const pull = yield* Socket.readerBytes(socket);
        yield* pull;
        yield* Effect.sleep('20 millis');
        const outcome = yield* write('{"type":"ping","id":"after-close"}\n').pipe(
          Effect.as('written'),
          Effect.catchTag('SocketError', (error) => Effect.succeed(error.reason._tag)),
          Effect.timeoutOrElse({ duration: '1 second', orElse: () => Effect.succeed('suspended') }),
        );
        expect(outcome).toBe('SocketWriteError');
      }),
    ));
});
