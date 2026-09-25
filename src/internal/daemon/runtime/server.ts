import { randomUUID } from 'node:crypto';

import * as Cause from 'effect/Cause';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Queue from 'effect/Queue';
import * as Result from 'effect/Result';
import type * as Scope from 'effect/Scope';
import * as Socket from 'effect/unstable/socket/Socket';

import { isRecord } from '../../util/guards.js';
import { LineBufferOverflowError } from '../../platform/ndjson.js';
import { compareVersions } from '../../contracts/version-order.js';

import type { BrokerApi } from '../broker/broker.js';
import type { SubmitCallbacks } from '../broker/job-state.js';
import type {
  ClientMessage,
  ExecRequest,
  OutputMessage,
  ReattachRequest,
  ServerMessage,
} from '../../contracts/protocol.js';
import { clientMessageSchema, encodeServerMessage } from '../../contracts/protocol.js';
import { wireProtocol } from '../../contracts/wire-version.js';
import { LineBuffer } from '../../platform/ndjson.js';

export interface ConnectionHandlerOptions {
  readonly broker: BrokerApi;
  readonly shutdownLatch: Deferred.Deferred<void>;
  readonly startedAtMs: number;
  readonly version: string;
  /** Largest NDJSON line accepted from a client before the connection is closed (default 16 MiB). */
  readonly maxLineBytes?: number;
}

export interface ConnectionOutputBufferOptions {
  /** Output cost kept for a peer that is still accepting writes but has fallen behind. */
  readonly maxOutputBytes: number;
  /** Output cost kept once a write has waited `stallMs` on the peer. */
  readonly stalledOutputBytes: number;
  readonly stallMs: number;
}

interface BufferedServerMessage {
  readonly message: ServerMessage;
  readonly outputBytes: number;
}

/** Heap and framing one queued output message costs beyond its base64 payload. */
const outputMessageOverheadBytes = 256;

/** Largest frame one write carries, so a pending write measures recent peer progress. */
const maxFrameBytes = 64 * 1024;

const outputCost = (message: OutputMessage): number =>
  message.data.length + outputMessageOverheadBytes;

/** Decoded size of a base64 payload; `Buffer.byteLength` costs a native call per message. */
const payloadBytes = (data: string): number => {
  const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0;
  return ((data.length - padding) * 3) >>> 2;
};

/** Output cost reserved for the truncation notice, whose text is rendered only when it is written. */
const noticeCostBytes = outputMessageOverheadBytes + 512;

const defaultOutputBufferOptions: ConnectionOutputBufferOptions = {
  maxOutputBytes: 64 * 1024 * 1024,
  stalledOutputBytes: 1024 * 1024,
  stallMs: 2_000,
};

/**
 * FIFO connection buffer with a bounded bulk-output portion. Output queued
 * between two writer turns is always kept. While a write waits on the peer,
 * output is kept up to `maxOutputBytes`; once that write has waited `stallMs`
 * the peer counts as stalled and keeps only `stalledOutputBytes`. Control and
 * terminal messages are always retained; overflow replaces output with one
 * ordinary stderr output message, so the truncation note needs no message
 * type of its own.
 */
export class ConnectionOutputBuffer {
  readonly #options: ConnectionOutputBufferOptions;
  readonly #pending: BufferedServerMessage[] = [];
  #writeStartedAtMs: number | null = null;
  #bufferedOutputBytes = 0;
  #droppedPayloadBytes = 0;
  #truncation: { readonly message: OutputMessage; readonly outputBytes: number } | null = null;

  constructor(options: ConnectionOutputBufferOptions = defaultOutputBufferOptions) {
    this.#options = options;
  }

  get bufferedOutputBytes(): number {
    return this.#bufferedOutputBytes;
  }

  get size(): number {
    return this.#pending.length;
  }

  offer(message: ServerMessage): boolean {
    const wasEmpty = this.#pending.length === 0;
    if (message.type !== 'output') {
      this.#pending.push({ message, outputBytes: 0 });
      return wasEmpty;
    }
    const outputBytes = outputCost(message);
    const limit = this.#outputLimit();
    if (this.#bufferedOutputBytes + outputBytes <= limit) {
      this.#pending.push({ message, outputBytes });
      this.#bufferedOutputBytes += outputBytes;
      return wasEmpty;
    }
    this.#recordDrop(message, limit);
    return wasEmpty;
  }

  /** Writes the oldest queued messages as one frame of at most about `maxFrameBytes`. */
  flush<E>(write: (frame: string) => Effect.Effect<void, E>): Effect.Effect<void, E> {
    return Effect.suspend(() => {
      const frame = this.#takeFrame();
      if (frame === '') {
        return Effect.void;
      }
      this.#writeStartedAtMs = performance.now();
      return write(frame).pipe(
        Effect.ensuring(
          Effect.sync(() => {
            this.#writeStartedAtMs = null;
          }),
        ),
      );
    });
  }

  #outputLimit(): number {
    const startedAtMs = this.#writeStartedAtMs;
    if (startedAtMs === null) {
      return Number.POSITIVE_INFINITY;
    }
    return performance.now() - startedAtMs >= this.#options.stallMs
      ? this.#options.stalledOutputBytes
      : this.#options.maxOutputBytes;
  }

  #takeFrame(): string {
    let frame = '';
    let taken = 0;
    const truncation = this.#truncation;
    for (const envelope of this.#pending) {
      if (frame.length >= maxFrameBytes) {
        break;
      }
      this.#bufferedOutputBytes -= envelope.outputBytes;
      if (envelope === truncation) {
        frame += encodeServerMessage(this.#renderNotice(truncation.message));
        this.#truncation = null;
        this.#droppedPayloadBytes = 0;
      } else {
        frame += encodeServerMessage(envelope.message);
      }
      taken += 1;
    }
    this.#pending.splice(0, taken);
    return frame;
  }

  #recordDrop(message: OutputMessage, limit: number): void {
    this.#droppedPayloadBytes += payloadBytes(message.data);
    if (this.#truncation === null) {
      this.#truncation = {
        message: { type: 'output', id: message.id, ticket: message.ticket, channel: 'stderr', cursorBytes: 0, data: '' },
        outputBytes: noticeCostBytes,
      };
      this.#pending.push(this.#truncation);
      this.#bufferedOutputBytes += noticeCostBytes;
    }
    if (this.#bufferedOutputBytes > limit) {
      this.#keepPrefixWithin(limit);
    }
  }

  /**
   * Keeps the longest run of oldest output that fits `limit` beside the
   * notice and drops the newer output in one pass: a stall can lower the
   * limit under a queue of tens of MiB.
   * ponytail: one pass over at most maxOutputBytes / 256 queued entries; a
   * running payload counter plus a control-message count would make the
   * cut O(1).
   */
  #keepPrefixWithin(limit: number): void {
    const pending = this.#pending;
    let kept = noticeCostBytes;
    let cut = 0;
    for (; cut < pending.length; cut += 1) {
      const envelope = pending[cut];
      if (envelope === undefined || envelope === this.#truncation) {
        continue;
      }
      if (kept + envelope.outputBytes > limit) {
        break;
      }
      kept += envelope.outputBytes;
    }
    for (const envelope of pending.splice(cut)) {
      if (envelope.message.type === 'output' && envelope !== this.#truncation) {
        this.#droppedPayloadBytes += payloadBytes(envelope.message.data);
      } else {
        pending.push(envelope);
      }
    }
    this.#bufferedOutputBytes = kept;
  }

  #renderNotice(message: OutputMessage): OutputMessage {
    return {
      ...message,
      data: Buffer.from(
        `[cargo-hauler] output truncated: client fell behind; ${this.#droppedPayloadBytes} bytes dropped; full output: hauler result ${message.ticket} --full\n`,
      ).toString('base64'),
    };
  }
}

const extractId = (value: unknown): string | null => {
  if (!isRecord(value)) {
    return null;
  }
  return typeof value.id === 'string' ? value.id : null;
};

/**
 * One fiber per connection. Inbound lines are dispatched off the read pump
 * (exec submissions and long-poll awaits fork) so suspending work never blocks
 * kill/status messages arriving on the same socket. Outbound messages flow
 * through a queue with a single writer fiber, keeping NDJSON lines whole under
 * concurrency.
 */
export const makeConnectionHandler =
  (options: ConnectionHandlerOptions) =>
  (socket: Socket.Socket): Effect.Effect<void> =>
    Effect.scoped(
      Effect.gen(function* () {
        const ownerId = randomUUID();
        const { write } = yield* socket.writer;
        const outbound = new ConnectionOutputBuffer();
        const outboundWake = yield* Queue.dropping<void>(1);
        const connection = { closed: false };
        const ownTickets = new Set<string>();

        // Jobs outlive connections by design (results stay retrievable from
        // the ledger), so sends become no-ops once the peer is gone. The
        // wake queue is never shut down and has dropping capacity one:
        // offers never block or interrupt a lane worker delivering output.
        const send = (message: ServerMessage): Effect.Effect<void> =>
          Effect.uninterruptible(
            Effect.gen(function* () {
              const shouldWake = yield* Effect.sync(() => {
                if (connection.closed) {
                  return false;
                }
                return outbound.offer(message);
              });
              if (shouldWake) {
                yield* Queue.offer(outboundWake, undefined);
              }
            }),
          );

        const recoverHandlerDefect =
          (id: string | null, handler: string) =>
          (cause: Cause.Cause<unknown>): Effect.Effect<void> =>
            Cause.hasInterruptsOnly(cause)
              ? Effect.interrupt
              : Effect.logError(`daemon ${handler} failed`, cause).pipe(
                  Effect.andThen(
                    id === null
                      ? Effect.void
                      : send({
                          type: 'error',
                          id,
                          code: 'internal',
                          message: 'internal daemon error',
                        }),
                  ),
                );

        yield* Effect.forkChild(
          Effect.forever(
            Effect.suspend(() =>
              outbound.size === 0 ? Queue.take(outboundWake) : outbound.flush(write),
            ),
          ).pipe(
            Effect.catchCause(() =>
              Effect.sync(() => {
                connection.closed = true;
              }),
            ),
          ),
        );

        /**
         * The streaming callbacks for a ticket this connection owns, keyed by
         * the request id the client will match replies on. `background`
         * requests are never owned: nobody streams their exit.
         */
        const streamCallbacks = (id: string, background: boolean): SubmitCallbacks => ({
          ...(background ? {} : { ownerId }),
          onRegistered: (ticket) =>
            Effect.sync(() => {
              if (background) {
                return true;
              }
              if (connection.closed) {
                return false;
              }
              ownTickets.add(ticket);
              return true;
            }),
          onStarted: (info) =>
            send({ type: 'started', id, ticket: info.ticket, waitMs: info.waitMs }),
          onOutput: (info) =>
            send({
              type: 'output',
              id,
              ticket: info.ticket,
              channel: info.channel,
              data: info.data,
              ...(info.cursorBytes === undefined ? {} : { cursorBytes: info.cursorBytes }),
            }),
          onExit: (info) =>
            Effect.gen(function* () {
              yield* Effect.sync(() => ownTickets.delete(info.ticket));
              yield* send({
                type: 'exit',
                id,
                ticket: info.ticket,
                status: info.status,
                exitCode: info.exitCode,
                signal: info.signal,
                waitMs: info.waitMs,
                runMs: info.runMs,
                error: info.error,
              });
            }),
          onRequeued: (info) =>
            send({
              type: 'requeued',
              id,
              ticket: info.ticket,
              reason: info.reason,
            }),
        });

        const handleExec = (message: ExecRequest): Effect.Effect<void> =>
          Effect.gen(function* () {
            const submitted = yield* Effect.result(
              options.broker.submit(
                {
                  argv: message.argv,
                  cwd: message.cwd,
                  workspaceRoot: message.workspaceRoot,
                  env: message.env,
                  session: message.session,
                  host: message.host,
                  background: message.background,
                  holdStop: message.holdStop,
                  mergeStderr: message.mergeStderr,
                  after: message.after,
                  allowSharedTarget: message.allowSharedTarget,
                },
                streamCallbacks(message.id, message.background === true),
              ),
            );
            if (submitted._tag === 'Failure') {
              yield* send({
                type: 'error',
                id: message.id,
                code: 'bad-intent',
                message: submitted.failure.message,
              });
              return;
            }
            // `SubmitResult` is the ack's payload key for key; the broker
            // already omits every optional it did not set.
            yield* send({ type: 'ack', id: message.id, ...submitted.success });
          });

        // Forked like exec: the replay of a large buffer must not hold up a
        // kill arriving on the same socket.
        const handleReattach = (message: ReattachRequest): Effect.Effect<void> =>
          Effect.gen(function* () {
            const outcome = yield* options.broker.reattach(message.ticket, {
              callbacks: streamCallbacks(message.id, false),
              fromByte: message.fromByte ?? 0,
              onActive: (info) =>
                send({
                  type: 'reattach-result',
                  id: message.id,
                  ticket: message.ticket,
                  outcome: 'active',
                  state: info.state,
                  ...(info.attachedTo === undefined ? {} : { attachedTo: info.attachedTo }),
                  missedBytes: info.missedBytes,
                  outputPath: info.outputPath,
                }),
            });
            switch (outcome.kind) {
              case 'active':
                return;
              case 'terminal':
                yield* send({
                  type: 'reattach-result',
                  id: message.id,
                  ticket: message.ticket,
                  outcome: 'terminal',
                  request: outcome.record,
                });
                return;
              case 'unknown':
                yield* send({
                  type: 'reattach-result',
                  id: message.id,
                  ticket: message.ticket,
                  outcome: 'unknown',
                });
                return;
              default: {
                const exhaustive: never = outcome;
                return exhaustive;
              }
            }
          });

        const handleMessage = (message: ClientMessage): Effect.Effect<void, never, Scope.Scope> => {
          switch (message.type) {
            case 'exec':
              return Effect.asVoid(
                Effect.forkScoped(
                  handleExec(message).pipe(
                    Effect.catchCause(recoverHandlerDefect(message.id, 'exec handler')),
                  ),
                ),
              );
            case 'attempt':
              return Effect.gen(function* () {
                const recorded = yield* options.broker.recordAttempt({
                  argv: message.argv,
                  cwd: message.cwd,
                  host: message.host,
                  reason: message.reason,
                  session: message.session,
                });
                yield* send({
                  type: 'attempt-recorded',
                  id: message.id,
                  ticket: recorded.ticket,
                });
              });
            case 'kill':
              return Effect.gen(function* () {
                const killed = yield* options.broker.kill(message.ticket);
                yield* send({ type: 'kill-result', id: message.id, ticket: message.ticket, killed });
              });
            case 'status':
              return Effect.gen(function* () {
                const report = yield* options.broker.report(message.limit);
                yield* send({
                  type: 'status-result',
                  id: message.id,
                  report: { ...report, version: options.version },
                });
              });
            case 'ping':
              return send({
                type: 'pong',
                id: message.id,
                pid: process.pid,
                protocol: wireProtocol,
                startedAtMs: options.startedAtMs,
                version: options.version,
              });
            case 'detach':
              return Effect.gen(function* () {
                const detached = ownTickets.delete(message.ticket);
                // Recorded even when this connection never owned the ticket:
                // the client is telling us nobody will stream its exit.
                yield* options.broker.detach(message.ticket);
                yield* send({
                  type: 'detach-result',
                  id: message.id,
                  ticket: message.ticket,
                  detached,
                });
              });
            case 'await':
              return Effect.asVoid(
                Effect.forkScoped(
                  Effect.gen(function* () {
                    const waited = yield* options.broker.awaitTicket(
                      message.ticket,
                      message.maxWaitMs ?? 30_000,
                    );
                    yield* send({
                      type: 'await-result',
                      id: message.id,
                      request: waited.record,
                      timedOut: waited.timedOut,
                    });
                  }).pipe(
                    Effect.catchCause(recoverHandlerDefect(message.id, 'await handler')),
                  ),
                ),
              );
            case 'result':
              return Effect.gen(function* () {
                const request = yield* options.broker.getTicket(message.ticket);
                yield* send({ type: 'result-result', id: message.id, request });
              });
            case 'reattach':
              return Effect.asVoid(
                Effect.forkScoped(
                  handleReattach(message).pipe(
                    Effect.catchCause(recoverHandlerDefect(message.id, 'reattach handler')),
                  ),
                ),
              );
            case 'session-pending':
              return Effect.gen(function* () {
                const requests = yield* options.broker.sessionPending(message.session);
                yield* send({
                  type: 'session-pending-result',
                  id: message.id,
                  requests,
                });
              });
            case 'session-completed':
              return Effect.gen(function* () {
                const requests = yield* options.broker.sessionCompleted(
                  message.session,
                  message.sinceMs,
                );
                yield* send({
                  type: 'session-completed-result',
                  id: message.id,
                  requests,
                });
              });
            case 'shutdown': {
              return Effect.gen(function* () {
                // Replacement is directional: a client older than this daemon,
                // or one that sends no version (every build before the field),
                // is a long-lived session on a previous plugin. It must not
                // take the current install's daemon down, or the two installs
                // replace each other on every hook call.
                const requester = message.version ?? null;
                if (requester === null || compareVersions(requester, options.version) < 0) {
                  return yield* send({
                    type: 'error',
                    id: message.id,
                    code: 'shutdown-refused',
                    message: `shutdown refused: this daemon is ${options.version} and the requesting client is ${requester ?? 'unversioned (older)'}; only a newer install replaces a daemon — upgrade that client, or stop the daemon with \`hauler daemon stop\` from this install`,
                  });
                }
                if (message.ifIdle === true) {
                  const mayRetire = yield* options.broker.prepareRetirement(
                    write(
                      encodeServerMessage({ type: 'shutting-down', id: message.id }),
                    ).pipe(
                      Effect.ignore,
                      Effect.andThen(Deferred.succeed(options.shutdownLatch, undefined)),
                      Effect.asVoid,
                    ),
                  );
                  if (!mayRetire) {
                    return yield* send({
                      type: 'error',
                      id: message.id,
                      code: 'shutdown-refused',
                      message: 'shutdown refused: cargo-hauler still has work in flight',
                    });
                  }
                  return;
                }
                // Written directly (not via the queue) so the ack is flushed
                // before the latch tears the server down.
                yield* write(
                  encodeServerMessage({ type: 'shutting-down', id: message.id }),
                ).pipe(Effect.ignore);
                yield* Deferred.succeed(options.shutdownLatch, undefined);
              });
            }
            default: {
              const exhaustive: never = message;
              return Effect.die(new Error(`Unhandled client message: ${String(exhaustive)}`));
            }
          }
        };

        const handleLine = (line: string): Effect.Effect<void, never, Scope.Scope> => {
          let requestId: string | null = null;
          return Effect.gen(function* () {
            const parsedJson = yield* Effect.result(
              Effect.try({
                try: (): unknown => JSON.parse(line),
                catch: (cause) => (cause instanceof Error ? cause.message : String(cause)),
              }),
            );
            if (Result.isFailure(parsedJson)) {
              yield* send({
                type: 'error',
                id: null,
                code: 'bad-message',
                message: `invalid JSON line: ${parsedJson.failure}`,
              });
              return;
            }
            const json = parsedJson.success;
            requestId = extractId(json);
            const parsed = clientMessageSchema.safeParse(json);
            if (!parsed.success) {
              yield* send({
                type: 'error',
                id: requestId,
                code: 'bad-message',
                message: parsed.error.message,
              });
              return;
            }
            requestId = parsed.data.id;
            yield* handleMessage(parsed.data);
          }).pipe(
            Effect.catchCause((cause) =>
              recoverHandlerDefect(requestId, 'connection message handler')(cause),
            ),
          );
        };

        const lineBuffer = new LineBuffer({ maxLineBytes: options.maxLineBytes });
        // An endless line is a protocol violation, not a request: tell the
        // peer once, then fail the read pump so the connection scope closes
        // the socket (the daemon never buffers the rest).
        const rejectOversizeLine = (
          overflow: LineBufferOverflowError,
        ): Effect.Effect<never, LineBufferOverflowError> =>
          write(
            encodeServerMessage({
              type: 'error',
              id: null,
              code: 'bad-message',
              message: `${overflow.message}; closing connection`,
            }),
          ).pipe(Effect.ignore, Effect.andThen(Effect.fail(overflow)));
        const readChunk = (
          chunk: Uint8Array,
        ): Effect.Effect<void, LineBufferOverflowError, Scope.Scope> =>
          Effect.suspend(() => {
            let lines: readonly string[];
            try {
              lines = lineBuffer.push(chunk);
            } catch (cause) {
              return cause instanceof LineBufferOverflowError
                ? rejectOversizeLine(cause)
                : Effect.die(cause);
            }
            return Effect.forEach(lines, handleLine, { discard: true });
          });
        yield* Socket.readerBytes(socket)
          .pipe(
            Effect.flatMap((pull) =>
              Effect.forever(
                Effect.flatMap(pull, (chunks) => Effect.forEach(chunks, readChunk, { discard: true })),
              ),
            ),
            // Every close fails the pull; abrupt disconnects are routine
            // (agent shells die mid-build).
            Effect.ignore,
            Effect.ensuring(
              Effect.gen(function* () {
                const tickets = yield* Effect.sync(() => {
                  connection.closed = true;
                  return [...ownTickets];
                });
                // Owned work outlives the connection: a queued ticket keeps
                // its place for the reattach grace window before it is
                // killed as abandoned (#187); a running one continues so its
                // result lands in the ledger, marked orphaned so a later
                // stall may end it (#46). A `reattach` on a new connection
                // takes either back.
                yield* Effect.forEach(
                  tickets,
                  (ticket) => options.broker.ownerDisconnected(ticket, ownerId),
                  { discard: true },
                );
              }),
            ),
          );
      }),
    ).pipe(Effect.annotateLogs({ connectionId: randomUUID() }));
