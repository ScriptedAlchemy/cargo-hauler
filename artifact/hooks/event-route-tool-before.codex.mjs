import * as __rspack_external_node_async_hooks_4d8b1b4a from "node:async_hooks";
import * as __rspack_external_node_child_process_cd435d64 from "node:child_process";
import * as __rspack_external_node_crypto_2e7c4b46 from "node:crypto";
import * as __rspack_external_node_fs_1b05aee1 from "node:fs";
import * as __rspack_external_node_fs_promises_3b710708 from "node:fs/promises";
import * as __rspack_external_node_os_4f3c9d58 from "node:os";
import * as __rspack_external_node_path_806ed179 from "node:path";
import * as __rspack_external_node_url_3991086a from "node:url";
var __webpack_modules__ = ({
"./src/events/tool/before.ts"(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
/* import */ var agent_bundle_routes__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/routes.js");
/* import */ var _internal_host_hooks_tokens_js__rspack_import_1 = __webpack_require__("./src/internal/host-hooks/tokens.ts");
/* import */ var _internal_host_hooks_tool_input_js__rspack_import_2 = __webpack_require__("./src/internal/host-hooks/tool-input.ts");



/**
 * The gate every shell tool call pays (#90): commands that name neither cargo
 * nor hauler continue before the rendered view, bash parser, and daemon probe
 * load.
 */ /* export default */ const __rspack_default_export = (agent_bundle_routes__rspack_import_0/* .events.tool.before */.AZ.tool.before({
    requires: [
        'events.toolBefore.deny'
    ],
    runtime: 'standalone',
    timeoutMs: 10000,
    tools: [
        'shell'
    ]
}, (context)=>(0,_internal_host_hooks_tokens_js__rspack_import_1/* .commandMentionsHauler */.C)((0,_internal_host_hooks_tool_input_js__rspack_import_2/* .extractShellCommand */.H)(context.canonical.payload.toolInput?.value)) ? context.render('./before.view.js', {}) : {
        outcome: 'continue'
    }));

__webpack_require__.d(__webpack_exports__, {
}, {
  A: __rspack_default_export
});


},
"./src/internal/contracts/protocol.ts"(__unused_rspack_module, __unused_rspack___webpack_exports__, __webpack_require__) {
/* import */ var zod__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/classic/schemas.js");

/**
 * Wire protocol for the hauler daemon: one JSON document per line
 * (NDJSON) in each direction over the daemon's unix socket. This module is
 * the shared vocabulary between the daemon, the control/exec clients, and
 * the ledger, so it must not import from the other daemon modules.
 */ /** Every status a request passes through, in lifecycle order. One list feeds the type, the schema, and the SQL filters. */ const requestStatuses = [
    'requested',
    'queued',
    'running',
    'done',
    'failed',
    'killed',
    'denied',
    'passthrough'
];
const statusRowStatuses = [
    ...requestStatuses,
    'orphaned'
];
/** Statuses of a request the daemon still owns. */ const activeStatuses = (/* unused pure expression or super */ null && ([
    'requested',
    'queued',
    'running'
]));
/** Terminal statuses a request can end in after running. */ const finishedStatuses = (/* unused pure expression or super */ null && ([
    'done',
    'failed',
    'killed'
]));
/** Every terminal status, including the ones that never ran. */ const terminalStatuses = (/* unused pure expression or super */ null && ([
    'done',
    'failed',
    'killed',
    'denied',
    'passthrough'
]));
/**
 * How an attached request rides its leader (see daemon/broker/coverage.ts):
 * 'identity' mirrors everything, 'coverage' rides a stronger in-flight run,
 * 'batch' was composed into a merged invocation. Coverage and compile-batch
 * attachments requeue when the leader fails (unless their scope was proven);
 * a folded test/nextest participant mirrors the composite's failure only
 * when it named every package the composite ran, and requeues otherwise.
 */ const attachModes = (/* unused pure expression or super */ null && ([
    'identity',
    'coverage',
    'batch'
]));
/**
 * Why a request could not ride an in-flight leader in its lane (see
 * daemon/broker/coverage.ts). Listed in evaluation order, which is also how close
 * the pair came to attaching: `subcommand` is a pair that never shares,
 * `leader-build-finished` is a compatible coverage rider that arrived after
 * the leader's compile had already ended. `hauler status` reports one count
 * per gate under `metrics.attach_rejections`, taken from the nearest miss
 * among the lane's leaders for each request that did not attach.
 */ const attachRejectionGates = (/* unused pure expression or super */ null && ([
    'shell-wrapped',
    'subcommand',
    'opaque-arguments',
    'passthrough',
    'compile-surface',
    'packages',
    'targets',
    'channels',
    'leader-build-finished'
]));
/**
 * Bytes of a running ticket's live output a status row carries (#95). The
 * bound is part of the status contract (`statusRowSchema`), independent of
 * `outputTailBytes` — the 16 KiB a `RequestRecord` tail may hold — so a
 * status document's size follows the number of rows, not what each printed.
 */ const statusOutputPreviewBytes = 512;
/** Lines of a running ticket's live output a status row carries. */ const statusOutputPreviewLines = 8;
/** The status row for a record: the tail fields dropped, the preview supplied by the caller. */ const toStatusRow = (record, outputPreview = null)=>{
    const { outputTail: _outputTail, outputTailLive: _outputTailLive, ...summary } = record;
    return {
        ...summary,
        outputPreview
    };
};
const execRequestSchema = zod__rspack_import_0/* .object */.Ikc({
    type: zod__rspack_import_0/* .literal */.euz('exec'),
    id: zod__rspack_import_0/* .string */.YjP().min(1),
    allowSharedTarget: zod__rspack_import_0/* .boolean */.zMY().optional(),
    argv: zod__rspack_import_0/* .array */.YOg(zod__rspack_import_0/* .string */.YjP()).min(1),
    cwd: zod__rspack_import_0/* .string */.YjP().min(1),
    workspaceRoot: zod__rspack_import_0/* .string */.YjP().min(1).optional(),
    env: zod__rspack_import_0/* .record */.g1P(zod__rspack_import_0/* .string */.YjP(), zod__rspack_import_0/* .string */.YjP()).optional(),
    session: zod__rspack_import_0/* .string */.YjP().optional(),
    host: zod__rspack_import_0/* .string */.YjP().optional(),
    background: zod__rspack_import_0/* .boolean */.zMY().optional(),
    holdStop: zod__rspack_import_0/* .boolean */.zMY().optional(),
    /** Run the child with stderr on the stdout pipe so the caller's `2>&1` keeps write order. */ mergeStderr: zod__rspack_import_0/* .boolean */.zMY().optional(),
    /** Tickets that must settle before this request may start; a failed or killed one fails it. */ after: zod__rspack_import_0/* .array */.YOg(zod__rspack_import_0/* .string */.YjP().min(1)).optional()
});
const attemptRequestSchema = zod__rspack_import_0/* .object */.Ikc({
    type: zod__rspack_import_0/* .literal */.euz('attempt'),
    id: zod__rspack_import_0/* .string */.YjP().min(1),
    kind: zod__rspack_import_0/* .literal */.euz('denied'),
    argv: zod__rspack_import_0/* .array */.YOg(zod__rspack_import_0/* .string */.YjP()).min(1),
    cwd: zod__rspack_import_0/* .string */.YjP().min(1),
    session: zod__rspack_import_0/* .string */.YjP().optional(),
    host: zod__rspack_import_0/* .string */.YjP().optional(),
    reason: zod__rspack_import_0/* .string */.YjP().min(1)
});
const detachRequestSchema = zod__rspack_import_0/* .object */.Ikc({
    type: zod__rspack_import_0/* .literal */.euz('detach'),
    id: zod__rspack_import_0/* .string */.YjP().min(1),
    ticket: zod__rspack_import_0/* .string */.YjP().min(1)
});
/** Await ceiling (2h) — the single source for daemon wire and operation schemas. */ const awaitCeilingMs = 7200000;
const awaitRequestSchema = zod__rspack_import_0/* .object */.Ikc({
    type: zod__rspack_import_0/* .literal */.euz('await'),
    id: zod__rspack_import_0/* .string */.YjP().min(1),
    ticket: zod__rspack_import_0/* .string */.YjP().min(1),
    maxWaitMs: zod__rspack_import_0/* .number */.aig().int().min(0).max(awaitCeilingMs).optional()
});
const resultRequestSchema = zod__rspack_import_0/* .object */.Ikc({
    type: zod__rspack_import_0/* .literal */.euz('result'),
    id: zod__rspack_import_0/* .string */.YjP().min(1),
    ticket: zod__rspack_import_0/* .string */.YjP().min(1)
});
/**
 * A client whose streaming connection dropped asks to own its ticket again
 * (#187). The daemon answers `reattach-result`; for an active ticket it then
 * replays the output the client has not seen and streams the rest as for a
 * fresh `exec`. Every field but `ticket` is optional so an older client's
 * message stays valid as the schema grows; an older daemon answers the
 * unknown type with `error bad-message`, which the client reads as
 * "reattach unsupported".
 */ const reattachRequestSchema = zod__rspack_import_0/* .object */.Ikc({
    type: zod__rspack_import_0/* .literal */.euz('reattach'),
    id: zod__rspack_import_0/* .string */.YjP().min(1),
    ticket: zod__rspack_import_0/* .string */.YjP().min(1),
    /**
   * Bytes of this ticket's output the client already received (both channels,
   * decoded). The daemon replays from there; anything before the replay
   * buffer's oldest retained byte is reported as `missedBytes`.
   */ fromByte: zod__rspack_import_0/* .number */.aig().int().min(0).optional()
});
const sessionPendingRequestSchema = zod__rspack_import_0/* .object */.Ikc({
    type: zod__rspack_import_0/* .literal */.euz('session-pending'),
    id: zod__rspack_import_0/* .string */.YjP().min(1),
    session: zod__rspack_import_0/* .string */.YjP().min(1)
});
const sessionCompletedRequestSchema = zod__rspack_import_0/* .object */.Ikc({
    type: zod__rspack_import_0/* .literal */.euz('session-completed'),
    id: zod__rspack_import_0/* .string */.YjP().min(1),
    session: zod__rspack_import_0/* .string */.YjP().min(1),
    sinceMs: zod__rspack_import_0/* .number */.aig().int().min(0)
});
const killRequestSchema = zod__rspack_import_0/* .object */.Ikc({
    type: zod__rspack_import_0/* .literal */.euz('kill'),
    id: zod__rspack_import_0/* .string */.YjP().min(1),
    ticket: zod__rspack_import_0/* .string */.YjP().min(1)
});
const statusRequestSchema = zod__rspack_import_0/* .object */.Ikc({
    type: zod__rspack_import_0/* .literal */.euz('status'),
    id: zod__rspack_import_0/* .string */.YjP().min(1),
    limit: zod__rspack_import_0/* .number */.aig().int().min(1).max(500).optional()
});
const pingRequestSchema = zod__rspack_import_0/* .object */.Ikc({
    type: zod__rspack_import_0/* .literal */.euz('ping'),
    id: zod__rspack_import_0/* .string */.YjP().min(1)
});
const shutdownRequestSchema = zod__rspack_import_0/* .object */.Ikc({
    type: zod__rspack_import_0/* .literal */.euz('shutdown'),
    id: zod__rspack_import_0/* .string */.YjP().min(1),
    /** Automatic upgrades set this; explicit daemon restart leaves it false. */ ifIdle: zod__rspack_import_0/* .boolean */.zMY().optional(),
    /**
   * The requesting client's release version. The daemon refuses a shutdown
   * from a client older than itself, or from one that sends no version
   * (every client before this field): replacement is directional, a newer
   * install replaces an older daemon and never the reverse.
   */ version: zod__rspack_import_0/* .string */.YjP().min(1).optional()
});
const clientMessageSchema = zod__rspack_import_0/* .discriminatedUnion */.gMt('type', [
    execRequestSchema,
    attemptRequestSchema,
    detachRequestSchema,
    awaitRequestSchema,
    resultRequestSchema,
    reattachRequestSchema,
    sessionPendingRequestSchema,
    sessionCompletedRequestSchema,
    killRequestSchema,
    statusRequestSchema,
    pingRequestSchema,
    shutdownRequestSchema
]);
/** One retirement predicate shared by the client preflight and daemon refusal. */ const daemonReportIsIdle = (report)=>report.active.length === 0 && report.lanes.every((lane)=>lane.queued === 0 && lane.runningTicket === null && lane.executingTickets.length === 0);
const encodeServerMessage = (message)=>`${JSON.stringify(message)}\n`;
const encodeClientMessage = (message)=>`${JSON.stringify(message)}\n`;
/** The daemon is a trusted local peer; clients parse its lines without schema checks. */ const parseServerMessageLine = (line)=>JSON.parse(line);
/**
 * The `error` a starting daemon stamps on every request still active in the
 * ledger: the daemon that owned them stopped, and runs are not handed over
 * across a restart. Clients read it to explain the `killed` status.
 */ const orphanedByRestartError = 'orphaned by daemon restart';
const isOrphanedByRestart = (record)=>record.status === 'killed' && record.error === orphanedByRestartError;
const formatTicket = (id)=>`cc-${id}`;
const ticketPattern = /^cc-(\d+)$/u;
const parseTicket = (ticket)=>{
    const match = ticketPattern.exec(ticket);
    return match === null ? null : Number(match[1]);
};
const passthroughSpoolFileName = 'passthrough-attempts.v1.jsonl';


},
"./src/internal/daemon/config.ts"(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
/* import */ var node_os__rspack_import_0 = __webpack_require__("node:os");
/* import */ var node_path__rspack_import_1 = __webpack_require__("node:path");
/* import */ var effect_Context__rspack_import_5 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Context.js");
/* import */ var _platform_state_paths_js__rspack_import_2 = __webpack_require__("./src/internal/platform/state-paths.ts");
/* import */ var _runtime_jobserver_js__rspack_import_3 = __webpack_require__("./src/internal/daemon/runtime/jobserver.ts");
/* import */ var _storage_ticket_log_js__rspack_import_4 = __webpack_require__("./src/internal/storage/ticket-log.ts");






class DaemonConfig extends effect_Context__rspack_import_5/* .Service */.kl()('cargo-hauler/DaemonConfig') {
}
const minimumDefaultMaxConcurrent = 5;
const maximumDefaultMaxConcurrent = 16;
const coresPerDefaultPermit = 8;
const defaultReplayBufferBytes = 4 * 1024 * 1024;
const defaultLoadMinConcurrent = 2;
const defaultCpuStallThreshold = 75;
const defaultBatchWindowMs = 150;
const defaultMemPressureSoftThreshold = 10;
const defaultMemPressureHardThreshold = 20;
const defaultMemAvailableMinGb = 8;
const defaultMemPressureLevelThreshold = 2;
const defaultHeavyMemAvailableGb = 16;
const defaultHeavyMaxConcurrent = 1;
const defaultLedgerRetentionDays = 30;
const defaultLedgerMaxRows = 50000;
const defaultStallEstimateFactor = 3;
const defaultStallIdleMs = 10 * 60000;
const defaultReattachGraceMs = 30000;
const gibibyte = 1024 ** 3;
const defaultTicketLogMaxBytes = 64 * 1024 * 1024;
/**
 * Default admission permits for a machine with `cores` hardware threads:
 * one per eight cores, never below the historical five nor above sixteen.
 * The shared jobserver already bounds compile parallelism machine-wide and
 * the pressure arms defer admission under load, so extra permits on a large
 * machine only let more lanes make progress at once instead of parking
 * whole worktrees behind unrelated builds.
 */ const defaultMaxConcurrentFor = (cores)=>Math.max(minimumDefaultMaxConcurrent, Math.min(maximumDefaultMaxConcurrent, Number.isFinite(cores) ? Math.floor(cores / coresPerDefaultPermit) : 0));
const writeWarningToStderr = (warning)=>{
    process.stderr.write(`[cargo-hauler] ${warning}\n`);
};
const describeRange = (options)=>{
    const kind = options.integer === true ? 'an integer' : 'a number';
    if (options.min !== undefined && options.max !== undefined) {
        return `${kind} between ${options.min} and ${options.max}`;
    }
    if (options.min !== undefined) {
        return `${kind} >= ${options.min}`;
    }
    if (options.max !== undefined) {
        return `${kind} <= ${options.max}`;
    }
    return kind;
};
const parseBoundedNumber = (raw, options)=>{
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
        return null;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
        return null;
    }
    if (options.integer === true && !Number.isInteger(parsed)) {
        return null;
    }
    if (options.min !== undefined && parsed < options.min) {
        return null;
    }
    if (options.max !== undefined && parsed > options.max) {
        return null;
    }
    return parsed;
};
/** Spellings that turn an optional arm off, in addition to a non-positive number. */ const disableTokens = new Set([
    'off',
    'false',
    'no',
    'none',
    'disabled'
]);
const isDisableToken = (raw)=>disableTokens.has(raw.trim().toLowerCase());
const falseTokens = new Set([
    '0',
    'false',
    'off',
    'no'
]);
const trueTokens = new Set([
    '1',
    'true',
    'on',
    'yes'
]);
/** The `flag()` spellings that mean on, for a client reading one `CARGO_HAULER_*` switch without the whole config. */ const isEnabledFlag = (raw)=>raw !== undefined && trueTokens.has(raw.trim().toLowerCase());
const pick = (env, name)=>({
        name,
        raw: env[name]
    });
/**
 * Builds the parsing helpers around one warning sink so an unparseable or
 * out-of-range value keeps the documented default and says so, instead of
 * silently changing behaviour (previously `abc` disabled a pressure arm).
 */ const envParsers = (warn)=>{
    const number = (value, fallback, options = {})=>{
        if (value.raw === undefined) {
            return fallback;
        }
        const parsed = parseBoundedNumber(value.raw, options);
        if (parsed === null) {
            warn(`${value.name}=${JSON.stringify(value.raw)} is not ${describeRange(options)}; using ${fallback}`);
            return fallback;
        }
        return parsed;
    };
    /**
   * Optional arm: `off` (and friends) or a number <= 0 disables it (null);
   * a positive number within range sets it; anything else warns and keeps the
   * fallback.
   */ const optionalNumber = (value, fallback, options = {})=>{
        if (value.raw === undefined) {
            return fallback;
        }
        if (isDisableToken(value.raw)) {
            return null;
        }
        const numeric = Number(value.raw.trim());
        if (value.raw.trim().length > 0 && Number.isFinite(numeric) && numeric <= 0) {
            return null;
        }
        const parsed = parseBoundedNumber(value.raw, {
            ...options,
            min: options.min ?? 0
        });
        if (parsed === null) {
            warn(`${value.name}=${JSON.stringify(value.raw)} is not ${describeRange({
                ...options,
                min: options.min ?? 0
            })} or off; using ${fallback ?? 'off'}`);
            return fallback;
        }
        return parsed;
    };
    const flag = (value, fallback)=>{
        if (value.raw === undefined) {
            return fallback;
        }
        const normalized = value.raw.trim().toLowerCase();
        if (falseTokens.has(normalized)) {
            return false;
        }
        if (trueTokens.has(normalized)) {
            return true;
        }
        warn(`${value.name}=${JSON.stringify(value.raw)} is not one of 1/true/on/yes or 0/false/off/no; using ${fallback ? 'enabled' : 'disabled'}`);
        return fallback;
    };
    return {
        flag,
        number,
        optionalNumber
    };
};
const resolveDaemonConfigWithWarnings = (env = process.env, platform = process.platform, cores = (0,node_os__rspack_import_0.availableParallelism)())=>{
    const warnings = [];
    const { flag, number, optionalNumber } = envParsers((warning)=>{
        warnings.push(warning);
    });
    const stateDir = (0,_platform_state_paths_js__rspack_import_2/* .resolveStateDir */.JT)(env);
    const maxConcurrent = number(pick(env, 'CARGO_HAULER_MAX_CONCURRENT'), defaultMaxConcurrentFor(cores), {
        integer: true,
        min: 1
    });
    const kacheIndexValue = env.CARGO_HAULER_KACHE_INDEX;
    // Divide the cores between the admitted builds so N concurrent cargos do
    // not each assume they own the whole machine (rheo's grant idea).
    const defaultJobsGrant = Math.max(4, Math.floor(cores / maxConcurrent));
    const linuxOnly = (value)=>platform === 'linux' ? value : null;
    let memPressureSoftThreshold = linuxOnly(optionalNumber(pick(env, 'CARGO_HAULER_MEM_PRESSURE_SOFT'), defaultMemPressureSoftThreshold, {
        max: 100
    }));
    let memPressureHardThreshold = linuxOnly(optionalNumber(pick(env, 'CARGO_HAULER_MEM_PRESSURE_HARD'), defaultMemPressureHardThreshold, {
        max: 100
    }));
    if (memPressureSoftThreshold !== null && memPressureHardThreshold !== null && memPressureSoftThreshold >= memPressureHardThreshold) {
        warnings.push(`CARGO_HAULER_MEM_PRESSURE_SOFT (${memPressureSoftThreshold}) must be below CARGO_HAULER_MEM_PRESSURE_HARD (${memPressureHardThreshold}); using ${defaultMemPressureSoftThreshold}/${defaultMemPressureHardThreshold}`);
        memPressureSoftThreshold = defaultMemPressureSoftThreshold;
        memPressureHardThreshold = defaultMemPressureHardThreshold;
    }
    const memAvailableMinGb = linuxOnly(optionalNumber(pick(env, 'CARGO_HAULER_MEM_AVAILABLE_MIN_GB'), defaultMemAvailableMinGb));
    const heavyMemAvailableGb = linuxOnly(optionalNumber(pick(env, 'CARGO_HAULER_HEAVY_MEM_AVAILABLE_GB'), defaultHeavyMemAvailableGb));
    const memPressureLevel = pick(env, 'CARGO_HAULER_MEM_PRESSURE_LEVEL');
    let memPressureLevelThreshold = null;
    if (platform === 'darwin') {
        const level = optionalNumber(memPressureLevel, defaultMemPressureLevelThreshold, {
            integer: true
        });
        if (level === null || level === 2 || level === 4) {
            memPressureLevelThreshold = level;
        } else {
            warnings.push(`${memPressureLevel.name}=${JSON.stringify(memPressureLevel.raw)} must be 2 (warn), 4 (critical), or off; using ${defaultMemPressureLevelThreshold}`);
            memPressureLevelThreshold = defaultMemPressureLevelThreshold;
        }
    }
    const config = {
        stateDir,
        socketPath: (0,_platform_state_paths_js__rspack_import_2/* .daemonSocketPath */.$Q)(stateDir, platform, env),
        databasePath: (0,node_path__rspack_import_1.join)(stateDir, 'ledger.db'),
        lockTargetPath: (0,node_path__rspack_import_1.join)(stateDir, 'daemon.pid'),
        logPath: (0,node_path__rspack_import_1.join)(stateDir, 'daemon.log'),
        maxConcurrent,
        outputTailBytes: 16 * 1024,
        ticketLogDir: (0,_storage_ticket_log_js__rspack_import_4/* .ticketLogDirFor */.RJ)(stateDir),
        ticketLogMaxBytes: number(pick(env, 'CARGO_HAULER_TICKET_LOG_MAX_BYTES'), defaultTicketLogMaxBytes, {
            integer: true,
            min: 0
        }),
        replayBufferBytes: number(pick(env, 'CARGO_HAULER_REPLAY_BUFFER_BYTES'), defaultReplayBufferBytes, {
            integer: true,
            min: 0
        }),
        // '' (explicitly empty) disables kache; a missing default file merely
        // reports kache as unavailable, so no machine needs the path to exist.
        kacheIndexPath: kacheIndexValue ?? (0,_platform_state_paths_js__rspack_import_2/* .defaultKacheIndexPath */.rU)(env),
        jobsGrant: number(pick(env, 'CARGO_HAULER_JOBS_GRANT'), defaultJobsGrant, {
            integer: true,
            min: 0
        }),
        batchEnabled: flag(pick(env, 'CARGO_HAULER_BATCH'), true),
        batchWindowMs: number(pick(env, 'CARGO_HAULER_BATCH_WINDOW_MS'), defaultBatchWindowMs, {
            integer: true,
            min: 0
        }),
        allowSharedTarget: flag(pick(env, 'CARGO_HAULER_ALLOW_SHARED_TARGET'), false),
        overlapExecution: flag(pick(env, 'CARGO_HAULER_OVERLAP_EXECUTION'), true),
        loadThresholdPerCore: optionalNumber(pick(env, 'CARGO_HAULER_LOAD_THRESHOLD'), null),
        loadMinConcurrent: number(pick(env, 'CARGO_HAULER_LOAD_MIN'), defaultLoadMinConcurrent, {
            integer: true,
            min: 1
        }),
        cpuStallThreshold: optionalNumber(pick(env, 'CARGO_HAULER_CPU_PRESSURE_THRESHOLD'), defaultCpuStallThreshold, {
            max: 100
        }),
        memPressureSoftThreshold,
        memPressureHardThreshold,
        memAvailableMinBytes: memAvailableMinGb === null ? null : memAvailableMinGb * gibibyte,
        memPressureLevelThreshold,
        heavyMemAvailableBytes: heavyMemAvailableGb === null ? null : heavyMemAvailableGb * gibibyte,
        heavyMaxConcurrent: number(pick(env, 'CARGO_HAULER_HEAVY_MAX_CONCURRENT'), defaultHeavyMaxConcurrent, {
            integer: true,
            min: 1
        }),
        ledgerRetentionDays: number(pick(env, 'CARGO_HAULER_LEDGER_RETENTION_DAYS'), defaultLedgerRetentionDays, {
            min: 0
        }),
        ledgerMaxRows: number(pick(env, 'CARGO_HAULER_LEDGER_MAX_ROWS'), defaultLedgerMaxRows, {
            integer: true,
            min: 0
        }),
        jobserverMode: (0,_runtime_jobserver_js__rspack_import_3/* .parseJobserverModeSetting */.JE)(pick(env, 'CARGO_HAULER_JOBSERVER').raw, (warning)=>warnings.push(warning)),
        stallEstimateFactor: number(pick(env, 'CARGO_HAULER_STALL_ESTIMATE_FACTOR'), defaultStallEstimateFactor, {
            min: 0
        }),
        stallIdleMs: optionalNumber(pick(env, 'CARGO_HAULER_STALL_IDLE_MS'), defaultStallIdleMs, {
            integer: true
        }),
        stallAutoKill: flag(pick(env, 'CARGO_HAULER_STALL_AUTO_KILL'), true),
        reattachGraceMs: number(pick(env, 'CARGO_HAULER_REATTACH_GRACE_MS'), defaultReattachGraceMs, {
            integer: true,
            min: 0
        })
    };
    return {
        config,
        warnings
    };
};
/**
 * Resolves the daemon configuration, reporting rejected overrides through
 * `onWarning` (stderr by default) before falling back to the documented value.
 */ const resolveDaemonConfig = (env = process.env, platform = process.platform, onWarning = writeWarningToStderr, cores = (0,node_os__rspack_import_0.availableParallelism)())=>{
    const resolved = resolveDaemonConfigWithWarnings(env, platform, cores);
    for (const warning of resolved.warnings){
        onWarning(warning);
    }
    return resolved.config;
};

__webpack_require__.d(__webpack_exports__, {
}, {
  bF: resolveDaemonConfig
});


},
"./src/internal/daemon/runtime/jobserver.ts"(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
/* import */ var node_child_process__rspack_import_0 = __webpack_require__("node:child_process");
/* import */ var node_fs__rspack_import_1 = __webpack_require__("node:fs");
/* import */ var node_os__rspack_import_2 = __webpack_require__("node:os");
/* import */ var node_path__rspack_import_3 = __webpack_require__("node:path");
/* import */ var _platform_private_state_js__rspack_import_4 = __webpack_require__("./src/internal/platform/private-state.ts");






/**
 * Machine-wide GNU make jobserver FIFO shared by every cargo the daemon
 * spawns.
 *
 * Cargo and rustc both speak the make jobserver protocol
 * (`--jobserver-auth=fifo:PATH` in `MAKEFLAGS`). A single FIFO preloaded
 * with N tokens is a cross-process semaphore: however many concurrent
 * cargos the broker lanes admit, their rustc/codegen jobs collectively hold
 * at most N tokens. This bounds *global* compile parallelism, where
 * per-lane admission alone lets K cargos each spawn a machine-width of
 * rustc jobs.
 *
 * Pool lifetime is tied to the daemon: a FIFO's buffered tokens die with
 * its last open descriptor, so the daemon arms the pool once at singleton
 * acquisition and retains the descriptor until shutdown. Arming drains any
 * stale bytes first (a previous daemon's tokens do not stack), then seeds
 * exactly N. Unarmed processes — client passthroughs with no daemon —
 * inject nothing: a lone cargo sizing its own default pool is the correct
 * uncoordinated behavior, whereas pointing it at an unowned FIFO would
 * starve it down to its single implicit token.
 *
 * Semantics inherited from make: every participating cargo also holds one
 * implicit token, so worst-case parallelism is `tokens + running cargos`;
 * tokens default to `cores - 1` to compensate. A cargo killed with SIGKILL
 * leaks its held tokens (the protocol has no revocation); orderly exits —
 * including failures — return them, and every daemon restart re-arms the
 * pool to exactly N.
 */ const jobserverFifoFileName = 'jobserver.fifo';
let armed = null;
const drain = (fd)=>{
    const buffer = Buffer.alloc(256);
    for(;;){
        let read;
        try {
            read = readSync(fd, buffer, 0, buffer.length, null);
        } catch (error) {
            if (isRecord(error) && error.code === 'EAGAIN') {
                return;
            }
            throw error;
        }
        if (read <= 0) {
            return;
        }
    }
};
/** Parses `CARGO_HAULER_JOBSERVER`; unknown values warn and fall back to `auto`. */ const parseJobserverModeSetting = (value, warn)=>{
    const setting = value?.trim().toLowerCase();
    switch(setting){
        case undefined:
        case '':
        case 'auto':
            return 'auto';
        case 'fifo':
        case '1':
        case 'on':
            return 'fifo';
        case 'off':
        case '0':
        case 'false':
            return 'off';
        default:
            warn(`CARGO_HAULER_JOBSERVER=${value} is not auto, fifo, or off; using auto`);
            return 'auto';
    }
};
/**
 * Cargo forwards the jobserver to build scripts through `MAKEFLAGS`, and a
 * `-sys` crate that shells out to `make` hands it straight to the host make.
 * Only GNU make 4.4+ understands `--jobserver-auth=fifo:PATH`; 4.3 (Ubuntu
 * 22.04) and 3.81 (macOS) abort with "invalid --jobserver-auth string", so
 * every jemalloc/openssl-style build fails under the daemon (#76).
 */ const makeSupportsFifoJobserver = (versionOutput)=>{
    const match = /^GNU Make (\d+)\.(\d+)/u.exec(versionOutput.trim());
    if (match === null) {
        return false;
    }
    const major = Number(match[1]);
    const minor = Number(match[2]);
    return major > 4 || major === 4 && minor >= 4;
};
const readMakeVersion = ()=>{
    const result = spawnSync('make', [
        '--version'
    ], {
        encoding: 'utf8',
        stdio: [
            'ignore',
            'pipe',
            'ignore'
        ]
    });
    return result.error === undefined && typeof result.stdout === 'string' ? result.stdout : null;
};
/**
 * `auto` arms the FIFO when the host has no `make` (nothing can hand it a
 * fifo auth) or a fifo-capable one, and stays off otherwise so build
 * scripts keep working; `fifo`/`off` are explicit.
 */ const resolveJobserverMode = (setting, makeVersion)=>{
    switch(setting){
        case 'fifo':
            return 'fifo';
        case 'off':
            return 'off';
        case 'auto':
            {
                const version = makeVersion();
                return version === null || makeSupportsFifoJobserver(version) ? 'fifo' : 'off';
            }
        default:
            {
                const exhaustive = setting;
                return exhaustive;
            }
    }
};
/**
 * Creates (if needed), drains, and seeds the shared FIFO, retaining an open
 * descriptor so the pool survives for the daemon's lifetime. Returns false —
 * leaving the process unarmed, with spawns behaving exactly as today — when
 * the FIFO cannot be provided (no mkfifo, unwritable state dir).
 */ const armSharedJobserver = (options)=>{
    if (armed !== null) {
        return true;
    }
    if (resolveJobserverMode(options.mode ?? 'auto', options.makeVersion ?? readMakeVersion) === 'off') {
        return false;
    }
    const tokens = options.tokens ?? Math.max(1, availableParallelism() - 1);
    const path = join(options.stateDir, jobserverFifoFileName);
    try {
        ensurePrivateDir(options.stateDir);
        if (statSync(path, {
            throwIfNoEntry: false
        }) === undefined) {
            // Only this user's cargo processes ever draw from the pool, so the
            // FIFO is owner-only: a world-writable one let any local account
            // drain or flood the daemon's tokens.
            spawnSync('mkfifo', [
                '-m',
                '0600',
                path
            ], {
                stdio: 'ignore'
            });
        }
        const stat = statSync(path, {
            throwIfNoEntry: false
        });
        if (stat === undefined || !stat.isFIFO()) {
            return false;
        }
        hardenPrivateEntry(path, 'fifo');
        // O_RDWR so open, drain, and seed never block on a peer; O_NONBLOCK so
        // draining stale bytes ends with EAGAIN instead of waiting for writers.
        const fd = openSync(path, constants.O_RDWR | constants.O_NONBLOCK);
        try {
            drain(fd);
            writeSync(fd, Buffer.alloc(tokens, '+'));
        } catch (error) {
            closeSync(fd);
            throw error;
        }
        armed = {
            fd,
            makeflags: `-j --jobserver-auth=fifo:${path}`,
            path,
            tokens
        };
        return true;
    } catch  {
        return false;
    }
};
/**
 * Whether this process holds the armed pool. An armed daemon lets the FIFO
 * own parallelism and must not pin `CARGO_BUILD_JOBS` on the cargos it
 * spawns, since cargo ignores an inherited jobserver once `-j` is set.
 */ const isSharedJobserverArmed = ()=>armed !== null;
/** Closes the retained descriptor; the pool's tokens die with it. */ const releaseSharedJobserver = ()=>{
    if (armed === null) {
        return;
    }
    try {
        closeSync(armed.fd);
    } catch  {
    // The descriptor is being discarded either way.
    }
    armed = null;
};
/**
 * Environment delta enrolling a spawned cargo in the armed pool, or `null`
 * when this process holds no pool or the invocation pins its own
 * parallelism (`CARGO_BUILD_JOBS`, `CARGO_MAKEFLAGS`, or an inherited
 * `MAKEFLAGS` jobserver — cargo ignores an inherited jobserver when
 * `-j`/`build.jobs` is set, so injecting one would only mislead).
 */ const sharedJobserverDelta = (env)=>{
    if (armed === null) {
        return null;
    }
    if (env.CARGO_BUILD_JOBS !== undefined || env.CARGO_MAKEFLAGS !== undefined || env.MAKEFLAGS?.includes('--jobserver-auth') === true) {
        return null;
    }
    const makeflags = env.MAKEFLAGS === undefined ? armed.makeflags : `${env.MAKEFLAGS} ${armed.makeflags}`;
    return {
        MAKEFLAGS: makeflags
    };
};

__webpack_require__.d(__webpack_exports__, {
}, {
  JE: parseJobserverModeSetting
});


},
"./src/internal/host-hooks/tokens.ts"(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
/**
 * The pre-parse test the cheap `tool/before` and `tool/after` handlers apply
 * before anything heavy loads: does the shell command name `cargo` or
 * `hauler` as a token? Boundaries are any character outside
 * `[A-Za-z0-9_]`, so `cargo-hauler`, `~/.cargo/bin/cargo`, `cargo.exe`,
 * `./scripts/cargo-wrapper`, and `echo cargo` all match while `mycargo` and
 * `CARGO_HOME=/x ls` do not. The match is case-insensitive (`Cargo.toml`
 * matches): false positives cost one parse of the command in-process, false
 * negatives would let a cargo invocation bypass the hauler, so the test errs
 * toward matching.
 *
 * This is a superset of the check `before-shell.ts` itself applies
 * (`command.includes('cargo')`): every command the rewrite could govern, and
 * every command `after-shell.ts` records, mentions one of these tokens.
 */ const haulerToken = /(?:^|[^A-Za-z0-9_])(?:cargo|hauler)(?![A-Za-z0-9_])/iu;
/** True when the command mentions cargo or hauler as a token; `undefined` and `''` never do. */ const commandMentionsHauler = (command)=>command !== undefined && command.length > 0 && haulerToken.test(command);
/**
 * Cargo's own status lines, right-aligned to twelve columns: `   Compiling
 * foo v0.1.0`, `    Finished \`test\` profile …`, `     Running unittests`,
 * `   Doc-tests foo`. Found in a shell tool's captured output for a command
 * that never named cargo, they mean cargo ran through a wrapper script, an
 * alias, or a shell variable — the one shape neither the rewrite nor the
 * PATH shim sees (the shim is skipped by an absolute toolchain path).
 */ const cargoStatusLine = /^ {2,}(?:Compiling|Checking|Finished|Running|Doc-tests|Documenting|Blocking) \S/mu;
/**
 * Commands whose output is a file they were asked to show. A saved cargo log
 * read back with one of these looks exactly like a live run.
 * ponytail: first-word check only; `cd x && tail log` still trips it. Widen
 * to every pipeline stage if that shows up in the hook log.
 */ const fileReaders = new Set([
    'awk',
    'bat',
    'cat',
    'grep',
    'head',
    'less',
    'more',
    'rg',
    'sed',
    'tac',
    'tail'
]);
const readsFile = (command)=>{
    const first = command.trimStart().split(/\s+/u, 1)[0] ?? '';
    return fileReaders.has(first.slice(first.lastIndexOf('/') + 1));
};
/**
 * True when the command names neither cargo nor hauler, is not a file reader,
 * and its output carries cargo status lines: cargo ran, and nothing brokered
 * it. `undefined` output never does.
 */ const hiddenCargoRun = (command, output)=>command !== undefined && output !== undefined && !commandMentionsHauler(command) && !readsFile(command) && cargoStatusLine.test(output);

__webpack_require__.d(__webpack_exports__, {
}, {
  C: commandMentionsHauler
});


},
"./src/internal/host-hooks/tool-input.ts"(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
/* import */ var _util_guards_js__rspack_import_0 = __webpack_require__("./src/internal/util/guards.ts");

/**
 * `tool_input.command` as the host sent it; `undefined` when the tool input
 * is not a shell call (Read, Edit, an MCP tool, Codex's non-object input).
 * Dependency-free on purpose: the cheap hook handlers read it before anything
 * heavier loads.
 */ const extractShellCommand = (toolInput)=>{
    if (!(0,_util_guards_js__rspack_import_0/* .isRecord */.u)(toolInput) || typeof toolInput.command !== 'string') {
        return undefined;
    }
    return toolInput.command;
};
const outputKeys = (/* unused pure expression or super */ null && ([
    'stdout',
    'stderr',
    'output',
    'content',
    'result'
]));
/**
 * The text a finished shell call produced, as the host reports it: Claude's
 * `{stdout, stderr}`, a bare string, or an `output`/`content`/`result` field.
 * `undefined` when the response carries no text — the hook then has nothing
 * to look at and fails open.
 */ const extractShellOutput = (toolResponse)=>{
    if (typeof toolResponse === 'string') {
        return toolResponse;
    }
    if (!isRecord(toolResponse)) {
        return undefined;
    }
    const parts = outputKeys.map((key)=>toolResponse[key]).filter((value)=>typeof value === 'string');
    return parts.length === 0 ? undefined : parts.join('\n');
};

__webpack_require__.d(__webpack_exports__, {
}, {
  H: extractShellCommand
});


},
"./src/internal/platform/private-state.ts"(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
/* import */ var node_fs__rspack_import_0 = __webpack_require__("node:fs");

/**
 * The one owner-private filesystem policy for cargo-hauler state.
 *
 * Everything the daemon persists — the ledger, complete command output, the
 * pid lock, hook records, the passthrough spool, the control socket — is the
 * work of one Unix user, and daemon control is that user's, not a shared
 * multi-user service. So every directory this application creates is 0700
 * and every sensitive file 0600, independent of the invoking shell's umask,
 * rather than inheriting a 0755/0644 that leaves full command output
 * readable to anyone who can traverse an operator-configured state root.
 *
 * Two rules keep the enforcement from becoming its own hazard:
 *
 * - Only the exact directory or file cargo-hauler owns is created or
 *   tightened. An operator's parent of the state root is never chmod'ed, so
 *   pointing `CARGO_HAULER_STATE_DIR` inside a shared volume cannot relock
 *   that volume.
 * - An existing path is validated before its mode changes: it must be the
 *   expected type, not a symbolic link, and owned by this process's uid.
 *   Following a link or chmod'ing another user's entry would act on their
 *   behalf, so those paths are refused with the path in the message.
 *
 * POSIX modes and uids do not exist on Windows, and `process.getuid` is
 * undefined there. Rather than pretend, the whole policy is a no-op on such
 * hosts: callers keep working and their own create calls behave as before.
 */ const privateDirMode = 448;
const privateFileMode = 384;
/** This process's Unix uid, or `null` where the platform has no uids. */ const currentUid = ()=>process.getuid?.() ?? null;
/**
 * A path cargo-hauler will not create, chmod, or delete. Callers surface it
 * as a startup failure naming the path; nothing is repaired silently,
 * because every cause is either an attack or an operator mistake.
 */ class UnsafeStatePathError extends Error {
    path;
    constructor(path, reason){
        super(`refusing to use ${path}: ${reason}`);
        this.name = 'UnsafeStatePathError';
        this.path = path;
    }
}
const describeKind = (kind)=>{
    switch(kind){
        case 'any':
            return 'an entry it owns';
        case 'directory':
            return 'a directory';
        case 'fifo':
            return 'a FIFO';
        case 'file':
            return 'a regular file';
        case 'socket':
            return 'a socket';
        default:
            {
                const exhaustive = kind;
                return exhaustive;
            }
    }
};
const matchesKind = (stats, kind)=>{
    switch(kind){
        case 'any':
            return true;
        case 'directory':
            return stats.isDirectory();
        case 'fifo':
            return stats.isFIFO();
        case 'file':
            return stats.isFile();
        case 'socket':
            return stats.isSocket();
        default:
            {
                const exhaustive = kind;
                return exhaustive;
            }
    }
};
/**
 * Gate an existing path before it is written, chmod'ed, or removed. Symlinks
 * are refused rather than resolved: the link's target is somebody else's
 * choice, and honoring it is how a predictable path in a shared temp
 * directory turns into a write to an arbitrary file.
 */ const assertOwnedPrivateEntry = (path, stats, kind)=>{
    if (stats.isSymbolicLink()) {
        throw new UnsafeStatePathError(path, `it is a symbolic link, and cargo-hauler state must be ${describeKind(kind)} it owns`);
    }
    if (!matchesKind(stats, kind)) {
        throw new UnsafeStatePathError(path, `it is not ${describeKind(kind)}`);
    }
    const uid = currentUid();
    if (uid !== null && stats.uid !== uid) {
        throw new UnsafeStatePathError(path, `it is owned by uid ${stats.uid}, not by this process (uid ${uid})`);
    }
};
const entryStats = (path)=>lstatSync(path, {
        throwIfNoEntry: false
    });
/**
 * `'a'` with the link refusal the rest of this module applies: the file is
 * created only when the check below found nothing, and a symbolic link
 * planted in that window fails the open with `ELOOP` rather than writing
 * through it. Windows has no `O_NOFOLLOW` — the constant is absent at
 * runtime despite its type, hence the fallback — and no POSIX modes to
 * protect either.
 */ const appendCreateFlags = node_fs__rspack_import_0.constants.O_APPEND | node_fs__rspack_import_0.constants.O_CREAT | node_fs__rspack_import_0.constants.O_WRONLY | (node_fs__rspack_import_0.constants.O_NOFOLLOW ?? 0);
/**
 * `mkdir` and `open` mask their mode argument with the umask, so the mode is
 * re-applied afterwards: that is what makes the result independent of the
 * shell that happened to start the daemon, and it is also the step that
 * migrates an already-owned 0755 install in place.
 */ const ensurePrivateDir = (dir)=>{
    if (currentUid() === null) {
        mkdirSync(dir, {
            recursive: true
        });
        return;
    }
    const existing = entryStats(dir);
    if (existing === undefined) {
        // Any ancestor this creates is application-created too, so it is made
        // private with the leaf; an ancestor that already exists is the
        // operator's and is left exactly as found.
        mkdirSync(dir, {
            recursive: true,
            mode: privateDirMode
        });
    } else {
        assertOwnedPrivateEntry(dir, existing, 'directory');
    }
    // Re-read rather than trust the check above: recursive `mkdir` resolves an
    // existing path with `stat`, so a symbolic link planted in the window
    // between them is accepted silently and the chmod would follow it. The
    // relocated socket's runtime directory is created in a shared temporary
    // root, where another account can reach that window.
    const created = entryStats(dir);
    if (created === undefined) {
        throw new UnsafeStatePathError(dir, 'it disappeared while being created');
    }
    assertOwnedPrivateEntry(dir, created, 'directory');
    chmodSync(dir, privateDirMode);
};
/** Tighten an entry that already exists; absent paths are left alone. */ const hardenPrivateEntry = (path, kind)=>{
    if (currentUid() === null) {
        return;
    }
    const existing = entryStats(path);
    if (existing === undefined) {
        return;
    }
    assertOwnedPrivateEntry(path, existing, kind);
    chmodSync(path, privateFileMode);
};
/**
 * Create `path` privately if it is absent, then tighten it. Writers call this
 * before their own `createWriteStream`/`appendFile`/`open`, so the mode is
 * settled before the first byte instead of depending on which writer got
 * there first.
 *
 * Creation is unconditional, including on hosts with no uids: callers such as
 * the singleton's `prepare` rely on this to bring the lock target into
 * existence, and only the mode and ownership enforcement is POSIX-only.
 */ const ensurePrivateFile = (path)=>{
    if (entryStats(path) === undefined) {
        closeSync(openSync(path, appendCreateFlags, privateFileMode));
    }
    hardenPrivateEntry(path, 'file');
};

__webpack_require__.d(__webpack_exports__, {
}, {
  Oq: currentUid
});


},
"./src/internal/platform/state-paths.ts"(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
/* import */ var node_crypto__rspack_import_0 = __webpack_require__("node:crypto");
/* import */ var node_fs__rspack_import_1 = __webpack_require__("node:fs");
/* import */ var node_os__rspack_import_2 = __webpack_require__("node:os");
/* import */ var node_path__rspack_import_3 = __webpack_require__("node:path");
/* import */ var _private_state_js__rspack_import_4 = __webpack_require__("./src/internal/platform/private-state.ts");





/**
 * Shared state-root resolution used by the daemon config, CLI, hooks, and
 * tests. Defaults must be machine-agnostic: a per-user cache directory
 * following each platform's convention, never a path that only exists on
 * one machine. Operators point elsewhere (a RAM disk, a shared volume)
 * exclusively through CARGO_HAULER_STATE_DIR / CARGO_HAULER_KACHE_INDEX.
 */ /**
 * Per-user cache base: `$XDG_CACHE_HOME` when set, else `~/Library/Caches`
 * on macOS, `%LOCALAPPDATA%` on Windows, `~/.cache` everywhere else.
 */ const userCacheDir = (env = process.env, platform = process.platform, home = (0,node_os__rspack_import_2.homedir)())=>{
    const xdgCacheHome = env.XDG_CACHE_HOME;
    if (xdgCacheHome !== undefined && xdgCacheHome.length > 0) {
        return xdgCacheHome;
    }
    if (platform === 'darwin') {
        return (0,node_path__rspack_import_3.join)(home, 'Library', 'Caches');
    }
    if (platform === 'win32') {
        const localAppData = env.LOCALAPPDATA;
        return localAppData !== undefined && localAppData.length > 0 ? localAppData : (0,node_path__rspack_import_3.join)(home, 'AppData', 'Local');
    }
    return (0,node_path__rspack_import_3.join)(home, '.cache');
};
const defaultStateDir = (env = process.env, platform = process.platform, home = (0,node_os__rspack_import_2.homedir)())=>(0,node_path__rspack_import_3.join)(userCacheDir(env, platform, home), 'cargo-hauler');
/**
 * The one state-dir resolution: a non-empty CARGO_HAULER_STATE_DIR wins,
 * otherwise use the per-user default. Daemon config and hook clients both
 * call this, so they cannot drift apart.
 */ const resolveStateDir = (env = process.env)=>{
    const current = env.CARGO_HAULER_STATE_DIR;
    if (current !== undefined && current.length > 0) {
        return current;
    }
    const fallback = defaultStateDir(env);
    try {
        // Package managers and operators commonly relocate the default cache onto
        // a larger local volume with a symlink. Resolve only this application-
        // chosen default; an explicit CARGO_HAULER_STATE_DIR retains the strict
        // no-symlink policy enforced by ensurePrivateDir.
        return (0,node_fs__rspack_import_1.realpathSync)(fallback);
    } catch  {
        return fallback;
    }
};
const namedPipePrefix = '\\\\.\\pipe\\';
const isNamedPipePath = (path)=>path.startsWith(namedPipePrefix);
/**
 * The daemon control endpoint for a state dir. On darwin/linux it is a unix
 * domain socket file inside the state dir. Windows IPC cannot bind a
 * filesystem `.sock` path — `net.Server.listen` needs a `\\.\pipe\` name —
 * so win32 derives a named pipe from the state dir (case-folded, since
 * Windows paths are case-insensitive), keeping the endpoint stable per
 * user/state-dir so every client reaches the same daemon.
 */ /**
 * Longest unix socket path the kernel accepts (`sun_path` less the NUL):
 * 103 bytes on macOS and the BSDs, 107 on Linux. A longer path fails to
 * bind, so the daemon never comes up and clients see it as stopped.
 */ const maxSocketPathBytes = (platform)=>platform === 'linux' ? 107 : 103;
const digestOf = (identity)=>(0,node_crypto__rspack_import_0.createHash)('sha256').update(identity).digest('hex').slice(0, 16);
/**
 * Windows paths are case-insensitive, so two spellings name one state dir
 * and must digest alike or clients split across pipes. Unix paths are
 * case-sensitive: folding them mapped case-distinct state dirs onto a single
 * control endpoint, pointing two independent daemons at one socket.
 */ const stateDirDigest = (stateDir, platform)=>digestOf(platform === 'win32' ? stateDir.toLowerCase() : stateDir);
/**
 * The directory a relocated socket lives in. `XDG_RUNTIME_DIR` is already
 * per-user, but `TMPDIR` and `/tmp` are shared, so the socket never sits
 * directly in a runtime root: it goes one level down into a directory the
 * daemon creates 0700. The uid keeps two accounts sharing one temp root from
 * deriving the same path, where the first to bind would own the name.
 */ const socketRuntimeDirName = (uid)=>`cargo-hauler-${uid === null ? 'anon' : uid}`;
/**
 * The daemon's control endpoint for a state dir: `daemon.sock` inside it on
 * unix, a named pipe on Windows. When the state dir is too deep for
 * `sun_path` (a realpath'd macOS temp root gets there), the socket moves to
 * an owner-private runtime directory under the first runtime root whose
 * resulting path still fits, keyed by a digest of the state dir, so every
 * process resolving that state dir still agrees on one endpoint.
 */ const daemonSocketPath = (stateDir, platform = process.platform, env = process.env, uid = (0,_private_state_js__rspack_import_4/* .currentUid */.Oq)())=>{
    const digest = stateDirDigest(stateDir, platform);
    if (platform === 'win32') {
        return `${namedPipePrefix}cargo-hauler-${digest}`;
    }
    const limit = maxSocketPathBytes(platform);
    const inState = (0,node_path__rspack_import_3.join)(stateDir, 'daemon.sock');
    if (Buffer.byteLength(inState) <= limit) {
        return inState;
    }
    const leaf = (0,node_path__rspack_import_3.join)(socketRuntimeDirName(uid), `${digest}.sock`);
    const candidates = [
        env.XDG_RUNTIME_DIR,
        env.TMPDIR,
        (0,node_os__rspack_import_2.tmpdir)()
    ].filter((root)=>root !== undefined && root.length > 0).map((root)=>(0,node_path__rspack_import_3.join)(root, leaf));
    // A runtime root long enough to overflow `sun_path` is no better than the
    // state dir it replaces, so the next one is tried. If none fit, the
    // shortest candidate at least fails at bind with a path worth reading.
    return candidates.find((candidate)=>Buffer.byteLength(candidate) <= limit) ?? candidates.reduce((shortest, candidate)=>Buffer.byteLength(candidate) < Buffer.byteLength(shortest) ? candidate : shortest, (0,node_path__rspack_import_3.join)((0,node_os__rspack_import_2.tmpdir)(), leaf));
};
/**
 * kache's configured store root, read from its own config
 * (`$XDG_CONFIG_HOME/kache/config.toml`, else `~/.config/kache/config.toml`):
 * the `local_store` key under `[cache]`. Guessing a sibling cache directory
 * would silently lose kache costs/status on any machine whose store lives
 * elsewhere (a dedicated fast disk is common); kache itself is the authority
 * for where its index is. The tolerant line match is deliberate — the value
 * is one quoted path and a TOML parser dependency buys nothing here.
 */ const kacheConfiguredStore = (env, home, read)=>{
    const configHome = env.XDG_CONFIG_HOME !== undefined && env.XDG_CONFIG_HOME.length > 0 ? env.XDG_CONFIG_HOME : (0,node_path__rspack_import_3.join)(home, '.config');
    let content;
    try {
        content = read((0,node_path__rspack_import_3.join)(configHome, 'kache', 'config.toml'));
    } catch  {
        return null;
    }
    const match = /^\s*local_store\s*=\s*"([^"]+)"/mu.exec(content);
    return match === null || match[1].length === 0 ? null : match[1];
};
/**
 * Default kache index when CARGO_HAULER_KACHE_INDEX is unset: the store
 * kache's own config names, else kache's sibling directory under the same
 * per-user cache base. A missing file is fine — kache status degrades to
 * unavailable and priors to defaults.
 */ const defaultKacheIndexPath = (env = process.env, platform = process.platform, home = (0,node_os__rspack_import_2.homedir)(), read = (path)=>(0,node_fs__rspack_import_1.readFileSync)(path, 'utf8'))=>{
    const configured = kacheConfiguredStore(env, home, read);
    return configured !== null ? (0,node_path__rspack_import_3.join)(configured, 'index.db') : (0,node_path__rspack_import_3.join)(userCacheDir(env, platform, home), 'kache', 'index.db');
};

__webpack_require__.d(__webpack_exports__, {
}, {
  $Q: daemonSocketPath,
  JT: resolveStateDir,
  rU: defaultKacheIndexPath
});


},
"./src/internal/storage/ticket-log.ts"(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
/* import */ var node_fs__rspack_import_0 = __webpack_require__("node:fs");
/* import */ var node_path__rspack_import_1 = __webpack_require__("node:path");
/* import */ var _platform_private_state_js__rspack_import_2 = __webpack_require__("./src/internal/platform/private-state.ts");
/* import */ var _contracts_protocol_js__rspack_import_3 = __webpack_require__("./src/internal/contracts/protocol.ts");





/**
 * Per-ticket full output logs: `<stateDir>/tickets/<ticket>.log` holds every
 * output chunk of a leader run as the broker emitted it, so a finished ticket
 * can be triaged after the fact instead of re-running the command (#68). The
 * ledger row keeps only a bounded tail; this file is the whole thing, up to
 * `CARGO_HAULER_TICKET_LOG_MAX_BYTES`.
 */ const ticketLogDirFor = (stateDir)=>(0,node_path__rspack_import_1.join)(stateDir, 'tickets');
const ticketLogPath = (directory, ticket)=>join(directory, `${ticket}.log`);
const truncationLine = (maxBytes)=>`\n[cargo-hauler] output log truncated at ${maxBytes} bytes (CARGO_HAULER_TICKET_LOG_MAX_BYTES); later output was not written\n`;
/**
 * One open log. Writes go through a single append stream for the life of the
 * run (no per-chunk `appendFileSync`); the stream buffers in memory and
 * drains on the event loop, and `close` waits for the flush so a
 * reader issued right after the exit sees complete content.
 * A stream error is remembered and silences the writer: the ticket's cargo
 * run must never fail because its log could not be written.
 */ class TicketLogWriter {
    path;
    #stream;
    #maxBytes;
    #written = 0;
    #truncated = false;
    #failed = false;
    constructor(path, stream, maxBytes){
        this.path = path;
        this.#stream = stream;
        this.#maxBytes = maxBytes;
        stream.on('error', ()=>{
            this.#failed = true;
        });
    }
    /** True once the byte bound was hit and the final truncation line was written. */ get truncated() {
        return this.#truncated;
    }
    get bytesWritten() {
        return this.#written;
    }
    write(data) {
        if (this.#failed || this.#truncated || data.byteLength === 0 || this.#stream.destroyed || this.#stream.writableEnded) {
            return;
        }
        if (this.#written + data.byteLength > this.#maxBytes) {
            this.#truncated = true;
            this.#push(Buffer.from(truncationLine(this.#maxBytes)));
            return;
        }
        this.#written += data.byteLength;
        this.#push(Buffer.from(data));
    }
    #push(chunk) {
        try {
            this.#stream.write(chunk);
        } catch  {
            this.#failed = true;
        }
    }
    /** Ends the stream and resolves once its buffered chunks reached the file (or it errored). */ close() {
        return Effect.callback((resume)=>{
            if (this.#stream.destroyed || this.#stream.writableEnded) {
                resume(Effect.void);
                return;
            }
            this.#stream.end(()=>resume(Effect.void));
        });
    }
}
/**
 * Opens `<directory>/<ticket>.log` for a leader about to start, creating the
 * directory on first use. Null when the directory cannot be created or the
 * stream cannot be constructed: the run proceeds without a log and the
 * ledger records no `output_path`. The file is truncated on open, not
 * appended to: a ticket runs as a leader at most once, so any existing file
 * is stale.
 */ const openTicketLog = (directory, ticket, maxBytes)=>{
    const path = ticketLogPath(directory, ticket);
    try {
        ensurePrivateDir(directory);
        // Complete command output is the most exposed thing the daemon writes;
        // the mode is settled before the stream opens so no chunk is ever
        // world-readable, not even briefly.
        ensurePrivateFile(path);
        return new TicketLogWriter(path, createWriteStream(path, {
            flags: 'w'
        }), maxBytes);
    } catch  {
        return null;
    }
};
const logFilePattern = /^(cc-\d+)\.log$/u;
/**
 * Startup pass: removes `cc-N.log` files whose ticket no longer has a ledger
 * row. Runs right after ledger retention, so the logs of the rows retention
 * just deleted go with them, along with anything left by a ledger reset.
 * Files that are not ticket logs are left alone. Returns the count removed.
 */ const sweepTicketLogs = (directory, ledger)=>Effect.gen(function*() {
        const entries = yield* Effect.sync(()=>{
            try {
                return readdirSync(directory);
            } catch  {
                return [];
            }
        });
        let removed = 0;
        for (const entry of entries){
            const match = logFilePattern.exec(entry);
            const id = match?.[1] === undefined ? null : parseTicket(match[1]);
            if (id === null) {
                continue;
            }
            if (yield* ledger.hasRequest(id)) {
                continue;
            }
            yield* Effect.sync(()=>{
                rmSync(join(directory, entry), {
                    force: true
                });
            });
            removed += 1;
        }
        return removed;
    });

__webpack_require__.d(__webpack_exports__, {
}, {
  RJ: ticketLogDirFor
});


},
"./src/internal/util/guards.ts"(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
const isRecord = (value)=>typeof value === 'object' && value !== null && !Array.isArray(value);

__webpack_require__.d(__webpack_exports__, {
}, {
  u: isRecord
});


},
"./src/providers/hauler-daemon.ts"(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
/* import */ var _internal_daemon_config_js__rspack_import_0 = __webpack_require__("./src/internal/daemon/config.ts");

function haulerDaemon() {
    return {
        config: (0,_internal_daemon_config_js__rspack_import_0/* .resolveDaemonConfig */.bF)()
    };
}

__webpack_require__.d(__webpack_exports__, {
  "default": () => (haulerDaemon)
});


},
"node:async_hooks"(module) {

module.exports = __rspack_external_node_async_hooks_4d8b1b4a;


},
"node:child_process"(module) {

module.exports = __rspack_external_node_child_process_cd435d64;


},
"node:crypto"(module) {

module.exports = __rspack_external_node_crypto_2e7c4b46;


},
"node:fs"(module) {

module.exports = __rspack_external_node_fs_1b05aee1;


},
"node:fs/promises"(module) {

module.exports = __rspack_external_node_fs_promises_3b710708;


},
"node:os"(module) {

module.exports = __rspack_external_node_os_4f3c9d58;


},
"node:path"(module) {

module.exports = __rspack_external_node_path_806ed179;


},
"node:url"(module) {

module.exports = __rspack_external_node_url_3991086a;


},
"./node_modules/.pnpm/@agent-bundle+runtime@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+@agent-bundle+run_8a520d7a3aaeaa0cabb76a1d5a9cc798/node_modules/@agent-bundle/runtime/dist/40.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var node_fs_promises__rspack_import_0 = __webpack_require__("node:fs/promises");
/* import */ var _736_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/@agent-bundle+runtime@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+@agent-bundle+run_8a520d7a3aaeaa0cabb76a1d5a9cc798/node_modules/@agent-bundle/runtime/dist/736.js");


const CODEX_ROLLOUT_HEAD_BYTES = 1048576;
const ROLLOUT_BASENAME = /rollout-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\.jsonl$/iu;
const codexThreadFromRolloutPath = (path)=>{
    if (void 0 === path) return;
    const match = ROLLOUT_BASENAME.exec(path);
    return match?.[1]?.toLowerCase();
};
const record = (value)=>null === value || 'object' != typeof value || Array.isArray(value) ? void 0 : value;
const codex_rollout_text = (value)=>'string' == typeof value && '' !== value.trim() ? value : void 0;
const parseCodexRolloutMeta = (head)=>{
    const newline = head.indexOf('\n');
    const line = (-1 === newline ? head : head.slice(0, newline)).trim();
    if ('' === line) return;
    let parsed;
    try {
        parsed = JSON.parse(line);
    } catch  {
        return;
    }
    const item = record(parsed);
    if (item?.['type'] !== 'session_meta') return;
    const payload = record(item['payload']);
    const thread = codex_rollout_text(payload?.['id']);
    if (void 0 === payload || void 0 === thread) return;
    const root = codex_rollout_text(payload['session_id']);
    const source = record(payload['source']);
    const subagent = record(source?.['subagent']);
    if (void 0 === subagent) {
        const kind = codex_rollout_text(source?.['subagent']);
        return {
            ...void 0 === kind ? {} : {
                subagentKind: kind
            },
            ...void 0 === root ? {} : {
                root
            },
            thread
        };
    }
    const [subagentKind] = Object.keys(subagent);
    const spawn = record(subagent['thread_spawn']);
    const parent = codex_rollout_text(spawn?.['parent_thread_id']) ?? codex_rollout_text(payload['parent_thread_id']);
    const rawDepth = spawn?.['depth'];
    const depth = 'number' == typeof rawDepth && Number.isInteger(rawDepth) && rawDepth > 0 ? rawDepth : void 0;
    const agentPath = codex_rollout_text(spawn?.['agent_path']) ?? codex_rollout_text(payload['agent_path']);
    return {
        ...void 0 === agentPath ? {} : {
            agentPath
        },
        ...void 0 === depth ? {} : {
            depth
        },
        ...void 0 === parent ? {} : {
            parent
        },
        ...void 0 === root ? {} : {
            root
        },
        ...void 0 === subagentKind ? {} : {
            subagentKind
        },
        thread
    };
};
const readCodexRolloutHead = async (path)=>{
    let handle;
    try {
        handle = await (0,node_fs_promises__rspack_import_0.open)(path, 'r');
        const buffer = Buffer.allocUnsafe(CODEX_ROLLOUT_HEAD_BYTES);
        let filled = 0;
        while(filled < buffer.length){
            const { bytesRead } = await handle.read(buffer, filled, buffer.length - filled, filled);
            if (0 === bytesRead) break;
            const newline = buffer.subarray(filled, filled + bytesRead).indexOf(0x0a);
            if (-1 !== newline) {
                filled += newline;
                break;
            }
            filled += bytesRead;
        }
        return buffer.subarray(0, filled).toString('utf8');
    } catch  {
        return;
    } finally{
        await handle?.close().catch(()=>void 0);
    }
};
const readCodexSpawnLineage = async (path, thread, read = readCodexRolloutHead)=>{
    if (void 0 === path) return;
    const head = await read(path);
    if (void 0 === head) return;
    const meta = parseCodexRolloutMeta(head);
    if (void 0 === meta || meta.thread !== thread || void 0 === meta.parent || void 0 === meta.depth) return;
    return {
        ...meta,
        depth: meta.depth,
        parent: meta.parent
    };
};
const nativeString = (native, key)=>{
    const value = native[key];
    return 'string' == typeof value && '' !== value.trim() ? value : void 0;
};
const lineageHostFromClient = (clientName)=>{
    if (void 0 === clientName) return;
    if (clientName.startsWith('claude')) return 'claude';
    if (clientName.startsWith('codex')) return 'codex';
    if (clientName.startsWith('cursor')) return 'cursor';
};
const lineageCarrier = (host, native)=>{
    switch(host){
        case 'claude':
            return {
                conversation: nativeString(native, 'agent_id') ?? nativeString(native, 'session_id'),
                generation: nativeString(native, 'prompt_id'),
                root: nativeString(native, 'session_id')
            };
        case 'codex':
            return {
                conversation: nativeString(native, 'agent_id') ?? nativeString(native, 'session_id'),
                generation: nativeString(native, 'turn_id'),
                root: nativeString(native, 'session_id')
            };
        case 'cursor':
            return {
                conversation: nativeString(native, 'conversation_id') ?? nativeString(native, 'session_id'),
                generation: nativeString(native, 'generation_id'),
                root: void 0
            };
        default:
            {
                const unreachable = host;
                throw new Error(`Unhandled lineage host ${String(unreachable)}`);
            }
    }
};
const resolveNativeLineage = (host, native)=>{
    const carrier = lineageCarrier(host, native);
    if ('cursor' === host || void 0 === carrier.conversation || void 0 === carrier.root) return (0,_736_js__rspack_import_1/* .unavailable */.hU)('no-shared-runtime');
    if (carrier.conversation !== carrier.root) return (0,_736_js__rspack_import_1/* .unavailable */.hU)('no-shared-runtime');
    return (0,_736_js__rspack_import_1/* .available */.qC)({
        conversation: carrier.root,
        depth: 0,
        ...void 0 === carrier.generation ? {} : {
            generation: carrier.generation
        },
        resolution: 'native',
        root: carrier.root
    }, 'native');
};
const resolveStandaloneLineage = async (host, native, read)=>{
    const fromPayload = resolveNativeLineage(host, native);
    if ('codex' !== host || 'available' === fromPayload.state) return fromPayload;
    const carrier = lineageCarrier(host, native);
    if (void 0 === carrier.conversation || void 0 === carrier.root) return fromPayload;
    const ownRollout = 'SubagentStop' === nativeString(native, 'hook_event_name') ? nativeString(native, "agent_transcript_path") : nativeString(native, "transcript_path");
    const spawn = await readCodexSpawnLineage(ownRollout, carrier.conversation, read);
    if (void 0 === spawn) return fromPayload;
    const type = nativeString(native, 'agent_type');
    return (0,_736_js__rspack_import_1/* .available */.qC)({
        conversation: carrier.conversation,
        depth: spawn.depth,
        ...void 0 === carrier.generation ? {} : {
            generation: carrier.generation
        },
        parent: spawn.parent,
        resolution: "transcript",
        root: carrier.root,
        subagent: {
            id: carrier.conversation,
            ...void 0 === type ? {} : {
                type
            }
        }
    }, 'derived');
};


__webpack_require__.d(__webpack_exports__, {
}, {
  Bu: resolveStandaloneLineage
});


},
"./node_modules/.pnpm/@agent-bundle+runtime@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+@agent-bundle+run_8a520d7a3aaeaa0cabb76a1d5a9cc798/node_modules/@agent-bundle/runtime/dist/49.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var node_crypto__rspack_import_0 = __webpack_require__("node:crypto");
/* import */ var node_fs__rspack_import_1 = __webpack_require__("node:fs");
/* import */ var node_os__rspack_import_2 = __webpack_require__("node:os");
/* import */ var node_path__rspack_import_3 = __webpack_require__("node:path");
/* import */ var _736_js__rspack_import_4 = __webpack_require__("./node_modules/.pnpm/@agent-bundle+runtime@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+@agent-bundle+run_8a520d7a3aaeaa0cabb76a1d5a9cc798/node_modules/@agent-bundle/runtime/dist/736.js");





const PLUGIN_ROOT_ENV_ANCHOR = 'AGENT_BUNDLE_PLUGIN_ROOT';
const PLUGIN_STATE_ROOT_ENV_ANCHOR = 'AGENT_BUNDLE_STATE_ROOT';
const PLUGIN_STATE_DIRECTORY = 'state';
const unexpandedToken = /\$\{[^}]*\}/u;
const defaultWarn = (message)=>{
    process.stderr.write(`${message}\n`);
};
const safePluginSegment = /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?$/u;
const pluginStateSegment = (root)=>{
    const canonicalRoot = (0,node_fs__rspack_import_1.existsSync)(root) ? (0,node_fs__rspack_import_1.realpathSync)(root) : (0,node_path__rspack_import_3.resolve)(root);
    const digest = (0,node_crypto__rspack_import_0.createHash)('sha256').update(canonicalRoot).digest('hex').slice(0, 16);
    const name = (0,node_path__rspack_import_3.basename)(canonicalRoot);
    return safePluginSegment.test(name) ? `${name}-${digest}` : `plugin-${digest}`;
};
const userStateHome = (env = process.env, home = (0,node_os__rspack_import_2.homedir)())=>{
    const xdgStateHome = env.XDG_STATE_HOME ?? '';
    return (0,node_path__rspack_import_3.isAbsolute)(xdgStateHome) ? (0,node_path__rspack_import_3.join)(xdgStateHome, 'agent-bundle') : (0,node_path__rspack_import_3.join)(home, '.agent-bundle', PLUGIN_STATE_DIRECTORY);
};
const userDataStateRoot = (root, env, home)=>(0,node_path__rspack_import_3.join)(userStateHome(env, home), pluginStateSegment(root));
const resolvePluginRoot = (options)=>{
    const env = options.env ?? process.env;
    const declared = env[PLUGIN_ROOT_ENV_ANCHOR] ?? '';
    let root;
    let source;
    if ('' === declared.trim()) {
        root = (0,node_path__rspack_import_3.resolve)(options.fallback);
        source = 'derived';
    } else if (unexpandedToken.test(declared)) {
        (options.warn ?? defaultWarn)(`[agent-bundle] ${PLUGIN_ROOT_ENV_ANCHOR} is the unexpanded token ${JSON.stringify(declared)}; anchoring the plugin on ${(0,node_path__rspack_import_3.resolve)(options.fallback)} instead.`);
        root = (0,node_path__rspack_import_3.resolve)(options.fallback);
        source = 'derived';
    } else {
        root = (0,node_path__rspack_import_3.resolve)(declared);
        source = 'native';
    }
    const derivedStateRoot = 'user-data' === options.stateAnchor ? userDataStateRoot(root, env, options.home) : (0,node_path__rspack_import_3.join)(root, PLUGIN_STATE_DIRECTORY);
    const declaredStateRoot = env[PLUGIN_STATE_ROOT_ENV_ANCHOR] ?? '';
    let stateRoot;
    let stateSource;
    if ('' === declaredStateRoot.trim()) {
        stateRoot = derivedStateRoot;
        stateSource = 'derived';
    } else if (unexpandedToken.test(declaredStateRoot)) {
        (options.warn ?? defaultWarn)(`[agent-bundle] ${PLUGIN_STATE_ROOT_ENV_ANCHOR} is the unexpanded token ${JSON.stringify(declaredStateRoot)}; anchoring state on ${derivedStateRoot} instead.`);
        stateRoot = derivedStateRoot;
        stateSource = 'derived';
    } else {
        stateRoot = (0,node_path__rspack_import_3.resolve)(declaredStateRoot);
        stateSource = 'native';
    }
    return Object.freeze({
        identity: (0,_736_js__rspack_import_4/* .available */.qC)({
            root,
            stateRoot
        }, source),
        root,
        source,
        stateRoot,
        stateSource
    });
};


__webpack_require__.d(__webpack_exports__, {
}, {
  E7: resolvePluginRoot
});


},
"./node_modules/.pnpm/@agent-bundle+runtime@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+@agent-bundle+run_8a520d7a3aaeaa0cabb76a1d5a9cc798/node_modules/@agent-bundle/runtime/dist/736.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var node_async_hooks__rspack_import_0 = __webpack_require__("node:async_hooks");

const AGENT_REQUEST_STORE_VERSION = 6;
const STORE_SYMBOL = Symbol.for('@agent-bundle/runtime/request-store');
class AgentRequestError extends Error {
    code;
    constructor(code, message){
        super(message);
        this.code = code;
        this.name = 'AgentRequestError';
    }
}
const freezeValue = (value)=>{
    if (Array.isArray(value)) return Object.freeze(value.map((item)=>freezeValue(item)));
    if (null !== value && 'object' == typeof value && Object.getPrototypeOf(value) === Object.prototype) {
        const copy = {};
        for (const [key, nested] of Object.entries(value))copy[key] = freezeValue(nested);
        return Object.freeze(copy);
    }
    return value;
};
const available = (value, source)=>Object.freeze({
        source,
        state: 'available',
        value: freezeValue(value)
    });
const unavailable = (reason = 'not-provided')=>Object.freeze({
        reason,
        state: 'unavailable'
    });
const snapshotObserved = (observed)=>'available' === observed.state ? available(observed.value, observed.source) : unavailable(observed.reason);
const silentProgress = Object.freeze({
    report: async ()=>void 0
});
const emptyCapabilities = ()=>Object.freeze({
        command: unavailable(),
        filesystem: unavailable(),
        network: unavailable(),
        projectRoot: unavailable()
    });
const snapshotCapabilities = (capabilities)=>Object.freeze({
        command: snapshotObserved(capabilities.command),
        filesystem: snapshotObserved(capabilities.filesystem),
        network: snapshotObserved(capabilities.network),
        projectRoot: snapshotObserved(capabilities.projectRoot)
    });
const optionalText = (value)=>{
    if (void 0 === value) return;
    if ('' === value.trim()) throw new AgentRequestError('invalid-invocation', 'Agent invocation fields must be non-empty when present');
    return value;
};
const invocationFrom = (input)=>Object.freeze({
        id: optionalText(input.id) ?? crypto.randomUUID(),
        kind: input.kind,
        startedAt: optionalText(input.startedAt) ?? new Date().toISOString(),
        ...void 0 === input.artifactEpoch ? {} : {
            artifactEpoch: optionalText(input.artifactEpoch)
        },
        ...void 0 === input.hostContractRevision ? {} : {
            hostContractRevision: optionalText(input.hostContractRevision)
        },
        ...void 0 === input.operationId ? {} : {
            operationId: optionalText(input.operationId)
        },
        ...void 0 === input.protocolRevision ? {} : {
            protocolRevision: optionalText(input.protocolRevision)
        },
        ...void 0 === input.sourceRevision ? {} : {
            sourceRevision: optionalText(input.sourceRevision)
        },
        ...void 0 === input.surface ? {} : {
            surface: optionalText(input.surface)
        }
    });
class Lease {
    values;
    closed = false;
    handle;
    constructor(values){
        this.values = values;
        this.handle = createHandle(this);
    }
}
const realm = globalThis;
const getStore = ()=>{
    const existing = realm[STORE_SYMBOL];
    if (void 0 !== existing) {
        if (existing.version !== AGENT_REQUEST_STORE_VERSION) throw new AgentRequestError('store-version-conflict', `Incompatible @agent-bundle/runtime request store version: found ${String(existing.version)}, expected ${String(AGENT_REQUEST_STORE_VERSION)}`);
        return existing;
    }
    const created = {
        storage: new node_async_hooks__rspack_import_0.AsyncLocalStorage(),
        version: AGENT_REQUEST_STORE_VERSION
    };
    realm[STORE_SYMBOL] = created;
    return created;
};
const agent_request_open = (lease)=>{
    if (lease.closed) throw new AgentRequestError('request-closed', 'agent() used after the request completed');
    return lease.values;
};
const createHandle = (lease)=>Object.freeze({
        get invocation () {
            return agent_request_open(lease).invocation;
        },
        get host () {
            return agent_request_open(lease).host;
        },
        get session () {
            return agent_request_open(lease).session;
        },
        get actor () {
            return agent_request_open(lease).actor;
        },
        get workspace () {
            return agent_request_open(lease).workspace;
        },
        get plugin () {
            return agent_request_open(lease).plugin;
        },
        get lineage () {
            return agent_request_open(lease).lineage;
        },
        get terminal () {
            return agent_request_open(lease).terminal;
        },
        get capabilities () {
            return agent_request_open(lease).capabilities;
        },
        get progress () {
            return agent_request_open(lease).progress;
        },
        get signal () {
            return agent_request_open(lease).signal;
        },
        get services () {
            return agent_request_open(lease).services;
        },
        get process () {
            return agent_request_open(lease).process;
        },
        async provider (key) {
            const values = agent_request_open(lease);
            values.signal.throwIfAborted();
            const value = await values.provider(key);
            agent_request_open(lease).signal.throwIfAborted();
            return value;
        },
        get state () {
            return agent_request_open(lease).state;
        },
        get notices () {
            return agent_request_open(lease).notices;
        }
    });
const currentLease = ()=>{
    const lease = getStore().storage.getStore();
    if (void 0 === lease) throw new AgentRequestError('outside-invocation', 'agent() used outside a real invocation');
    return lease;
};
const currentAgentRequest = ()=>{
    const lease = getStore().storage.getStore();
    return void 0 === lease || lease.closed ? void 0 : lease.handle;
};
const agent = async ()=>{
    const lease = currentLease();
    agent_request_open(lease);
    return lease.handle;
};
const useAgent = ()=>{
    const lease = currentLease();
    agent_request_open(lease);
    return lease.handle;
};
const runAgentRequest = async (init, operation)=>{
    const actor = snapshotObserved(init.actor ?? unavailable());
    const host = snapshotObserved(init.host ?? unavailable());
    const invocation = invocationFrom(init.invocation);
    const lineage = snapshotObserved(init.lineage ?? unavailable());
    const plugin = snapshotObserved(init.plugin ?? unavailable());
    const session = snapshotObserved(init.session ?? unavailable());
    const signal = init.signal ?? new AbortController().signal;
    const terminal = snapshotObserved(init.terminal ?? unavailable());
    const workspace = snapshotObserved(init.workspace ?? unavailable());
    const noticeLease = void 0 === init.noticeLedger ? void 0 : await init.noticeLedger.openRequest({
        invocation,
        principal: Object.freeze({
            actor,
            host,
            lineage,
            session,
            workspace
        }),
        signal
    });
    try {
        const providers = 'function' == typeof init.providers ? await resolveProvidersDetached(init.providers, providerRequest({
            host,
            lineage,
            notices: noticeLease?.handle,
            plugin,
            session,
            signal,
            state: init.state,
            workspace
        })) : init.providers;
        const providerPromises = new Map();
        const request = providerRequest({
            host,
            lineage,
            notices: noticeLease?.handle,
            plugin,
            session,
            signal,
            state: init.state,
            workspace
        });
        const values = Object.freeze({
            provider: (key)=>{
                let pending = providerPromises.get(key);
                if (void 0 === pending) {
                    pending = getStore().storage.exit(async ()=>{
                        if (void 0 !== providers && Object.hasOwn(providers, key)) return providers[key];
                        if (void 0 === init.resolveProvider) throw new TypeError(`Unknown provider ${JSON.stringify(key)}.`);
                        return init.resolveProvider(key, request);
                    });
                    providerPromises.set(key, pending);
                }
                return pending;
            },
            actor,
            capabilities: snapshotCapabilities(init.capabilities ?? emptyCapabilities()),
            host,
            invocation,
            lineage,
            notices: noticeLease?.handle,
            plugin,
            progress: init.progress ?? silentProgress,
            process: void 0 === init.process ? void 0 : Object.freeze({
                ...init.process
            }),
            services: Object.freeze({
                ...init.services ?? {}
            }),
            session,
            signal,
            state: init.state,
            terminal,
            workspace
        });
        const lease = new Lease(values);
        try {
            return await getStore().storage.run(lease, operation);
        } finally{
            lease.closed = true;
        }
    } finally{
        noticeLease?.close();
    }
};
const resolveProvidersDetached = (resolver, request)=>getStore().storage.exit(async ()=>resolver(request));
const providerRequest = ({ notices, state, ...axes })=>Object.freeze({
        ...axes,
        ...void 0 === notices ? {} : {
            notices: Object.freeze({
                inbox: ()=>notices.inbox(),
                published: ()=>notices.published()
            })
        },
        ...void 0 === state ? {} : {
            state: Object.freeze({
                lifetime: state.lifetime,
                read: (options)=>state.read(options)
            })
        }
    });


__webpack_require__.d(__webpack_exports__, {
}, {
  MA: agent,
  fJ: useAgent,
  hU: unavailable,
  iC: runAgentRequest,
  qC: available
});


},
"./node_modules/.pnpm/@agent-bundle+runtime@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+@agent-bundle+run_8a520d7a3aaeaa0cabb76a1d5a9cc798/node_modules/@agent-bundle/runtime/dist/request.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _736_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/@agent-bundle+runtime@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+@agent-bundle+run_8a520d7a3aaeaa0cabb76a1d5a9cc798/node_modules/@agent-bundle/runtime/dist/736.js");
var request_AGENT_REQUEST_STORE_VERSION = 6;
var request_PLUGIN_STATE_DIRECTORY = "state";




__webpack_require__.d(__webpack_exports__, {
  agent: () => (/* reexport safe */ _736_js__rspack_import_0.MA)
});


},
"./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/242~1.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
function getEnumValues(entries) {
    const numericValues = Object.values(entries).filter((v)=>"number" == typeof v);
    const values = Object.entries(entries).filter(([k, _])=>-1 === numericValues.indexOf(+k)).map(([_, v])=>v);
    return values;
}
function joinValues(array, separator = "|") {
    return array.map((val)=>stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
    if ("bigint" == typeof value) return value.toString();
    return value;
}
class Cached {
    constructor(getter){
        this._getter = getter;
        this._value = void 0;
    }
    get value() {
        const getter = this._getter;
        if (void 0 !== getter) {
            this._value = getter();
            this._getter = void 0;
        }
        return this._value;
    }
}
function util_cached(getter) {
    return new Cached(getter);
}
function nullish(input) {
    return null == input;
}
function cleanRegex(source) {
    const start = source.startsWith("^") ? 1 : 0;
    const end = source.endsWith("$") ? source.length - 1 : source.length;
    return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
    const ratio = val / step;
    const roundedRatio = Math.round(ratio);
    const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
    if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
    return ratio - roundedRatio;
}
function util_assignProp(target, prop, value) {
    Object.defineProperty(target, prop, {
        value,
        writable: true,
        enumerable: true,
        configurable: true
    });
}
function rawShape(def) {
    const desc = Object.getOwnPropertyDescriptor(def, "shape");
    return desc?.get ? desc.get.raw : desc?.value;
}
function sourceShape(schema) {
    return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
function deferProp(target, key, getter) {
    Object.defineProperty(target, key, {
        get () {
            const value = getter();
            util_assignProp(this, key, value);
            return value;
        },
        enumerable: true,
        configurable: true
    });
}
function putProp(target, key, value) {
    if (key in target) util_assignProp(target, key, value);
    else target[key] = value;
}
function mirrorShape(target, source, keys, wrap) {
    const raw = sourceShape(source);
    for (const key of keys){
        const desc = Object.getOwnPropertyDescriptor(raw, key);
        if (desc.enumerable) if (desc.get) deferProp(target, key, ()=>{
            const value = source._zod.def.shape[key];
            return wrap ? wrap(value, key) : value;
        });
        else putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
    }
}
function mirrorProps(target, source) {
    for (const key of Reflect.ownKeys(source)){
        const desc = Object.getOwnPropertyDescriptor(source, key);
        if (desc.enumerable) if (desc.get) deferProp(target, key, ()=>source[key]);
        else putProp(target, key, desc.value);
    }
}
function mergeDefs(...defs) {
    const mergedDescriptors = {};
    for (const def of defs){
        const descriptors = Object.getOwnPropertyDescriptors(def);
        Object.assign(mergedDescriptors, descriptors);
    }
    return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
    return JSON.stringify(str);
}
function slugify(input) {
    return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
const captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args)=>{};
function util_isObject(data) {
    return "object" == typeof data && null !== data && !Array.isArray(data);
}
const util_allowsEval = /* @__PURE__*/ util_cached(()=>{
    if (globalConfig.jitless) return false;
    if ("u" > typeof navigator && navigator?.userAgent?.includes("Cloudflare")) return false;
    try {
        const F = Function;
        new F("");
        return true;
    } catch (_) {
        return false;
    }
});
function isPlainObject(o) {
    if (false === util_isObject(o)) return false;
    const ctor = o.constructor;
    if (void 0 === ctor) return true;
    if ("function" != typeof ctor) return true;
    const prot = ctor.prototype;
    if (false === util_isObject(prot)) return false;
    if (false === Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf")) return false;
    return true;
}
function shallowClone(o) {
    if (isPlainObject(o)) return {
        ...o
    };
    if (Array.isArray(o)) return [
        ...o
    ];
    if (o instanceof Map) return new Map(o);
    if (o instanceof Set) return new Set(o);
    return o;
}
const propertyKeyTypes = /* @__PURE__*/ new Set([
    "string",
    "number",
    "symbol"
]);
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
    const cl = new inst._zod.constr(def ?? inst._zod.def);
    if (!def || params?.parent) cl._zod.parent = inst;
    return cl;
}
function normalizeParams(_params) {
    const params = _params;
    if (!params) return {};
    if ("string" == typeof params) return {
        error: ()=>params
    };
    if (params?.message !== void 0) {
        if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
        params.error = params.message;
    }
    delete params.message;
    if ("string" == typeof params.error) return {
        ...params,
        error: ()=>params.error
    };
    return params;
}
function stringifyPrimitive(value) {
    if ("bigint" == typeof value) return value.toString() + "n";
    if ("string" == typeof value) return `"${value}"`;
    return `${value}`;
}
function optionalKeys(shape) {
    return Object.keys(shape).filter((k)=>void 0 !== shape[k]._zod.optin && "optional" === shape[k]._zod.optout);
}
// Wrapped in a `@__PURE__` IIFE: esbuild never tree-shakes a top-level initializer that contains a member access on `Number`, so the bare object literal survived into every bundle.
const NUMBER_FORMAT_RANGES = /*@__PURE__*/ (()=>({
        safeint: [
            Number.MIN_SAFE_INTEGER,
            Number.MAX_SAFE_INTEGER
        ],
        int32: [
            -2147483648,
            2147483647
        ],
        uint32: [
            0,
            4294967295
        ],
        float32: [
            -3.4028234663852886e+38,
            3.4028234663852886e38
        ],
        float64: [
            -Number.MAX_VALUE,
            Number.MAX_VALUE
        ]
    }))();
const BIGINT_FORMAT_RANGES = {
    int64: [
        /* @__PURE__*/ BigInt("-9223372036854775808"),
        /* @__PURE__*/ BigInt("9223372036854775807")
    ],
    uint64: [
        /* @__PURE__*/ BigInt(0),
        /* @__PURE__*/ BigInt("18446744073709551615")
    ]
};
function pick(schema, mask) {
    const currDef = schema._zod.def;
    const checks = currDef.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) throw new Error(".pick() cannot be used on object schemas containing refinements");
    const newShape = {};
    mirrorShape(newShape, schema, maskedKeys(schema, mask));
    return clone(schema, mergeDefs(currDef, {
        shape: newShape,
        checks: []
    }));
}
function maskedKeys(schema, mask) {
    const raw = sourceShape(schema);
    const keys = [];
    for (const key of Reflect.ownKeys(mask)){
        if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) throw new Error(`Unrecognized key: "${String(key)}"`);
        if (mask[key]) keys.push(key);
    }
    return keys;
}
function omit(schema, mask) {
    const currDef = schema._zod.def;
    const checks = currDef.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) throw new Error(".omit() cannot be used on object schemas containing refinements");
    const omitted = new Set(maskedKeys(schema, mask));
    const newShape = {};
    mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key)=>!omitted.has(key)));
    return clone(schema, mergeDefs(currDef, {
        shape: newShape,
        checks: []
    }));
}
function extend(schema, shape) {
    if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
    const checks = schema._zod.def.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) {
        const existingShape = sourceShape(schema);
        for (const key of Reflect.ownKeys(shape))if (void 0 !== Object.getOwnPropertyDescriptor(existingShape, key)) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
    }
    return clone(schema, mergeDefs(schema._zod.def, {
        shape: extended(schema, shape)
    }));
}
function extended(schema, shape) {
    const newShape = {};
    mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
    mirrorProps(newShape, shape);
    return newShape;
}
function safeExtend(schema, shape) {
    if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
    return clone(schema, mergeDefs(schema._zod.def, {
        shape: extended(schema, shape)
    }));
}
function util_merge(a, b) {
    if (!b?._zod?.def) throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
    if (a._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
    const newShape = {};
    mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
    mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
    const def = mergeDefs(a._zod.def, {
        shape: newShape,
        get catchall () {
            return b._zod.def.catchall;
        },
        checks: b._zod.def.checks ?? []
    });
    return clone(a, def);
}
function partial(Class, schema, mask, name = "partial") {
    const currDef = schema._zod.def;
    const checks = currDef.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
    const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
    const newShape = {};
    mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class && ((value, key)=>selected && !selected.has(key) ? value : new Class({
            type: "optional",
            innerType: value
        })));
    return clone(schema, mergeDefs(schema._zod.def, {
        shape: newShape,
        checks: []
    }));
}
function util_required(Class, schema, mask) {
    const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
    const newShape = {};
    mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key)=>selected && !selected.has(key) ? value : new Class({
            type: "nonoptional",
            innerType: value
        }));
    return clone(schema, mergeDefs(schema._zod.def, {
        shape: newShape
    }));
}
function aborted(x, startIndex = 0) {
    if (true === x.aborted) return true;
    for(let i = startIndex; i < x.issues.length; i++)if (x.issues[i]?.continue !== true) return true;
    return false;
}
function explicitlyAborted(x, startIndex = 0) {
    if (true === x.aborted) return true;
    for(let i = startIndex; i < x.issues.length; i++)if (x.issues[i]?.continue === false) return true;
    return false;
}
function prefixIssues(path, issues) {
    return issues.map((iss)=>{
        var _a;
        (_a = iss).path ?? (_a.path = []);
        iss.path.unshift(path);
        return iss;
    });
}
function unwrapMessage(message) {
    return "string" == typeof message ? message : message?.message;
}
function attachSchema(issues, start, inst) {
    var _a;
    for(let i = start; i < issues.length; i++)(_a = issues[i]).schema ?? (_a.schema = inst);
}
function finalizeIssue(iss, ctx, config) {
    var _a;
    const traits = iss.inst?._zod?.traits;
    if (traits?.has("$ZodType")) if (traits.has("$ZodCheck")) (_a = iss).schema ?? (_a.schema = iss.inst);
    else iss.schema = iss.inst;
    const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
    const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
    const full = {};
    for (const k of Object.keys(iss))if ("inst" !== k && "schema" !== k && "continue" !== k && "input" !== k && "__proto__" !== k) full[k] = iss[k];
    full.path ?? (full.path = []);
    full.message = message;
    if (ctx?.reportInput) full.input = iss.input;
    return full;
}
const highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
    const units = str.length;
    if (!highSurrogate.test(str)) return units;
    let count = units;
    for(let i = 0; i < units - 1; i++)if ((0xfc00 & str.charCodeAt(i)) === 0xd800 && (0xfc00 & str.charCodeAt(i + 1)) === 0xdc00) {
        count--;
        i++;
    }
    return count;
}
function getLengthableOrigin(input) {
    if (Array.isArray(input)) return "array";
    if ("string" == typeof input) return "string";
    return "unknown";
}
function parsedType(data) {
    const t = typeof data;
    switch(t){
        case "number":
            return Number.isNaN(data) ? "nan" : "number";
        case "object":
            {
                if (null === data) return "null";
                if (Array.isArray(data)) return "array";
                const obj = data;
                if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) return obj.constructor.name;
            }
    }
    return t;
}
function util_issue(...args) {
    const [iss, input, inst] = args;
    if ("string" == typeof iss) return {
        message: iss,
        code: "custom",
        input,
        inst
    };
    return {
        ...iss
    };
}
function util_members(proto, table) {
    for(const key in table){
        const desc = Object.getOwnPropertyDescriptor(table, key);
        if (desc.get) Object.defineProperty(proto, key, {
            ...desc,
            enumerable: false
        });
        else defineBound(proto, key, desc.value);
    }
}
function util_own(inst, key, value, enumerable = true) {
    Object.defineProperty(inst, key, {
        configurable: true,
        writable: true,
        enumerable,
        value
    });
    return value;
}
function hide(inst, key, value) {
    return util_own(inst, key, value, false);
}
function derived(computes, table) {
    for(const key in computes){
        const compute = computes[key];
        Object.defineProperty(table, key, {
            configurable: true,
            enumerable: true,
            get () {
                return util_own(this, key, compute(this));
            },
            set (value) {
                util_own(this, key, value);
            }
        });
    }
    return table;
}
function defineBound(proto, key, fn) {
    Object.defineProperty(proto, key, {
        configurable: true,
        get () {
            return this == null ? fn : util_own(this, key, fn.bind(this));
        },
        set (value) {
            util_own(this, key, value);
        }
    });
}
function claim(inst, sentinel) {
    const proto = Object.getPrototypeOf(inst);
    return sentinel in proto ? void 0 : proto;
}
let installing;
let broke = false;
const breaker = {
    configurable: true,
    get () {
        broke = true;
    }
};
function defineLazyInternal(inst, key, compute) {
    const proto = Object.getPrototypeOf(inst._zod);
    if (key in proto && installing !== inst._zod) {
        installing = void 0;
        return;
    }
    installing = inst._zod;
    Object.defineProperty(proto, key, {
        configurable: true,
        get () {
            Object.defineProperty(this, key, breaker);
            const outer = broke;
            broke = false;
            try {
                const value = compute(this);
                if (broke) delete this[key];
                else Object.defineProperty(this, key, {
                    configurable: true,
                    writable: true,
                    value
                });
                broke = broke || outer;
                return value;
            } catch (err) {
                delete this[key];
                broke = broke || outer;
                throw err;
            }
        },
        set (value) {
            Object.defineProperty(this, key, {
                configurable: true,
                writable: true,
                value
            });
        }
    });
}
function installLazyProp(inst, key, make, enumerable) {
    const proto = claim(inst, key);
    if (!proto) return;
    Object.defineProperty(proto, key, {
        configurable: true,
        get () {
            const desc = {
                configurable: true,
                writable: true,
                enumerable,
                value: void 0
            };
            Object.defineProperty(this, key, desc);
            desc.value = make(this);
            Object.defineProperty(this, key, desc);
            return desc.value;
        },
        set (value) {
            Object.defineProperty(this, key, {
                configurable: true,
                writable: true,
                enumerable,
                value
            });
        }
    });
}
const CONSTANT_CATCH = "~constantCatch";
function constantCatch(value) {
    const fn = ()=>value;
    fn[CONSTANT_CATCH] = true;
    return fn;
}
var core_a;
const _zodDesc = {
    value: void 0,
    enumerable: false
};
let _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
    const E = _E;
    if (E) {
        const saved = E.stackTraceLimit;
        if ("number" == typeof saved) {
            try {
                E.stackTraceLimit = 0;
            } catch  {
                _E = null;
                return new Definition();
            }
            try {
                return new Definition();
            } finally{
                E.stackTraceLimit = saved;
            }
        }
    }
    return new Definition();
}
function $constructor(name, initializer, proto, params) {
    const zodProto = {};
    function Internals(def) {
        this.def = def;
        this.constr = _;
        this.traits = new Set();
    }
    Internals.prototype = zodProto;
    const protoMembers = proto;
    const initialized = protoMembers && new WeakSet();
    function init(inst, def) {
        if (inst._zod) {
            if (inst._zod.traits.has(name)) return;
        } else {
            _zodDesc.value = new Internals(def);
            try {
                Object.defineProperty(inst, "_zod", _zodDesc);
            } finally{
                _zodDesc.value = void 0;
            }
        }
        inst._zod.traits.add(name);
        initializer(inst, def);
        if (initialized) {
            const own = Object.getPrototypeOf(inst);
            const ctorProto = inst._zod.constr.prototype;
            let up = own;
            while(up && up !== ctorProto)up = Object.getPrototypeOf(up);
            const target = up ?? own;
            if (!initialized.has(target)) {
                initialized.add(target);
                util_members(target, protoMembers);
            }
        }
        const proto = _.prototype;
        for(const k in proto)if (Object.prototype.hasOwnProperty.call(proto, k)) {
            if (!(k in inst)) inst[k] = proto[k].bind(inst);
        }
    }
    const Parent = params?.Parent ?? Object;
    class Definition extends Parent {
    }
    Object.defineProperty(Definition, "name", {
        value: name
    });
    function _(def) {
        const inst = params?.Parent ? newError(Definition) : this;
        init(inst, def);
        const deferred = inst._zod.deferred;
        if (deferred) {
            for (const fn of deferred)fn();
            inst._zod.deferred = void 0;
        }
        const pp = globalThis.__zod_globalConfig?.postProcessor;
        if (pp) pp(inst);
        return inst;
    }
    Object.defineProperty(_, "init", {
        value: init
    });
    Object.defineProperty(_, Symbol.hasInstance, {
        value: (inst)=>{
            if (params?.Parent && inst instanceof params.Parent) return true;
            return inst?._zod?.traits?.has(name);
        }
    });
    Object.defineProperty(_, "name", {
        value: name
    });
    return _;
}
class $ZodAsyncError extends Error {
    constructor(){
        super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
    }
}
class $ZodEncodeError extends Error {
    constructor(name){
        super(`Encountered unidirectional transform during encode: ${name}`);
        this.name = "ZodEncodeError";
    }
}
(core_a = globalThis).__zod_globalConfig ?? (core_a.__zod_globalConfig = {});
const globalConfig = globalThis.__zod_globalConfig;
function core_config(newConfig) {
    if (newConfig) Object.assign(globalConfig, newConfig);
    return globalConfig;
}
class $ZodCyclicError extends Error {
    constructor(){
        super("Cannot parse a reference cycle that closes through a transform");
        this.name = "ZodCyclicError";
    }
}
const STATE = "~memo";
const NO_ISSUES = [];
function isRef(value) {
    return null !== value && "object" == typeof value;
}
function cloneIssues(issues) {
    return issues.map((iss)=>iss.path ? {
            ...iss,
            path: iss.path.slice()
        } : {
            ...iss
        });
}
const recursive = /*@__PURE__*/ new WeakMap();
const NONE = 0;
const ASSUMED = 1;
const PROVEN = 2;
function isRecursive(inst, stack, resolve) {
    const cached = recursive.get(inst);
    if (void 0 !== cached) return cached ? PROVEN : NONE;
    if (stack.has(inst)) return PROVEN;
    stack.add(inst);
    let result = NONE;
    const check = (child)=>{
        if (result !== PROVEN && child?._zod) {
            const answer = isRecursive(child, stack, resolve);
            if (answer > result) result = answer;
        }
    };
    const shape = (sh, spread)=>{
        let answer = NONE;
        for (const key of Reflect.ownKeys(sh)){
            const desc = Object.getOwnPropertyDescriptor(sh, key);
            if (spread && !desc.enumerable) continue;
            const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
            if (child > answer) answer = child;
        }
        return answer;
    };
    const merge = (answer)=>{
        if (answer > result) result = answer;
    };
    const def = inst._zod.def;
    const kind = def.type;
    switch(kind){
        case "object":
            {
                const raw = rawShape(def);
                merge(raw ? shape(raw, true) : ASSUMED);
                check(def.catchall);
                break;
            }
        case "array":
            check(def.element);
            break;
        case "tuple":
            for (const el of def.items)check(el);
            check(def.rest);
            break;
        case "record":
        case "map":
            check(def.keyType);
            check(def.valueType);
            break;
        case "set":
            check(def.valueType);
            break;
        case "union":
            for (const el of def.options)check(el);
            break;
        case "intersection":
            check(def.left);
            check(def.right);
            break;
        case "optional":
        case "nullable":
        case "default":
        case "prefault":
        case "catch":
        case "readonly":
        case "nonoptional":
        case "promise":
        case "success":
            check(def.innerType);
            break;
        case "pipe":
            check(def.in);
            check(def.out);
            break;
        case "function":
            check(def.input);
            check(def.output);
            break;
        case "lazy":
            {
                const inner = def._cachedInner ?? (resolve ? inst._zod.innerType : void 0);
                merge(inner ? isRecursive(inner, stack, false) : ASSUMED);
                break;
            }
        case "template_literal":
        case "string":
        case "number":
        case "int":
        case "boolean":
        case "bigint":
        case "symbol":
        case "undefined":
        case "null":
        case "void":
        case "never":
        case "any":
        case "unknown":
        case "date":
        case "nan":
        case "enum":
        case "literal":
        case "file":
        case "transform":
        case "custom":
            break;
        default:
            for(const key in def){
                const desc = Object.getOwnPropertyDescriptor(def, key);
                if (!desc || desc.get) continue;
                const value = desc.value;
                if (value && "object" == typeof value) {
                    if (value._zod) check(value);
                    else if (Array.isArray(value)) for (const el of value)check(el);
                }
            }
    }
    stack.delete(inst);
    return settle(inst, result);
}
function settle(inst, answer) {
    if (answer !== ASSUMED) recursive.set(inst, answer === PROVEN);
    return answer;
}
function bucketFor(state, inst) {
    let bucket = state.buckets.get(inst);
    if (!bucket) {
        bucket = new WeakMap();
        state.buckets.set(inst, bucket);
    }
    return bucket;
}
let handoff;
const memoizer_open = [];
const memoizer_memo = {
    alloc (_inst, payload, empty) {
        const bucket = handoff;
        if (!bucket) return empty;
        handoff = void 0;
        const entry = {
            value: empty,
            issues: null
        };
        bucket.set(payload.value, entry);
        memoizer_open.push(entry);
        return empty;
    },
    guard (inst) {
        var _a;
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        inst._zod.deferred.push(()=>{
            const base = inst._zod.parse;
            const wrapped = (payload, ctx)=>{
                if ("backward" !== ctx.direction && isBackEdge(ctx, payload.value)) throw new $ZodCyclicError();
                return base(payload, ctx);
            };
            inst._zod.parse = wrapped;
            if (inst._zod.run === base) inst._zod.run = wrapped;
        });
    },
    attach (inst) {
        var _a;
        let isRecursiveInst;
        let rechecked = false;
        let lastCtx;
        let lastBucket;
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        inst._zod.deferred.push(()=>{
            const base = inst._zod.parse;
            const wrapped = (payload, ctx)=>{
                if (void 0 === isRecursiveInst) {
                    const walked = isRecursive(inst, new Set(), false);
                    if (walked === NONE) {
                        inst._zod.parse = base;
                        if (inst._zod.run === wrapped) inst._zod.run = base;
                        return base(payload, ctx);
                    }
                    if (walked === PROVEN || rechecked) isRecursiveInst = true;
                    else rechecked = true;
                }
                const input = payload.value;
                if (!isRef(input)) return base(payload, ctx);
                let state = ctx[STATE];
                if (!state) {
                    state = {
                        buckets: new WeakMap(),
                        backEdges: void 0
                    };
                    ctx[STATE] = state;
                }
                let bucket;
                if (lastCtx === ctx) bucket = lastBucket;
                else {
                    bucket = bucketFor(state, inst);
                    lastCtx = ctx;
                    lastBucket = bucket;
                }
                const hit = bucket.get(input);
                if (hit) {
                    payload.value = hit.value;
                    if (hit.issues) {
                        if (hit.issues.length) payload.issues.push(...cloneIssues(hit.issues));
                    } else {
                        payload.memo = true;
                        state.backEdges ?? (state.backEdges = new WeakSet());
                        state.backEdges.add(hit.value);
                    }
                    return payload;
                }
                handoff = bucket;
                const depth = memoizer_open.length;
                const result = base(payload, ctx);
                handoff = void 0;
                const entry = memoizer_open.length > depth ? memoizer_open.pop() : void 0;
                if (result instanceof Promise) return result.then((r)=>{
                    if (entry) entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
                    return r;
                });
                if (entry) entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
                return result;
            };
            inst._zod.parse = wrapped;
            if (inst._zod.run === base) inst._zod.run = wrapped;
        });
    }
};
function memoizer() {
    return memoizer_memo;
}
function isBackEdge(ctx, value) {
    const backEdges = ctx[STATE]?.backEdges;
    return void 0 !== backEdges && isRef(value) && backEdges.has(value);
}
const cuid = /^[cC][0-9a-z]{6,}$/;
const cuid2 = /^[0-9a-z]+$/;
const ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
const xid = /^[0-9a-vA-V]{20}$/;
const ksuid = /^[A-Za-z0-9]{27}$/;
const nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
    return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
const duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
const uuid = (version)=>{
    if (!version) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
    return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
const email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
const _emoji = "^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$";
function emoji() {
    return new RegExp(_emoji, "u");
}
const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const regexes_base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
const regexes_base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
const httpProtocol = /^https?$/;
const e164 = /^\+[1-9]\d{6,14}$/;
const dateSource = "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))";
/** Anchors a pattern source. The interpolation lives here rather than at the call site because
 * esbuild will not drop a `@__PURE__` call whose own argument interpolates a variable, but it
 * will drop `anchor(dateSource)`. Keeping it inline pinned `date` into every bundle. */ function regexes_anchor(source) {
    return new RegExp(`^${source}$`);
}
const date = /*@__PURE__*/ regexes_anchor(dateSource);
function timeSource(args) {
    const hhmm = "(?:[01]\\d|2[0-3]):[0-5]\\d";
    const regex = "number" == typeof args.precision ? -1 === args.precision ? `${hhmm}` : 0 === args.precision ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
    return regex;
}
function time(args) {
    return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
    const opts = [
        "Z"
    ];
    if (args.offset) opts.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");
    const qualified = `${timeSource({
        precision: args.precision,
        seconds: true
    })}(?:${opts.join("|")})`;
    const timeRegex = args.local ? `${qualified}|${timeSource({
        precision: args.precision
    })}` : qualified;
    return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
const anyString = /^[\s\S]{0,}$/;
const integer = /^-?\d+$/;
const number = /^-?\d+(?:\.\d+)?$/;
const regexes_boolean = /^(?:true|false)$/i;
const lowercase = /^[^A-Z]*$/;
const uppercase = /^[^a-z]*$/;
const $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def)=>{
    var _a;
    inst._zod ?? (inst._zod = {});
    inst._zod.def = def;
    (_a = inst._zod).onattach ?? (_a.onattach = []);
});
const _whenHasLength = (payload)=>{
    const val = payload.value;
    return !nullish(val) && void 0 !== val.length;
};
const numericOriginMap = {
    number: "number",
    bigint: "bigint",
    object: "date"
};
const $ZodCheckLessThan = /*@__PURE__*/ $constructor("$ZodCheckLessThan", (inst, def)=>{
    $ZodCheck.init(inst, def);
    const origin = numericOriginMap[typeof def.value];
    inst._zod.check = (payload)=>{
        if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
        payload.issues.push({
            origin: numericOriginMap[typeof payload.value] ?? origin,
            code: "too_big",
            maximum: "object" == typeof def.value ? def.value.getTime() : def.value,
            input: payload.value,
            inclusive: def.inclusive,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckGreaterThan = /*@__PURE__*/ $constructor("$ZodCheckGreaterThan", (inst, def)=>{
    $ZodCheck.init(inst, def);
    const origin = numericOriginMap[typeof def.value];
    inst._zod.check = (payload)=>{
        if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
        payload.issues.push({
            origin: numericOriginMap[typeof payload.value] ?? origin,
            code: "too_small",
            minimum: "object" == typeof def.value ? def.value.getTime() : def.value,
            input: payload.value,
            inclusive: def.inclusive,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckMultipleOf = /*@__PURE__*/ $constructor("$ZodCheckMultipleOf", (inst, def)=>{
    $ZodCheck.init(inst, def);
    inst._zod.check = (payload)=>{
        if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
        const isMultiple = "bigint" == typeof payload.value ? def.value !== BigInt(0) && payload.value % def.value === BigInt(0) : 0 === floatSafeRemainder(payload.value, def.value);
        if (isMultiple) return;
        payload.issues.push({
            origin: typeof payload.value,
            code: "not_multiple_of",
            divisor: def.value,
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckNumberFormat = /*@__PURE__*/ $constructor("$ZodCheckNumberFormat", (inst, def)=>{
    $ZodCheck.init(inst, def);
    def.format = def.format || "float64";
    const isInt = def.format?.includes("int");
    const origin = isInt ? "int" : "number";
    const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
    inst._zod.check = (payload)=>{
        const input = payload.value;
        if (isInt) {
            if (!Number.isInteger(input)) return void payload.issues.push({
                expected: origin,
                format: def.format,
                code: "invalid_type",
                continue: false,
                input,
                inst
            });
            if (!Number.isSafeInteger(input)) {
                if (input > 0) payload.issues.push({
                    input,
                    code: "too_big",
                    maximum: Number.MAX_SAFE_INTEGER,
                    note: "Integers must be within the safe integer range.",
                    inst,
                    origin,
                    inclusive: true,
                    continue: !def.abort
                });
                else payload.issues.push({
                    input,
                    code: "too_small",
                    minimum: Number.MIN_SAFE_INTEGER,
                    note: "Integers must be within the safe integer range.",
                    inst,
                    origin,
                    inclusive: true,
                    continue: !def.abort
                });
                return;
            }
        }
        if (input < minimum) payload.issues.push({
            origin: "number",
            input,
            code: "too_small",
            minimum,
            inclusive: true,
            inst,
            continue: !def.abort
        });
        if (input > maximum) payload.issues.push({
            origin: "number",
            input,
            code: "too_big",
            maximum,
            inclusive: true,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckMaxLength = /*@__PURE__*/ $constructor("$ZodCheckMaxLength", (inst, def)=>{
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
    inst._zod.check = (payload)=>{
        const input = payload.value;
        const units = input.length;
        const length = "string" == typeof input && units > def.maximum ? codePointLength(input) : units;
        if (length <= def.maximum) return;
        const origin = getLengthableOrigin(input);
        payload.issues.push({
            origin,
            code: "too_big",
            maximum: def.maximum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def)=>{
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
    inst._zod.check = (payload)=>{
        const input = payload.value;
        const units = input.length;
        const length = "string" == typeof input && units >= def.minimum && units < 2 * def.minimum ? codePointLength(input) : units;
        if (length >= def.minimum) return;
        const origin = getLengthableOrigin(input);
        payload.issues.push({
            origin,
            code: "too_small",
            minimum: def.minimum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckLengthEquals = /*@__PURE__*/ $constructor("$ZodCheckLengthEquals", (inst, def)=>{
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
    inst._zod.check = (payload)=>{
        const input = payload.value;
        const units = input.length;
        const length = "string" == typeof input && units >= def.length && units <= 2 * def.length ? codePointLength(input) : units;
        if (length === def.length) return;
        const origin = getLengthableOrigin(input);
        const tooBig = length > def.length;
        payload.issues.push({
            origin,
            ...tooBig ? {
                code: "too_big",
                maximum: def.length
            } : {
                code: "too_small",
                minimum: def.length
            },
            inclusive: true,
            exact: true,
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckStringFormat = /*@__PURE__*/ $constructor("$ZodCheckStringFormat", (inst, def)=>{
    var _a, _b;
    $ZodCheck.init(inst, def);
    if (def.pattern) (_a = inst._zod).check ?? (_a.check = (payload)=>{
        def.pattern.lastIndex = 0;
        if (def.pattern.test(payload.value)) return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: def.format,
            input: payload.value,
            ...def.pattern ? {
                pattern: def.pattern.toString()
            } : {},
            inst,
            continue: !def.abort
        });
    });
    else (_b = inst._zod).check ?? (_b.check = ()=>{});
});
const $ZodCheckRegex = /*@__PURE__*/ $constructor("$ZodCheckRegex", (inst, def)=>{
    $ZodCheckStringFormat.init(inst, def);
    inst._zod.check = (payload)=>{
        def.pattern.lastIndex = 0;
        if (def.pattern.test(payload.value)) return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "regex",
            input: payload.value,
            pattern: def.pattern.toString(),
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckLowerCase = /*@__PURE__*/ $constructor("$ZodCheckLowerCase", (inst, def)=>{
    def.pattern ?? (def.pattern = lowercase);
    $ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckUpperCase = /*@__PURE__*/ $constructor("$ZodCheckUpperCase", (inst, def)=>{
    def.pattern ?? (def.pattern = uppercase);
    $ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckIncludes = /*@__PURE__*/ $constructor("$ZodCheckIncludes", (inst, def)=>{
    $ZodCheck.init(inst, def);
    const escapedRegex = escapeRegex(def.includes);
    const pattern = new RegExp("number" == typeof def.position ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
    def.pattern = pattern;
    inst._zod.check = (payload)=>{
        if (payload.value.includes(def.includes, def.position)) return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "includes",
            includes: def.includes,
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckStartsWith = /*@__PURE__*/ $constructor("$ZodCheckStartsWith", (inst, def)=>{
    $ZodCheck.init(inst, def);
    const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
    def.pattern ?? (def.pattern = pattern);
    inst._zod.check = (payload)=>{
        if (payload.value.startsWith(def.prefix)) return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "starts_with",
            prefix: def.prefix,
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckEndsWith = /*@__PURE__*/ $constructor("$ZodCheckEndsWith", (inst, def)=>{
    $ZodCheck.init(inst, def);
    const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
    def.pattern ?? (def.pattern = pattern);
    inst._zod.check = (payload)=>{
        if (payload.value.endsWith(def.suffix)) return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "ends_with",
            suffix: def.suffix,
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckOverwrite = /*@__PURE__*/ $constructor("$ZodCheckOverwrite", (inst, def)=>{
    $ZodCheck.init(inst, def);
    inst._zod.check = (payload)=>{
        payload.value = def.tx(payload.value);
    };
});
class Doc {
    constructor(args = [], closed = {}){
        this.content = [];
        this.indent = 0;
        this.args = args;
        this.closed = closed;
    }
    indented(fn) {
        this.indent += 1;
        try {
            fn(this);
        } finally{
            this.indent -= 1;
        }
    }
    write(arg) {
        if ("function" == typeof arg) {
            arg(this, {
                execution: "sync"
            });
            arg(this, {
                execution: "async"
            });
            return;
        }
        const content = arg;
        const lines = content.split("\n").filter((x)=>x);
        const minIndent = Math.min(...lines.map((x)=>x.length - x.trimStart().length));
        const dedented = lines.map((x)=>x.slice(minIndent)).map((x)=>" ".repeat(2 * this.indent) + x);
        for (const line of dedented)this.content.push(line);
    }
    compile() {
        const F = Function;
        const content = this?.content ?? [
            ""
        ];
        const factory = new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {\n${content.join("\n")}\n};`);
        return factory(...Object.values(this.closed));
    }
}
const versions_version = {
    major: 4,
    minor: 6,
    patch: 4
};
const $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def)=>{
    var _a;
    inst ?? (inst = {});
    inst._zod.def = def;
    inst._zod.bag = inst._zod.bag || {};
    inst._zod.version = versions_version;
    const defChecks = inst._zod.def.checks;
    const checks = inst._zod.traits.has("$ZodCheck") ? [
        inst,
        ...defChecks ?? []
    ] : defChecks?.length ? [
        ...defChecks
    ] : [];
    for (const ch of checks)for (const fn of ch._zod.onattach)fn(inst);
    if (0 === checks.length) {
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        inst._zod.deferred?.push(()=>{
            inst._zod.run = inst._zod.parse;
        });
    } else {
        const runChecks = (payload, checks, ctx)=>{
            if (payload.memo) return payload;
            let isAborted = aborted(payload);
            let asyncResult;
            for (const ch of checks){
                if (ch._zod.def.when) {
                    if (explicitlyAborted(payload)) continue;
                    const shouldRun = ch._zod.def.when(payload);
                    if (!shouldRun) continue;
                } else if (isAborted) continue;
                const currLen = payload.issues.length;
                const _ = ch._zod.check(payload);
                if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
                if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async ()=>{
                    await _;
                    const nextLen = payload.issues.length;
                    if (nextLen === currLen) return;
                    attachSchema(payload.issues, currLen, inst);
                    if (!isAborted) isAborted = aborted(payload, currLen);
                });
                else {
                    const nextLen = payload.issues.length;
                    if (nextLen === currLen) continue;
                    attachSchema(payload.issues, currLen, inst);
                    if (!isAborted) isAborted = aborted(payload, currLen);
                }
            }
            if (asyncResult) return asyncResult.then(()=>payload);
            return payload;
        };
        const handleCanaryResult = (canary, payload, ctx)=>{
            if (aborted(canary)) {
                canary.aborted = true;
                return canary;
            }
            const checkResult = runChecks(payload, checks, ctx);
            if (checkResult instanceof Promise) {
                if (false === ctx.async) throw new $ZodAsyncError();
                return checkResult.then((checkResult)=>inst._zod.parse(checkResult, ctx));
            }
            return inst._zod.parse(checkResult, ctx);
        };
        inst._zod.run = (payload, ctx)=>{
            if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
            if ("backward" === ctx.direction) {
                const canary = inst._zod.parse({
                    value: payload.value,
                    issues: []
                }, {
                    ...ctx,
                    skipChecks: true
                });
                if (canary instanceof Promise) return canary.then((canary)=>handleCanaryResult(canary, payload, ctx));
                return handleCanaryResult(canary, payload, ctx);
            }
            const result = inst._zod.parse(payload, ctx);
            if (result instanceof Promise) {
                if (false === ctx.async) throw new $ZodAsyncError();
                return result.then((result)=>runChecks(result, checks, ctx));
            }
            return runChecks(result, checks, ctx);
        };
    }
}, {
    get "~standard" () {
        return hide(this, "~standard", standardProps(this));
    },
    set "~standard" (value){
        util_own(this, "~standard", value);
    }
});
const toStandardResult = (r, ctx)=>r.issues.length ? {
        issues: r.issues.map((iss)=>finalizeIssue(iss, ctx, core_config()))
    } : {
        value: r.value
    };
async function validateAsync(inst, value) {
    const ctx = {
        async: true
    };
    return toStandardResult(await inst._zod.run({
        value,
        issues: []
    }, ctx), ctx);
}
function standardProps(inst) {
    return {
        validate: (value)=>{
            const ctx = {
                async: false
            };
            try {
                const r = inst._zod.run({
                    value,
                    issues: []
                }, ctx);
                if (!(r instanceof Promise)) return toStandardResult(r, ctx);
            } catch (_) {}
            return validateAsync(inst, value);
        },
        vendor: "zod",
        version: 1
    };
}
const $ZodString = /*@__PURE__*/ $constructor("$ZodString", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.pattern = def.pattern ?? anyString;
    inst._zod.parse = (payload, _)=>{
        if (def.coerce) try {
            payload.value = String(payload.value);
        } catch (_) {}
        if ("string" == typeof payload.value) return payload;
        payload.issues.push({
            expected: "string",
            code: "invalid_type",
            input: payload.value,
            inst
        });
        return payload;
    };
});
const $ZodStringFormat = /*@__PURE__*/ $constructor("$ZodStringFormat", (inst, def)=>{
    $ZodCheckStringFormat.init(inst, def);
    $ZodString.init(inst, def);
});
const $ZodGUID = /*@__PURE__*/ $constructor("$ZodGUID", (inst, def)=>{
    def.pattern ?? (def.pattern = guid);
    $ZodStringFormat.init(inst, def);
});
const $ZodUUID = /*@__PURE__*/ $constructor("$ZodUUID", (inst, def)=>{
    if (def.version) {
        const versionMap = {
            v1: 1,
            v2: 2,
            v3: 3,
            v4: 4,
            v5: 5,
            v6: 6,
            v7: 7,
            v8: 8
        };
        const v = versionMap[def.version];
        if (void 0 === v) throw new Error(`Invalid UUID version: "${def.version}"`);
        def.pattern ?? (def.pattern = uuid(v));
    } else def.pattern ?? (def.pattern = uuid());
    $ZodStringFormat.init(inst, def);
});
const $ZodEmail = /*@__PURE__*/ $constructor("$ZodEmail", (inst, def)=>{
    def.pattern ?? (def.pattern = email);
    $ZodStringFormat.init(inst, def);
});
const URL_BAD_FORMAT = 1;
const URL_UNPARSEABLE = 2;
function canParseURL(input) {
    try {
        if ("u" > typeof URL && "function" == typeof URL.canParse) return URL.canParse(input);
        new URL(input);
        return true;
    } catch  {
        return false;
    }
}
function validateURL(trimmed, def) {
    if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) return canParseURL(trimmed) || URL_UNPARSEABLE;
    return parseURLObject(trimmed, def);
}
function parseURLObject(trimmed, def) {
    if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) return URL_BAD_FORMAT;
    try {
        if ("u" > typeof URL) {
            const URLStatic = URL;
            if ("function" == typeof URLStatic.parse) return URLStatic.parse(trimmed) ?? URL_UNPARSEABLE;
        }
        return new URL(trimmed);
    } catch  {
        return URL_UNPARSEABLE;
    }
}
const asciiTabOrNewline = /[\t\n\r]/g;
function stripTabAndNewline(value) {
    return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url, hostname) {
    hostname.lastIndex = 0;
    return hostname.test(url.hostname);
}
function urlProtocolOk(url, protocol) {
    protocol.lastIndex = 0;
    return protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol);
}
const $ZodURL = /*@__PURE__*/ $constructor("$ZodURL", (inst, def)=>{
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload)=>{
        try {
            const trimmed = payload.value.trim();
            const url = validateURL(trimmed, def);
            if (url === URL_BAD_FORMAT) return void payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid URL format",
                input: payload.value,
                inst,
                continue: !def.abort
            });
            if (url === URL_UNPARSEABLE) return void payload.issues.push({
                code: "invalid_format",
                format: "url",
                input: payload.value,
                inst,
                continue: !def.abort
            });
            if (true === url) {
                payload.value = stripTabAndNewline(trimmed);
                return;
            }
            if (def.hostname && !urlHostnameOk(url, def.hostname)) payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid hostname",
                pattern: def.hostname.source,
                input: payload.value,
                inst,
                continue: !def.abort
            });
            if (def.protocol && !urlProtocolOk(url, def.protocol)) payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid protocol",
                pattern: def.protocol.source,
                input: payload.value,
                inst,
                continue: !def.abort
            });
            payload.value = def.normalize ? url.href : stripTabAndNewline(trimmed);
            return;
        } catch (_) {
            payload.issues.push({
                code: "invalid_format",
                format: "url",
                input: payload.value,
                inst,
                continue: !def.abort
            });
        }
    };
});
const $ZodEmoji = /*@__PURE__*/ $constructor("$ZodEmoji", (inst, def)=>{
    def.pattern ?? (def.pattern = emoji());
    $ZodStringFormat.init(inst, def);
});
const $ZodNanoID = /*@__PURE__*/ $constructor("$ZodNanoID", (inst, def)=>{
    if (void 0 !== def.length && (!Number.isInteger(def.length) || def.length < 1)) throw new Error(`Invalid nanoid length: ${def.length}`);
    def.pattern ?? (def.pattern = void 0 === def.length ? nanoid : nanoidOfLength(def.length));
    $ZodStringFormat.init(inst, def);
});
const $ZodCUID = /*@__PURE__*/ $constructor("$ZodCUID", (inst, def)=>{
    def.pattern ?? (def.pattern = cuid);
    $ZodStringFormat.init(inst, def);
});
const $ZodCUID2 = /*@__PURE__*/ $constructor("$ZodCUID2", (inst, def)=>{
    def.pattern ?? (def.pattern = cuid2);
    $ZodStringFormat.init(inst, def);
});
const $ZodULID = /*@__PURE__*/ $constructor("$ZodULID", (inst, def)=>{
    def.pattern ?? (def.pattern = ulid);
    $ZodStringFormat.init(inst, def);
});
const $ZodXID = /*@__PURE__*/ $constructor("$ZodXID", (inst, def)=>{
    def.pattern ?? (def.pattern = xid);
    $ZodStringFormat.init(inst, def);
});
const $ZodKSUID = /*@__PURE__*/ $constructor("$ZodKSUID", (inst, def)=>{
    def.pattern ?? (def.pattern = ksuid);
    $ZodStringFormat.init(inst, def);
});
const $ZodISODateTime = /*@__PURE__*/ $constructor("$ZodISODateTime", (inst, def)=>{
    def.pattern ?? (def.pattern = datetime(def));
    $ZodStringFormat.init(inst, def);
});
const $ZodISODate = /*@__PURE__*/ $constructor("$ZodISODate", (inst, def)=>{
    def.pattern ?? (def.pattern = date);
    $ZodStringFormat.init(inst, def);
});
const $ZodISOTime = /*@__PURE__*/ $constructor("$ZodISOTime", (inst, def)=>{
    def.pattern ?? (def.pattern = time(def));
    $ZodStringFormat.init(inst, def);
});
const $ZodISODuration = /*@__PURE__*/ $constructor("$ZodISODuration", (inst, def)=>{
    def.pattern ?? (def.pattern = duration);
    $ZodStringFormat.init(inst, def);
});
const $ZodIPv4 = /*@__PURE__*/ $constructor("$ZodIPv4", (inst, def)=>{
    def.pattern ?? (def.pattern = ipv4);
    $ZodStringFormat.init(inst, def);
});
const ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
    if (!ipv6Alphabet.test(value)) return false;
    return canParseURL(`http://[${value}]`);
}
const $ZodIPv6 = /*@__PURE__*/ $constructor("$ZodIPv6", (inst, def)=>{
    def.pattern ?? (def.pattern = ipv6);
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload)=>{
        if (!isValidIPv6(payload.value)) payload.issues.push({
            code: "invalid_format",
            format: "ipv6",
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCIDRv4 = /*@__PURE__*/ $constructor("$ZodCIDRv4", (inst, def)=>{
    def.pattern ?? (def.pattern = cidrv4);
    $ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
    const parts = value.split("/");
    if (2 !== parts.length) return false;
    const [address, prefix] = parts;
    if (!prefix) return false;
    const prefixNum = Number(prefix);
    if (`${prefixNum}` !== prefix) return false;
    if (prefixNum < 0 || prefixNum > 128) return false;
    return isValidIPv6(address);
}
const $ZodCIDRv6 = /*@__PURE__*/ $constructor("$ZodCIDRv6", (inst, def)=>{
    def.pattern ?? (def.pattern = cidrv6);
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload)=>{
        if (!isValidCIDRv6(payload.value)) payload.issues.push({
            code: "invalid_format",
            format: "cidrv6",
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
function isValidBase64(data) {
    if ("" === data) return true;
    if (/\s/.test(data)) return false;
    if (data.length % 4 !== 0) return false;
    try {
        atob(data);
        return true;
    } catch  {
        return false;
    }
}
const base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
const $ZodBase64 = /*@__PURE__*/ $constructor("$ZodBase64", (inst, def)=>{
    def.pattern ?? (def.pattern = base64Charset);
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload)=>{
        if (isValidBase64(payload.value)) return;
        payload.issues.push({
            code: "invalid_format",
            format: "base64",
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
    if (!base64urlCharset.test(data)) return false;
    const base64 = data.replace(/[-_]/g, (c)=>"-" === c ? "+" : "/");
    const padded = base64.padEnd(4 * Math.ceil(base64.length / 4), "=");
    return isValidBase64(padded);
}
const $ZodBase64URL = /*@__PURE__*/ $constructor("$ZodBase64URL", (inst, def)=>{
    def.pattern ?? (def.pattern = base64urlCharset);
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload)=>{
        if (isValidBase64URL(payload.value)) return;
        payload.issues.push({
            code: "invalid_format",
            format: "base64url",
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodE164 = /*@__PURE__*/ $constructor("$ZodE164", (inst, def)=>{
    def.pattern ?? (def.pattern = e164);
    $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
    try {
        const tokensParts = token.split(".");
        if (3 !== tokensParts.length) return false;
        const [header] = tokensParts;
        if (!header) return false;
        const parsedHeader = JSON.parse(atob(header));
        if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
        if (!parsedHeader.alg) return false;
        if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
        return true;
    } catch  {
        return false;
    }
}
const $ZodJWT = /*@__PURE__*/ $constructor("$ZodJWT", (inst, def)=>{
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload)=>{
        if (isValidJWT(payload.value, def.alg)) return;
        payload.issues.push({
            code: "invalid_format",
            format: "jwt",
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodNumber = /*@__PURE__*/ $constructor("$ZodNumber", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.pattern = number;
    inst._zod.parse = (payload, _ctx)=>{
        if (def.coerce) try {
            payload.value = Number(payload.value);
        } catch (_) {}
        const input = payload.value;
        if ("number" == typeof input && !Number.isNaN(input) && Number.isFinite(input)) return payload;
        const received = "number" == typeof input ? Number.isNaN(input) ? "NaN" : Number.isFinite(input) ? void 0 : String(input) : void 0;
        payload.issues.push({
            expected: "number",
            code: "invalid_type",
            input,
            inst,
            ...received ? {
                received
            } : {}
        });
        return payload;
    };
});
const $ZodNumberFormat = /*@__PURE__*/ $constructor("$ZodNumberFormat", (inst, def)=>{
    $ZodCheckNumberFormat.init(inst, def);
    $ZodNumber.init(inst, def);
});
const $ZodBoolean = /*@__PURE__*/ (/* unused pure expression or super */ null && ($constructor("$ZodBoolean", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.pattern = regexes_boolean;
    inst._zod.parse = (payload, _ctx)=>{
        if (def.coerce) try {
            payload.value = Boolean(payload.value);
        } catch (_) {}
        const input = payload.value;
        if ("boolean" == typeof input) return payload;
        payload.issues.push({
            expected: "boolean",
            code: "invalid_type",
            input,
            inst
        });
        return payload;
    };
})));
const $ZodUnknown = /*@__PURE__*/ $constructor("$ZodUnknown", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.parse = (payload)=>payload;
});
const $ZodNever = /*@__PURE__*/ $constructor("$ZodNever", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _ctx)=>{
        payload.issues.push({
            expected: "never",
            code: "invalid_type",
            input: payload.value,
            inst
        });
        return payload;
    };
});
function handleArrayResult(result, final, index) {
    if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
    final.value[index] = result.value;
}
const $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def)=>{
    $ZodType.init(inst, def);
    const memo = globalConfig.memoizer;
    memo?.attach(inst);
    inst._zod.parse = (payload, ctx)=>{
        const input = payload.value;
        if (!Array.isArray(input)) {
            payload.issues.push({
                expected: "array",
                code: "invalid_type",
                input,
                inst
            });
            return payload;
        }
        payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
        const proms = [];
        const abortEarly = ctx?.abortEarly;
        for(let i = 0; i < input.length; i++){
            const item = input[i];
            const result = def.element._zod.run({
                value: item,
                issues: []
            }, ctx);
            if (result instanceof Promise) proms.push(result.then((result)=>handleArrayResult(result, payload, i)));
            else {
                handleArrayResult(result, payload, i);
                if (abortEarly && 0 !== result.issues.length && aborted(result)) break;
            }
        }
        if (proms.length) return Promise.all(proms).then(()=>payload);
        return payload;
    };
});
function handlePropertyResult(result, final, key, input, optin, optout) {
    const isPresent = key in input;
    const isOptionalOut = "optional" === optout;
    if (!isPresent && isOptionalOut && "optional" === optin) return;
    if (result.issues.length) {
        if (void 0 !== optin && isOptionalOut && !isPresent) return;
        final.issues.push(...prefixIssues(key, result.issues));
    }
    if (!isPresent && void 0 === optin) {
        if (!result.issues.length) final.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: void 0,
            path: [
                key
            ]
        });
        return;
    }
    if (void 0 === result.value) {
        if (isPresent || "defaulted" === optin && !isOptionalOut) final.value[key] = void 0;
    } else final.value[key] = result.value;
}
const NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
    const keys = Object.keys(def.shape);
    const ownSymbols = Object.getOwnPropertySymbols(def.shape);
    const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
    const allKeys = symbolKeys.length ? [
        ...keys,
        ...symbolKeys
    ] : keys;
    for (const k of allKeys)if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
    const okeys = optionalKeys(def.shape);
    return {
        ...def,
        allKeys,
        symbolKeys,
        keySet: new Set(keys),
        numKeys: keys.length,
        optionalKeys: new Set(okeys)
    };
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
    const unrecognized = [];
    const keySet = def.keySet;
    const _catchall = def.catchall._zod;
    const t = _catchall.def.type;
    const optin = _catchall.optin;
    const optout = _catchall.optout;
    let seen = 0;
    for(const key in input){
        if (abortEarly && payload.issues.length !== seen) {
            if (aborted(payload, seen)) break;
            seen = payload.issues.length;
        }
        if (keySet.has(key)) continue;
        if ("__proto__" === key) {
            if ("never" === t) unrecognized.push(key);
            continue;
        }
        if ("never" === t) {
            unrecognized.push(key);
            continue;
        }
        const r = _catchall.run({
            value: input[key],
            issues: []
        }, ctx);
        if (r instanceof Promise) proms.push(r.then((r)=>handlePropertyResult(r, payload, key, input, optin, optout)));
        else handlePropertyResult(r, payload, key, input, optin, optout);
    }
    if (unrecognized.length) payload.issues.push({
        code: "unrecognized_keys",
        keys: unrecognized,
        input,
        inst,
        continue: true
    });
    if (!proms.length) return payload;
    return Promise.all(proms).then(()=>payload);
}
const $ZodObject = /*@__PURE__*/ $constructor("$ZodObject", (inst, def)=>{
    $ZodType.init(inst, def);
    const desc = Object.getOwnPropertyDescriptor(def, "shape");
    const sh = desc?.get ? desc.get.raw : def.shape ?? {};
    if (sh) {
        const get = ()=>{
            const newSh = {
                ...sh
            };
            Object.defineProperty(def, "shape", {
                value: newSh
            });
            get.raw = newSh;
            return newSh;
        };
        get.raw = sh;
        Object.defineProperty(def, "shape", {
            get
        });
    }
    const _normalized = util_cached(()=>normalizeDef(def));
    defineLazyInternal(inst, "propValues", (zod)=>{
        const shape = zod.def.shape;
        const propValues = {};
        for(const key in shape){
            const field = shape[key]._zod;
            if (field.values) {
                if (!Object.prototype.hasOwnProperty.call(propValues, key)) util_assignProp(propValues, key, new Set());
                for (const v of field.values)propValues[key].add(v);
                if (void 0 !== field.optin) propValues[key].add(void 0);
            }
        }
        return propValues;
    });
    const isObject = util_isObject;
    const catchall = def.catchall;
    let value;
    const memo = globalConfig.memoizer;
    memo?.attach(inst);
    inst._zod.parse = (payload, ctx)=>{
        value ?? (value = _normalized.value);
        const input = payload.value;
        if (!isObject(input)) {
            payload.issues.push({
                expected: "object",
                code: "invalid_type",
                input,
                inst
            });
            return payload;
        }
        payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
        const proms = [];
        const shape = value.shape;
        const abortEarly = ctx?.abortEarly;
        let seen = payload.issues.length;
        for (const key of value.allKeys){
            if (abortEarly && payload.issues.length !== seen) {
                if (aborted(payload, seen)) break;
                seen = payload.issues.length;
            }
            if ("__proto__" === key) continue;
            const el = shape[key];
            const optin = el._zod.optin;
            const optout = el._zod.optout;
            const r = el._zod.run({
                value: input[key],
                issues: []
            }, ctx);
            if (r instanceof Promise) proms.push(r.then((r)=>handlePropertyResult(r, payload, key, input, optin, optout)));
            else handlePropertyResult(r, payload, key, input, optin, optout);
        }
        if (!catchall) return proms.length ? Promise.all(proms).then(()=>payload) : payload;
        return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, true === abortEarly);
    };
});
const $ZodObjectJIT = /*@__PURE__*/ $constructor("$ZodObjectJIT", (inst, def)=>{
    $ZodObject.init(inst, def);
    const superParse = inst._zod.parse;
    const _normalized = util_cached(()=>normalizeDef(def));
    const memo = globalConfig.memoizer;
    const generateFastpass = (shape)=>{
        const normalized = _normalized.value;
        const syms = normalized.symbolKeys;
        const doc = new Doc([
            "payload",
            "ctx"
        ], {
            shape,
            inst,
            memo,
            syms
        });
        const parseStr = (k)=>`shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
        const prefixStr = (id, k)=>`
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
        doc.write("const input = payload.value;");
        const ids = Object.create(null);
        let counter = 0;
        for (const key of normalized.allKeys)ids[key] = `key_${counter++}`;
        doc.write(memo ? "const newResult = memo.alloc(inst, payload, {}, ctx);" : "const newResult = {};");
        for (const key of normalized.allKeys){
            if ("__proto__" === key) continue;
            const id = ids[key];
            const k = "symbol" == typeof key ? `syms[${syms.indexOf(key)}]` : esc(key);
            const isPresent = `${k} in input`;
            const schema = shape[key];
            const optin = schema?._zod?.optin;
            const isOptionalIn = void 0 !== optin;
            const isOptionalOut = schema?._zod?.optout === "optional";
            doc.write(`const ${id} = ${parseStr(k)};`);
            if (isOptionalIn && isOptionalOut) {
                const assign = "optional" === optin ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
                doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
            } else if (isOptionalIn) {
                doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
                if ("defaulted" === optin) doc.write(`newResult[${k}] = ${id}.value;`);
                else doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
            } else doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
        }
        doc.write("payload.value = newResult;");
        doc.write("return payload;");
        return doc.compile();
    };
    let fastpass;
    const isObject = util_isObject;
    const jit = !globalConfig.jitless;
    const allowsEval = util_allowsEval;
    const fastEnabled = jit && allowsEval.value;
    const catchall = def.catchall;
    let value;
    inst._zod.parse = (payload, ctx)=>{
        value ?? (value = _normalized.value);
        const input = payload.value;
        if (!isObject(input)) {
            payload.issues.push({
                expected: "object",
                code: "invalid_type",
                input,
                inst
            });
            return payload;
        }
        if (jit && fastEnabled && ctx?.async === false && true !== ctx.jitless) {
            if (!fastpass) fastpass = generateFastpass(def.shape);
            payload = fastpass(payload, ctx);
            if (!catchall) return payload;
            return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
        }
        return superParse(payload, ctx);
    };
});
function handleUnionResults(results, final, inst, ctx) {
    for (const result of results)if (0 === result.issues.length) {
        final.value = result.value;
        return final;
    }
    const nonaborted = results.filter((r)=>!aborted(r));
    if (1 === nonaborted.length) {
        final.value = nonaborted[0].value;
        return nonaborted[0];
    }
    final.issues.push({
        code: "invalid_union",
        input: final.value,
        inst,
        errors: results.map((result)=>result.issues.map((iss)=>finalizeIssue(iss, ctx, core_config())))
    });
    return final;
}
const $ZodUnion = /*@__PURE__*/ $constructor("$ZodUnion", (inst, def)=>{
    $ZodType.init(inst, def);
    defineLazyInternal(inst, "optin", (zod)=>zod.def.options.some((o)=>"defaulted" === o._zod.optin) ? "defaulted" : zod.def.options.some((o)=>void 0 !== o._zod.optin) ? "optional" : void 0);
    defineLazyInternal(inst, "optout", (zod)=>zod.def.options.some((o)=>"optional" === o._zod.optout) ? "optional" : void 0);
    defineLazyInternal(inst, "values", (zod)=>{
        if (zod.def.options.every((o)=>o._zod.values)) return new Set(zod.def.options.flatMap((option)=>Array.from(option._zod.values)));
    });
    defineLazyInternal(inst, "pattern", (zod)=>{
        if (zod.def.options.every((o)=>o._zod.pattern)) {
            const patterns = zod.def.options.map((o)=>o._zod.pattern);
            return new RegExp(`^(${patterns.map((p)=>cleanRegex(p.source)).join("|")})$`);
        }
    });
    const first = 1 === def.options.length ? def.options[0]._zod.run : null;
    inst._zod.parse = (payload, ctx)=>{
        if (first) return first(payload, ctx);
        let async = false;
        const results = [];
        for (const option of def.options){
            const result = option._zod.run({
                value: payload.value,
                issues: []
            }, ctx);
            if (result instanceof Promise) {
                results.push(result);
                async = true;
            } else {
                if (0 === result.issues.length) return result;
                results.push(result);
            }
        }
        if (!async) return handleUnionResults(results, payload, inst, ctx);
        return Promise.all(results).then((results)=>handleUnionResults(results, payload, inst, ctx));
    };
});
function discriminatorMap(def) {
    const map = new Map();
    for (const option of def.options){
        const values = option._zod.propValues?.[def.discriminator];
        if (!values || 0 === values.size) throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
        for (const value of values)if (map.has(value)) {
            if (void 0 !== value) throw new Error(`Duplicate discriminator value "${String(value)}"`);
            map.set(value, null);
        } else map.set(value, option);
    }
    return map;
}
const $ZodDiscriminatedUnion = /*@__PURE__*/ (/* unused pure expression or super */ null && ($constructor("$ZodDiscriminatedUnion", (inst, def)=>{
    def.inclusive = false;
    $ZodUnion.init(inst, def);
    const _super = inst._zod.parse;
    defineLazyInternal(inst, "propValues", (zod)=>{
        const propValues = {};
        let undefinedCount = 0;
        for (const option of zod.def.options){
            const pv = option._zod.propValues;
            if (!pv || 0 === Object.keys(pv).length) throw new Error(`Invalid discriminated union option at index "${zod.def.options.indexOf(option)}"`);
            if (pv[zod.def.discriminator]?.has(void 0)) undefinedCount++;
            for (const [k, v] of Object.entries(pv)){
                if (!Object.prototype.hasOwnProperty.call(propValues, k)) util_assignProp(propValues, k, new Set());
                for (const val of v)propValues[k].add(val);
            }
        }
        if (!zod.def.unionFallback && undefinedCount > 1) propValues[zod.def.discriminator]?.delete(void 0);
        return propValues;
    });
    def.options.forEach((option, i)=>{
        const propShape = rawShape(option._zod.def);
        if (propShape && !Object.prototype.hasOwnProperty.call(propShape, def.discriminator)) throw new Error(`Invalid discriminated union option at index "${i}"`);
    });
    const disc = util_cached(()=>discriminatorMap(def));
    inst._zod.parse = (payload, ctx)=>{
        const input = payload.value;
        if (!util_isObject(input)) {
            payload.issues.push({
                code: "invalid_type",
                expected: "object",
                input,
                inst
            });
            return payload;
        }
        const value = input?.[def.discriminator];
        const opt = disc.value.get(value);
        if (opt && (void 0 !== value || "backward" !== ctx.direction)) return opt._zod.run(payload, ctx);
        if (def.unionFallback || "backward" === ctx.direction) return _super(payload, ctx);
        payload.issues.push({
            code: "invalid_union",
            errors: [],
            note: "No matching discriminator",
            discriminator: def.discriminator,
            options: Array.from(disc.value.keys()).filter((value)=>null !== disc.value.get(value)),
            input,
            path: [
                def.discriminator
            ],
            inst
        });
        return payload;
    };
})));
const $ZodIntersection = /*@__PURE__*/ $constructor("$ZodIntersection", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx)=>{
        const input = payload.value;
        const left = def.left._zod.run({
            value: input,
            issues: []
        }, ctx);
        const right = def.right._zod.run({
            value: input,
            issues: []
        }, ctx);
        const async = left instanceof Promise || right instanceof Promise;
        if (async) return Promise.all([
            left,
            right
        ]).then(([left, right])=>handleIntersectionResults(payload, left, right));
        return handleIntersectionResults(payload, left, right);
    };
});
function mergeValues(a, b) {
    if (a === b) return {
        valid: true,
        data: a
    };
    if (a instanceof Date && b instanceof Date && +a === +b) return {
        valid: true,
        data: a
    };
    if (isPlainObject(a) && isPlainObject(b)) {
        const bKeys = Object.keys(b);
        const sharedKeys = Object.keys(a).filter((key)=>-1 !== bKeys.indexOf(key));
        const newObj = {
            ...a,
            ...b
        };
        if (Object.prototype.hasOwnProperty.call(newObj, "__proto__")) delete newObj.__proto__;
        for (const key of sharedKeys){
            if ("__proto__" === key) continue;
            const sharedValue = mergeValues(a[key], b[key]);
            if (!sharedValue.valid) return {
                valid: false,
                mergeErrorPath: [
                    key,
                    ...sharedValue.mergeErrorPath
                ]
            };
            newObj[key] = sharedValue.data;
        }
        return {
            valid: true,
            data: newObj
        };
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return {
            valid: false,
            mergeErrorPath: []
        };
        const newArray = [];
        for(let index = 0; index < a.length; index++){
            const itemA = a[index];
            const itemB = b[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) return {
                valid: false,
                mergeErrorPath: [
                    index,
                    ...sharedValue.mergeErrorPath
                ]
            };
            newArray.push(sharedValue.data);
        }
        return {
            valid: true,
            data: newArray
        };
    }
    return {
        valid: false,
        mergeErrorPath: []
    };
}
function handleIntersectionResults(result, left, right) {
    const unrecKeys = new Map();
    let unrecIssue;
    const keyIssues = new Map();
    const collect = (iss, side)=>{
        let keys;
        if ("unrecognized_keys" !== iss.code || iss.path?.length) if ("invalid_key" !== iss.code || "record" !== iss.origin || iss.path?.length !== 1) return false;
        else {
            const k = String(iss.path[0]);
            if (!keyIssues.has(k)) keyIssues.set(k, iss);
            keys = [
                k
            ];
        }
        else {
            unrecIssue ?? (unrecIssue = iss);
            keys = iss.keys;
        }
        for (const k of keys){
            if (!unrecKeys.has(k)) unrecKeys.set(k, {});
            unrecKeys.get(k)[side] = true;
        }
        return true;
    };
    for (const iss of left.issues)if (!collect(iss, "l")) result.issues.push(iss);
    for (const iss of right.issues)if (!collect(iss, "r")) result.issues.push(iss);
    const bothKeys = [
        ...unrecKeys
    ].filter(([, f])=>f.l && f.r).map(([k])=>k);
    if (bothKeys.length) {
        const aggregated = unrecIssue ? bothKeys.filter((k)=>unrecIssue.keys.includes(k)) : [];
        if (aggregated.length) result.issues.push({
            ...unrecIssue,
            keys: aggregated
        });
        for (const k of bothKeys)if (!aggregated.includes(k) && keyIssues.has(k)) result.issues.push(keyIssues.get(k));
    }
    const merged = mergeValues(left.value, right.value);
    if (!merged.valid) {
        if (aborted(result)) return result;
        throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
    }
    result.value = merged.data;
    return result;
}
const $ZodRecord = /*@__PURE__*/ $constructor("$ZodRecord", (inst, def)=>{
    $ZodType.init(inst, def);
    const memo = globalConfig.memoizer;
    memo?.attach(inst);
    inst._zod.parse = (payload, ctx)=>{
        const input = payload.value;
        if (!isPlainObject(input)) {
            payload.issues.push({
                expected: "record",
                code: "invalid_type",
                input,
                inst
            });
            return payload;
        }
        const proms = [];
        const values = def.keyType._zod.values;
        if (values && !def.partial) {
            payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
            const recordKeys = new Set();
            for (const key of values)if ("string" == typeof key || "number" == typeof key || "symbol" == typeof key) {
                recordKeys.add("number" == typeof key ? key.toString() : key);
                if ("__proto__" === key) continue;
                const keyResult = def.keyType._zod.run({
                    value: key,
                    issues: []
                }, ctx);
                if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
                if (keyResult.issues.length) {
                    payload.issues.push({
                        code: "invalid_key",
                        origin: "record",
                        issues: keyResult.issues.map((iss)=>finalizeIssue(iss, ctx, core_config())),
                        input: key,
                        path: [
                            key
                        ],
                        inst
                    });
                    continue;
                }
                const outKey = keyResult.value;
                if ("__proto__" === outKey) continue;
                const result = def.valueType._zod.run({
                    value: input[key],
                    issues: []
                }, ctx);
                if (result instanceof Promise) proms.push(result.then((result)=>{
                    if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
                    payload.value[outKey] = result.value;
                }));
                else {
                    if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
                    payload.value[outKey] = result.value;
                }
            }
            let unrecognized;
            for(const key in input)if (!recordKeys.has(key)) if ("loose" === def.mode) {
                if ("__proto__" === key) continue;
                payload.value[key] = input[key];
            } else {
                unrecognized = unrecognized ?? [];
                unrecognized.push(key);
            }
            if (unrecognized && unrecognized.length > 0) payload.issues.push({
                code: "unrecognized_keys",
                input,
                inst,
                keys: unrecognized,
                continue: true
            });
        } else {
            payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
            let unrecognized;
            for (const key of Reflect.ownKeys(input)){
                if ("__proto__" === key) continue;
                if (!Object.prototype.propertyIsEnumerable.call(input, key)) continue;
                let keyResult = def.keyType._zod.run({
                    value: key,
                    issues: []
                }, ctx);
                if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
                const checkNumericKey = "string" == typeof key && number.test(key) && keyResult.issues.length;
                if (checkNumericKey) {
                    const retryResult = def.keyType._zod.run({
                        value: Number(key),
                        issues: []
                    }, ctx);
                    if (retryResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
                    if (0 === retryResult.issues.length) keyResult = retryResult;
                }
                if (keyResult.issues.length) {
                    if ("loose" === def.mode) payload.value[key] = input[key];
                    else if (values) {
                        unrecognized = unrecognized ?? [];
                        unrecognized.push(key);
                    } else payload.issues.push({
                        code: "invalid_key",
                        origin: "record",
                        issues: keyResult.issues.map((iss)=>finalizeIssue(iss, ctx, core_config())),
                        input: key,
                        path: [
                            key
                        ],
                        inst
                    });
                    continue;
                }
                const outKey = keyResult.value;
                if ("__proto__" === outKey) continue;
                const result = def.valueType._zod.run({
                    value: input[key],
                    issues: []
                }, ctx);
                if (result instanceof Promise) proms.push(result.then((result)=>{
                    if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
                    payload.value[outKey] = result.value;
                }));
                else {
                    if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
                    payload.value[outKey] = result.value;
                }
            }
            if (unrecognized && unrecognized.length > 0) payload.issues.push({
                code: "unrecognized_keys",
                input,
                inst,
                keys: unrecognized,
                continue: true
            });
        }
        if (proms.length) return Promise.all(proms).then(()=>payload);
        return payload;
    };
});
const $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def)=>{
    $ZodType.init(inst, def);
    const values = getEnumValues(def.entries);
    const valuesSet = new Set(values);
    inst._zod.values = valuesSet;
    defineLazyInternal(inst, "pattern", (zod)=>{
        const patternValues = getEnumValues(zod.def.entries).filter((k)=>propertyKeyTypes.has(typeof k));
        return new RegExp(patternValues.length ? `^(${patternValues.map((o)=>escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
    });
    inst._zod.parse = (payload, _ctx)=>{
        const input = payload.value;
        if (valuesSet.has(input)) return payload;
        payload.issues.push({
            code: "invalid_value",
            values,
            input,
            inst
        });
        return payload;
    };
});
const $ZodLiteral = /*@__PURE__*/ (/* unused pure expression or super */ null && ($constructor("$ZodLiteral", (inst, def)=>{
    $ZodType.init(inst, def);
    const values = new Set(def.values);
    inst._zod.values = values;
    defineLazyInternal(inst, "pattern", (zod)=>{
        const vals = zod.def.values;
        return new RegExp(vals.length ? `^(${vals.map((o)=>"string" == typeof o ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
    });
    inst._zod.parse = (payload, _ctx)=>{
        const input = payload.value;
        if (values.has(input)) return payload;
        payload.issues.push({
            code: "invalid_value",
            values: def.values,
            input,
            inst
        });
        return payload;
    };
})));
const $ZodTransform = /*@__PURE__*/ $constructor("$ZodTransform", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.optin = "optional";
    globalConfig.memoizer?.guard(inst);
    inst._zod.parse = (payload, ctx)=>{
        if ("backward" === ctx.direction) throw new $ZodEncodeError(inst.constructor.name);
        const _out = def.transform(payload.value, payload);
        if (ctx.async) {
            const output = _out instanceof Promise ? _out : Promise.resolve(_out);
            return output.then((output)=>{
                payload.value = output;
                return payload;
            });
        }
        if (_out instanceof Promise) throw new $ZodAsyncError();
        payload.value = _out;
        return payload;
    };
});
function handleOptionalResult(payload, result) {
    payload.value = result.issues.length ? void 0 : result.value;
    return payload;
}
const $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def)=>{
    $ZodType.init(inst, def);
    defineLazyInternal(inst, "optin", (zod)=>"defaulted" === zod.def.innerType._zod.optin ? "defaulted" : "optional");
    inst._zod.optout = "optional";
    defineLazyInternal(inst, "values", (zod)=>{
        const values = zod.def.innerType._zod.values;
        return values ? new Set([
            ...values,
            void 0
        ]) : void 0;
    });
    defineLazyInternal(inst, "pattern", (zod)=>{
        const pattern = zod.def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
    });
    inst._zod.parse = (payload, ctx)=>{
        if (void 0 === payload.value) {
            if ("defaulted" !== def.innerType._zod.optin) return payload;
            const result = def.innerType._zod.run({
                value: payload.value,
                issues: []
            }, ctx);
            if (result instanceof Promise) return result.then((result)=>handleOptionalResult(payload, result));
            return handleOptionalResult(payload, result);
        }
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodExactOptional = /*@__PURE__*/ $constructor("$ZodExactOptional", (inst, def)=>{
    $ZodOptional.init(inst, def);
    defineLazyInternal(inst, "values", (zod)=>zod.def.innerType._zod.values);
    defineLazyInternal(inst, "pattern", (zod)=>zod.def.innerType._zod.pattern);
    inst._zod.parse = (payload, ctx)=>def.innerType._zod.run(payload, ctx);
});
const $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def)=>{
    $ZodType.init(inst, def);
    defineLazyInternal(inst, "optin", (zod)=>zod.def.innerType._zod.optin);
    defineLazyInternal(inst, "optout", (zod)=>zod.def.innerType._zod.optout);
    defineLazyInternal(inst, "pattern", (zod)=>{
        const pattern = zod.def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
    });
    defineLazyInternal(inst, "values", (zod)=>zod.def.innerType._zod.values ? new Set([
            ...zod.def.innerType._zod.values,
            null
        ]) : void 0);
    inst._zod.parse = (payload, ctx)=>{
        if (null === payload.value) return payload;
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodDefault = /*@__PURE__*/ $constructor("$ZodDefault", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.optin = "defaulted";
    defineLazyInternal(inst, "values", (zod)=>zod.def.innerType._zod.values);
    inst._zod.parse = (payload, ctx)=>{
        if ("backward" === ctx.direction) return def.innerType._zod.run(payload, ctx);
        if (void 0 === payload.value) {
            payload.value = def.defaultValue;
            return payload;
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) return result.then((result)=>handleDefaultResult(result, def));
        return handleDefaultResult(result, def);
    };
});
function handleDefaultResult(payload, def) {
    if (void 0 === payload.value) payload.value = def.defaultValue;
    return payload;
}
const $ZodPrefault = /*@__PURE__*/ $constructor("$ZodPrefault", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.optin = "defaulted";
    defineLazyInternal(inst, "values", (zod)=>zod.def.innerType._zod.values);
    inst._zod.parse = (payload, ctx)=>{
        if ("backward" === ctx.direction) return def.innerType._zod.run(payload, ctx);
        if (void 0 === payload.value) payload.value = def.defaultValue;
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodNonOptional = /*@__PURE__*/ $constructor("$ZodNonOptional", (inst, def)=>{
    $ZodType.init(inst, def);
    defineLazyInternal(inst, "values", (zod)=>{
        const v = zod.def.innerType._zod.values;
        return v ? new Set([
            ...v
        ].filter((x)=>void 0 !== x)) : void 0;
    });
    inst._zod.parse = (payload, ctx)=>{
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) return result.then((result)=>handleNonOptionalResult(result, inst));
        return handleNonOptionalResult(result, inst);
    };
});
function handleNonOptionalResult(payload, inst) {
    if (!payload.issues.length && void 0 === payload.value) payload.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: payload.value,
        inst
    });
    return payload;
}
function handleCatchResult(payload, result, def, ctx) {
    if (!result.issues.length) {
        payload.value = result.value;
        if (result.memo) payload.memo = true;
        return payload;
    }
    payload.value = def.catchValue({
        ...result,
        value: payload.value,
        error: {
            issues: result.issues.map((iss)=>finalizeIssue(iss, ctx, core_config()))
        },
        input: payload.value
    });
    return payload;
}
const $ZodCatch = /*@__PURE__*/ $constructor("$ZodCatch", (inst, def)=>{
    $ZodType.init(inst, def);
    defineLazyInternal(inst, "optin", (zod)=>"defaulted" === zod.def.innerType._zod.optin ? "defaulted" : "optional");
    defineLazyInternal(inst, "optout", (zod)=>zod.def.innerType._zod.optout);
    defineLazyInternal(inst, "values", (zod)=>zod.def.innerType._zod.values);
    inst._zod.parse = (payload, ctx)=>{
        if ("backward" === ctx.direction) return def.innerType._zod.run(payload, ctx);
        const result = def.innerType._zod.run({
            value: payload.value,
            issues: []
        }, ctx);
        if (result instanceof Promise) return result.then((result)=>handleCatchResult(payload, result, def, ctx));
        return handleCatchResult(payload, result, def, ctx);
    };
});
const $ZodPipe = /*@__PURE__*/ $constructor("$ZodPipe", (inst, def)=>{
    $ZodType.init(inst, def);
    defineLazyInternal(inst, "values", (zod)=>zod.def.in._zod.values);
    defineLazyInternal(inst, "optin", (zod)=>zod.def.in._zod.optin);
    defineLazyInternal(inst, "optout", (zod)=>zod.def.out._zod.optout);
    defineLazyInternal(inst, "propValues", (zod)=>zod.def.in._zod.propValues);
    inst._zod.parse = (payload, ctx)=>{
        if ("backward" === ctx.direction) {
            const right = def.out._zod.run(payload, ctx);
            if (right instanceof Promise) return right.then((right)=>handlePipeResult(right, def.in, ctx));
            return handlePipeResult(right, def.in, ctx);
        }
        const left = def.in._zod.run(payload, ctx);
        if (left instanceof Promise) return left.then((left)=>handlePipeResult(left, def.out, ctx));
        return handlePipeResult(left, def.out, ctx);
    };
});
function handlePipeResult(left, next, ctx) {
    if (left.issues.some((iss)=>"unrecognized_keys" !== iss.code)) {
        left.aborted = true;
        return left;
    }
    return next._zod.run({
        value: left.value,
        issues: left.issues
    }, ctx);
}
const $ZodReadonly = /*@__PURE__*/ $constructor("$ZodReadonly", (inst, def)=>{
    $ZodType.init(inst, def);
    defineLazyInternal(inst, "propValues", (zod)=>zod.def.innerType._zod.propValues);
    defineLazyInternal(inst, "values", (zod)=>zod.def.innerType._zod.values);
    defineLazyInternal(inst, "optin", (zod)=>zod.def.innerType?._zod?.optin);
    defineLazyInternal(inst, "optout", (zod)=>zod.def.innerType?._zod?.optout);
    inst._zod.parse = (payload, ctx)=>{
        if ("backward" === ctx.direction) return def.innerType._zod.run(payload, ctx);
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) return result.then(handleReadonlyResult);
        return handleReadonlyResult(result);
    };
});
function handleReadonlyResult(payload) {
    if (!payload.memo) payload.value = Object.freeze(payload.value);
    return payload;
}
const $ZodCustom = /*@__PURE__*/ $constructor("$ZodCustom", (inst, def)=>{
    $ZodCheck.init(inst, def);
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _)=>payload;
    inst._zod.check = (payload)=>{
        const input = payload.value;
        const r = def.fn(input);
        if (r instanceof Promise) return r.then((r)=>handleRefineResult(r, payload, input, inst));
        handleRefineResult(r, payload, input, inst);
    };
});
function handleRefineResult(result, payload, input, inst) {
    if (!result) {
        const _iss = {
            code: "custom",
            input,
            inst,
            path: [
                ...inst._zod.def.path ?? []
            ],
            continue: !inst._zod.def.abort
        };
        if (inst._zod.def.params) _iss.params = inst._zod.def.params;
        payload.issues.push(util_issue(_iss));
    }
}
var registries_a;
class $ZodRegistry {
    constructor(){
        this._map = new WeakMap();
        this._idmap = new Map();
    }
    add(schema, ..._meta) {
        const meta = _meta[0];
        this._map.set(schema, meta);
        if (meta && "object" == typeof meta && "id" in meta) this._idmap.set(meta.id, schema);
        return this;
    }
    clear() {
        this._map = new WeakMap();
        this._idmap = new Map();
        return this;
    }
    remove(schema) {
        const meta = this._map.get(schema);
        if (meta && "object" == typeof meta && "id" in meta) this._idmap.delete(meta.id);
        this._map.delete(schema);
        return this;
    }
    get(schema) {
        const p = schema._zod.parent;
        if (p) {
            const pm = {
                ...this.get(p) ?? {}
            };
            delete pm.id;
            const f = {
                ...pm,
                ...this._map.get(schema)
            };
            return Object.keys(f).length ? f : void 0;
        }
        return this._map.get(schema);
    }
    has(schema) {
        return this._map.has(schema);
    }
}
function registries_registry() {
    return new $ZodRegistry();
}
(registries_a = globalThis).__zod_globalRegistry ?? (registries_a.__zod_globalRegistry = registries_registry());
const globalRegistry = globalThis.__zod_globalRegistry;
function snapshotChecks(def) {
    if (def.checks) def.checks = [
        ...def.checks
    ];
    return def;
}
function _string(Class, params) {
    return new Class(snapshotChecks({
        type: "string",
        ...normalizeParams(params)
    }));
}
function _email(Class, params) {
    return new Class({
        type: "string",
        format: "email",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _guid(Class, params) {
    return new Class({
        type: "string",
        format: "guid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _uuid(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _uuidv4(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        version: "v4",
        ...normalizeParams(params)
    });
}
function _uuidv6(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        version: "v6",
        ...normalizeParams(params)
    });
}
function _uuidv7(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        version: "v7",
        ...normalizeParams(params)
    });
}
function _url(Class, params) {
    return new Class({
        type: "string",
        format: "url",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function api_emoji(Class, params) {
    return new Class({
        type: "string",
        format: "emoji",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _nanoid(Class, params) {
    return new Class({
        type: "string",
        format: "nanoid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _cuid(Class, params) {
    return new Class({
        type: "string",
        format: "cuid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _cuid2(Class, params) {
    return new Class({
        type: "string",
        format: "cuid2",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _ulid(Class, params) {
    return new Class({
        type: "string",
        format: "ulid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _xid(Class, params) {
    return new Class({
        type: "string",
        format: "xid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _ksuid(Class, params) {
    return new Class({
        type: "string",
        format: "ksuid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _ipv4(Class, params) {
    return new Class({
        type: "string",
        format: "ipv4",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _ipv6(Class, params) {
    return new Class({
        type: "string",
        format: "ipv6",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _cidrv4(Class, params) {
    return new Class({
        type: "string",
        format: "cidrv4",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _cidrv6(Class, params) {
    return new Class({
        type: "string",
        format: "cidrv6",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _base64(Class, params) {
    return new Class({
        type: "string",
        format: "base64",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _base64url(Class, params) {
    return new Class({
        type: "string",
        format: "base64url",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _e164(Class, params) {
    return new Class({
        type: "string",
        format: "e164",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _jwt(Class, params) {
    return new Class({
        type: "string",
        format: "jwt",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _isoDateTime(Class, params) {
    return new Class({
        type: "string",
        format: "datetime",
        check: "string_format",
        offset: false,
        local: false,
        precision: null,
        ...normalizeParams(params)
    });
}
function _isoDate(Class, params) {
    return new Class({
        type: "string",
        format: "date",
        check: "string_format",
        ...normalizeParams(params)
    });
}
function _isoTime(Class, params) {
    return new Class({
        type: "string",
        format: "time",
        check: "string_format",
        precision: null,
        ...normalizeParams(params)
    });
}
function _isoDuration(Class, params) {
    return new Class({
        type: "string",
        format: "duration",
        check: "string_format",
        ...normalizeParams(params)
    });
}
function _number(Class, params) {
    return new Class(snapshotChecks({
        type: "number",
        checks: [],
        ...normalizeParams(params)
    }));
}
function _int(Class, params) {
    return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "safeint",
        ...normalizeParams(params)
    });
}
function _boolean(Class, params) {
    return new Class({
        type: "boolean",
        ...normalizeParams(params)
    });
}
function _unknown(Class) {
    return new Class({
        type: "unknown"
    });
}
function _never(Class, params) {
    return new Class({
        type: "never",
        ...normalizeParams(params)
    });
}
function _lt(value, params) {
    return new $ZodCheckLessThan({
        check: "less_than",
        ...normalizeParams(params),
        value,
        inclusive: false
    });
}
function _lte(value, params) {
    return new $ZodCheckLessThan({
        check: "less_than",
        ...normalizeParams(params),
        value,
        inclusive: true
    });
}
function _gt(value, params) {
    return new $ZodCheckGreaterThan({
        check: "greater_than",
        ...normalizeParams(params),
        value,
        inclusive: false
    });
}
function _gte(value, params) {
    return new $ZodCheckGreaterThan({
        check: "greater_than",
        ...normalizeParams(params),
        value,
        inclusive: true
    });
}
function _multipleOf(value, params) {
    return new $ZodCheckMultipleOf({
        check: "multiple_of",
        ...normalizeParams(params),
        value
    });
}
function _maxLength(maximum, params) {
    const ch = new $ZodCheckMaxLength({
        check: "max_length",
        ...normalizeParams(params),
        maximum
    });
    return ch;
}
function _minLength(minimum, params) {
    return new $ZodCheckMinLength({
        check: "min_length",
        ...normalizeParams(params),
        minimum
    });
}
function _length(length, params) {
    return new $ZodCheckLengthEquals({
        check: "length_equals",
        ...normalizeParams(params),
        length
    });
}
function _regex(pattern, params) {
    return new $ZodCheckRegex({
        check: "string_format",
        format: "regex",
        ...normalizeParams(params),
        pattern
    });
}
function _lowercase(params) {
    return new $ZodCheckLowerCase({
        check: "string_format",
        format: "lowercase",
        ...normalizeParams(params)
    });
}
function _uppercase(params) {
    return new $ZodCheckUpperCase({
        check: "string_format",
        format: "uppercase",
        ...normalizeParams(params)
    });
}
function _includes(includes, params) {
    return new $ZodCheckIncludes({
        check: "string_format",
        format: "includes",
        ...normalizeParams(params),
        includes
    });
}
function _startsWith(prefix, params) {
    return new $ZodCheckStartsWith({
        check: "string_format",
        format: "starts_with",
        ...normalizeParams(params),
        prefix
    });
}
function _endsWith(suffix, params) {
    return new $ZodCheckEndsWith({
        check: "string_format",
        format: "ends_with",
        ...normalizeParams(params),
        suffix
    });
}
function _overwrite(tx) {
    return new $ZodCheckOverwrite({
        check: "overwrite",
        tx
    });
}
function _normalize(form) {
    return _overwrite((input)=>input.normalize(form));
}
function _trim() {
    return _overwrite((input)=>input.trim());
}
function _toLowerCase() {
    return _overwrite((input)=>input.toLowerCase());
}
function _toUpperCase() {
    return _overwrite((input)=>input.toUpperCase());
}
function _slugify() {
    return _overwrite((input)=>slugify(input));
}
function _array(Class, element, params) {
    return new Class({
        type: "array",
        element,
        ...normalizeParams(params)
    });
}
function _refine(Class, fn, _params) {
    const schema = new Class({
        type: "custom",
        check: "custom",
        fn: fn,
        ...normalizeParams(_params)
    });
    return schema;
}
function _superRefine(fn, params) {
    const ch = _check((payload)=>{
        payload.addIssue = (issue)=>{
            if ("string" == typeof issue) payload.issues.push(util_issue(issue, payload.value, ch._zod.def));
            else {
                const _issue = issue;
                if (_issue.fatal) _issue.continue = false;
                _issue.code ?? (_issue.code = "custom");
                if (!("input" in _issue)) _issue.input = payload.value;
                _issue.inst ?? (_issue.inst = ch);
                _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
                payload.issues.push(util_issue(_issue));
            }
        };
        return fn(payload.value, payload);
    }, params);
    return ch;
}
function _check(fn, params) {
    const ch = new $ZodCheck({
        check: "custom",
        ...normalizeParams(params)
    });
    ch._zod.check = fn;
    return ch;
}
function assignProps(target, ...sources) {
    for (const source of sources)for (const key of Reflect.ownKeys(source))if (Object.prototype.propertyIsEnumerable.call(source, key)) util_assignProp(target, key, source[key]);
    return target;
}
function to_json_schema_initializeContext(params) {
    let target = params?.target ?? "draft-2020-12";
    if ("draft-4" === target) target = "draft-04";
    if ("draft-7" === target) target = "draft-07";
    return {
        processors: params.processors ?? {},
        metadataRegistry: params?.metadata ?? globalRegistry,
        target,
        unrepresentable: params?.unrepresentable ?? "throw",
        override: params?.override ?? (()=>{}),
        io: params?.io ?? "output",
        counter: 0,
        seen: new Map(),
        sharedDefsExtractedFor: void 0,
        sharedEmitDoneFor: void 0,
        cycles: params?.cycles ?? "ref",
        reused: params?.reused ?? "inline",
        intersections: [],
        deferred: [],
        external: params?.external ?? void 0
    };
}
function to_json_schema_handleUnrepresentable(schema, ctx, json, params, message) {
    const result = "function" == typeof ctx.unrepresentable ? ctx.unrepresentable({
        zodSchema: schema,
        path: params.path,
        message
    }) : ctx.unrepresentable;
    if ("any" === result) return false;
    if (void 0 === result || "throw" === result) throw new Error(message);
    Object.assign(json, result);
    return true;
}
function to_json_schema_processSchema(schema, ctx, _params = {
    path: [],
    schemaPath: []
}) {
    var _a;
    const def = schema._zod.def;
    const seen = ctx.seen.get(schema);
    if (seen) {
        seen.count++;
        const isCycle = _params.schemaPath.includes(schema);
        if (isCycle) seen.cycle = _params.path;
        return seen.schema;
    }
    const result = {
        schema: {},
        count: 1,
        cycle: void 0,
        path: _params.path
    };
    ctx.seen.set(schema, result);
    ctx.sharedDefsExtractedFor = void 0;
    ctx.sharedEmitDoneFor = void 0;
    const overrideSchema = schema._zod.toJSONSchema?.();
    if (overrideSchema) result.schema = overrideSchema;
    else {
        const params = {
            ..._params,
            schemaPath: [
                ..._params.schemaPath,
                schema
            ],
            path: _params.path
        };
        if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
        else {
            const _json = result.schema;
            const processor = ctx.processors[def.type];
            if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
            processor(schema, ctx, _json, params);
        }
        const parent = schema._zod.parent;
        if (parent) {
            if (!result.ref) result.ref = parent;
            to_json_schema_processSchema(parent, ctx, params);
            ctx.seen.get(parent).isParent = true;
        }
    }
    const meta = ctx.metadataRegistry.get(schema);
    if (meta) assignProps(result.schema, meta);
    if ("input" === ctx.io && isTransforming(schema)) {
        delete result.schema.examples;
        delete result.schema.default;
    }
    if ("input" === ctx.io && "_prefault" in result.schema) (_a = result.schema).default ?? (_a.default = result.schema._prefault);
    delete result.schema._prefault;
    const _result = ctx.seen.get(schema);
    return _result.schema;
}
function encodeJSONPointerSegment(segment) {
    return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function to_json_schema_extractDefs(ctx, schema) {
    const root = ctx.seen.get(schema);
    if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
    if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external) return;
    const idToSchema = new Map();
    for (const entry of ctx.seen.entries()){
        const id = ctx.metadataRegistry.get(entry[0])?.id;
        if (id) {
            const existing = idToSchema.get(id);
            if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
            idToSchema.set(id, entry[0]);
        }
    }
    const makeURI = (entry)=>{
        const defsSegment = "draft-2020-12" === ctx.target ? "$defs" : "definitions";
        if (ctx.external) {
            const externalId = ctx.external.registry.get(entry[0])?.id;
            const uriGenerator = ctx.external.uri ?? ((id)=>id);
            if (externalId) return {
                ref: uriGenerator(externalId)
            };
            const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
            entry[1].defId = id;
            return {
                defId: id,
                ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}`
            };
        }
        const uriPrefix = "#";
        const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
        if (entry[1] === root && !entry[1].schema.id) return {
            ref: uriPrefix
        };
        const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
        return {
            defId,
            ref: defUriPrefix + encodeJSONPointerSegment(defId)
        };
    };
    const extractToDef = (entry)=>{
        if (entry[1].schema.$ref) return;
        const seen = entry[1];
        const { ref, defId } = makeURI(entry);
        seen.def = {
            ...seen.schema
        };
        if (defId) seen.defId = defId;
        const schema = seen.schema;
        for(const key in schema)delete schema[key];
        schema.$ref = ref;
    };
    if ("throw" === ctx.cycles) for (const entry of ctx.seen.entries()){
        const seen = entry[1];
        if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>\n\nSet the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
    }
    for (const entry of ctx.seen.entries()){
        const seen = entry[1];
        if (schema === entry[0]) {
            extractToDef(entry);
            continue;
        }
        if (ctx.external) {
            const ext = ctx.external.registry.get(entry[0])?.id;
            if (schema !== entry[0] && ext) {
                extractToDef(entry);
                continue;
            }
        }
        const id = ctx.metadataRegistry.get(entry[0])?.id;
        if (id) {
            extractToDef(entry);
            continue;
        }
        if (seen.cycle) {
            extractToDef(entry);
            continue;
        }
        if (seen.count > 1) {
            if ("ref" === ctx.reused) extractToDef(entry);
        }
    }
    if (ctx.external) ctx.sharedDefsExtractedFor = ctx.external;
}
function compactTypeUnion(schema) {
    const options = schema.anyOf;
    if (!Array.isArray(options) || 0 === options.length || void 0 !== schema.type) return;
    const types = [];
    for (const option of options){
        if (!option || "object" != typeof option) return;
        compactTypeUnion(option);
        const keys = Object.keys(option);
        if (1 !== keys.length || "type" !== keys[0]) return;
        const type = option.type;
        for (const member of Array.isArray(type) ? type : [
            type
        ]){
            if ("string" != typeof member) return;
            if (!types.includes(member)) types.push(member);
        }
    }
    delete schema.anyOf;
    schema.type = 1 === types.length ? types[0] : types;
}
const FOLDABLE_KEYS = new Set([
    "type",
    "properties",
    "required",
    "additionalProperties"
]);
const UNION_KEYS = [
    "oneOf",
    "anyOf"
];
function undeclaredConstraint(member) {
    const extra = member.additionalProperties;
    if (void 0 === extra || false === extra || "object" != typeof extra || null === extra) return null;
    return Object.keys(extra).length ? extra : null;
}
function foldObjects(members) {
    const objects = [];
    for (const member of members){
        if ("object" != typeof member || "object" !== member.type) return null;
        for(const key in member)if (!FOLDABLE_KEYS.has(key)) return null;
        objects.push(member);
    }
    const properties = {};
    const required = new Set();
    for (const object of objects){
        for(const key in object.properties){
            if (Object.prototype.hasOwnProperty.call(properties, key)) continue;
            const parts = [];
            for (const other of objects){
                const part = other.properties?.[key] ?? undeclaredConstraint(other);
                if (null != part) {
                    if (!parts.some((seen)=>JSON.stringify(seen) === JSON.stringify(part))) parts.push(part);
                }
            }
            const merged = 1 === parts.length ? parts[0] : foldObjects(parts) ?? {
                allOf: parts
            };
            util_assignProp(properties, key, merged);
        }
        for (const key of object.required ?? [])required.add(key);
    }
    const folded = {
        type: "object",
        properties
    };
    if (required.size) folded.required = [
        ...required
    ];
    if (objects.every((object)=>false === object.additionalProperties)) folded.additionalProperties = false;
    else {
        const constraints = [];
        for (const object of objects){
            const constraint = undeclaredConstraint(object);
            if (constraint && !constraints.some((seen)=>JSON.stringify(seen) === JSON.stringify(constraint))) constraints.push(constraint);
        }
        if (1 === constraints.length) folded.additionalProperties = constraints[0];
        else if (constraints.length > 1) folded.additionalProperties = {
            allOf: constraints
        };
    }
    return folded;
}
function foldIntersection(json) {
    const allOf = json.allOf;
    if (!Array.isArray(allOf) || allOf.length < 2) return;
    for (const key of FOLDABLE_KEYS)if (key in json) return;
    const unions = allOf.filter((m)=>UNION_KEYS.some((k)=>Array.isArray(m[k])));
    let folded = null;
    if (unions.length) {
        const union = unions[0];
        const keyword = UNION_KEYS.find((k)=>Array.isArray(union[k]));
        if (1 !== Object.keys(union).length) return;
        const rest = allOf.filter((m)=>m !== union);
        const branches = union[keyword].map((branch)=>foldObjects([
                ...rest,
                branch
            ]));
        if (branches.some((b)=>!b)) return;
        folded = {
            [keyword]: branches
        };
    } else folded = foldObjects(allOf);
    if (!folded) return;
    delete json.allOf;
    assignProps(json, folded);
}
function to_json_schema_finalize(ctx, schema) {
    const root = ctx.seen.get(schema);
    if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
    const flattenRef = (zodSchema)=>{
        const seen = ctx.seen.get(zodSchema);
        if (null === seen.ref) return;
        const schema = seen.def ?? seen.schema;
        const _cached = {
            ...schema
        };
        const ref = seen.ref;
        seen.ref = null;
        if (ref) {
            flattenRef(ref);
            const refSeen = ctx.seen.get(ref);
            const refSchema = refSeen.schema;
            if (refSchema.$ref && ("draft-07" === ctx.target || "draft-04" === ctx.target || "openapi-3.0" === ctx.target)) {
                schema.allOf = schema.allOf ?? [];
                schema.allOf.push(refSchema);
            } else assignProps(schema, refSchema);
            assignProps(schema, _cached);
            const isParentRef = zodSchema._zod.parent === ref;
            if (isParentRef) {
                for(const key in schema)if ("$ref" !== key && "allOf" !== key) {
                    if (!(key in _cached)) delete schema[key];
                }
            }
            if (refSchema.$ref && refSeen.def) {
                for(const key in schema)if ("$ref" !== key && "allOf" !== key) {
                    if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) delete schema[key];
                }
            }
        }
        const parent = zodSchema._zod.parent;
        if (parent && parent !== ref) {
            flattenRef(parent);
            const parentSeen = ctx.seen.get(parent);
            if (parentSeen?.schema.$ref) {
                schema.$ref = parentSeen.schema.$ref;
                if (parentSeen.def) {
                    for(const key in schema)if ("$ref" !== key && "allOf" !== key) {
                        if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) delete schema[key];
                    }
                }
            }
        }
        ctx.override({
            zodSchema: zodSchema,
            jsonSchema: schema,
            path: seen.path ?? []
        });
    };
    if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
        for (const entry of [
            ...ctx.seen.entries()
        ].reverse())flattenRef(entry[0]);
        if ("openapi-3.0" !== ctx.target) for (const entry of ctx.seen.entries())compactTypeUnion(entry[1].def ?? entry[1].schema);
        for (const rewrite of ctx.deferred)rewrite();
        if (ctx.intersections.length) {
            const carriers = new Map();
            for (const seen of ctx.seen.values())for (const json of [
                seen.schema,
                seen.def
            ]){
                const allOf = json?.allOf;
                if (!Array.isArray(allOf)) continue;
                const existing = carriers.get(allOf);
                if (existing) existing.push(json);
                else carriers.set(allOf, [
                    json
                ]);
            }
            for (const allOf of ctx.intersections)for (const json of carriers.get(allOf) ?? [])foldIntersection(json);
        }
    }
    const result = {};
    if ("draft-2020-12" === ctx.target) result.$schema = "https://json-schema.org/draft/2020-12/schema";
    else if ("draft-07" === ctx.target) result.$schema = "http://json-schema.org/draft-07/schema#";
    else if ("draft-04" === ctx.target) result.$schema = "http://json-schema.org/draft-04/schema#";
    else ctx.target;
    if (ctx.external?.uri) {
        const id = ctx.external.registry.get(schema)?.id;
        if (!id) throw new Error("Schema is missing an `id` property");
        result.$id = ctx.external.uri(id);
    }
    assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
    const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
    if (void 0 !== rootMetaId && result.id === rootMetaId) delete result.id;
    const defs = ctx.external?.defs ?? {};
    if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) for (const entry of ctx.seen.entries()){
        const seen = entry[1];
        if (seen.def && seen.defId) {
            if (seen.def.id === seen.defId) delete seen.def.id;
            util_assignProp(defs, seen.defId, seen.def);
        }
    }
    if (ctx.external) ctx.sharedEmitDoneFor = ctx.external;
    if (ctx.external) ;
    else if (Object.keys(defs).length > 0) if ("draft-2020-12" === ctx.target) result.$defs = defs;
    else result.definitions = defs;
    try {
        const finalized = JSON.parse(JSON.stringify(result));
        Object.defineProperty(finalized, "~standard", {
            value: {
                ...schema["~standard"],
                jsonSchema: {
                    input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
                    output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
                }
            },
            enumerable: false,
            writable: false
        });
        return finalized;
    } catch (_err) {
        throw new Error("Error converting schema to JSON.");
    }
}
function isTransforming(_schema, _ctx) {
    const ctx = _ctx ?? {
        seen: new Set()
    };
    if (ctx.seen.has(_schema)) return false;
    ctx.seen.add(_schema);
    const def = _schema._zod.def;
    if ("transform" === def.type) return true;
    if ("array" === def.type) return isTransforming(def.element, ctx);
    if ("set" === def.type) return isTransforming(def.valueType, ctx);
    if ("lazy" === def.type) return isTransforming(def.getter(), ctx);
    if ("promise" === def.type || "optional" === def.type || "nonoptional" === def.type || "nullable" === def.type || "readonly" === def.type || "default" === def.type || "prefault" === def.type || "catch" === def.type) return isTransforming(def.innerType, ctx);
    if ("intersection" === def.type) return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
    if ("record" === def.type || "map" === def.type) return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    if ("pipe" === def.type) {
        if (_schema._zod.traits.has("$ZodCodec")) return true;
        return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
    }
    if ("object" === def.type) {
        for(const key in def.shape)if (isTransforming(def.shape[key], ctx)) return true;
        return false;
    }
    if ("union" === def.type) {
        for (const option of def.options)if (isTransforming(option, ctx)) return true;
        return false;
    }
    if ("tuple" === def.type) {
        for (const item of def.items)if (isTransforming(item, ctx)) return true;
        if (def.rest && isTransforming(def.rest, ctx)) return true;
    }
    return false;
}
const createToJSONSchemaMethod = (schema, processors = {})=>(params)=>{
        const ctx = to_json_schema_initializeContext({
            ...params,
            processors
        });
        to_json_schema_processSchema(schema, ctx);
        to_json_schema_extractDefs(ctx, schema);
        return to_json_schema_finalize(ctx, schema);
    };
const createStandardJSONSchemaMethod = (schema, io, processors = {})=>(params)=>{
        const { libraryOptions, target } = params ?? {};
        const ctx = to_json_schema_initializeContext({
            ...libraryOptions ?? {},
            target,
            io,
            processors
        });
        to_json_schema_processSchema(schema, ctx);
        to_json_schema_extractDefs(ctx, schema);
        return to_json_schema_finalize(ctx, schema);
    };
const narrowMin = (agg, key, value)=>{
    if (void 0 === agg[key] || value > agg[key]) agg[key] = value;
};
const narrowMax = (agg, key, value)=>{
    if (void 0 === agg[key] || value < agg[key]) agg[key] = value;
};
const narrowBoth = (agg, value)=>{
    narrowMin(agg, "minimum", value);
    narrowMax(agg, "maximum", value);
};
const addDivisor = (agg, value)=>{
    agg.multipleOf ?? (agg.multipleOf = []);
    if (!agg.multipleOf.includes(value)) agg.multipleOf.push(value);
};
const addPattern = (agg, pattern)=>{
    agg.patterns ?? (agg.patterns = new Set());
    agg.patterns.add(pattern);
};
const intersectMime = (agg, mime)=>{
    agg.mime = agg.mime ? agg.mime.filter((m)=>mime.includes(m)) : [
        ...mime
    ];
};
const setFormat = (agg, format)=>{
    agg.format = format;
    if (format.includes("int")) agg.isInt = true;
};
const minContributor = (agg, def)=>narrowMin(agg, "minimum", def.minimum);
const maxContributor = (agg, def)=>narrowMax(agg, "maximum", def.maximum);
const formatContributor = (ranges)=>(agg, def)=>{
        setFormat(agg, def.format);
        const [minimum, maximum] = ranges[def.format];
        narrowMin(agg, "minimum", minimum);
        narrowMax(agg, "maximum", maximum);
    };
const contributors = {
    greater_than: (agg, def)=>narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
    less_than: (agg, def)=>narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
    multiple_of: (agg, def)=>addDivisor(agg, def.value),
    number_format: formatContributor(NUMBER_FORMAT_RANGES),
    bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
    min_length: minContributor,
    max_length: maxContributor,
    length_equals: (agg, def)=>narrowBoth(agg, def.length),
    min_size: minContributor,
    max_size: maxContributor,
    size_equals: (agg, def)=>narrowBoth(agg, def.size),
    string_format: (agg, def)=>{
        setFormat(agg, def.format);
        if (def.pattern) addPattern(agg, def.pattern);
        if ("base64" === def.format || "base64url" === def.format) agg.contentEncoding = def.format;
        if (def.local || -1 === def.precision) agg.laxFormat = true;
    },
    mime_type: (agg, def)=>intersectMime(agg, def.mime)
};
function aggregateChecks(schema) {
    const agg = {};
    const def = schema._zod.def;
    const list = schema._zod.traits.has("$ZodCheck") ? [
        schema,
        ...def.checks ?? []
    ] : def.checks ?? [];
    for (const ch of list)contributors[ch._zod.def.check]?.(agg, ch._zod.def);
    const bag = schema._zod.bag;
    if (void 0 !== bag.minimum) narrowMin(agg, "minimum", bag.minimum);
    if (void 0 !== bag.exclusiveMinimum) narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
    if (void 0 !== bag.maximum) narrowMax(agg, "maximum", bag.maximum);
    if (void 0 !== bag.exclusiveMaximum) narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
    if (void 0 !== bag.multipleOf) addDivisor(agg, bag.multipleOf);
    if (void 0 !== bag.format) {
        agg.format ?? (agg.format = bag.format);
        if (bag.format.includes("int")) agg.isInt = true;
    }
    if (bag.mime) intersectMime(agg, bag.mime);
    for (const pattern of bag.patterns ?? [])addPattern(agg, pattern);
    return agg;
}
const formatMap = {
    guid: "uuid",
    url: "uri",
    datetime: "date-time",
    json_string: "json-string",
    regex: ""
};
const exactPatterns = new Map([
    [
        base64Charset,
        regexes_base64
    ],
    [
        base64urlCharset,
        regexes_base64url
    ]
]);
const exactPattern = (p)=>exactPatterns.get(p) ?? p;
const stringProcessor = (schema, ctx, _json, _params)=>{
    const json = _json;
    json.type = "string";
    const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
    if ("number" == typeof minimum) json.minLength = minimum;
    if ("number" == typeof maximum) json.maxLength = maximum;
    if (format) {
        json.format = formatMap[format] ?? format;
        if ("" === json.format) delete json.format;
        if ("time" === format || laxFormat) delete json.format;
    }
    if (contentEncoding) json.contentEncoding = contentEncoding;
    if (patterns && patterns.size > 0) {
        const patternList = [
            ...patterns
        ].map(exactPattern);
        if (1 === patternList.length) json.pattern = patternList[0].source;
        else if (patternList.length > 1) json.allOf = [
            ...patternList.map((regex)=>({
                    ..."draft-07" === ctx.target || "draft-04" === ctx.target || "openapi-3.0" === ctx.target ? {
                        type: "string"
                    } : {},
                    pattern: regex.source
                }))
        ];
    }
};
const numberProcessor = (schema, ctx, _json, params)=>{
    const json = _json;
    const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
    json.type = isInt ? "integer" : "number";
    const exMin = "number" == typeof exclusiveMinimum && exclusiveMinimum >= (minimum ?? -1 / 0);
    const exMax = "number" == typeof exclusiveMaximum && exclusiveMaximum <= (maximum ?? 1 / 0);
    const legacy = "draft-04" === ctx.target || "openapi-3.0" === ctx.target;
    if (exMin) if (legacy) {
        json.minimum = exclusiveMinimum;
        json.exclusiveMinimum = true;
    } else json.exclusiveMinimum = exclusiveMinimum;
    else if ("number" == typeof minimum) json.minimum = minimum;
    if (exMax) if (legacy) {
        json.maximum = exclusiveMaximum;
        json.exclusiveMaximum = true;
    } else json.exclusiveMaximum = exclusiveMaximum;
    else if ("number" == typeof maximum) json.maximum = maximum;
    if (multipleOf) {
        const divisors = new Set();
        for (const divisor of multipleOf)if (Number.isFinite(divisor) && 0 !== divisor) divisors.add(Math.abs(divisor));
        else to_json_schema_handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
        const [first, ...rest] = divisors;
        if (void 0 !== first) json.multipleOf = first;
        if (rest.length) json.allOf = [
            ...json.allOf ?? [],
            ...rest.map((m)=>({
                    multipleOf: m
                }))
        ];
    }
};
const booleanProcessor = (_schema, _ctx, json, _params)=>{
    json.type = "boolean";
};
const neverProcessor = (_schema, _ctx, json, _params)=>{
    json.not = {};
};
const unknownProcessor = (_schema, _ctx, _json, _params)=>{};
const enumProcessor = (schema, _ctx, json, _params)=>{
    const def = schema._zod.def;
    const values = getEnumValues(def.entries);
    if (0 === values.length) {
        json.not = {};
        return;
    }
    if (values.every((v)=>"number" == typeof v)) json.type = "number";
    if (values.every((v)=>"string" == typeof v)) json.type = "string";
    json.enum = values;
};
const literalProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    if (0 === def.values.length) {
        json.not = {};
        return;
    }
    const vals = [];
    for (const val of def.values)if (void 0 === val) {
        if (to_json_schema_handleUnrepresentable(schema, ctx, json, params, "Literal `undefined` cannot be represented in JSON Schema")) return;
    } else if ("bigint" == typeof val) {
        if (to_json_schema_handleUnrepresentable(schema, ctx, json, params, "BigInt literals cannot be represented in JSON Schema")) return;
        vals.push(Number(val));
    } else vals.push(val);
    if (0 === vals.length) ;
    else if (1 === vals.length) {
        const val = vals[0];
        json.type = null === val ? "null" : typeof val;
        if ("draft-04" === ctx.target || "openapi-3.0" === ctx.target) json.enum = [
            val
        ];
        else json.const = val;
    } else {
        if (vals.every((v)=>"number" == typeof v)) json.type = "number";
        if (vals.every((v)=>"string" == typeof v)) json.type = "string";
        if (vals.every((v)=>"boolean" == typeof v)) json.type = "boolean";
        if (vals.every((v)=>null === v)) json.type = "null";
        json.enum = vals;
    }
};
const customProcessor = (schema, ctx, json, params)=>{
    to_json_schema_handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
};
const transformProcessor = (schema, ctx, json, params)=>{
    to_json_schema_handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
};
const arrayProcessor = (schema, ctx, _json, params)=>{
    const json = _json;
    const def = schema._zod.def;
    const { minimum, maximum } = aggregateChecks(schema);
    if ("number" == typeof minimum) json.minItems = minimum;
    if ("number" == typeof maximum) json.maxItems = maximum;
    json.type = "array";
    json.items = to_json_schema_processSchema(def.element, ctx, {
        ...params,
        path: [
            ...params.path,
            "items"
        ]
    });
};
function inputOptin(schema) {
    const def = schema._zod.def;
    if ("pipe" === def.type && def.in._zod.traits.has("$ZodTransform")) return inputOptin(def.out);
    if ("catch" === def.type) return inputOptin(def.innerType);
    return schema._zod.optin;
}
const objectProcessor = (schema, ctx, _json, params)=>{
    const json = _json;
    const def = schema._zod.def;
    const shape = def.shape;
    const symbolKeys = Object.getOwnPropertySymbols(shape);
    if (symbolKeys.length && to_json_schema_handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) return;
    json.type = "object";
    json.properties = {};
    for(const key in shape)util_assignProp(json.properties, key, to_json_schema_processSchema(shape[key], ctx, {
        ...params,
        path: [
            ...params.path,
            "properties",
            key
        ]
    }));
    const requiredKeys = [];
    for (const key of Object.keys(shape)){
        const field = def.shape[key];
        if ("input" === ctx.io ? void 0 === inputOptin(field) : void 0 === field._zod.optout) requiredKeys.push(key);
    }
    if (requiredKeys.length > 0) json.required = requiredKeys;
    if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
    else if (def.catchall) {
        if (def.catchall) json.additionalProperties = to_json_schema_processSchema(def.catchall, ctx, {
            ...params,
            path: [
                ...params.path,
                "additionalProperties"
            ]
        });
    } else if ("output" === ctx.io) json.additionalProperties = false;
};
const unionProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    const isExclusive = false === def.inclusive;
    const options = def.options.map((x, i)=>to_json_schema_processSchema(x, ctx, {
            ...params,
            path: [
                ...params.path,
                isExclusive ? "oneOf" : "anyOf",
                i
            ]
        }));
    if (isExclusive) json.oneOf = options;
    else json.anyOf = options;
};
const intersectionProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    const a = to_json_schema_processSchema(def.left, ctx, {
        ...params,
        path: [
            ...params.path,
            "allOf",
            0
        ]
    });
    const b = to_json_schema_processSchema(def.right, ctx, {
        ...params,
        path: [
            ...params.path,
            "allOf",
            1
        ]
    });
    const isSimpleIntersection = (val)=>"allOf" in val && 1 === Object.keys(val).length;
    const allOf = [
        ...isSimpleIntersection(a) ? a.allOf : [
            a
        ],
        ...isSimpleIntersection(b) ? b.allOf : [
            b
        ]
    ];
    json.allOf = allOf;
    ctx.intersections.push(allOf);
};
function stringifyKeyNames(bySchema, json, visited) {
    if (json.$ref) {
        if (visited.has(json)) return json;
        visited.add(json);
        const def = bySchema.get(json)?.def;
        if (!def) return json;
        const inlined = stringifyKeyNames(bySchema, def, visited);
        return inlined === def ? json : inlined;
    }
    for (const keyword of [
        "anyOf",
        "oneOf"
    ]){
        const branches = json[keyword];
        if (!Array.isArray(branches)) continue;
        const mapped = branches.map((branch)=>stringifyKeyNames(bySchema, branch, visited));
        if (mapped.some((branch, i)=>branch !== branches[i])) json = {
            ...json,
            [keyword]: mapped
        };
    }
    const types = Array.isArray(json.type) ? json.type : [
        json.type
    ];
    const numericType = !types.includes("string") && types.some((t)=>"number" === t || "integer" === t);
    const values = json.enum ?? (void 0 !== json.const ? [
        json.const
    ] : void 0);
    if (!numericType && !values?.some((v)=>"number" == typeof v)) return json;
    const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, format, id, ...rest } = json;
    if (rest.enum) rest.enum = rest.enum.map((v)=>"number" == typeof v ? String(v) : v);
    else if ("number" == typeof rest.const) rest.const = String(rest.const);
    if (!numericType) return rest;
    rest.type = "string";
    if (!values) rest.pattern = (types.includes("number") ? number : integer).source;
    return rest;
}
const pendingRecords = new WeakMap();
function rewriteKeyNames(ctx) {
    const bySchema = new Map();
    for (const entry of ctx.seen.values())if (entry.def && !bySchema.has(entry.schema)) bySchema.set(entry.schema, entry);
    const rewrites = new Map();
    for (const record of pendingRecords.get(ctx) ?? []){
        const seen = ctx.seen.get(record);
        const names = (seen?.def ?? seen?.schema)?.propertyNames;
        if (!names || true === names || rewrites.has(names)) continue;
        const rewritten = stringifyKeyNames(bySchema, names, new Set());
        if (rewritten !== names) rewrites.set(names, rewritten);
    }
    if (!rewrites.size) return;
    for (const entry of ctx.seen.values())for (const carrier of [
        entry.schema,
        entry.def
    ]){
        const rewritten = carrier && rewrites.get(carrier.propertyNames);
        if (rewritten) carrier.propertyNames = rewritten;
    }
}
const recordProcessor = (schema, ctx, _json, params)=>{
    const json = _json;
    const def = schema._zod.def;
    json.type = "object";
    const keyType = def.keyType;
    const patterns = aggregateChecks(keyType).patterns;
    if ("loose" === def.mode && patterns && patterns.size > 0) {
        const valueSchema = to_json_schema_processSchema(def.valueType, ctx, {
            ...params,
            path: [
                ...params.path,
                "patternProperties",
                "*"
            ]
        });
        json.patternProperties = {};
        for (const pattern of patterns)util_assignProp(json.patternProperties, exactPattern(pattern).source, valueSchema);
    } else {
        if ("draft-07" === ctx.target || "draft-2020-12" === ctx.target) {
            json.propertyNames = to_json_schema_processSchema(def.keyType, ctx, {
                ...params,
                path: [
                    ...params.path,
                    "propertyNames"
                ]
            });
            let pending = pendingRecords.get(ctx);
            if (!pending) {
                pending = [];
                pendingRecords.set(ctx, pending);
                ctx.deferred.push(()=>rewriteKeyNames(ctx));
            }
            pending.push(schema);
        }
        json.additionalProperties = to_json_schema_processSchema(def.valueType, ctx, {
            ...params,
            path: [
                ...params.path,
                "additionalProperties"
            ]
        });
    }
    const keyValues = keyType._zod.values;
    const omittableOnInput = "input" === ctx.io && void 0 !== inputOptin(def.valueType);
    if (keyValues && !def.partial && !omittableOnInput) {
        const validKeyValues = [
            ...keyValues
        ].filter((v)=>"string" == typeof v || "number" == typeof v);
        if (validKeyValues.length > 0) json.required = validKeyValues.map(String);
    }
};
const nullableProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    const inner = to_json_schema_processSchema(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    if ("openapi-3.0" === ctx.target) {
        seen.ref = def.innerType;
        json.nullable = true;
    } else json.anyOf = [
        inner,
        {
            type: "null"
        }
    ];
};
const nonoptionalProcessor = (schema, ctx, _json, params)=>{
    const def = schema._zod.def;
    to_json_schema_processSchema(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
};
const UNREPRESENTABLE_DEFAULT = Symbol();
function serializeDefaultValue(value, schema, ctx, json, params) {
    let unrepresentable = false;
    const serialized = JSON.stringify(value, (_, val)=>{
        if ("bigint" != typeof val) return val;
        unrepresentable = true;
        return null;
    });
    if (!unrepresentable) return JSON.parse(serialized);
    to_json_schema_handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
    return UNREPRESENTABLE_DEFAULT;
}
const defaultProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    to_json_schema_processSchema(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
    if (value !== UNREPRESENTABLE_DEFAULT) json.default = value;
};
const prefaultProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    to_json_schema_processSchema(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    if ("input" !== ctx.io) return;
    const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
    if (value !== UNREPRESENTABLE_DEFAULT) json._prefault = value;
};
const catchProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    to_json_schema_processSchema(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    let catchValue;
    try {
        catchValue = def.catchValue(void 0);
    } catch  {
        to_json_schema_handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
        return;
    }
    json.default = catchValue;
};
const pipeProcessor = (schema, ctx, _json, params)=>{
    const def = schema._zod.def;
    const inIsTransform = def.in._zod.traits.has("$ZodTransform");
    const innerType = "input" === ctx.io ? inIsTransform ? def.out : def.in : def.out;
    to_json_schema_processSchema(innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = innerType;
};
const readonlyProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    to_json_schema_processSchema(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    json.readOnly = true;
};
const optionalProcessor = (schema, ctx, _json, params)=>{
    const def = schema._zod.def;
    to_json_schema_processSchema(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
};
const en_error = ()=>{
    const Sizable = {
        string: {
            unit: "characters",
            verb: "to have"
        },
        file: {
            unit: "bytes",
            verb: "to have"
        },
        array: {
            unit: "items",
            verb: "to have"
        },
        set: {
            unit: "items",
            verb: "to have"
        },
        map: {
            unit: "entries",
            verb: "to have"
        }
    };
    function getSizing(origin) {
        return Sizable[origin] ?? null;
    }
    const FormatDictionary = {
        regex: "input",
        email: "email address",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datetime",
        date: "ISO date",
        time: "ISO time",
        duration: "ISO duration",
        ipv4: "IPv4 address",
        ipv6: "IPv6 address",
        mac: "MAC address",
        cidrv4: "IPv4 range",
        cidrv6: "IPv6 range",
        base64: "base64-encoded string",
        base64url: "base64url-encoded string",
        json_string: "JSON string",
        e164: "E.164 number",
        currency_code: "currency code",
        credit_card: "credit card number",
        iban: "IBAN",
        jwt: "JWT",
        template_literal: "input"
    };
    const TypeDictionary = {
        nan: "NaN"
    };
    function getTypeName(type, input) {
        if ("number" === type && "number" == typeof input && !Number.isFinite(input)) return String(input);
        return TypeDictionary[type] ?? type;
    }
    return (issue)=>{
        switch(issue.code){
            case "invalid_type":
                {
                    const expected = getTypeName(issue.expected);
                    const receivedType = parsedType(issue.input);
                    const received = getTypeName(receivedType, issue.input);
                    return `Invalid input: expected ${expected}, received ${received}`;
                }
            case "invalid_value":
                if (1 === issue.values.length) return `Invalid input: expected ${stringifyPrimitive(issue.values[0])}`;
                return `Invalid option: expected one of ${joinValues(issue.values, "|")}`;
            case "too_big":
                {
                    const adj = issue.exact ? "exactly " : issue.inclusive ? "<=" : "<";
                    const sizing = getSizing(issue.origin);
                    if (sizing) return `Too big: expected ${issue.origin ?? "value"} to have ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
                    return `Too big: expected ${issue.origin ?? "value"} to be ${adj}${issue.maximum.toString()}`;
                }
            case "too_small":
                {
                    const adj = issue.exact ? "exactly " : issue.inclusive ? ">=" : ">";
                    const sizing = getSizing(issue.origin);
                    if (sizing) return `Too small: expected ${issue.origin} to have ${adj}${issue.minimum.toString()} ${sizing.unit}`;
                    return `Too small: expected ${issue.origin} to be ${adj}${issue.minimum.toString()}`;
                }
            case "invalid_format":
                {
                    const _issue = issue;
                    if ("starts_with" === _issue.format) return `Invalid string: must start with "${_issue.prefix}"`;
                    if ("ends_with" === _issue.format) return `Invalid string: must end with "${_issue.suffix}"`;
                    if ("includes" === _issue.format) return `Invalid string: must include "${_issue.includes}"`;
                    if ("regex" === _issue.format) return `Invalid string: must match pattern ${_issue.pattern}`;
                    return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
                }
            case "not_multiple_of":
                return `Invalid number: must be a multiple of ${issue.divisor}`;
            case "unrecognized_keys":
                return `Unrecognized key${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
            case "invalid_key":
                return `Invalid key in ${issue.origin}`;
            case "invalid_union":
                if (issue.options && Array.isArray(issue.options) && issue.options.length > 0) {
                    const opts = issue.options.map((o)=>`'${o}'`).join(" | ");
                    return `Invalid discriminator value. Expected ${opts}`;
                }
                if (false === issue.inclusive) return "Invalid input: more than one option matched";
                return "Invalid input";
            case "invalid_element":
                return `Invalid value in ${issue.origin}`;
            default:
                return "Invalid input";
        }
    };
};
function en() {
    return {
        localeError: en_error()
    };
}
function _getMessage() {
    const internals = this._zod;
    internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
    return internals.message;
}
function _setMessage(value) {
    this._zod.message = value;
}
const _messageDesc = {
    get: _getMessage,
    set: _setMessage,
    enumerable: true,
    configurable: true
};
const _issuesDesc = {
    value: void 0,
    enumerable: false
};
const _installedToString = /* @__PURE__ */ new WeakSet([
    Object.prototype,
    Error.prototype
]);
const errors_initializer = (inst, def)=>{
    inst.name = "$ZodError";
    _issuesDesc.value = def;
    Object.defineProperty(inst, "issues", _issuesDesc);
    _issuesDesc.value = void 0;
    Object.defineProperty(inst, "message", _messageDesc);
    const proto = Object.getPrototypeOf(inst);
    if (!_installedToString.has(proto)) {
        _installedToString.add(proto);
        Object.defineProperty(proto, "toString", {
            configurable: true,
            enumerable: false,
            get () {
                const value = ()=>this.message;
                Object.defineProperty(this, "toString", {
                    value,
                    configurable: true,
                    writable: true
                });
                return value;
            },
            set (value) {
                Object.defineProperty(this, "toString", {
                    value,
                    configurable: true,
                    writable: true
                });
            }
        });
    }
};
const $ZodError = $constructor("$ZodError", errors_initializer);
$constructor("$ZodError", errors_initializer, void 0, {
    Parent: Error
});
function errors_node(obj, key, make) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) if ("__proto__" === key) Object.defineProperty(obj, key, {
        value: make(),
        writable: true,
        enumerable: true,
        configurable: true
    });
    else obj[key] = make();
    return obj[key];
}
function flattenError(error, mapper = (issue)=>issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of error.issues)if (sub.path.length > 0) errors_node(fieldErrors, sub.path[0], ()=>[]).push(mapper(sub));
    else formErrors.push(mapper(sub));
    return {
        formErrors,
        fieldErrors
    };
}
function formatError(error, mapper = (issue)=>issue.message) {
    const fieldErrors = {
        _errors: []
    };
    const processError = (error, path = [])=>{
        for (const issue of error.issues)if ("invalid_union" === issue.code && issue.errors.length) issue.errors.map((issues)=>processError({
                issues
            }, [
                ...path,
                ...issue.path
            ]));
        else if ("invalid_key" === issue.code) processError({
            issues: issue.issues
        }, [
            ...path,
            ...issue.path
        ]);
        else if ("invalid_element" === issue.code) processError({
            issues: issue.issues
        }, [
            ...path,
            ...issue.path
        ]);
        else {
            const fullpath = [
                ...path,
                ...issue.path
            ];
            if (0 === fullpath.length) fieldErrors._errors.push(mapper(issue));
            else {
                let curr = fieldErrors;
                let i = 0;
                while(i < fullpath.length){
                    const el = fullpath[i];
                    const terminal = i === fullpath.length - 1;
                    if ("_errors" === el) {
                        if (terminal) curr._errors.push(mapper(issue));
                        i++;
                        continue;
                    }
                    if (!Object.prototype.hasOwnProperty.call(curr, el)) Object.defineProperty(curr, el, {
                        value: {
                            _errors: []
                        },
                        enumerable: true,
                        writable: true,
                        configurable: true
                    });
                    const node = curr[el];
                    if (terminal) node._errors.push(mapper(issue));
                    curr = node;
                    i++;
                }
            }
        }
    };
    processError(error);
    return fieldErrors;
}
function finalizeParams(callee, params) {
    return {
        callee: params?.callee ?? callee,
        Err: params?.Err
    };
}
const parse_parse = (_Err)=>{
    const fn = (schema, value, _ctx, _params)=>{
        const ctx = _ctx ? {
            ..._ctx,
            async: false
        } : {
            async: false
        };
        const result = schema._zod.run({
            value,
            issues: []
        }, ctx);
        if (result instanceof Promise) throw new $ZodAsyncError();
        if (result.issues.length) {
            const e = new (_params?.Err ?? _Err)(result.issues.map((iss)=>finalizeIssue(iss, ctx, core_config())));
            captureStackTrace(e, _params?.callee ?? fn);
            throw e;
        }
        return result.value;
    };
    return fn;
};
const parse_parseAsync = (_Err)=>{
    const fn = async (schema, value, _ctx, params)=>{
        const ctx = _ctx ? {
            ..._ctx,
            async: true
        } : {
            async: true
        };
        let result = schema._zod.run({
            value,
            issues: []
        }, ctx);
        if (result instanceof Promise) result = await result;
        if (result.issues.length) {
            const e = new (params?.Err ?? _Err)(result.issues.map((iss)=>finalizeIssue(iss, ctx, core_config())));
            captureStackTrace(e, params?.callee ?? fn);
            throw e;
        }
        return result.value;
    };
    return fn;
};
const _safeParse = (_Err)=>(schema, value, _ctx)=>{
        const ctx = _ctx ? {
            ..._ctx,
            async: false
        } : {
            async: false
        };
        const result = schema._zod.run({
            value,
            issues: []
        }, ctx);
        if (result instanceof Promise) throw new $ZodAsyncError();
        return result.issues.length ? failure(_Err, result.issues, ctx) : {
            success: true,
            data: result.value
        };
    };
function failure(Err, issues, ctx) {
    let error;
    return {
        success: false,
        get error () {
            if (!error) {
                error = new Err(issues.map((iss)=>finalizeIssue(iss, ctx, core_config())));
                issues = void 0;
                ctx = void 0;
            }
            return error;
        },
        set error (e){
            error = e;
            issues = void 0;
            ctx = void 0;
        }
    };
}
const _safeParseAsync = (_Err)=>async (schema, value, _ctx)=>{
        const ctx = _ctx ? {
            ..._ctx,
            async: true
        } : {
            async: true
        };
        let result = schema._zod.run({
            value,
            issues: []
        }, ctx);
        if (result instanceof Promise) result = await result;
        return result.issues.length ? failure(_Err, result.issues, ctx) : {
            success: true,
            data: result.value
        };
    };
const COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
const COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
const validate = (schema, value, _ctx)=>{
    const validator = schema._zod.bag.validator;
    if (void 0 !== validator) {
        if (validator(value) !== COMPILE_INVALID) return true;
        if (true === validator.definite && void 0 === _ctx) return false;
    }
    return validateFallback(schema, value, _ctx);
};
function validateFallback(schema, value, _ctx) {
    const ctx = _ctx ? {
        ..._ctx,
        async: false,
        abortEarly: true
    } : {
        async: false,
        abortEarly: true
    };
    const fallbackRun = schema._zod.bag.fallbackRun;
    let result;
    if (fallbackRun) {
        ctx[COMPILE_FALLBACK] = true;
        result = fallbackRun({
            value,
            issues: []
        }, ctx);
    } else result = schema._zod.run({
        value,
        issues: []
    }, ctx);
    if (result instanceof Promise) throw new $ZodAsyncError();
    return 0 === result.issues.length;
}
const parse_validateAsync = async (schema, value, _ctx)=>{
    const ctx = _ctx ? {
        ..._ctx,
        async: true,
        abortEarly: true
    } : {
        async: true,
        abortEarly: true
    };
    let result = schema._zod.run({
        value,
        issues: []
    }, ctx);
    if (result instanceof Promise) result = await result;
    return 0 === result.issues.length;
};
const parse_encode = (_Err)=>{
    const parse = parse_parse(_Err);
    const fn = (schema, value, _ctx, _params)=>{
        const ctx = _ctx ? {
            ..._ctx,
            direction: "backward"
        } : {
            direction: "backward"
        };
        return parse(schema, value, ctx, finalizeParams(fn, _params));
    };
    return fn;
};
const parse_decode = (_Err)=>{
    const parse = parse_parse(_Err);
    const fn = (schema, value, _ctx, _params)=>parse(schema, value, _ctx, finalizeParams(fn, _params));
    return fn;
};
const parse_encodeAsync = (_Err)=>{
    const parseAsync = parse_parseAsync(_Err);
    const fn = async (schema, value, _ctx, _params)=>{
        const ctx = _ctx ? {
            ..._ctx,
            direction: "backward"
        } : {
            direction: "backward"
        };
        return await parseAsync(schema, value, ctx, finalizeParams(fn, _params));
    };
    return fn;
};
const parse_decodeAsync = (_Err)=>{
    const parseAsync = parse_parseAsync(_Err);
    const fn = async (schema, value, _ctx, _params)=>await parseAsync(schema, value, _ctx, finalizeParams(fn, _params));
    return fn;
};
const _safeEncode = (_Err)=>(schema, value, _ctx)=>{
        const ctx = _ctx ? {
            ..._ctx,
            direction: "backward"
        } : {
            direction: "backward"
        };
        return _safeParse(_Err)(schema, value, ctx);
    };
const _safeDecode = (_Err)=>(schema, value, _ctx)=>_safeParse(_Err)(schema, value, _ctx);
const _safeEncodeAsync = (_Err)=>async (schema, value, _ctx)=>{
        const ctx = _ctx ? {
            ..._ctx,
            direction: "backward"
        } : {
            direction: "backward"
        };
        return _safeParseAsync(_Err)(schema, value, ctx);
    };
const _safeDecodeAsync = (_Err)=>async (schema, value, _ctx)=>_safeParseAsync(_Err)(schema, value, _ctx);
const _installedErrorProtos = /* @__PURE__ */ new WeakSet([
    Object.prototype,
    Error.prototype
]);
function _lazyMethod(proto, key, make) {
    Object.defineProperty(proto, key, {
        configurable: true,
        enumerable: false,
        get () {
            const value = make(this);
            Object.defineProperty(this, key, {
                value,
                configurable: true,
                writable: true
            });
            return value;
        },
        set (value) {
            Object.defineProperty(this, key, {
                value,
                configurable: true,
                writable: true
            });
        }
    });
}
const classic_errors_initializer = (inst, issues)=>{
    $ZodError.init(inst, issues);
    inst.name = "ZodError";
    const proto = Object.getPrototypeOf(inst);
    if (_installedErrorProtos.has(proto)) return;
    _installedErrorProtos.add(proto);
    _lazyMethod(proto, "format", (self)=>(mapper)=>formatError(self, mapper));
    _lazyMethod(proto, "flatten", (self)=>(mapper)=>flattenError(self, mapper));
    _lazyMethod(proto, "addIssue", (self)=>(issue)=>{
            self.issues.push(issue);
            self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
        });
    _lazyMethod(proto, "addIssues", (self)=>(issues)=>{
            self.issues.push(...issues);
            self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
        });
    Object.defineProperty(proto, "isEmpty", {
        configurable: true,
        enumerable: false,
        get () {
            return 0 === this.issues.length;
        }
    });
};
const ZodRealError = /*@__PURE__*/ $constructor("ZodError", classic_errors_initializer, void 0, {
    Parent: Error
});
const classic_parse_parse = /* @__PURE__ */ parse_parse(ZodRealError);
const classic_parse_parseAsync = /* @__PURE__ */ parse_parseAsync(ZodRealError);
const parse_safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
const parse_safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
const classic_parse_encode = /* @__PURE__ */ parse_encode(ZodRealError);
const classic_parse_decode = /* @__PURE__ */ parse_decode(ZodRealError);
const classic_parse_encodeAsync = /* @__PURE__ */ parse_encodeAsync(ZodRealError);
const classic_parse_decodeAsync = /* @__PURE__ */ parse_decodeAsync(ZodRealError);
const parse_safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
const parse_safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
const parse_safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
const parse_safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
function _ensureDefaultLocale() {
    if (!globalConfig.localeError) core_config(en());
}
function _ensureDefaultMemoizer() {
    if (!globalConfig.memoizer) core_config({
        memoizer: memoizer()
    });
}
const ZodType = /*@__PURE__*/ $constructor("ZodType", (inst, def)=>{
    _ensureDefaultLocale();
    $ZodType.init(inst, def);
    inst.def = def;
    inst.type = def.type;
    return inst;
}, {
    check (...chks) {
        const def = this.def;
        return this.clone(mergeDefs(def, {
            checks: [
                ...def.checks ?? [],
                ...chks.map((ch)=>"function" == typeof ch ? {
                        _zod: {
                            check: ch,
                            def: {
                                check: "custom"
                            },
                            onattach: []
                        }
                    } : ch)
            ]
        }), {
            parent: true
        });
    },
    with (...chks) {
        return this.check(...chks);
    },
    clone (def, params) {
        return clone(this, def, params);
    },
    brand () {
        return this;
    },
    register (reg, meta) {
        reg.add(this, meta);
        return this;
    },
    refine (check, params) {
        return this.check(refine(check, params));
    },
    superRefine (refinement, params) {
        return this.check(superRefine(refinement, params));
    },
    overwrite (fn) {
        return this.check(_overwrite(fn));
    },
    optional () {
        return schemas_optional(this);
    },
    exactOptional () {
        return exactOptional(this);
    },
    nullable () {
        return nullable(this);
    },
    nullish () {
        return schemas_optional(nullable(this));
    },
    nonoptional (params) {
        return nonoptional(this, params);
    },
    array () {
        return schemas_array(this);
    },
    or (arg) {
        return schemas_union([
            this,
            arg
        ]);
    },
    and (arg) {
        return intersection(this, arg);
    },
    transform (tx) {
        return pipe(this, transform(tx));
    },
    default (d) {
        return schemas_default(this, d);
    },
    prefault (d) {
        return prefault(this, d);
    },
    catch (params) {
        return schemas_catch(this, params);
    },
    pipe (target) {
        return pipe(this, target);
    },
    readonly () {
        return readonly(this);
    },
    describe (description) {
        const cl = this.clone();
        globalRegistry.add(cl, {
            description
        });
        return cl;
    },
    meta (...args) {
        if (0 === args.length) return globalRegistry.get(this);
        const cl = this.clone();
        globalRegistry.add(cl, args[0]);
        return cl;
    },
    isOptional () {
        return this.safeParse(void 0).success;
    },
    isNullable () {
        return this.safeParse(null).success;
    },
    apply (fn, ...args) {
        return 0 === args.length ? fn(this) : fn(this, ...args);
    },
    get "~standard" () {
        return hide(this, "~standard", {
            ...standardProps(this),
            jsonSchema: {
                input: createStandardJSONSchemaMethod(this, "input"),
                output: createStandardJSONSchemaMethod(this, "output")
            }
        });
    },
    set "~standard" (value){
        util_own(this, "~standard", value);
    },
    parse: function _parse(data, params) {
        return classic_parse_parse(this, data, params, {
            callee: _parse
        });
    },
    parseAsync: async function _parseAsync(data, params) {
        return await classic_parse_parseAsync(this, data, params, {
            callee: _parseAsync
        });
    },
    safeParse (data, params) {
        return parse_safeParse(this, data, params);
    },
    async safeParseAsync (data, params) {
        return parse_safeParseAsync(this, data, params);
    },
    get spa () {
        return this?.safeParseAsync;
    },
    set spa (value){
        util_own(this, "spa", value);
    },
    validate (data, params) {
        return validate(this, data, params);
    },
    validateAsync (data, params) {
        return parse_validateAsync(this, data, params);
    },
    encode: function _encode(data, params) {
        return classic_parse_encode(this, data, params, {
            callee: _encode
        });
    },
    decode: function _decode(data, params) {
        return classic_parse_decode(this, data, params, {
            callee: _decode
        });
    },
    encodeAsync: async function _encodeAsync(data, params) {
        return await classic_parse_encodeAsync(this, data, params, {
            callee: _encodeAsync
        });
    },
    decodeAsync: async function _decodeAsync(data, params) {
        return await classic_parse_decodeAsync(this, data, params, {
            callee: _decodeAsync
        });
    },
    safeEncode (data, params) {
        return parse_safeEncode(this, data, params);
    },
    safeDecode (data, params) {
        return parse_safeDecode(this, data, params);
    },
    async safeEncodeAsync (data, params) {
        return parse_safeEncodeAsync(this, data, params);
    },
    async safeDecodeAsync (data, params) {
        return parse_safeDecodeAsync(this, data, params);
    },
    toJSONSchema (params) {
        return createToJSONSchemaMethod(this, {})(params);
    },
    get description () {
        return globalRegistry.get(this)?.description;
    },
    get _def () {
        return this._zod.def;
    }
});
const _ZodString = /*@__PURE__*/ $constructor("_ZodString", (inst, def)=>{
    $ZodString.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>stringProcessor(inst, ctx, json, params);
}, /*@__PURE__*/ derived({
    format: (inst)=>aggregateChecks(inst).format ?? null,
    minLength: (inst)=>aggregateChecks(inst).minimum ?? null,
    maxLength: (inst)=>aggregateChecks(inst).maximum ?? null
}, {
    regex (...args) {
        return this.check(_regex(...args));
    },
    includes (...args) {
        return this.check(_includes(...args));
    },
    startsWith (...args) {
        return this.check(_startsWith(...args));
    },
    endsWith (...args) {
        return this.check(_endsWith(...args));
    },
    min (...args) {
        return this.check(_minLength(...args));
    },
    max (...args) {
        return this.check(_maxLength(...args));
    },
    length (...args) {
        return this.check(_length(...args));
    },
    nonempty (...args) {
        return this.check(_minLength(1, ...args));
    },
    lowercase (params) {
        return this.check(_lowercase(params));
    },
    uppercase (params) {
        return this.check(_uppercase(params));
    },
    trim () {
        return this.check(_trim());
    },
    normalize (...args) {
        return this.check(_normalize(...args));
    },
    toLowerCase () {
        return this.check(_toLowerCase());
    },
    toUpperCase () {
        return this.check(_toUpperCase());
    },
    slugify () {
        return this.check(_slugify());
    }
}));
const ZodString = /*@__PURE__*/ $constructor("ZodString", (inst, def)=>{
    $ZodString.init(inst, def);
    _ZodString.init(inst, def);
}, {
    email (params) {
        return this.check(_email(ZodEmail, params));
    },
    url (params) {
        return this.check(_url(ZodURL, params));
    },
    jwt (params) {
        return this.check(_jwt(ZodJWT, params));
    },
    emoji (params) {
        return this.check(api_emoji(ZodEmoji, params));
    },
    guid (params) {
        return this.check(_guid(ZodGUID, params));
    },
    uuid (params) {
        return this.check(_uuid(ZodUUID, params));
    },
    uuidv4 (params) {
        return this.check(_uuidv4(ZodUUID, params));
    },
    uuidv6 (params) {
        return this.check(_uuidv6(ZodUUID, params));
    },
    uuidv7 (params) {
        return this.check(_uuidv7(ZodUUID, params));
    },
    nanoid (params) {
        return this.check(_nanoid(ZodNanoID, params));
    },
    cuid (params) {
        return this.check(_cuid(ZodCUID, params));
    },
    cuid2 (params) {
        return this.check(_cuid2(ZodCUID2, params));
    },
    ulid (params) {
        return this.check(_ulid(ZodULID, params));
    },
    base64 (params) {
        return this.check(_base64(ZodBase64, params));
    },
    base64url (params) {
        return this.check(_base64url(ZodBase64URL, params));
    },
    xid (params) {
        return this.check(_xid(ZodXID, params));
    },
    ksuid (params) {
        return this.check(_ksuid(ZodKSUID, params));
    },
    ipv4 (params) {
        return this.check(_ipv4(ZodIPv4, params));
    },
    ipv6 (params) {
        return this.check(_ipv6(ZodIPv6, params));
    },
    cidrv4 (params) {
        return this.check(_cidrv4(ZodCIDRv4, params));
    },
    cidrv6 (params) {
        return this.check(_cidrv6(ZodCIDRv6, params));
    },
    e164 (params) {
        return this.check(_e164(ZodE164, params));
    },
    datetime (params) {
        return this.check(_isoDateTime(ZodISODateTime, params));
    },
    date (params) {
        return this.check(_isoDate(ZodISODate, params));
    },
    time (params) {
        return this.check(_isoTime(ZodISOTime, params));
    },
    duration (params) {
        return this.check(_isoDuration(ZodISODuration, params));
    }
});
function schemas_string(params) {
    return _string(ZodString, params);
}
const ZodStringFormat = /*@__PURE__*/ $constructor("ZodStringFormat", (inst, def)=>{
    $ZodStringFormat.init(inst, def);
    _ZodString.init(inst, def);
});
const ZodISODateTime = /*@__PURE__*/ $constructor("ZodISODateTime", (inst, def)=>{
    $ZodISODateTime.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodISODate = /*@__PURE__*/ $constructor("ZodISODate", (inst, def)=>{
    $ZodISODate.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodISOTime = /*@__PURE__*/ $constructor("ZodISOTime", (inst, def)=>{
    $ZodISOTime.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodISODuration = /*@__PURE__*/ $constructor("ZodISODuration", (inst, def)=>{
    $ZodISODuration.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodEmail = /*@__PURE__*/ $constructor("ZodEmail", (inst, def)=>{
    $ZodEmail.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodGUID = /*@__PURE__*/ $constructor("ZodGUID", (inst, def)=>{
    $ZodGUID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodUUID = /*@__PURE__*/ $constructor("ZodUUID", (inst, def)=>{
    $ZodUUID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodURL = /*@__PURE__*/ $constructor("ZodURL", (inst, def)=>{
    $ZodURL.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodEmoji = /*@__PURE__*/ $constructor("ZodEmoji", (inst, def)=>{
    $ZodEmoji.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodNanoID = /*@__PURE__*/ $constructor("ZodNanoID", (inst, def)=>{
    $ZodNanoID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodCUID = /*@__PURE__*/ $constructor("ZodCUID", (inst, def)=>{
    $ZodCUID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodCUID2 = /*@__PURE__*/ $constructor("ZodCUID2", (inst, def)=>{
    $ZodCUID2.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodULID = /*@__PURE__*/ $constructor("ZodULID", (inst, def)=>{
    $ZodULID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodXID = /*@__PURE__*/ $constructor("ZodXID", (inst, def)=>{
    $ZodXID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodKSUID = /*@__PURE__*/ $constructor("ZodKSUID", (inst, def)=>{
    $ZodKSUID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodIPv4 = /*@__PURE__*/ $constructor("ZodIPv4", (inst, def)=>{
    $ZodIPv4.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodIPv6 = /*@__PURE__*/ $constructor("ZodIPv6", (inst, def)=>{
    $ZodIPv6.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodCIDRv4 = /*@__PURE__*/ $constructor("ZodCIDRv4", (inst, def)=>{
    $ZodCIDRv4.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodCIDRv6 = /*@__PURE__*/ $constructor("ZodCIDRv6", (inst, def)=>{
    $ZodCIDRv6.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodBase64 = /*@__PURE__*/ $constructor("ZodBase64", (inst, def)=>{
    $ZodBase64.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodBase64URL = /*@__PURE__*/ $constructor("ZodBase64URL", (inst, def)=>{
    $ZodBase64URL.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodE164 = /*@__PURE__*/ $constructor("ZodE164", (inst, def)=>{
    $ZodE164.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodJWT = /*@__PURE__*/ $constructor("ZodJWT", (inst, def)=>{
    $ZodJWT.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodNumber = /*@__PURE__*/ $constructor("ZodNumber", (inst, def)=>{
    $ZodNumber.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>numberProcessor(inst, ctx, json, params);
    inst.isFinite = true;
}, /*@__PURE__*/ derived({
    minValue: (inst)=>{
        const { minimum, exclusiveMinimum } = aggregateChecks(inst);
        return Math.max(minimum ?? -1 / 0, exclusiveMinimum ?? -1 / 0);
    },
    maxValue: (inst)=>{
        const { maximum, exclusiveMaximum } = aggregateChecks(inst);
        return Math.min(maximum ?? 1 / 0, exclusiveMaximum ?? 1 / 0);
    },
    isInt: (inst)=>{
        const { isInt, multipleOf } = aggregateChecks(inst);
        return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
    },
    format: (inst)=>aggregateChecks(inst).format ?? null
}, {
    gt (value, params) {
        return this.check(_gt(value, params));
    },
    gte (value, params) {
        return this.check(_gte(value, params));
    },
    min (value, params) {
        return this.check(_gte(value, params));
    },
    lt (value, params) {
        return this.check(_lt(value, params));
    },
    lte (value, params) {
        return this.check(_lte(value, params));
    },
    max (value, params) {
        return this.check(_lte(value, params));
    },
    int (params) {
        return this.check(schemas_int(params));
    },
    safe (params) {
        return this.check(schemas_int(params));
    },
    positive (params) {
        return this.check(_gt(0, params));
    },
    nonnegative (params) {
        return this.check(_gte(0, params));
    },
    negative (params) {
        return this.check(_lt(0, params));
    },
    nonpositive (params) {
        return this.check(_lte(0, params));
    },
    multipleOf (value, params) {
        return this.check(_multipleOf(value, params));
    },
    step (value, params) {
        return this.check(_multipleOf(value, params));
    },
    finite () {
        return this;
    }
}));
function schemas_number(params) {
    return _number(ZodNumber, params);
}
const ZodNumberFormat = /*@__PURE__*/ $constructor("ZodNumberFormat", (inst, def)=>{
    $ZodNumberFormat.init(inst, def);
    ZodNumber.init(inst, def);
});
function schemas_int(params) {
    return _int(ZodNumberFormat, params);
}
const ZodBoolean = /*@__PURE__*/ (/* unused pure expression or super */ null && ($constructor("ZodBoolean", (inst, def)=>{
    $ZodBoolean.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>booleanProcessor(inst, ctx, json, params);
})));
function schemas_boolean(params) {
    return _boolean(ZodBoolean, params);
}
const ZodUnknown = /*@__PURE__*/ $constructor("ZodUnknown", (inst, def)=>{
    $ZodUnknown.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>unknownProcessor(inst, ctx, json, params);
});
function unknown() {
    return _unknown(ZodUnknown);
}
const ZodNever = /*@__PURE__*/ $constructor("ZodNever", (inst, def)=>{
    $ZodNever.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>neverProcessor(inst, ctx, json, params);
});
function never(params) {
    return _never(ZodNever, params);
}
const ZodArray = /*@__PURE__*/ $constructor("ZodArray", (inst, def)=>{
    _ensureDefaultMemoizer();
    $ZodArray.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>arrayProcessor(inst, ctx, json, params);
    inst.element = def.element;
}, {
    min (n, params) {
        return this.check(_minLength(n, params));
    },
    nonempty (params) {
        return this.check(_minLength(1, params));
    },
    max (n, params) {
        return this.check(_maxLength(n, params));
    },
    length (n, params) {
        return this.check(_length(n, params));
    },
    unwrap () {
        return this.element;
    }
});
function schemas_array(element, params) {
    return _array(ZodArray, element, params);
}
const ZodObject = /*@__PURE__*/ $constructor("ZodObject", (inst, def)=>{
    _ensureDefaultMemoizer();
    $ZodObjectJIT.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>objectProcessor(inst, ctx, json, params);
    installLazyProp(inst, "shape", (self)=>self._zod.def.shape, false);
}, {
    keyof () {
        return schemas_enum(Object.keys(this._zod.def.shape));
    },
    catchall (catchall) {
        return this.clone(mergeDefs(this._zod.def, {
            catchall: catchall
        }));
    },
    passthrough () {
        return this.clone(mergeDefs(this._zod.def, {
            catchall: unknown()
        }));
    },
    loose () {
        return this.clone(mergeDefs(this._zod.def, {
            catchall: unknown()
        }));
    },
    strict () {
        return this.clone(mergeDefs(this._zod.def, {
            catchall: never()
        }));
    },
    strip () {
        return this.clone(mergeDefs(this._zod.def, {
            catchall: void 0
        }));
    },
    extend (incoming) {
        return extend(this, incoming);
    },
    safeExtend (incoming) {
        return safeExtend(this, incoming);
    },
    merge (other) {
        return util_merge(this, other);
    },
    pick (mask) {
        return pick(this, mask);
    },
    omit (mask) {
        return omit(this, mask);
    },
    partial (...args) {
        return partial(ZodOptional, this, args[0]);
    },
    exactPartial (...args) {
        return partial(ZodExactOptional, this, args[0], "exactPartial");
    },
    required (...args) {
        return util_required(ZodNonOptional, this, args[0]);
    }
});
function schemas_object(shape, params) {
    const def = {
        type: "object",
        shape: shape ?? {},
        ...normalizeParams(params)
    };
    return new ZodObject(def);
}
function strictObject(shape, params) {
    return new ZodObject({
        type: "object",
        shape,
        catchall: never(),
        ...normalizeParams(params)
    });
}
const ZodUnion = /*@__PURE__*/ $constructor("ZodUnion", (inst, def)=>{
    $ZodUnion.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>unionProcessor(inst, ctx, json, params);
    inst.options = def.options;
});
function schemas_union(options, params) {
    return new ZodUnion({
        type: "union",
        options: options,
        ...normalizeParams(params)
    });
}
const ZodDiscriminatedUnion = /*@__PURE__*/ (/* unused pure expression or super */ null && ($constructor("ZodDiscriminatedUnion", (inst, def)=>{
    ZodUnion.init(inst, def);
    $ZodDiscriminatedUnion.init(inst, def);
})));
function discriminatedUnion(discriminator, options, params) {
    return new ZodDiscriminatedUnion({
        type: "union",
        options: options,
        discriminator,
        ...normalizeParams(params)
    });
}
const ZodIntersection = /*@__PURE__*/ $constructor("ZodIntersection", (inst, def)=>{
    $ZodIntersection.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
    return new ZodIntersection({
        type: "intersection",
        left: left,
        right: right
    });
}
const ZodRecord = /*@__PURE__*/ $constructor("ZodRecord", (inst, def)=>{
    _ensureDefaultMemoizer();
    $ZodRecord.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>recordProcessor(inst, ctx, json, params);
    inst.keyType = def.keyType;
    inst.valueType = def.valueType;
});
function schemas_record(keyType, valueType, params) {
    if (!valueType || !valueType._zod) return new ZodRecord({
        type: "record",
        keyType: schemas_string(),
        valueType: keyType,
        ...normalizeParams(valueType)
    });
    return new ZodRecord({
        type: "record",
        keyType,
        valueType: valueType,
        ...normalizeParams(params)
    });
}
const ZodEnum = /*@__PURE__*/ $constructor("ZodEnum", (inst, def)=>{
    $ZodEnum.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>enumProcessor(inst, ctx, json, params);
    inst.enum = def.entries;
    inst.options = [
        ...inst._zod.values
    ];
    const keys = new Set(Object.keys(def.entries));
    inst.extract = (values, params)=>{
        const newEntries = {};
        for (const value of values)if (keys.has(value)) newEntries[value] = def.entries[value];
        else throw new Error(`Key ${value} not found in enum`);
        return new ZodEnum({
            ...def,
            checks: [],
            ...normalizeParams(params),
            entries: newEntries
        });
    };
    inst.exclude = (values, params)=>{
        const newEntries = {
            ...def.entries
        };
        for (const value of values)if (keys.has(value)) delete newEntries[value];
        else throw new Error(`Key ${value} not found in enum`);
        return new ZodEnum({
            ...def,
            checks: [],
            ...normalizeParams(params),
            entries: newEntries
        });
    };
});
function schemas_enum(values, params) {
    const entries = Array.isArray(values) ? Object.fromEntries(values.map((v)=>[
            v,
            v
        ])) : values;
    return new ZodEnum({
        type: "enum",
        entries,
        ...normalizeParams(params)
    });
}
const ZodLiteral = /*@__PURE__*/ (/* unused pure expression or super */ null && ($constructor("ZodLiteral", (inst, def)=>{
    $ZodLiteral.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>literalProcessor(inst, ctx, json, params);
    inst.values = new Set(def.values);
    Object.defineProperty(inst, "value", {
        get () {
            if (def.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
            return def.values[0];
        }
    });
})));
function literal(value, params) {
    return new ZodLiteral({
        type: "literal",
        values: Array.isArray(value) ? value : [
            value
        ],
        ...normalizeParams(params)
    });
}
const ZodTransform = /*@__PURE__*/ $constructor("ZodTransform", (inst, def)=>{
    _ensureDefaultMemoizer();
    $ZodTransform.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>transformProcessor(inst, ctx, json, params);
    inst._zod.parse = (payload, _ctx)=>{
        if ("backward" === _ctx.direction) throw new $ZodEncodeError(inst.constructor.name);
        payload.addIssue = (issue)=>{
            if ("string" == typeof issue) payload.issues.push(util_issue(issue, payload.value, def));
            else {
                const _issue = issue;
                if (_issue.fatal) _issue.continue = false;
                _issue.code ?? (_issue.code = "custom");
                if (!("input" in _issue)) _issue.input = payload.value;
                _issue.inst ?? (_issue.inst = inst);
                payload.issues.push(util_issue(_issue));
            }
        };
        const output = def.transform(payload.value, payload);
        if (output instanceof Promise) return output.then((output)=>{
            payload.value = output;
            return payload;
        });
        payload.value = output;
        return payload;
    };
});
function transform(fn) {
    return new ZodTransform({
        type: "transform",
        transform: fn
    });
}
const ZodOptional = /*@__PURE__*/ $constructor("ZodOptional", (inst, def)=>{
    $ZodOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>optionalProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
});
function schemas_optional(innerType) {
    return new ZodOptional({
        type: "optional",
        innerType: innerType
    });
}
const ZodExactOptional = /*@__PURE__*/ $constructor("ZodExactOptional", (inst, def)=>{
    $ZodExactOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>optionalProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
});
function exactOptional(innerType) {
    return new ZodExactOptional({
        type: "optional",
        innerType: innerType
    });
}
const ZodNullable = /*@__PURE__*/ $constructor("ZodNullable", (inst, def)=>{
    $ZodNullable.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>nullableProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
});
function nullable(innerType) {
    return new ZodNullable({
        type: "nullable",
        innerType: innerType
    });
}
const ZodDefault = /*@__PURE__*/ $constructor("ZodDefault", (inst, def)=>{
    $ZodDefault.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>defaultProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
    inst.removeDefault = inst.unwrap;
});
function schemas_default(innerType, defaultValue) {
    return new ZodDefault({
        type: "default",
        innerType: innerType,
        get defaultValue () {
            return "function" == typeof defaultValue ? defaultValue() : shallowClone(defaultValue);
        }
    });
}
const ZodPrefault = /*@__PURE__*/ $constructor("ZodPrefault", (inst, def)=>{
    $ZodPrefault.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>prefaultProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
    return new ZodPrefault({
        type: "prefault",
        innerType: innerType,
        get defaultValue () {
            return "function" == typeof defaultValue ? defaultValue() : shallowClone(defaultValue);
        }
    });
}
const ZodNonOptional = /*@__PURE__*/ $constructor("ZodNonOptional", (inst, def)=>{
    $ZodNonOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>nonoptionalProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
    return new ZodNonOptional({
        type: "nonoptional",
        innerType: innerType,
        ...normalizeParams(params)
    });
}
const ZodCatch = /*@__PURE__*/ $constructor("ZodCatch", (inst, def)=>{
    $ZodCatch.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>catchProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
    inst.removeCatch = inst.unwrap;
});
function schemas_catch(innerType, catchValue) {
    return new ZodCatch({
        type: "catch",
        innerType: innerType,
        catchValue: "function" == typeof catchValue ? catchValue : constantCatch(catchValue)
    });
}
const ZodPipe = /*@__PURE__*/ $constructor("ZodPipe", (inst, def)=>{
    $ZodPipe.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>pipeProcessor(inst, ctx, json, params);
    inst.in = def.in;
    inst.out = def.out;
});
function pipe(in_, out) {
    return new ZodPipe({
        type: "pipe",
        in: in_,
        out: out
    });
}
const ZodReadonly = /*@__PURE__*/ $constructor("ZodReadonly", (inst, def)=>{
    $ZodReadonly.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>readonlyProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
});
function readonly(innerType) {
    return new ZodReadonly({
        type: "readonly",
        innerType: innerType
    });
}
const ZodCustom = /*@__PURE__*/ $constructor("ZodCustom", (inst, def)=>{
    $ZodCustom.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
    return _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
    return _superRefine(fn, params);
}


__webpack_require__.d(__webpack_exports__, {
  $z: () => (schemas_string),
  L5: () => (unknown),
  X5: () => (schemas_enum),
  vD: () => (schemas_number),
  xK: () => (schemas_record),
  xf: () => (schemas_object)
});


},
"./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/573~1.js"(__unused_rspack___webpack_module__, __unused_rspack___webpack_exports__, __webpack_require__) {
/* import */ var _917_1_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/917~1.js");

const appResourceUri = (reference)=>reference;
const MAX_ROUTE_RENDER_ELAPSED_MS = 86400000;



},
"./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/818~1.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
const isPlainObjectOrArray = (value)=>{
    if (Array.isArray(value)) return true;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || null === proto;
};
const deepFreeze = (value, seen = new WeakSet())=>{
    if ('object' != typeof value || null === value || seen.has(value)) return value;
    if (!isPlainObjectOrArray(value)) return value;
    seen.add(value);
    for (const property of Reflect.ownKeys(value))deepFreeze(Reflect.get(value, property), seen);
    return Object.freeze(value);
};


__webpack_require__.d(__webpack_exports__, {
}, {
  o: deepFreeze
});


},
"./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/917~1.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _818_1_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/818~1.js");

const canonicalAgentEvents = Object.freeze([
    'session/start',
    'tool/before',
    'tool/after',
    'stop',
    'agent/start',
    'agent/stop',
    'workspace/open',
    'session/end',
    'prompt/submit',
    'tool/failure',
    'compact/before',
    'compact/after',
    'permission/request',
    'permission/denied',
    'stop/failure',
    'file/change',
    'config/change',
    'task/create',
    'task/complete',
    'agent/idle',
    'model-switch/before',
    'model-switch/after'
]);
const eventContracts = {
    'session/start': {
        deny: false
    },
    'tool/before': {
        deny: true
    },
    'tool/after': {
        deny: false
    },
    stop: {
        deny: true
    },
    'agent/start': {
        deny: true
    },
    'agent/stop': {
        deny: true
    },
    'workspace/open': {
        deny: false
    },
    'session/end': {
        deny: false
    },
    'prompt/submit': {
        deny: true
    },
    'tool/failure': {
        deny: false
    },
    'compact/before': {
        deny: true
    },
    'compact/after': {
        deny: false
    },
    'permission/request': {
        deny: true
    },
    'permission/denied': {
        deny: false
    },
    'stop/failure': {
        deny: false
    },
    'file/change': {
        deny: false
    },
    'config/change': {
        deny: true
    },
    'task/create': {
        deny: true
    },
    'task/complete': {
        deny: false
    },
    'agent/idle': {
        deny: true
    },
    'model-switch/before': {
        deny: true
    },
    'model-switch/after': {
        deny: false
    }
};
const agentEventPayloadFieldKinds = (0,_818_1_js__rspack_import_0/* .deepFreeze */.o)({
    agentId: 'string',
    agentTranscriptPath: 'nullable-string',
    agentType: 'string',
    cwd: 'string',
    error: 'string',
    filePath: 'string',
    fromModel: 'string',
    isInterrupt: 'boolean',
    lastAssistantMessage: 'nullable-string',
    model: 'string',
    permissionMode: 'string',
    prompt: 'string',
    reason: 'string',
    reentry: 'boolean',
    requestedModel: 'nullable-string',
    sessionId: 'string',
    source: 'string',
    taskDescription: 'string',
    taskId: 'string',
    taskSubject: 'string',
    teamName: 'string',
    teammateName: 'string',
    toModel: 'string',
    toolInput: 'json',
    toolName: 'string',
    toolResponse: 'json',
    toolUseId: 'string',
    transcriptPath: 'nullable-string',
    trigger: 'trigger',
    workspaceRoots: 'string-array'
});
const sessionFields = [
    'sessionId',
    'cwd',
    "transcriptPath",
    'permissionMode',
    'agentId',
    'agentType'
];
const threeHostFields = [
    ...sessionFields,
    'model'
];
const toolFields = [
    ...threeHostFields,
    'toolName',
    'toolInput',
    'toolUseId'
];
const taskFields = [
    ...sessionFields,
    'taskId',
    'taskSubject',
    "taskDescription",
    'teammateName',
    'teamName'
];
const modelSwitchFields = [
    ...sessionFields,
    'fromModel',
    'toModel',
    'requestedModel',
    'source'
];
const agentEventPayloadFields = (0,_818_1_js__rspack_import_0/* .deepFreeze */.o)({
    'agent/idle': [
        ...sessionFields,
        'teammateName',
        'teamName'
    ],
    'agent/start': threeHostFields,
    'agent/stop': [
        ...threeHostFields,
        "agentTranscriptPath",
        'reentry',
        'lastAssistantMessage'
    ],
    'compact/after': [
        ...sessionFields,
        'trigger'
    ],
    'compact/before': [
        ...threeHostFields,
        'trigger'
    ],
    'config/change': [
        ...sessionFields,
        'source',
        'filePath'
    ],
    'file/change': [
        ...sessionFields,
        'filePath'
    ],
    'model-switch/after': modelSwitchFields,
    'model-switch/before': modelSwitchFields,
    'permission/denied': [
        ...sessionFields,
        'toolName',
        'toolInput'
    ],
    'permission/request': [
        ...sessionFields,
        'toolName',
        'toolInput'
    ],
    'prompt/submit': [
        ...threeHostFields,
        'prompt'
    ],
    'session/end': [
        ...threeHostFields,
        'reason'
    ],
    'session/start': [
        ...threeHostFields,
        'source'
    ],
    stop: [
        ...threeHostFields,
        'reentry',
        'lastAssistantMessage'
    ],
    'stop/failure': [
        ...sessionFields,
        'error',
        'reentry',
        'lastAssistantMessage'
    ],
    'task/complete': taskFields,
    'task/create': taskFields,
    'tool/after': [
        ...toolFields,
        'toolResponse'
    ],
    'tool/before': toolFields,
    'tool/failure': [
        'sessionId',
        'cwd',
        "transcriptPath",
        'toolName',
        'toolInput',
        'toolUseId',
        'error',
        'isInterrupt'
    ],
    'workspace/open': [
        'workspaceRoots'
    ]
});
const key = (nativeKey, decode)=>Object.freeze(void 0 === decode ? {
        nativeKey
    } : {
        decode,
        nativeKey
    });
const standardKeys = Object.freeze({
    agentId: key('agent_id'),
    agentTranscriptPath: key("agent_transcript_path"),
    agentType: key('agent_type'),
    cwd: key('cwd'),
    error: key('error'),
    filePath: key('file_path'),
    fromModel: key('from_model'),
    isInterrupt: key('is_interrupt'),
    lastAssistantMessage: key('last_assistant_message'),
    model: key('model'),
    permissionMode: key('permission_mode'),
    prompt: key('prompt'),
    reason: key('reason'),
    reentry: key('stop_hook_active'),
    requestedModel: key('requested_model'),
    sessionId: key('session_id'),
    source: key('source'),
    taskDescription: key("task_description"),
    taskId: key('task_id'),
    taskSubject: key('task_subject'),
    teamName: key('team_name'),
    teammateName: key('teammate_name'),
    toModel: key('to_model'),
    toolInput: key('tool_input'),
    toolName: key('tool_name'),
    toolResponse: key('tool_response'),
    toolUseId: key('tool_use_id'),
    transcriptPath: key("transcript_path"),
    trigger: key('trigger')
});
const cursorKeys = Object.freeze({
    ...standardKeys,
    agentId: key('subagent_id'),
    agentType: key('subagent_type'),
    error: key('error_message'),
    reentry: key('loop_count', 'positive-count'),
    sessionId: key('conversation_id'),
    toolResponse: key('tool_output', 'json-string'),
    workspaceRoots: key('workspace_roots')
});
const pick = (keys, fields)=>Object.freeze(Object.fromEntries(fields.map((field)=>[
            field,
            keys[field]
        ])));
const claudeSession = [
    'sessionId',
    'cwd',
    "transcriptPath",
    'permissionMode',
    'agentId',
    'agentType'
];
const claudeTool = [
    ...claudeSession,
    'toolName',
    'toolInput',
    'toolUseId'
];
const claudeTask = [
    ...claudeSession,
    'taskId',
    'taskSubject',
    "taskDescription",
    'teammateName',
    'teamName'
];
const codexSession = [
    'sessionId',
    'cwd',
    "transcriptPath",
    'permissionMode',
    'agentId',
    'agentType'
];
const codexThreeHost = [
    ...codexSession,
    'model'
];
const codexTool = [
    ...codexThreeHost,
    'toolName',
    'toolInput',
    'toolUseId'
];
const cursorSession = [
    'sessionId',
    "transcriptPath",
    'model'
];
const cursorTool = [
    ...cursorSession,
    'cwd',
    'toolName',
    'toolInput',
    'toolUseId'
];
const agentEventPayloadNativeKeys = (0,_818_1_js__rspack_import_0/* .deepFreeze */.o)({
    amp: Object.freeze({
        'prompt/submit': pick(standardKeys, [
            'sessionId',
            'prompt'
        ]),
        'session/start': pick(standardKeys, [
            'sessionId'
        ]),
        stop: pick(standardKeys, [
            'sessionId'
        ]),
        'tool/after': pick(standardKeys, [
            'sessionId',
            'toolName',
            'toolInput',
            'toolUseId',
            'toolResponse'
        ]),
        'tool/before': pick(standardKeys, [
            'sessionId',
            'toolName',
            'toolInput',
            'toolUseId'
        ])
    }),
    claude: Object.freeze({
        'agent/idle': pick(standardKeys, [
            ...claudeSession,
            'teammateName',
            'teamName'
        ]),
        'agent/start': pick(standardKeys, claudeSession),
        'agent/stop': pick(standardKeys, [
            ...claudeSession,
            "agentTranscriptPath",
            'reentry',
            'lastAssistantMessage'
        ]),
        'compact/after': pick(standardKeys, [
            ...claudeSession,
            'trigger'
        ]),
        'compact/before': pick(standardKeys, [
            ...claudeSession,
            'trigger'
        ]),
        'config/change': pick(standardKeys, [
            ...claudeSession,
            'source',
            'filePath'
        ]),
        'file/change': pick(standardKeys, [
            ...claudeSession,
            'filePath'
        ]),
        'model-switch/after': pick(standardKeys, modelSwitchFields),
        'model-switch/before': pick(standardKeys, modelSwitchFields),
        'permission/denied': pick(standardKeys, [
            ...claudeSession,
            'toolName',
            'toolInput'
        ]),
        'permission/request': pick(standardKeys, [
            ...claudeSession,
            'toolName',
            'toolInput'
        ]),
        'prompt/submit': pick(standardKeys, [
            ...claudeSession,
            'prompt'
        ]),
        'session/end': pick(standardKeys, [
            ...claudeSession,
            'reason'
        ]),
        'session/start': pick(standardKeys, [
            ...claudeSession,
            'model',
            'source'
        ]),
        stop: pick(standardKeys, [
            ...claudeSession,
            'reentry',
            'lastAssistantMessage'
        ]),
        'stop/failure': pick(standardKeys, [
            ...claudeSession,
            'error',
            'reentry',
            'lastAssistantMessage'
        ]),
        'task/complete': pick(standardKeys, claudeTask),
        'task/create': pick(standardKeys, claudeTask),
        'tool/after': pick(standardKeys, [
            ...claudeTool,
            'toolResponse'
        ]),
        'tool/before': pick(standardKeys, claudeTool),
        'tool/failure': pick(standardKeys, [
            'sessionId',
            'cwd',
            "transcriptPath",
            'toolName',
            'toolInput',
            'toolUseId',
            'error',
            'isInterrupt'
        ])
    }),
    codex: Object.freeze({
        'agent/start': pick(standardKeys, codexThreeHost),
        'agent/stop': pick(standardKeys, [
            ...codexThreeHost,
            "agentTranscriptPath",
            'reentry',
            'lastAssistantMessage'
        ]),
        'compact/after': pick(standardKeys, [
            ...codexSession,
            'trigger'
        ]),
        'compact/before': pick(standardKeys, [
            ...codexThreeHost,
            'trigger'
        ]),
        'permission/request': pick(standardKeys, [
            ...codexSession,
            'toolName',
            'toolInput'
        ]),
        'prompt/submit': pick(standardKeys, [
            ...codexThreeHost,
            'prompt'
        ]),
        'session/end': pick(standardKeys, [
            ...codexThreeHost,
            'reason'
        ]),
        'session/start': pick(standardKeys, [
            ...codexThreeHost,
            'source'
        ]),
        stop: pick(standardKeys, [
            ...codexThreeHost,
            'reentry',
            'lastAssistantMessage'
        ]),
        'tool/after': pick(standardKeys, [
            ...codexTool,
            'toolResponse'
        ]),
        'tool/before': pick(standardKeys, codexTool)
    }),
    cursor: Object.freeze({
        'agent/start': pick(cursorKeys, [
            ...cursorSession,
            'agentId',
            'agentType'
        ]),
        'agent/stop': pick(cursorKeys, [
            ...cursorSession,
            'agentId',
            'agentType',
            "agentTranscriptPath",
            'reentry'
        ]),
        'compact/before': pick(cursorKeys, [
            ...cursorSession,
            'trigger'
        ]),
        'prompt/submit': pick(cursorKeys, [
            ...cursorSession,
            'prompt'
        ]),
        'session/end': pick(cursorKeys, [
            ...cursorSession,
            'reason'
        ]),
        'session/start': pick(cursorKeys, cursorSession),
        stop: pick(cursorKeys, [
            ...cursorSession,
            'reentry'
        ]),
        'tool/after': pick(cursorKeys, [
            ...cursorTool,
            'toolResponse'
        ]),
        'tool/before': pick(cursorKeys, cursorTool),
        'tool/failure': pick(cursorKeys, [
            'sessionId',
            "transcriptPath",
            'cwd',
            'toolName',
            'toolInput',
            'toolUseId',
            'error',
            'isInterrupt'
        ]),
        'workspace/open': pick(cursorKeys, [
            'workspaceRoots'
        ])
    })
});
const isAgentEventPayloadHost = (target)=>'amp' === target || 'claude' === target || 'codex' === target || 'cursor' === target;


__webpack_require__.d(__webpack_exports__, {
}, {
  an: isAgentEventPayloadHost,
  fC: agentEventPayloadFieldKinds,
  jm: agentEventPayloadNativeKeys,
  jy: canonicalAgentEvents,
  jz: agentEventPayloadFields,
  wo: eventContracts
});


},
"./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/991~1.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
const isJsonWhitespace = (code)=>0x09 === code || 0x0a === code || 0x0d === code || 0x20 === code;
const isValueTerminator = (code)=>isJsonWhitespace(code) || 0x2c === code || 0x7d === code || 0x5d === code;
const skipWhitespace = (bytes, index)=>{
    let cursor = index;
    while(cursor < bytes.length && isJsonWhitespace(bytes.charCodeAt(cursor)))cursor += 1;
    return cursor;
};
const scanJsonString = (bytes, index)=>{
    let cursor = index + 1;
    while(cursor < bytes.length){
        const character = bytes[cursor];
        if ('\\' === character) {
            cursor += 2;
            continue;
        }
        if ('"' === character) {
            const end = cursor + 1;
            return [
                JSON.parse(bytes.slice(index, end)),
                end
            ];
        }
        cursor += 1;
    }
    throw new SyntaxError('JSON has an unterminated string.');
};
const scanJsonValue = (bytes, index)=>{
    let cursor = skipWhitespace(bytes, index);
    const character = bytes[cursor];
    if ('{' === character) {
        cursor = skipWhitespace(bytes, cursor + 1);
        const keys = new Set();
        if ('}' === bytes[cursor]) return cursor + 1;
        while(true){
            if ('"' !== bytes[cursor]) throw new SyntaxError('JSON has an invalid object key.');
            const [key, afterKey] = scanJsonString(bytes, cursor);
            if (keys.has(key)) throw new SyntaxError(`JSON has duplicate key ${JSON.stringify(key)}.`);
            keys.add(key);
            cursor = skipWhitespace(bytes, afterKey);
            if (':' !== bytes[cursor]) throw new SyntaxError('JSON has an invalid object entry.');
            cursor = skipWhitespace(bytes, scanJsonValue(bytes, cursor + 1));
            if ('}' === bytes[cursor]) return cursor + 1;
            if (',' !== bytes[cursor]) throw new SyntaxError('JSON has an invalid object separator.');
            cursor = skipWhitespace(bytes, cursor + 1);
        }
    }
    if ('[' === character) {
        cursor = skipWhitespace(bytes, cursor + 1);
        if (']' === bytes[cursor]) return cursor + 1;
        while(true){
            cursor = skipWhitespace(bytes, scanJsonValue(bytes, cursor));
            if (']' === bytes[cursor]) return cursor + 1;
            if (',' !== bytes[cursor]) throw new SyntaxError('JSON has an invalid array separator.');
            cursor = skipWhitespace(bytes, cursor + 1);
        }
    }
    if ('"' === character) return scanJsonString(bytes, cursor)[1];
    while(cursor < bytes.length && !isValueTerminator(bytes.charCodeAt(cursor)))cursor += 1;
    return cursor;
};
class StrictJsonError extends TypeError {
    reason;
    constructor(reason, message){
        super(message);
        this.name = 'StrictJsonError';
        this.reason = reason;
    }
}
const isRecord = (value)=>'object' == typeof value && null !== value && !Array.isArray(value);
const isJsonRecord = (value)=>isRecord(value);
const ownDataValue = (value, key)=>{
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (void 0 === descriptor) return {
        found: false,
        value: void 0
    };
    return 'value' in descriptor ? {
        found: true,
        value: descriptor.value
    } : void 0;
};
const dataArrayValues = (value)=>{
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return;
    const length = Object.getOwnPropertyDescriptor(value, 'length');
    if (void 0 === length || !('value' in length) || 'number' != typeof length.value || !Number.isSafeInteger(length.value) || length.value < 0 || Reflect.ownKeys(value).length !== length.value + 1) return;
    const copy = [];
    for(let index = 0; index < length.value; index += 1){
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (void 0 === descriptor || !('value' in descriptor)) return;
        copy.push(descriptor.value);
    }
    return Object.freeze(copy);
};
const isPlainRecord = (value)=>{
    if (!isRecord(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || null === prototype;
};
const hasOnlyOwnKeys = (value, keys)=>Object.keys(value).every((key)=>keys.includes(key));
const isPlainDataRecord = (value)=>{
    if (!isRecord(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && null !== prototype) return false;
    return Reflect.ownKeys(value).every((key)=>{
        if ('string' != typeof key) return false;
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        return void 0 !== descriptor && 'value' in descriptor;
    });
};
const hasDataKeys = (value, required, optional = [])=>{
    if (!isPlainDataRecord(value)) return false;
    const allowed = new Set([
        ...required,
        ...optional
    ]);
    return Reflect.ownKeys(value).length >= required.length && Reflect.ownKeys(value).every((key)=>'string' == typeof key && allowed.has(key)) && required.every((key)=>Object.hasOwn(value, key));
};
const fail = (reason, message)=>{
    throw new StrictJsonError(reason, message);
};
const snapshotJsonValue = (value, ancestors, nullPrototype)=>{
    if (null === value || 'boolean' == typeof value || 'string' == typeof value) return value;
    if ('number' == typeof value) {
        if (Number.isFinite(value)) return value;
        return fail('nonfinite', 'JSON values must be finite.');
    }
    if ('object' != typeof value) return fail('not-json', 'JSON values must be primitives, arrays, or plain objects.');
    if (ancestors.has(value)) return fail('cyclic', 'JSON values must not be cyclic.');
    ancestors.add(value);
    try {
        const descriptors = Object.getOwnPropertyDescriptors(value);
        if (Array.isArray(value)) {
            if (Object.getPrototypeOf(value) !== Array.prototype) return fail('array-shape', 'JSON arrays must be ordinary arrays.');
            const length = descriptors.length;
            if (void 0 === length || !('value' in length) || !Number.isSafeInteger(length.value) || length.value < 0) return fail('array-shape', 'JSON arrays must have a finite length.');
            const values = [];
            for(let index = 0; index < length.value; index += 1){
                const descriptor = descriptors[String(index)];
                if (void 0 === descriptor || !descriptor.enumerable || !('value' in descriptor)) return fail('array-shape', 'JSON arrays must contain only enumerable data properties.');
                values.push(snapshotJsonValue(descriptor.value, ancestors, nullPrototype));
            }
            if (Reflect.ownKeys(descriptors).length !== length.value + 1) return fail('array-shape', 'JSON arrays must not have extra properties.');
            return Object.freeze(values);
        }
        const prototype = Object.getPrototypeOf(value);
        if (prototype !== Object.prototype && null !== prototype) return fail('exotic-prototype', 'JSON objects must be plain objects.');
        const entries = Reflect.ownKeys(descriptors).map((key)=>{
            if ('string' != typeof key) return fail('not-json', 'JSON objects must not use symbol keys.');
            const descriptor = descriptors[key];
            if (void 0 === descriptor || !descriptor.enumerable || !('value' in descriptor)) return fail('not-json', 'JSON objects must contain only enumerable data properties.');
            return [
                key,
                snapshotJsonValue(descriptor.value, ancestors, nullPrototype)
            ];
        });
        if (nullPrototype) {
            const snapshot = Object.create(null);
            for (const [key, entry] of entries)snapshot[key] = entry;
            return Object.freeze(snapshot);
        }
        return Object.freeze(Object.fromEntries(entries));
    } finally{
        ancestors.delete(value);
    }
};
const snapshotStrictJsonValue = (value, options = {})=>snapshotJsonValue(value, new Set(), true === options.nullPrototype);
const parseJsonWithoutDuplicateKeys = (bytes)=>{
    const end = skipWhitespace(bytes, scanJsonValue(bytes, 0));
    if (end !== bytes.length) throw new SyntaxError('JSON has trailing data.');
    return JSON.parse(bytes);
};


__webpack_require__.d(__webpack_exports__, {
}, {
  f8: snapshotStrictJsonValue,
  u4: isRecord
});


},
"./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/event-project.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var node_crypto__rspack_import_0 = __webpack_require__("node:crypto");
/* import */ var node_fs_promises__rspack_import_1 = __webpack_require__("node:fs/promises");
/* import */ var node_path__rspack_import_2 = __webpack_require__("node:path");
/* import */ var node_url__rspack_import_3 = __webpack_require__("node:url");
/* import */ var _917_1_js__rspack_import_4 = __webpack_require__("./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/917~1.js");
/* import */ var _242_1_js__rspack_import_5 = __webpack_require__("./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/242~1.js");
/* import */ var _818_1_js__rspack_import_7 = __webpack_require__("./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/818~1.js");
/* import */ var _991_1_js__rspack_import_6 = __webpack_require__("./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/991~1.js");








const isJsonValue = (value)=>{
    switch(typeof value){
        case 'boolean':
        case 'number':
        case 'string':
            return true;
        case 'object':
            if (null === value) return true;
            if (Array.isArray(value)) return value.every(isJsonValue);
            return Object.values(value).every(isJsonValue);
        default:
            return false;
    }
};
const decodeKind = (kind, value)=>{
    switch(kind){
        case 'boolean':
            return 'boolean' == typeof value ? value : void 0;
        case 'json':
            return isJsonValue(value) ? value : void 0;
        case 'nullable-string':
            return null === value || 'string' == typeof value ? value : void 0;
        case 'string':
            return 'string' == typeof value ? value : void 0;
        case 'string-array':
            return Array.isArray(value) && value.every((item)=>'string' == typeof item) ? value : void 0;
        case 'trigger':
            return 'manual' === value || 'auto' === value ? value : void 0;
        default:
            {
                const exhaustive = kind;
                return exhaustive;
            }
    }
};
const decodeNative = (field, mapping, raw)=>{
    const kind = _917_1_js__rspack_import_4/* .agentEventPayloadFieldKinds */.fC[field];
    switch(mapping.decode){
        case 'json-string':
            if ('string' != typeof raw) return;
            try {
                return decodeKind(kind, JSON.parse(raw));
            } catch  {
                return raw;
            }
        case 'positive-count':
            return 'number' == typeof raw && Number.isFinite(raw) ? raw > 0 : void 0;
        case void 0:
            return decodeKind(kind, raw);
        default:
            {
                const exhaustive = mapping.decode;
                return exhaustive;
            }
    }
};
const projectEventPayload = (event, native, target)=>{
    const payload = {};
    const mappings = (0,_917_1_js__rspack_import_4/* .isAgentEventPayloadHost */.an)(target) ? _917_1_js__rspack_import_4/* .agentEventPayloadNativeKeys */.jm[target][event] : void 0;
    if (void 0 !== mappings) for (const field of _917_1_js__rspack_import_4/* .agentEventPayloadFields */.jz[event]){
        const mapping = mappings[field];
        if (void 0 === mapping || !Object.hasOwn(native, mapping.nativeKey)) continue;
        const value = decodeNative(field, mapping, native[mapping.nativeKey]);
        if (void 0 !== value) payload[field] = Object.freeze({
            nativeKey: mapping.nativeKey,
            value
        });
    }
    return Object.freeze(payload);
};
const resultValueSchema = (0,_242_1_js__rspack_import_5/* .schemas_object */.xf)({
    error: (0,_242_1_js__rspack_import_5/* .schemas_string */.$z)().optional(),
    exitCode: (0,_242_1_js__rspack_import_5/* .schemas_number */.vD)().int().optional(),
    outcome: (0,_242_1_js__rspack_import_5/* .schemas_enum */.X5)([
        'continue',
        'allow',
        'ask',
        'deny',
        'synthesize'
    ]).optional(),
    output: (0,_242_1_js__rspack_import_5/* .unknown */.L5)().optional(),
    reason: (0,_242_1_js__rspack_import_5/* .schemas_string */.$z)().min(1).optional(),
    status: (0,_242_1_js__rspack_import_5/* .schemas_enum */.X5)([
        'done',
        'error',
        'cancelled'
    ]).optional(),
    updatedInput: (0,_242_1_js__rspack_import_5/* .schemas_record */.xK)((0,_242_1_js__rspack_import_5/* .schemas_string */.$z)(), (0,_242_1_js__rspack_import_5/* .unknown */.L5)()).optional()
}).strict();
let eventSequence = 0;
const snapshotNative = (native)=>Object.freeze(structuredClone(native));
const nativeEventError = (message)=>{
    throw new Error(`Agent Bundle event route error: ${message}`);
};
const requireNativeString = (input, field)=>{
    const value = input[field];
    if ('string' != typeof value || '' === value.trim()) nativeEventError(`native ${field} must be a nonempty string`);
};
const requireNativeStringValue = (input, field)=>{
    if ('string' != typeof input[field]) nativeEventError(`native ${field} must be a string`);
};
const requireNativeNumber = (input, field)=>{
    if ('number' != typeof input[field]) nativeEventError(`native ${field} must be a number`);
};
const requireNativeBoolean = (input, field)=>{
    if ('boolean' != typeof input[field]) nativeEventError(`native ${field} must be a boolean`);
};
const requireCompactTrigger = (native)=>{
    if ('manual' !== native.trigger && 'auto' !== native.trigger) nativeEventError('native trigger must equal manual or auto');
};
const requirePermissionMode = (native)=>{
    requireNativeString(native, 'permission_mode');
    if (![
        'default',
        'acceptEdits',
        'plan',
        'dontAsk',
        'bypassPermissions'
    ].includes(String(native.permission_mode))) nativeEventError('native permission_mode is invalid');
};
const isCursorPromptAttachment = (value)=>{
    if ('object' != typeof value || null === value || Array.isArray(value)) return false;
    const attachment = value;
    return ('file' === attachment.type || 'rule' === attachment.type) && 'string' == typeof attachment.file_path && '' !== attachment.file_path.trim();
};
const validateNativeEventEnvelope = (input, validation)=>{
    if ('object' != typeof input || null === input || Array.isArray(input)) return nativeEventError('stdin JSON value must be an object');
    const native = input;
    const { canonicalEvent, nativeEvent, target } = validation;
    if (native.hook_event_name !== nativeEvent) return nativeEventError(`native hook_event_name must equal ${nativeEvent}`);
    if ('amp' === target) {
        requireNativeString(native, 'session_id');
        switch(canonicalEvent){
            case 'session/start':
                if ('session.start' !== nativeEvent) return nativeEventError('Amp session/start must use session.start');
                return native;
            case 'prompt/submit':
                if ('agent.start' !== nativeEvent) return nativeEventError('Amp prompt/submit must use agent.start');
                requireNativeStringValue(native, 'prompt');
                return native;
            case 'stop':
                if ('agent.end' !== nativeEvent) return nativeEventError('Amp stop must use agent.end');
                if (![
                    'done',
                    'error',
                    'cancelled'
                ].includes(String(native.status))) return nativeEventError('native status is invalid');
                return native;
            case 'tool/before':
            case 'tool/after':
                if (nativeEvent !== ('tool/before' === canonicalEvent ? 'tool.call' : 'tool.result')) return nativeEventError(`Amp ${canonicalEvent} uses the wrong native event`);
                requireNativeString(native, 'tool_name');
                if ('object' != typeof native.tool_input || null === native.tool_input || Array.isArray(native.tool_input)) return nativeEventError('native tool_input must be an object');
                requireNativeString(native, 'tool_use_id');
                if ('tool/after' === canonicalEvent && ![
                    'done',
                    'error',
                    'cancelled'
                ].includes(String(native.status))) return nativeEventError('native status is invalid');
                return native;
            case 'agent/idle':
            case 'agent/start':
            case 'agent/stop':
            case 'compact/after':
            case 'compact/before':
            case 'config/change':
            case 'file/change':
            case 'model-switch/after':
            case 'model-switch/before':
            case 'permission/denied':
            case 'permission/request':
            case 'session/end':
            case 'stop/failure':
            case 'task/complete':
            case 'task/create':
            case 'tool/failure':
            case 'workspace/open':
                return nativeEventError(`Amp PluginEventMap does not support ${canonicalEvent}`);
            default:
                {
                    const exhaustive = canonicalEvent;
                    return exhaustive;
                }
        }
    }
    if ('cursor' === target) {
        if ('workspace/open' === canonicalEvent) {
            if (!Array.isArray(native.workspace_roots) || 0 === native.workspace_roots.length || !native.workspace_roots.every((root)=>'string' == typeof root && '' !== root.trim())) return nativeEventError('native workspace_roots must be a nonempty array of nonempty strings');
            requireNativeString(native, 'cursor_version');
            return native;
        }
        if ('string' != typeof native.session_id && 'string' != typeof native.conversation_id) return nativeEventError('native session_id or conversation_id must be a string');
        if ('session/end' === canonicalEvent) {
            if (![
                'completed',
                'aborted',
                'error',
                'window_close',
                'user_close'
            ].includes(String(native.reason))) return nativeEventError('native reason is invalid');
            if ('number' != typeof native.duration_ms) return nativeEventError('native duration_ms must be a number');
            if ('boolean' != typeof native.is_background_agent) return nativeEventError('native is_background_agent must be a boolean');
            requireNativeString(native, 'final_status');
            if (Object.hasOwn(native, 'error_message') && 'string' != typeof native.error_message) return nativeEventError('native error_message must be a string');
            return native;
        }
        if ('prompt/submit' === canonicalEvent) {
            requireNativeStringValue(native, 'prompt');
            if (!Array.isArray(native.attachments) || !native.attachments.every(isCursorPromptAttachment)) return nativeEventError('native attachments must be an array of file/rule objects with nonempty file_path');
            return native;
        }
        if ('tool/failure' === canonicalEvent) {
            requireNativeString(native, 'tool_name');
            if ('object' != typeof native.tool_input || null === native.tool_input || Array.isArray(native.tool_input)) return nativeEventError('native tool_input must be an object');
            requireNativeString(native, 'tool_use_id');
            requireNativeString(native, 'cwd');
            requireNativeStringValue(native, 'error_message');
            if (![
                'timeout',
                'error',
                'permission_denied'
            ].includes(String(native.failure_type))) return nativeEventError('native failure_type is invalid');
            requireNativeNumber(native, 'duration');
            requireNativeBoolean(native, 'is_interrupt');
            return native;
        }
        if ('compact/before' === canonicalEvent) {
            requireCompactTrigger(native);
            for (const field of [
                'context_usage_percent',
                'context_tokens',
                'context_window_size',
                'message_count',
                'messages_to_compact'
            ])requireNativeNumber(native, field);
            requireNativeBoolean(native, 'is_first_compaction');
            return native;
        }
        if ('tool/before' === canonicalEvent || 'tool/after' === canonicalEvent) {
            requireNativeString(native, 'tool_name');
            if ('object' != typeof native.tool_input || null === native.tool_input || Array.isArray(native.tool_input)) return nativeEventError('native tool_input must be an object');
            requireNativeString(native, 'tool_use_id');
            if ('tool/after' === canonicalEvent) requireNativeString(native, 'tool_output');
        }
        if ('stop' === canonicalEvent && 'number' != typeof native.loop_count) return nativeEventError('native loop_count must be a number');
        if ('agent/start' === canonicalEvent) {
            requireNativeString(native, 'subagent_id');
            requireNativeString(native, 'subagent_type');
            requireNativeStringValue(native, 'task');
            requireNativeString(native, 'parent_conversation_id');
            requireNativeString(native, 'tool_call_id');
            requireNativeStringValue(native, 'subagent_model');
            requireNativeBoolean(native, 'is_parallel_worker');
            if (Object.hasOwn(native, 'git_branch')) requireNativeStringValue(native, 'git_branch');
        }
        if ('agent/stop' === canonicalEvent) {
            requireNativeString(native, 'subagent_type');
            if (![
                'completed',
                'error',
                'aborted'
            ].includes(String(native.status))) return nativeEventError('native status is invalid');
            for (const field of [
                'task',
                "description",
                'summary'
            ])requireNativeStringValue(native, field);
            for (const field of [
                'duration_ms',
                'message_count',
                'tool_call_count'
            ])requireNativeNumber(native, field);
            requireNativeNumber(native, 'loop_count');
            if (!Array.isArray(native.modified_files) || !native.modified_files.every((file)=>'string' == typeof file)) return nativeEventError('native modified_files must be an array of strings');
            if (!Object.hasOwn(native, "agent_transcript_path") || null !== native.agent_transcript_path && 'string' != typeof native.agent_transcript_path) return nativeEventError("native agent_transcript_path must be a string or null");
        }
        return native;
    }
    requireNativeString(native, 'session_id');
    if ('codex' === target) {
        if (null !== native.transcript_path && 'string' != typeof native.transcript_path) return nativeEventError("native transcript_path must be a string or null");
    } else requireNativeString(native, "transcript_path");
    requireNativeString(native, 'cwd');
    if ('session/end' === canonicalEvent) {
        if ('codex' === target) {
            if ('other' !== native.reason) return nativeEventError('native reason must equal other');
        } else if (![
            'clear',
            'resume',
            'logout',
            'prompt_input_exit',
            'other'
        ].includes(String(native.reason))) return nativeEventError('native reason is invalid');
    }
    if ('prompt/submit' === canonicalEvent) {
        requireNativeStringValue(native, 'prompt');
        requirePermissionMode(native);
        if ('codex' === target) {
            requireNativeString(native, 'turn_id');
            requireNativeString(native, 'model');
        }
    }
    if ('tool/failure' === canonicalEvent) {
        requireNativeString(native, 'tool_name');
        if ('object' != typeof native.tool_input || null === native.tool_input || Array.isArray(native.tool_input)) return nativeEventError('native tool_input must be an object');
        requireNativeString(native, 'tool_use_id');
        requireNativeStringValue(native, 'error');
        if (Object.hasOwn(native, 'is_interrupt')) requireNativeBoolean(native, 'is_interrupt');
        if (Object.hasOwn(native, 'duration_ms')) requireNativeNumber(native, 'duration_ms');
    }
    if ('permission/request' === canonicalEvent) {
        requireNativeString(native, 'tool_name');
        if ('codex' === target) {
            if (!Object.hasOwn(native, 'tool_input') || void 0 === native.tool_input) return nativeEventError('native tool_input is required');
            requirePermissionMode(native);
            requireNativeString(native, 'turn_id');
            requireNativeString(native, 'model');
        } else {
            if ('object' != typeof native.tool_input || null === native.tool_input || Array.isArray(native.tool_input)) return nativeEventError('native tool_input must be an object');
            requirePermissionMode(native);
        }
    }
    if ('permission/denied' === canonicalEvent) {
        requireNativeString(native, 'tool_name');
        if ('object' != typeof native.tool_input || null === native.tool_input || Array.isArray(native.tool_input)) return nativeEventError('native tool_input must be an object');
        if (Object.hasOwn(native, 'permission_decision')) requireNativeString(native, 'permission_decision');
        if (Object.hasOwn(native, 'permission_decision_reason')) requireNativeStringValue(native, 'permission_decision_reason');
    }
    if ('stop/failure' === canonicalEvent) {
        requireNativeStringValue(native, 'error');
        if (Object.hasOwn(native, 'stop_hook_active') && 'boolean' != typeof native.stop_hook_active) return nativeEventError('native stop_hook_active must be a boolean');
    }
    if ('file/change' === canonicalEvent) requireNativeString(native, 'file_path');
    if ('config/change' === canonicalEvent) {
        if (![
            'user_settings',
            'project_settings',
            'local_settings',
            'policy_settings',
            'skills'
        ].includes(String(native.source))) return nativeEventError('native source is invalid');
        if (Object.hasOwn(native, 'file_path')) requireNativeString(native, 'file_path');
    }
    if ('task/create' === canonicalEvent || 'task/complete' === canonicalEvent) {
        requireNativeString(native, 'task_id');
        requireNativeString(native, 'task_subject');
        for (const field of [
            "task_description",
            'teammate_name',
            'team_name'
        ])if (Object.hasOwn(native, field)) requireNativeString(native, field);
    }
    if ('agent/idle' === canonicalEvent) {
        requireNativeString(native, 'teammate_name');
        requireNativeString(native, 'team_name');
    }
    if ('model-switch/before' === canonicalEvent || 'model-switch/after' === canonicalEvent) {
        requireNativeString(native, 'from_model');
        requireNativeString(native, 'to_model');
        if (null !== native.requested_model && 'string' != typeof native.requested_model) return nativeEventError('native requested_model must be a string or null');
        const sources = 'model-switch/before' === canonicalEvent ? [
            'command',
            'picker',
            'sdk'
        ] : [
            'command',
            'picker',
            'sdk',
            'auto',
            'resume'
        ];
        if (!sources.includes(String(native.source))) return nativeEventError('native source is invalid');
        for (const field of [
            'context_tokens',
            'estimated_cache_write_usd'
        ])if (Object.hasOwn(native, field)) requireNativeNumber(native, field);
        if (Object.hasOwn(native, 'prompt_cache_warm')) requireNativeBoolean(native, 'prompt_cache_warm');
        if (Object.hasOwn(native, 'cache_ttl') && ![
            '5m',
            '1h'
        ].includes(String(native.cache_ttl))) return nativeEventError('native cache_ttl is invalid');
        if (Object.hasOwn(native, 'pricing') && ![
            'configured',
            'catalog',
            'default'
        ].includes(String(native.pricing))) return nativeEventError('native pricing is invalid');
    }
    if ('compact/before' === canonicalEvent || 'compact/after' === canonicalEvent) {
        requireCompactTrigger(native);
        if ('codex' === target) {
            requireNativeString(native, 'turn_id');
            requireNativeString(native, 'model');
        } else if ('compact/before' === canonicalEvent) {
            if (null !== native.custom_instructions && 'string' != typeof native.custom_instructions) return nativeEventError('native custom_instructions must be a string or null');
        } else requireNativeStringValue(native, 'compact_summary');
    }
    if ('session/start' === canonicalEvent) requireNativeString(native, 'source');
    if ('tool/before' === canonicalEvent || 'tool/after' === canonicalEvent) {
        requireNativeString(native, 'tool_name');
        if ('codex' === target) {
            if (!Object.hasOwn(native, 'tool_input') || void 0 === native.tool_input) return nativeEventError('native tool_input is required');
        } else if ('object' != typeof native.tool_input || null === native.tool_input || Array.isArray(native.tool_input)) return nativeEventError('native tool_input must be an object');
        requireNativeString(native, 'tool_use_id');
        if ('tool/after' === canonicalEvent) {
            if (!Object.hasOwn(native, 'tool_response') || void 0 === native.tool_response) return nativeEventError('native tool_response is required');
        }
    }
    if ('agent/start' === canonicalEvent || 'agent/stop' === canonicalEvent) {
        requireNativeString(native, 'agent_id');
        requireNativeString(native, 'agent_type');
        if ('codex' === target) {
            requireNativeString(native, 'turn_id');
            requireNativeString(native, 'model');
            requirePermissionMode(native);
        }
        if ('agent/stop' === canonicalEvent) {
            if ('boolean' != typeof native.stop_hook_active) return nativeEventError('native stop_hook_active must be a boolean');
            if (null !== native.agent_transcript_path && 'string' != typeof native.agent_transcript_path) return nativeEventError("native agent_transcript_path must be a string or null");
            if (null !== native.last_assistant_message && 'string' != typeof native.last_assistant_message) return nativeEventError('native last_assistant_message must be a string or null');
        }
    }
    if ('stop' === canonicalEvent) {
        if ('boolean' != typeof native.stop_hook_active) return nativeEventError('native stop_hook_active must be a boolean');
        if ('codex' === target) {
            if (null !== native.last_assistant_message && 'string' != typeof native.last_assistant_message) return nativeEventError('native last_assistant_message must be a string or null');
        } else requireNativeString(native, 'last_assistant_message');
    }
    return native;
};
const createCanonicalEventProps = (event, nativeInput, target, nativeEvent, hostContractRevision, signal, observation)=>{
    const native = snapshotNative(nativeInput);
    const canonical = Object.freeze({
        event,
        idempotencyKey: (0,node_crypto__rspack_import_0.createHash)('sha256').update(JSON.stringify({
            event,
            native,
            target
        }), 'utf8').digest('hex'),
        observedAt: observation?.observedAt ?? new Date().toISOString(),
        payload: projectEventPayload(event, native, target),
        provenance: Object.freeze({
            host: target,
            hostContractRevision,
            nativeEvent,
            source: 'native'
        }),
        sequence: observation?.sequence ?? ++eventSequence
    });
    return Object.freeze({
        canonical,
        native,
        signal
    });
};
const appendContext = (node, contexts)=>{
    switch(node.kind){
        case 'result':
            for (const child of node.children)appendContext(child, contexts);
            break;
        case 'context':
            contexts.push(node.text);
            break;
        case 'audio':
        case 'error':
        case 'image':
        case 'json':
        case 'markdown':
        case 'progress':
        case 'resource':
        case 'text':
            break;
        default:
            {
                const exhaustive = node;
                return exhaustive;
            }
    }
};
const projectEventDocument = (document, event, target, nativeEvent, nativeInput)=>{
    const contexts = [];
    appendContext(document.root, contexts);
    const additionalContext = 0 === contexts.length ? void 0 : contexts.join('');
    const parsedValue = void 0 === document.value ? void 0 : resultValueSchema.parse(document.value);
    if ('amp' !== target && (parsedValue?.error !== void 0 || parsedValue?.exitCode !== void 0 || parsedValue?.output !== void 0 || parsedValue?.status !== void 0)) throw new TypeError(`${event} does not accept Amp tool-result fields.`);
    if ('amp' !== target && (parsedValue?.outcome === 'synthesize' || parsedValue?.outcome === 'allow' && 'tool/before' !== event && 'permission/request' !== event && 'model-switch/before' !== event || parsedValue?.outcome === 'ask' && 'tool/before' !== event && 'model-switch/before' !== event)) throw new TypeError(`${event} does not accept outcome "${parsedValue.outcome}": allow is a tool/before, model-switch/before, or permission/request decision and ask is a tool/before or model-switch/before decision; continue leaves the host's own flow untouched.`);
    const requireDenyReason = ()=>{
        if (parsedValue?.outcome !== 'deny') throw new TypeError(`${event} did not request a blocking outcome.`);
        if (void 0 === parsedValue.reason) throw new TypeError(`${event} requires a nonempty reason when outcome is deny.`);
        return parsedValue.reason;
    };
    if ('amp' === target) switch(event){
        case 'session/start':
            if (void 0 !== additionalContext || void 0 !== parsedValue) throw new TypeError('Amp session.start is observation-only and has no result channel.');
            return;
        case 'prompt/submit':
            if (parsedValue?.outcome !== void 0 && 'continue' !== parsedValue.outcome || parsedValue?.error !== void 0 || parsedValue?.exitCode !== void 0 || parsedValue?.output !== void 0 || parsedValue?.reason !== void 0 || parsedValue?.status !== void 0 || parsedValue?.updatedInput !== void 0) throw new TypeError('Amp agent.start accepts appended context only.');
            return void 0 === additionalContext ? void 0 : Object.freeze({
                message: Object.freeze({
                    content: additionalContext
                })
            });
        case 'stop':
            if (void 0 !== additionalContext || parsedValue?.error !== void 0 || parsedValue?.exitCode !== void 0 || parsedValue?.output !== void 0 || parsedValue?.status !== void 0 || parsedValue?.updatedInput !== void 0 || parsedValue?.outcome !== void 0 && 'continue' !== parsedValue.outcome && 'deny' !== parsedValue.outcome || parsedValue?.reason !== void 0 && 'deny' !== parsedValue.outcome) throw new TypeError('Amp agent.end accepts only a denied stop with a follow-up message.');
            return parsedValue?.outcome === 'deny' ? Object.freeze({
                action: 'continue',
                userMessage: requireDenyReason()
            }) : void 0;
        case 'tool/before':
            if (void 0 !== additionalContext || parsedValue?.status !== void 0 || parsedValue?.error !== void 0) throw new TypeError('Amp tool.call has no context or terminal-status result fields.');
            if (parsedValue?.outcome === 'ask') throw new TypeError('Amp tool.call has no ask result; native permissions remain host-owned.');
            if (parsedValue?.outcome === 'synthesize') {
                if ('string' != typeof parsedValue.output || void 0 !== parsedValue.reason || void 0 !== parsedValue.updatedInput) throw new TypeError('Amp tool.call synthesize requires string output and no decision or input-rewrite fields.');
                return Object.freeze({
                    action: 'synthesize',
                    result: Object.freeze({
                        ...void 0 === parsedValue.exitCode ? {} : {
                            exitCode: parsedValue.exitCode
                        },
                        output: parsedValue.output
                    })
                });
            }
            if (parsedValue?.output !== void 0 || parsedValue?.exitCode !== void 0) throw new TypeError('Amp tool.call output and exitCode are valid only with outcome synthesize.');
            if (parsedValue?.outcome === 'deny') {
                if (void 0 !== parsedValue.updatedInput) throw new TypeError('Amp tool.call cannot reject and modify one call.');
                return Object.freeze({
                    action: 'reject-and-continue',
                    message: requireDenyReason()
                });
            }
            if (parsedValue?.reason !== void 0) throw new TypeError('Amp tool.call reason is valid only with outcome deny.');
            if (parsedValue?.updatedInput !== void 0) return Object.freeze({
                action: 'modify',
                input: parsedValue.updatedInput
            });
            return parsedValue?.outcome === 'allow' ? Object.freeze({
                action: 'allow'
            }) : void 0;
        case 'tool/after':
            {
                if (void 0 !== additionalContext || parsedValue?.exitCode !== void 0 || parsedValue?.reason !== void 0 || parsedValue?.updatedInput !== void 0 || parsedValue?.outcome !== void 0 && 'continue' !== parsedValue.outcome) throw new TypeError('Amp tool.result accepts only a replacement status, output, and error.');
                if (parsedValue?.status === void 0 && parsedValue?.output === void 0 && parsedValue?.error === void 0) return;
                const status = parsedValue?.status ?? nativeInput?.status;
                if ('done' !== status && 'error' !== status && 'cancelled' !== status) throw new TypeError('Amp tool.result replacement requires a terminal status.');
                return Object.freeze({
                    ...parsedValue?.error === void 0 ? {} : {
                        error: parsedValue.error
                    },
                    ...parsedValue?.output === void 0 ? {} : {
                        output: parsedValue.output
                    },
                    status
                });
            }
        case 'agent/idle':
        case 'agent/start':
        case 'agent/stop':
        case 'compact/after':
        case 'compact/before':
        case 'config/change':
        case 'file/change':
        case 'model-switch/after':
        case 'model-switch/before':
        case 'permission/denied':
        case 'permission/request':
        case 'session/end':
        case 'stop/failure':
        case 'task/complete':
        case 'task/create':
        case 'tool/failure':
        case 'workspace/open':
            throw new TypeError(`Amp PluginEventMap does not support ${event}.`);
        default:
            {
                const exhaustive = event;
                return exhaustive;
            }
    }
    if ('stop' === event) {
        if (parsedValue?.outcome !== 'deny') return;
        return 'cursor' === target ? Object.freeze({
            followup_message: requireDenyReason()
        }) : Object.freeze({
            decision: 'block',
            reason: requireDenyReason()
        });
    }
    if ('agent/start' === event) {
        if (parsedValue?.updatedInput !== void 0) throw new TypeError('agent/start cannot replace native input.');
        if ('cursor' === target) {
            if (void 0 !== additionalContext) throw new TypeError('Cursor subagentStart has no additional-context channel.');
            if (parsedValue?.reason !== void 0 && 'deny' !== parsedValue.outcome) throw new TypeError('agent/start reason is only valid when outcome is deny.');
            return parsedValue?.outcome === 'deny' ? Object.freeze({
                permission: 'deny',
                user_message: requireDenyReason()
            }) : void 0;
        }
        if (parsedValue?.outcome === 'deny') throw new TypeError('agent/start cannot block subagent creation on Claude Code or Codex.');
        if (void 0 === additionalContext) return;
        return (0,_818_1_js__rspack_import_7/* .deepFreeze */.o)({
            hookSpecificOutput: {
                additionalContext,
                hookEventName: nativeEvent
            }
        });
    }
    if ('agent/stop' === event) {
        if (parsedValue?.updatedInput !== void 0) throw new TypeError('agent/stop cannot replace native input.');
        if ('cursor' === target) {
            if (void 0 !== additionalContext) throw new TypeError('Cursor subagentStop has no additional-context channel; only followup_message is documented.');
            if (parsedValue?.reason !== void 0 && 'deny' !== parsedValue.outcome) throw new TypeError('agent/stop reason is only valid when outcome is deny.');
            if (parsedValue?.outcome !== 'deny') return;
            if (void 0 !== nativeInput && 'completed' !== nativeInput.status) throw new TypeError(`Cursor subagentStop consumes followup_message only when status is "completed"; this subagent reported ${JSON.stringify(nativeInput.status)}, so the continuation would be ignored.`);
            return Object.freeze({
                followup_message: requireDenyReason()
            });
        }
        if (parsedValue?.outcome === 'deny') return Object.freeze({
            decision: 'block',
            reason: requireDenyReason()
        });
        if (void 0 === additionalContext) return;
        if ('codex' === target) throw new TypeError('agent/stop additional context is not supported by the Codex SubagentStop output schema.');
        return (0,_818_1_js__rspack_import_7/* .deepFreeze */.o)({
            hookSpecificOutput: {
                additionalContext,
                hookEventName: nativeEvent
            }
        });
    }
    if ('session/end' === event) {
        if (parsedValue?.outcome === 'deny' || parsedValue?.reason !== void 0 || parsedValue?.updatedInput !== void 0) throw new TypeError('session/end is observation-only on every supported host and cannot deny or replace native input.');
        if (void 0 !== additionalContext) throw new TypeError('session/end is observation-only on every supported host and has no context/output channel.');
        return;
    }
    if ('prompt/submit' === event) {
        if (parsedValue?.updatedInput !== void 0) throw new TypeError('prompt/submit cannot replace native input on any supported host.');
        if (parsedValue?.reason !== void 0 && 'deny' !== parsedValue.outcome) throw new TypeError('prompt/submit reason is only valid when outcome is deny.');
        if ('cursor' === target && void 0 !== additionalContext) throw new TypeError('Cursor beforeSubmitPrompt has no additional-context channel.');
        if ('cursor' === target) return parsedValue?.outcome === 'deny' ? Object.freeze({
            continue: false,
            user_message: requireDenyReason()
        }) : void 0;
        const reason = parsedValue?.outcome === 'deny' ? requireDenyReason() : void 0;
        if (void 0 === reason && void 0 === additionalContext) return;
        return (0,_818_1_js__rspack_import_7/* .deepFreeze */.o)({
            ...void 0 === reason ? {} : {
                decision: 'block',
                reason
            },
            ...void 0 === additionalContext ? {} : {
                hookSpecificOutput: {
                    additionalContext,
                    hookEventName: nativeEvent
                }
            }
        });
    }
    if ('tool/failure' === event) {
        if (parsedValue?.outcome === 'deny' || parsedValue?.reason !== void 0 || parsedValue?.updatedInput !== void 0) throw new TypeError('tool/failure cannot deny or replace native input; the tool has already failed.');
        if ('claude' !== target && void 0 !== additionalContext) throw new TypeError('cursor' === target ? 'Cursor postToolUseFailure has no context/output channel.' : 'tool/failure additional context is supported only by Claude PostToolUseFailure.');
        if (void 0 === additionalContext) return;
        return (0,_818_1_js__rspack_import_7/* .deepFreeze */.o)({
            hookSpecificOutput: {
                additionalContext,
                hookEventName: nativeEvent
            }
        });
    }
    if ('compact/before' === event) {
        if (parsedValue?.updatedInput !== void 0) throw new TypeError('compact/before cannot replace native input on any supported host.');
        if (void 0 !== additionalContext) throw new TypeError('cursor' === target ? 'Cursor preCompact user_message is user-facing and cannot be represented by Agent.Context.' : `${'codex' === target ? 'Codex PreCompact' : 'Claude PreCompact'} has no additional-context channel.`);
        if ('claude' === target) {
            if (parsedValue?.reason !== void 0 && 'deny' !== parsedValue.outcome) throw new TypeError('compact/before reason is only valid when outcome is deny on Claude.');
            return parsedValue?.outcome === 'deny' ? Object.freeze({
                decision: 'block',
                reason: requireDenyReason()
            }) : void 0;
        }
        if (parsedValue?.outcome === 'deny' || parsedValue?.reason !== void 0) throw new TypeError('cursor' === target ? 'Cursor preCompact is observational and cannot block compaction.' : 'Codex PreCompact common-control runtime semantics are unproven and are not projected.');
        return;
    }
    if ('compact/after' === event) {
        if (parsedValue?.outcome === 'deny' || parsedValue?.reason !== void 0 || parsedValue?.updatedInput !== void 0) throw new TypeError('compact/after is observation-only on every supported host and cannot deny or replace native input.');
        if (void 0 !== additionalContext) throw new TypeError('compact/after is observation-only on every supported host and has no context/output channel.');
        return;
    }
    if ('permission/request' === event) {
        if (parsedValue?.updatedInput !== void 0) throw new TypeError('permission/request input rewrite is reserved upstream and fails closed on both supported hosts; it is not projected.');
        if (void 0 !== additionalContext) throw new TypeError('permission/request has no additional-context channel in the PermissionRequest output contract.');
        if (parsedValue?.reason !== void 0 && 'deny' !== parsedValue.outcome) throw new TypeError('permission/request reason is only valid when outcome is deny.');
        if (parsedValue?.outcome === void 0 || 'continue' === parsedValue.outcome) return;
        return (0,_818_1_js__rspack_import_7/* .deepFreeze */.o)({
            hookSpecificOutput: {
                decision: {
                    behavior: 'deny' === parsedValue.outcome ? 'deny' : 'allow',
                    ...'deny' === parsedValue.outcome ? {
                        message: requireDenyReason()
                    } : {}
                },
                hookEventName: nativeEvent
            }
        });
    }
    if ('permission/denied' === event) {
        if (parsedValue?.outcome === 'deny' || parsedValue?.reason !== void 0 || parsedValue?.updatedInput !== void 0) throw new TypeError('permission/denied observes an already-denied call and cannot deny or replace native input.');
        if (void 0 !== additionalContext) throw new TypeError('permission/denied retry signalling has no canonical vocabulary yet; no context/output channel is projected.');
        return;
    }
    if ('stop/failure' === event) {
        if (parsedValue?.outcome === 'deny' || parsedValue?.reason !== void 0 || parsedValue?.updatedInput !== void 0) throw new TypeError('stop/failure observes an API-error turn end and cannot deny or replace native input.');
        if (void 0 !== additionalContext) throw new TypeError('stop/failure has no documented context/output channel.');
        return;
    }
    if ('model-switch/before' === event) {
        if (parsedValue?.updatedInput !== void 0) throw new TypeError('model-switch/before cannot replace native input; PreModelSwitch accepts no updatedInput.');
        if (void 0 !== additionalContext) throw new TypeError('model-switch/before has no additional-context channel; PreModelSwitch accepts no additionalContext.');
        if (parsedValue?.reason !== void 0 && 'deny' !== parsedValue.outcome && 'ask' !== parsedValue.outcome) throw new TypeError('model-switch/before reason is only valid when outcome is deny or ask.');
        if (parsedValue?.outcome === void 0 || 'continue' === parsedValue.outcome) return;
        return (0,_818_1_js__rspack_import_7/* .deepFreeze */.o)({
            hookSpecificOutput: {
                hookEventName: nativeEvent,
                permissionDecision: parsedValue.outcome,
                ...'deny' === parsedValue.outcome ? {
                    permissionDecisionReason: requireDenyReason()
                } : 'ask' === parsedValue.outcome && void 0 !== parsedValue.reason ? {
                    permissionDecisionReason: parsedValue.reason
                } : {}
            }
        });
    }
    if ('model-switch/after' === event) {
        if (parsedValue?.outcome === 'deny' || parsedValue?.reason !== void 0 || parsedValue?.updatedInput !== void 0) throw new TypeError('model-switch/after observes a completed model switch and cannot deny or replace native input.');
        if (void 0 === additionalContext) return;
        return (0,_818_1_js__rspack_import_7/* .deepFreeze */.o)({
            hookSpecificOutput: {
                additionalContext,
                hookEventName: nativeEvent
            }
        });
    }
    if ('file/change' === event) {
        if (parsedValue?.outcome === 'deny' || parsedValue?.reason !== void 0 || parsedValue?.updatedInput !== void 0) throw new TypeError('file/change has no decision control on Claude FileChanged; it is side-effect-only.');
        if (void 0 !== additionalContext) throw new TypeError('file/change has no documented context/output channel.');
        return;
    }
    if ('config/change' === event || 'task/create' === event) {
        if (parsedValue?.updatedInput !== void 0) throw new TypeError(`${event} cannot replace native input.`);
        if (void 0 !== additionalContext) throw new TypeError(`${event} has no documented additional-context channel.`);
        if (parsedValue?.reason !== void 0 && 'deny' !== parsedValue.outcome) throw new TypeError(`${event} reason is only valid when outcome is deny.`);
        return parsedValue?.outcome === 'deny' ? Object.freeze({
            decision: 'block',
            reason: requireDenyReason()
        }) : void 0;
    }
    if ('task/complete' === event) {
        if (parsedValue?.outcome === 'deny' || parsedValue?.reason !== void 0 || parsedValue?.updatedInput !== void 0) throw new TypeError('task/complete blocking is exit-code-only on Claude TaskCompleted (JSON continue:false redirects to teammate stop and is ignored for TaskUpdate); it is not projected.');
        if (void 0 !== additionalContext) throw new TypeError('task/complete has no documented context/output channel.');
        return;
    }
    if ('agent/idle' === event) {
        if (parsedValue?.updatedInput !== void 0) throw new TypeError('agent/idle cannot replace native input.');
        if (void 0 !== additionalContext) throw new TypeError('agent/idle has no documented additional-context channel.');
        if (parsedValue?.reason !== void 0 && 'deny' !== parsedValue.outcome) throw new TypeError('agent/idle reason is only valid when outcome is deny.');
        return parsedValue?.outcome === 'deny' ? Object.freeze({
            continue: false,
            stopReason: requireDenyReason()
        }) : void 0;
    }
    if ('tool/before' === event) {
        const decision = parsedValue?.outcome === void 0 || 'continue' === parsedValue.outcome ? void 0 : parsedValue.outcome;
        if (parsedValue?.reason !== void 0 && void 0 === decision) throw new TypeError('tool/before reason is only valid when outcome is allow, ask, or deny.');
        if ('cursor' === target) {
            if ('ask' === decision) throw new TypeError('Cursor preToolUse accepts permission "ask" in its schema but does not enforce it; ask is not projected on Cursor.');
            if ('deny' === decision) return Object.freeze({
                agent_message: parsedValue?.reason,
                permission: 'deny',
                user_message: parsedValue?.reason
            });
            if (void 0 === decision && parsedValue?.updatedInput === void 0) return;
            return Object.freeze({
                permission: 'allow',
                ...parsedValue?.updatedInput === void 0 ? {} : {
                    updated_input: parsedValue.updatedInput
                }
            });
        }
        const output = {
            ...void 0 === additionalContext ? {} : {
                additionalContext
            },
            hookEventName: nativeEvent,
            ...void 0 === decision ? {} : {
                permissionDecision: decision
            },
            ...parsedValue?.reason === void 0 ? {} : {
                permissionDecisionReason: parsedValue.reason
            },
            ...parsedValue?.updatedInput === void 0 ? {} : {
                updatedInput: parsedValue.updatedInput
            }
        };
        return 1 === Object.keys(output).length ? void 0 : (0,_818_1_js__rspack_import_7/* .deepFreeze */.o)({
            hookSpecificOutput: output
        });
    }
    if ('session/start' === event || 'tool/after' === event) {
        if (void 0 === additionalContext) return;
        return 'cursor' === target ? Object.freeze({
            additional_context: additionalContext
        }) : (0,_818_1_js__rspack_import_7/* .deepFreeze */.o)({
            hookSpecificOutput: {
                additionalContext,
                hookEventName: nativeEvent
            }
        });
    }
    if ('workspace/open' === event) {
        if (parsedValue?.outcome === 'deny' || parsedValue?.updatedInput !== void 0) throw new TypeError('workspace/open is observation-only on every supported host and cannot deny or replace native input.');
        if (void 0 !== additionalContext) throw new TypeError('Cursor\'s workspaceOpen has no context/output channel; the native pluginPaths return channel is deliberately not modeled.');
    }
};
const projectEventHandlerResult = (result, event, target, nativeEvent, nativeInput)=>projectEventDocument({
        root: {
            children: [],
            kind: 'result'
        },
        status: 'success',
        value: result,
        version: 1
    }, event, target, nativeEvent, nativeInput);
const settleBeforeAbort = (operation, signal, reason = ()=>signal.reason)=>new Promise((resolve, reject)=>{
        let settled = false;
        const finish = (outcome)=>{
            if (settled) return;
            settled = true;
            signal.removeEventListener('abort', onAbort);
            outcome();
        };
        const onAbort = ()=>finish(()=>reject(reason()));
        if (signal.aborted) return void onAbort();
        signal.addEventListener('abort', onAbort, {
            once: true
        });
        operation.then((value)=>finish(()=>resolve(value)), (error)=>finish(()=>reject(error)));
    });
const isHandlerObjectOutcome = (value)=>'continue' === value || 'deny' === value || 'render' === value;
const unsupportedResult = (detail)=>{
    throw new TypeError(`Event handler result ${detail}`);
};
const unexpectedFields = (record, allowed)=>{
    for (const key of Object.keys(record))if (!allowed.has(key)) throw new TypeError(`Event handler result has unsupported field ${JSON.stringify(key)}.`);
};
const validateEventHandlerResult = (value, event, view)=>{
    if (void 0 === value) return Object.freeze({
        outcome: 'continue'
    });
    if (!(0,_991_1_js__rspack_import_6/* .isRecord */.u4)(value)) return unsupportedResult('must be void or a render/continue/deny object.');
    const outcome = value.outcome;
    if (!isHandlerObjectOutcome(outcome)) return unsupportedResult(`outcome ${JSON.stringify(outcome)} is not supported.`);
    switch(outcome){
        case 'render':
            unexpectedFields(value, new Set([
                'outcome',
                'module',
                'data'
            ]));
            if (void 0 === view || value.module !== view) throw new TypeError('ctx.render() must name the event handler’s sibling .view.js module.');
            return Object.freeze({
                data: (0,_991_1_js__rspack_import_6/* .snapshotStrictJsonValue */.f8)(value.data),
                module: view,
                outcome: 'render'
            });
        case 'continue':
            unexpectedFields(value, new Set([
                'outcome'
            ]));
            return Object.freeze({
                outcome: 'continue'
            });
        case 'deny':
            unexpectedFields(value, new Set([
                'outcome',
                'reason'
            ]));
            if (!_917_1_js__rspack_import_4/* .eventContracts */.wo[event].deny) throw new TypeError(`${event} cannot deny from handler.`);
            if ('string' != typeof value.reason || '' === value.reason.trim()) throw new TypeError(`${event} requires a nonempty reason when outcome is deny.`);
            return Object.freeze({
                outcome: 'deny',
                reason: value.reason
            });
        default:
            {
                const exhaustive = outcome;
                return exhaustive;
            }
    }
};
const executeEventHandler = async (handler, context, trace, view)=>{
    trace?.handlerStart();
    try {
        context.signal.throwIfAborted();
        const frozenContext = Object.freeze({
            render: (module, data)=>({
                    outcome: 'render',
                    module,
                    data
                }),
            canonical: context.canonical,
            host: Object.freeze({
                ...context.host
            }),
            signal: context.signal,
            terminal: context.terminal,
            ...void 0 === context.native ? {} : {
                native: context.native
            }
        });
        const value = await settleBeforeAbort(Promise.resolve().then(()=>handler(frozenContext)), context.signal);
        context.signal.throwIfAborted();
        const result = validateEventHandlerResult(value, context.canonical.event, view);
        trace?.handlerOutcome(result);
        return result;
    } catch (error) {
        trace?.failure('handler', error);
        throw error;
    }
};
const eventTracePhases = Object.freeze([
    'handler',
    'execute',
    'providers',
    'render'
]);
const eventTraceEventKinds = Object.freeze([
    'handler.start',
    'handler.outcome',
    'execute.start',
    'providers.start',
    'providers.finish',
    'render.start',
    'render.finish',
    'failure'
]);
const eventTraceObserverSlot = Symbol.for('agent-bundle.event-trace-observer');
const observerRegistry = globalThis;
const eventTraceObserver = ()=>observerRegistry[eventTraceObserverSlot];
const installEventTraceObserver = (observer)=>{
    const previous = observerRegistry[eventTraceObserverSlot];
    observerRegistry[eventTraceObserverSlot] = observer;
    return ()=>{
        if (observerRegistry[eventTraceObserverSlot] === observer) observerRegistry[eventTraceObserverSlot] = previous;
    };
};
const MAX_ERROR_SUMMARY_MESSAGE_LENGTH = 512;
const UNPRINTABLE = '[unprintable]';
const NON_ERROR_NAME = 'NonError';
const requireNonBlank = (value, field)=>{
    if ('string' != typeof value || '' === value.trim()) throw new TypeError(`Event trace execution ${field} must be a nonempty string.`);
    return value;
};
const eventTraceExecution = (input)=>Object.freeze({
        event: input.event,
        executionId: void 0 === input.executionId ? (0,node_crypto__rspack_import_0.randomUUID)() : requireNonBlank(input.executionId, 'executionId'),
        host: requireNonBlank(input.host, 'host'),
        nativeEvent: requireNonBlank(input.nativeEvent, 'nativeEvent')
    });
const boundedMessage = (message)=>message.length > MAX_ERROR_SUMMARY_MESSAGE_LENGTH ? `${message.slice(0, MAX_ERROR_SUMMARY_MESSAGE_LENGTH - 1)}…` : message;
const stringProperty = (value, key)=>{
    try {
        const read = value[key];
        return 'string' == typeof read ? read : void 0;
    } catch  {
        return;
    }
};
const printable = (value)=>{
    try {
        return String(value);
    } catch  {
        return UNPRINTABLE;
    }
};
const summarizeEventTraceError = (error)=>{
    if (error instanceof Error) {
        const name = stringProperty(error, 'name');
        const message = stringProperty(error, 'message');
        const code = stringProperty(error, 'code');
        return Object.freeze({
            ...void 0 === code ? {} : {
                code
            },
            message: boundedMessage(message ?? UNPRINTABLE),
            name: void 0 === name || '' === name ? 'Error' : name
        });
    }
    return Object.freeze({
        message: boundedMessage(printable(error)),
        name: NON_ERROR_NAME
    });
};
const handlerOutcomeOf = (result)=>{
    if ('render' === result.outcome) return 'render';
    switch(result.outcome){
        case 'continue':
            return 'continue';
        case 'deny':
            return 'deny';
        default:
            {
                const exhaustive = result;
                return exhaustive;
            }
    }
};
const durationField = (since, at)=>void 0 === since ? {} : {
        durationMs: at - since
    };
const createEventTracer = (options)=>{
    const execution = options.execution;
    const explicitObserver = options.observer;
    const now = options.now ?? (()=>performance.now());
    let sequence = 0;
    let closed = false;
    let firstAt;
    const startedAt = {};
    let activeProviders = 0;
    let completedProviders = 0;
    const readClock = ()=>{
        try {
            return now();
        } catch  {
            return;
        }
    };
    const deliver = (observer, event)=>{
        try {
            observer(event);
        } catch  {}
    };
    const emit = (build, terminal = false)=>{
        if (closed) return;
        const observer = explicitObserver ?? eventTraceObserver();
        if (void 0 === observer) {
            if (terminal) closed = true;
            return;
        }
        const at = readClock();
        if (void 0 === at) return;
        const traceStartedAt = firstAt;
        firstAt ??= at;
        const event = build(at, sequence, traceStartedAt);
        sequence += 1;
        if (terminal) closed = true;
        deliver(observer, Object.freeze(event));
    };
    return {
        get closed () {
            return closed;
        },
        get enabled () {
            return (explicitObserver ?? eventTraceObserver()) !== void 0;
        },
        execution,
        executeStart: (runtime)=>{
            emit((at, next)=>{
                startedAt.execute = at;
                return {
                    at,
                    execution,
                    kind: 'execute.start',
                    phase: 'execute',
                    runtime,
                    sequence: next
                };
            });
        },
        failure: (phase, error)=>{
            const summary = summarizeEventTraceError(error);
            emit((at, next, traceStartedAt)=>({
                    at,
                    ...durationField(traceStartedAt, at),
                    error: summary,
                    execution,
                    kind: 'failure',
                    phase,
                    sequence: next
                }), true);
        },
        handlerOutcome: (result)=>{
            const outcome = handlerOutcomeOf(result);
            emit((at, next)=>({
                    at,
                    ...durationField(startedAt.handler, at),
                    execution,
                    kind: 'handler.outcome',
                    outcome,
                    phase: 'handler',
                    sequence: next
                }));
        },
        handlerStart: ()=>{
            emit((at, next)=>{
                startedAt.handler = at;
                return {
                    at,
                    execution,
                    kind: 'handler.start',
                    phase: 'handler',
                    sequence: next
                };
            });
        },
        providersFinish: (count)=>{
            if (0 === activeProviders) return void emit((at, next)=>({
                    at,
                    count,
                    execution,
                    kind: 'providers.finish',
                    phase: 'providers',
                    sequence: next
                }));
            completedProviders += count;
            activeProviders -= 1;
            if (activeProviders > 0) return;
            emit((at, next)=>{
                const providerStartedAt = startedAt.providers;
                delete startedAt.providers;
                return {
                    at,
                    count: completedProviders,
                    ...durationField(providerStartedAt, at),
                    execution,
                    kind: 'providers.finish',
                    phase: 'providers',
                    sequence: next
                };
            });
        },
        providersStart: ()=>{
            activeProviders += 1;
            if (activeProviders > 1) return;
            completedProviders = 0;
            emit((at, next)=>{
                startedAt.providers = at;
                return {
                    at,
                    execution,
                    kind: 'providers.start',
                    phase: 'providers',
                    sequence: next
                };
            });
        },
        renderFinish: ()=>{
            emit((at, next)=>({
                    at,
                    ...durationField(startedAt.render, at),
                    execution,
                    kind: 'render.finish',
                    phase: 'render',
                    sequence: next
                }));
        },
        renderStart: ()=>{
            emit((at, next)=>{
                startedAt.render = at;
                return {
                    at,
                    execution,
                    kind: 'render.start',
                    phase: 'render',
                    sequence: next
                };
            });
        }
    };
};
const isHostSessionId = (value)=>'string' == typeof value && /^hs_[0-9a-z]{16}$/.test(value);
const isLoopbackHttpOrigin = (value)=>{
    if ('string' != typeof value) return false;
    try {
        const parsed = new URL(value);
        return 'http:' === parsed.protocol && ('127.0.0.1' === parsed.hostname || '[::1]' === parsed.hostname) && parsed.origin === value;
    } catch  {
        return false;
    }
};
const EVENT_TRACE_RECEIPT_VERSION = 1;
const EVENT_TRACE_RECEIPT_PATH = '/api/trace/receipts';
const EVENT_TRACE_RECEIPT_MAX_BYTES = 16384;
const EVENT_TRACE_RECEIPT_URL_ENV = 'AGENT_BUNDLE_DEV_TRACE_URL';
const EVENT_TRACE_RECEIPT_TOKEN_ENV = 'AGENT_BUNDLE_DEV_TRACE_TOKEN';
const EVENT_TRACE_RECEIPT_SESSION_ENV = 'AGENT_BUNDLE_DEV_SESSION';
const EVENT_TRACE_RECEIPT_ENDPOINT_FILE = 'hook-receipts.json';
const DEV_INSTALL_MARKER_FILE = '.agent-bundle-dev.json';
const EVENT_TRACE_RECEIPT_TIMEOUT_MS = 750;
const nativeString = (native, key)=>{
    const value = native[key];
    return 'string' == typeof value && '' !== value.trim() ? value : void 0;
};
const eventTraceReceiptIdentity = (host, native)=>{
    const sessionId = nativeString(native, 'session_id') ?? nativeString(native, 'conversation_id');
    const conversationId = 'cursor' === host ? nativeString(native, 'conversation_id') : nativeString(native, 'agent_id') ?? nativeString(native, 'session_id');
    const requestId = nativeString(native, 'tool_use_id') ?? nativeString(native, 'tool_call_id');
    return Object.freeze({
        ...void 0 === conversationId ? {} : {
            conversationId
        },
        ...void 0 === requestId ? {} : {
            requestId
        },
        ...void 0 === sessionId ? {} : {
            sessionId
        }
    });
};
const eventTraceReceiptLineage = (observed)=>{
    if ('unavailable' === observed.state) return Object.freeze({
        reason: observed.reason,
        state: 'unavailable'
    });
    const { conversation, depth, generation, parent, resolution, root, subagent } = observed.value;
    return Object.freeze({
        source: observed.source,
        state: 'available',
        value: Object.freeze({
            conversation,
            depth,
            ...void 0 === generation ? {} : {
                generation
            },
            ...void 0 === parent ? {} : {
                parent
            },
            resolution,
            root,
            ...void 0 === subagent ? {} : {
                subagent: Object.freeze({
                    id: subagent.id,
                    ...void 0 === subagent.isParallelWorker ? {} : {
                        isParallelWorker: subagent.isParallelWorker
                    },
                    ...void 0 === subagent.toolCallId ? {} : {
                        toolCallId: subagent.toolCallId
                    },
                    ...void 0 === subagent.type ? {} : {
                        type: subagent.type
                    }
                })
            }
        })
    });
};
const receiptEndpoint = (url, token)=>isLoopbackHttpOrigin(url) && 'string' == typeof token && '' !== token.trim() ? Object.freeze({
        token,
        url
    }) : void 0;
const readJsonRecord = async (path)=>{
    let parsed;
    try {
        parsed = JSON.parse(await (0,node_fs_promises__rspack_import_1.readFile)(path, 'utf8'));
    } catch  {
        return;
    }
    return 'object' != typeof parsed || null === parsed || Array.isArray(parsed) ? void 0 : parsed;
};
const eventTraceReceiptEndpointPath = (projectRoot)=>(0,node_path__rspack_import_2.join)(projectRoot, '.agent-bundle', EVENT_TRACE_RECEIPT_ENDPOINT_FILE);
const resolveEventTraceReceiptEndpoint = async (options)=>{
    const fromEnv = receiptEndpoint(options.env[EVENT_TRACE_RECEIPT_URL_ENV], options.env[EVENT_TRACE_RECEIPT_TOKEN_ENV]);
    if (void 0 !== fromEnv) return fromEnv;
    let markerPath;
    try {
        markerPath = (0,node_url__rspack_import_3.fileURLToPath)(new URL(`../${DEV_INSTALL_MARKER_FILE}`, options.anchor));
    } catch  {
        return;
    }
    const marker = await readJsonRecord(markerPath);
    if (void 0 === marker || 'string' != typeof marker.projectRoot || '' === marker.projectRoot) return;
    const record = await readJsonRecord(eventTraceReceiptEndpointPath(marker.projectRoot));
    if (void 0 === record || 'number' != typeof record.pid || !Number.isSafeInteger(record.pid)) return;
    if (record.pid !== process.pid) try {
        process.kill(record.pid, 0);
    } catch  {
        return;
    }
    return receiptEndpoint(record.url, record.token);
};
const withoutExecution = (event)=>{
    const { execution: _execution, ...rest } = event;
    return rest;
};
const compactProviderEvents = (events)=>{
    const firstStart = events.find((event)=>'providers.start' === event.kind);
    const finishes = events.filter((event)=>'providers.finish' === event.kind);
    const lastFinish = finishes.at(-1);
    if (void 0 === firstStart && void 0 === lastFinish) return events;
    const count = finishes.reduce((total, event)=>total + event.count, 0);
    const compacted = [];
    for (const event of events){
        if ('providers.start' === event.kind) {
            if (event === firstStart) compacted.push(event);
            continue;
        }
        if ('providers.finish' !== event.kind) {
            compacted.push(event);
            continue;
        }
        if (event === lastFinish) compacted.push(Object.freeze({
            ...event,
            count,
            ...void 0 === firstStart ? {} : {
                durationMs: Math.max(0, event.at - firstStart.at)
            }
        }));
    }
    return Object.freeze(compacted);
};
const openEventTraceReceipt = async (options)=>{
    const endpoint = await resolveEventTraceReceiptEndpoint(options);
    if (void 0 === endpoint) return;
    const post = options.fetch ?? fetch;
    const events = [];
    let startedAt;
    let identity = Object.freeze({});
    let lineage = Object.freeze({
        reason: 'not-provided',
        state: 'unavailable'
    });
    let sent = false;
    const recorder = {
        endpoint,
        identity: (native)=>{
            identity = eventTraceReceiptIdentity(options.execution.host, native);
        },
        lineage: (observed)=>{
            lineage = eventTraceReceiptLineage(observed);
        },
        observer: (event)=>{
            startedAt ??= new Date().toISOString();
            events.push(withoutExecution(event));
        },
        send: async ()=>{
            if (sent || void 0 === startedAt) return;
            sent = true;
            const session = options.env[EVENT_TRACE_RECEIPT_SESSION_ENV];
            const receipt = {
                ...isHostSessionId(session) ? {
                    devSession: session
                } : {},
                events: compactProviderEvents(events),
                execution: options.execution,
                identity,
                lineage,
                startedAt,
                version: EVENT_TRACE_RECEIPT_VERSION
            };
            const body = JSON.stringify(receipt);
            if (Buffer.byteLength(body, 'utf8') > EVENT_TRACE_RECEIPT_MAX_BYTES) return;
            try {
                await post(new URL(EVENT_TRACE_RECEIPT_PATH, endpoint.url), {
                    body,
                    headers: {
                        authorization: `Bearer ${endpoint.token}`,
                        'content-type': 'application/json'
                    },
                    method: 'POST',
                    signal: AbortSignal.timeout(EVENT_TRACE_RECEIPT_TIMEOUT_MS)
                });
            } catch  {}
        }
    };
    return Object.freeze(recorder);
};


__webpack_require__.d(__webpack_exports__, {
}, {
  AN: validateNativeEventEnvelope,
  Q$: openEventTraceReceipt,
  hx: projectEventHandlerResult,
  kx: executeEventHandler,
  no: createCanonicalEventProps,
  oq: eventTraceExecution,
  wG: createEventTracer
});


},
"./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/launch-env.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var node_fs__rspack_import_0 = __webpack_require__("node:fs");
/* import */ var node_path__rspack_import_1 = __webpack_require__("node:path");


const OPERATOR_ENV_FILE_VARIABLE = 'AGENT_BUNDLE_ENV_FILE';
const OPERATOR_ENV_FILE_NONE = 'none';
const OPERATOR_ENV_FILE_NAMES = Object.freeze([
    '.env',
    '.env.local'
]);
const unexpandedToken = /\$\{[^}]*\}/u;
const operatorEnvPluginRoot = (fallback, env = process.env)=>{
    const declared = env['AGENT_BUNDLE_PLUGIN_ROOT'] ?? '';
    return '' === declared.trim() || unexpandedToken.test(declared) ? (0,node_path__rspack_import_1.resolve)(fallback) : (0,node_path__rspack_import_1.resolve)(declared);
};
const operatorEnvFilePaths = (pluginRoot, env = process.env)=>{
    const explicit = env[OPERATOR_ENV_FILE_VARIABLE]?.trim() ?? '';
    if (explicit === OPERATOR_ENV_FILE_NONE) return Object.freeze([]);
    if ('' !== explicit) return Object.freeze(explicit.split(node_path__rspack_import_1.delimiter).map((path)=>path.trim()).filter((path)=>'' !== path).map((path)=>(0,node_path__rspack_import_1.resolve)(path)));
    return Object.freeze(OPERATOR_ENV_FILE_NAMES.map((name)=>(0,node_path__rspack_import_1.join)(pluginRoot, name)));
};
const closingQuoteIndex = (raw, quote)=>{
    for(let index = 1; index < raw.length; index += 1){
        if ('\\' === raw[index]) {
            index += 1;
            continue;
        }
        if (raw[index] === quote) return index;
    }
    return -1;
};
const unquotedValue = (raw)=>{
    const value = raw.trim();
    const comment = value.search(/\s#/u);
    return (-1 === comment ? value : value.slice(0, comment)).trim();
};
const quotedValue = (quote, inner)=>'"' === quote ? inner.replace(/\\n/gu, '\n').replace(/\\r/gu, '\r').replace(/\\"/gu, '"') : inner;
const parseOperatorEnv = (contents)=>{
    const parsed = {};
    const lines = contents.replace(/\r\n?/gu, '\n').split('\n');
    for(let index = 0; index < lines.length; index += 1){
        const line = lines[index].trim();
        if ('' === line || line.startsWith('#')) continue;
        const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/u.exec(line);
        if (null === match) continue;
        const key = match[1];
        let raw = match[2].trim();
        const quote = raw[0];
        if ('"' === quote || "'" === quote || '`' === quote) {
            let end = closingQuoteIndex(raw, quote);
            while(-1 === end && '`' !== quote && index + 1 < lines.length){
                index += 1;
                raw += `\n${lines[index]}`;
                end = closingQuoteIndex(raw, quote);
            }
            if (-1 !== end) {
                const trailer = raw.slice(end + 1).trim();
                if ('' === trailer || trailer.startsWith('#')) {
                    parsed[key] = quotedValue(quote, raw.slice(1, end));
                    continue;
                }
            }
        }
        parsed[key] = unquotedValue(raw);
    }
    return parsed;
};
const readOptional = (path)=>{
    try {
        return (0,node_fs__rspack_import_0.readFileSync)(path, 'utf8');
    } catch (error) {
        return 'ENOENT' === error.code ? void 0 : null;
    }
};
const applyOperatorEnv = (options)=>{
    const env = options.env ?? process.env;
    const reservedKey = (options.platform ?? process.platform) === 'win32' ? (key)=>key.toUpperCase() : (key)=>key;
    const manifestDefaults = new Map(Object.entries(options.manifestEnv ?? {}).map(([key, value])=>[
            reservedKey(key),
            value
        ]));
    const reserved = new Set(Object.keys(env).filter((key)=>void 0 !== env[key] && manifestDefaults.get(reservedKey(key)) !== env[key]).map(reservedKey));
    const files = [];
    const applied = new Set();
    for (const path of operatorEnvFilePaths(options.pluginRoot, env)){
        const contents = readOptional(path);
        if (void 0 === contents) {
            files.push({
                path,
                state: 'absent'
            });
            continue;
        }
        if (null === contents) {
            files.push({
                path,
                state: 'unreadable'
            });
            continue;
        }
        let count = 0;
        for (const [key, value] of Object.entries(parseOperatorEnv(contents)))if (!reserved.has(reservedKey(key))) {
            env[key] = value;
            applied.add(key);
            count += 1;
        }
        files.push({
            applied: count,
            path,
            state: 'loaded'
        });
    }
    return Object.freeze({
        applied: Object.freeze([
            ...applied
        ].sort((left, right)=>left.localeCompare(right))),
        files: Object.freeze(files)
    });
};


__webpack_require__.d(__webpack_exports__, {
}, {
  FF: operatorEnvPluginRoot,
  OJ: applyOperatorEnv
});


},
"./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/routes.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _917_1_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/917~1.js");
/* import */ var _573_1_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/573~1.js");

const defineTool = (config, handler)=>Object.assign(async (props)=>{
        const { agent } = await Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, "./node_modules/.pnpm/@agent-bundle+runtime@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+@agent-bundle+run_8a520d7a3aaeaa0cabb76a1d5a9cc798/node_modules/@agent-bundle/runtime/dist/request.js"));
        return handler(props.input, await agent());
    }, config);
const definitions = {};
for (const event of _917_1_js__rspack_import_0/* .canonicalAgentEvents */.jy){
    const [family, name] = event.split('/');
    const key = family.replace(/-([a-z])/gu, (_match, letter)=>letter.toUpperCase());
    const define = (config, handler)=>Object.assign(handler, {
            config,
            event
        });
    if (void 0 === name) definitions[key] = Object.assign(define, definitions[key]);
    else {
        const group = definitions[key] ?? {};
        Object.assign(group, {
            [name]: define
        });
        definitions[key] = group;
    }
}
const events = definitions;




__webpack_require__.d(__webpack_exports__, {
}, {
  AZ: events
});


},
"./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Context.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _Effectable_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Effectable.js");
/* import */ var _Equal_js__rspack_import_2 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Equal.js");
/* import */ var _Function_js__rspack_import_5 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Function.js");
/* import */ var _Hash_js__rspack_import_3 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Hash.js");
/* import */ var _internal_core_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/internal/core.js");
/* import */ var _Predicate_js__rspack_import_4 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Predicate.js");







/**
 * Runtime type identifier attached to `Context` service keys and used by
 * `isKey` to recognize them.
 *
 * @category type IDs
 * @since 4.0.0
 */
const ServiceTypeId = "~effect/Context/Service";
/**
 * Creates a `Context` service key.
 *
 * **When to use**
 *
 * Use when you need to define a context service key for a dependency that must
 * be provided by the surrounding context.
 *
 * **Details**
 *
 * Call `Context.Service("Key")` for a function-style key, or use the two-stage
 * form `Context.Service<Self, Shape>()("Key")` for class-style service
 * declarations. The returned key can be yielded as an Effect and passed to
 * `Context.make`, `Context.add`, and the Context getter functions.
 *
 * **Gotchas**
 *
 * The string key is the runtime identity of the service. Reusing the same key
 * string for unrelated services makes them occupy the same slot in a
 * `Context`.
 *
 * **Example** (Creating service keys)
 *
 * ```ts import.meta.vitest
 * import { Context } from "effect"
 *
 * // Create a simple service
 * const Database = Context.Service<{
 *   query: (sql: string) => string
 * }>("Database")
 *
 * // Create a service class
 * class Config extends Context.Service<Config, {
 *   port: number
 * }>()("Config") {}
 *
 * // Use the services to create contexts
 * const db = Context.make(Database, {
 *   query: (sql) => `Result: ${sql}`
 * })
 * const config = Context.make(Config, { port: 8080 })
 * Context.get(db, Database).query("SELECT 1") // => "Result: SELECT 1"
 * Context.get(config, Config).port // => 8080
 * ```
 *
 * @see {@link Reference} for service keys with default values
 *
 * @category services
 * @since 4.0.0
 */
const Service = function () {
  function KeyClass() {}
  const self = KeyClass;
  Object.setPrototypeOf(self, ServiceProto);
  const init = (key, options) => {
    self.key = key;
    if (options?.defaultValue) {
      self[ReferenceTypeId] = ReferenceTypeId;
      self.defaultValue = options.defaultValue;
    }
    if (options?.make) {
      ;
      self.make = options.make;
    }
    if (options?.fiberCached) {
      cacheKeys.add(key);
    }
    return self;
  };
  return arguments.length > 0 ? init(arguments[0], arguments[1]) : init;
};
const ServiceProto = {
  [ServiceTypeId]: ServiceTypeId,
  ... /*#__PURE__*/_Effectable_js__rspack_import_0/* .Prototype */.bp({
    label: "Service",
    evaluate(fiber) {
      return (0,_internal_core_js__rspack_import_1/* .exitSucceed */.xt)(get(fiber.context, this));
    }
  }),
  toJSON() {
    return {
      _id: "Service",
      key: this.key
    };
  },
  of(self) {
    return self;
  },
  context(self) {
    return make(this, self);
  },
  use(f) {
    return (0,_internal_core_js__rspack_import_1/* .withFiber */.R6)(fiber => f(get(fiber.context, this)));
  },
  useSync(f) {
    return (0,_internal_core_js__rspack_import_1/* .withFiber */.R6)(fiber => (0,_internal_core_js__rspack_import_1/* .exitSucceed */.xt)(f(get(fiber.context, this))));
  }
};
const cacheKeys = /*#__PURE__*/new Set();
const ReferenceTypeId = "~effect/Context/Reference";
const TypeId = "~effect/Context";
const MaxDepth = 8;
const FlattenAfterBaseHits = 8;
const makeImpl = (cacheRoot, base, overlay, depth) => {
  const self = Object.create(Proto);
  self.cacheRoot = cacheRoot ?? self;
  self.base = base;
  self.overlay = overlay;
  self.depth = depth;
  self._flat = undefined;
  self.baseHits = 0;
  return self;
};
const applyOverlays = (map, overlay) => {
  if (!overlay) return;
  applyOverlays(map, overlay.parent);
  map.set(overlay.key, overlay.value);
};
const flatten = self => {
  if (self._flat) return self._flat;
  if (!self.overlay) return self._flat = self.base;
  const map = new Map(self.base);
  applyOverlays(map, self.overlay);
  return self._flat = map;
};
const withFlat = (self, f) => {
  const map = new Map(self.mapUnsafe);
  f(map);
  return makeUnsafe(map);
};
// A private symbol so user code cannot forge a value that reads as absent
const notFound = /*#__PURE__*/Symbol();
const lookup = (self, key) => {
  const impl = self;
  for (let overlay = impl.overlay; overlay; overlay = overlay.parent) {
    if (overlay.key === key) return overlay.value;
  }
  const value = impl.base.get(key);
  // Misses must not advance the counter: reference-default lookups miss the
  // base on every fiber cache refresh, which would flatten every short-lived
  // request context and reintroduce the O(services) per-request cost
  if (value === undefined && !impl.base.has(key)) return notFound;
  if (impl.overlay && ++impl.baseHits >= FlattenAfterBaseHits) {
    impl.base = flatten(impl);
    impl.overlay = undefined;
    impl.depth = 0;
  }
  return value;
};
/**
 * Creates a `Context` from an existing service map.
 *
 * **When to use**
 *
 * Use when constructing a low-level `Context` from a trusted map whose lifecycle
 * you control.
 *
 * **Gotchas**
 *
 * The provided map is retained without copying and must not be mutated after
 * construction. Prefer `empty`, `make`, `add`, or `merge` for normal Context
 * construction.
 *
 * **Example** (Creating a context from a map)
 *
 * ```ts import.meta.vitest
 * import { Context } from "effect"
 *
 * // Create a context from a Map (unsafe)
 * const map = new Map([
 *   ["Logger", { log: (_msg: string) => {} }]
 * ])
 *
 * const context = Context.makeUnsafe(map)
 * context.mapUnsafe.size // => 1
 * ```
 *
 * @category constructors
 * @since 4.0.0
 */
const makeUnsafe = mapUnsafe => makeImpl(undefined, mapUnsafe, undefined, 0);
const Proto = {
  get mapUnsafe() {
    return flatten(this);
  },
  ..._internal_core_js__rspack_import_1/* .PipeInspectableProto */.fU,
  [TypeId]: {
    _Services: _ => _
  },
  toJSON() {
    return {
      _id: "Context",
      services: Array.from(this.mapUnsafe).map(([key, value]) => ({
        key,
        value
      }))
    };
  },
  [_Equal_js__rspack_import_2/* .symbol */.HR](that) {
    if (!isContext(that)) return false;
    const self = this.mapUnsafe;
    const other = that.mapUnsafe;
    if (self.size !== other.size) return false;
    for (const [key, value] of self) {
      if (!other.has(key) || !_Equal_js__rspack_import_2/* .equals */.aI(value, other.get(key))) return false;
    }
    return true;
  },
  [_Hash_js__rspack_import_3/* .symbol */.HR]() {
    return _Hash_js__rspack_import_3/* .number */.ai(this.mapUnsafe.size);
  }
};
/** @internal */
const hasSameCache = (self, that) => self.cacheRoot === that.cacheRoot;
/**
 * Checks whether the provided argument is a `Context`.
 *
 * **When to use**
 *
 * Use to narrow an unknown value before passing it to APIs that require a
 * `Context`.
 *
 * **Details**
 *
 * This checks the runtime `Context` marker and does not inspect which services
 * the context contains.
 *
 * **Gotchas**
 *
 * This guard only proves that the value is a `Context`; it does not prove that
 * any specific service is present.
 *
 * **Example** (Checking for contexts)
 *
 * ```ts import.meta.vitest
 * import { Context } from "effect"
 * Context.isContext(Context.empty()) // => true
 * ```
 *
 * @see {@link isKey} for checking service keys
 * @see {@link isReference} for checking references with defaults
 *
 * @category guards
 * @since 2.0.0
 */
const isContext = u => (0,_Predicate_js__rspack_import_4/* .hasProperty */.i5)(u, TypeId);
/**
 * Checks whether the provided argument is a `Key`.
 *
 * **Example** (Checking for keys)
 *
 * ```ts import.meta.vitest
 * import { Context } from "effect"
 * Context.isKey(Context.Service("Service")) // => true
 * ```
 *
 * @category guards
 * @since 4.0.0
 */
const isKey = u => hasProperty(u, ServiceTypeId);
/**
 * Checks whether the provided argument is a `Reference`.
 *
 * **Example** (Checking for references)
 *
 * ```ts import.meta.vitest
 * import { Context } from "effect"
 *
 * const LoggerRef = Context.Reference("Logger", {
 *   defaultValue: () => ({ log: (_msg: string) => {} })
 * })
 *
 * Context.isReference(LoggerRef) // => true
 * Context.isReference(Context.Service("Key")) // => false
 * ```
 *
 * @category guards
 * @since 3.11.0
 */
const isReference = u => !!u[ReferenceTypeId];
/**
 * Returns an empty `Context`.
 *
 * **Example** (Creating an empty context)
 *
 * ```ts import.meta.vitest
 * import { Context } from "effect"
 * Context.empty().mapUnsafe.size // => 0
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
const empty = () => emptyContext;
const emptyContext = /*#__PURE__*/(/* unused pure expression or super */ null && (makeUnsafe(/*#__PURE__*/new Map())));
/**
 * Creates a new `Context` with a single service associated to the key.
 *
 * **Example** (Creating a context with one service)
 *
 * ```ts import.meta.vitest
 * import { Context } from "effect"
 *
 * const Port = Context.Service<{ PORT: number }>("Port")
 *
 * const context = Context.make(Port, { PORT: 8080 })
 *
 * Context.get(context, Port).PORT // => 8080
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
const make = (key, service) => makeUnsafe(new Map([[key.key, service]]));
/**
 * Adds a service to a given `Context`.
 *
 * **When to use**
 *
 * Use when you need to store a known service value in a `Context`.
 *
 * **Details**
 *
 * If the context already contains the same service key, the new service
 * replaces the previous one.
 *
 * **Example** (Adding a service to a context)
 *
 * ```ts import.meta.vitest
 * import { Context, pipe } from "effect"
 *
 * const Port = Context.Service<{ PORT: number }>("Port")
 * const Timeout = Context.Service<{ TIMEOUT: number }>("Timeout")
 *
 * const someContext = Context.make(Port, { PORT: 8080 })
 *
 * const context = pipe(
 *   someContext,
 *   Context.add(Timeout, { TIMEOUT: 5000 })
 * )
 *
 * const values = [Context.get(context, Port).PORT, Context.get(context, Timeout).TIMEOUT]
 * values // => [8080, 5000]
 * ```
 *
 * @see {@link addOrOmit} for adding or removing a service from an `Option`
 *
 * @category combining
 * @since 2.0.0
 */
const add = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(3, (self, key, service) => addUnsafe(self, key.key, service))));
/**
 * Adds a service by key to a given `Context` using a string key.
 *
 * @category combining
 * @since 4.0.0
 */
const addUnsafe = (self, key, service) => {
  const impl = self;
  const cacheRoot = cacheKeys.has(key) ? undefined : impl.cacheRoot;
  if (impl.depth >= MaxDepth) {
    // Rebase the overlay chain into a flat map, keeping the cacheRoot so a
    // rebase on an ordinary key does not invalidate fiber caches
    const map = new Map(impl.mapUnsafe);
    map.set(key, service);
    return makeImpl(cacheRoot, map, undefined, 0);
  }
  return makeImpl(cacheRoot, impl.base, {
    key,
    value: service,
    parent: impl.overlay
  }, impl.depth + 1);
};
/**
 * Adds or removes a service depending on an `Option`.
 *
 * **When to use**
 *
 * Use when you need to add or omit a `Context` service based on an `Option`.
 *
 * **Details**
 *
 * When `service` is `Option.some`, the value is stored for the key. When it is
 * `Option.none`, the key is removed from the returned `Context`.
 *
 * **Example** (Adding optional services)
 *
 * ```ts import.meta.vitest
 * import { Context, Option } from "effect"
 *
 * const Port = Context.Service<{ PORT: number }>("Port")
 *
 * const withPort = Context.empty().pipe(
 *   Context.addOrOmit(Port, Option.some({ PORT: 8080 }))
 * )
 *
 * const withoutPort = withPort.pipe(
 *   Context.addOrOmit(Port, Option.none())
 * )
 * Context.getOption(withPort, Port) // => Option.some({ PORT: 8080 })
 * Context.getOption(withoutPort, Port) // => Option.none()
 * ```
 *
 * @see {@link add} for always storing a service value
 *
 * @category combining
 * @since 4.0.0
 */
const addOrOmit = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(3, (self, key, service) => service._tag === "None" ? omit(key)(self) : add(self, key, service.value))));
/**
 * Gets the service for a key, or evaluates the fallback when a non-reference
 * key is absent.
 *
 * **When to use**
 *
 * Use when you need a fallback for a missing `Context.Service` key while still
 * resolving `Context.Reference` defaults.
 *
 * **Details**
 *
 * If the key is a `Context.Reference` and no override is stored in the
 * context, its cached default value is returned instead of the fallback.
 *
 * **Gotchas**
 *
 * The fallback is not evaluated for missing `Context.Reference` keys because
 * references resolve to their default value.
 *
 * **Example** (Falling back for missing services)
 *
 * ```ts import.meta.vitest
 * import { Context } from "effect"
 *
 * const Logger = Context.Service<{ log: (msg: string) => void }>("Logger")
 * const Database = Context.Service<{ query: (sql: string) => string }>(
 *   "Database"
 * )
 *
 * const context = Context.make(Logger, { log: (_msg: string) => {} })
 *
 * const logger = Context.getOrElse(context, Logger, () => ({ log: () => {} }))
 * const database = Context.getOrElse(
 *   context,
 *   Database,
 *   () => ({ query: () => "fallback" })
 * )
 *
 * logger === Context.get(context, Logger) // => true
 * database.query("SELECT 1") // => "fallback"
 * ```
 *
 * @see {@link getOption} for returning `Option.none` when a non-reference key is missing
 *
 * @category getters
 * @since 3.7.0
 */
const getOrElse = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(3, (self, key, orElse) => {
  const value = lookup(self, key.key);
  if (value !== notFound) return value;
  return isReference(key) ? getDefaultValue(key) : orElse();
})));
/**
 * Returns the service currently stored for a key, or `undefined` when the key
 * is absent.
 *
 * **When to use**
 *
 * Use when you need to read the service stored for a key without resolving
 * `Context.Reference` defaults.
 *
 * **Gotchas**
 *
 * This is a raw lookup and does not resolve default values for
 * `Context.Reference` keys.
 *
 * @see {@link getOption} for a reference-aware optional lookup
 *
 * @category getters
 * @since 4.0.0
 */
const getOrUndefined = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (self, key) => getOrUndefinedUnsafe(self, key.key))));
/** @internal */
const getOrUndefinedUnsafe = (self, key) => {
  const value = lookup(self, key);
  return value === notFound ? undefined : value;
};
/**
 * Gets the service for a key, throwing if an absent non-reference key cannot be
 * resolved.
 *
 * **When to use**
 *
 * Use when you need to read a service from a context whose type does not prove
 * the service is present.
 *
 * **Details**
 *
 * If the key is a `Context.Reference` and no override is stored in the
 * context, its cached default value is returned. For absent non-reference keys,
 * this function throws a runtime error.
 *
 * **Example** (Getting services unsafely)
 *
 * ```ts import.meta.vitest
 * import { Context, Option } from "effect"
 *
 * const Port = Context.Service<{ PORT: number }>("Port")
 * const Timeout = Context.Service<{ TIMEOUT: number }>("Timeout")
 *
 * const context = Context.make(Port, { PORT: 8080 })
 *
 * Context.getUnsafe(context, Port).PORT // => 8080
 * Context.getOption(context, Timeout) // => Option.none()
 * ```
 *
 * @see {@link get} for type-checked service access
 * @see {@link getOption} for optional service access
 *
 * @category unsafe
 * @since 4.0.0
 */
const getUnsafe = /*#__PURE__*/(0,_Function_js__rspack_import_5/* .dual */.XY)(2, (self, service) => {
  const value = lookup(self, service.key);
  if (value === notFound) {
    if (isReference(service)) return getDefaultValue(service);
    throw serviceNotFoundError(service);
  }
  return value;
});
/**
 * Gets a service from the context that corresponds to the given key.
 *
 * **When to use**
 *
 * Use when you need type-checked access to a service already included in the
 * context type.
 *
 * **Example** (Getting a service from a context)
 *
 * ```ts import.meta.vitest
 * import { Context, pipe } from "effect"
 *
 * const Port = Context.Service<{ PORT: number }>("Port")
 * const Timeout = Context.Service<{ TIMEOUT: number }>("Timeout")
 *
 * const context = pipe(
 *   Context.make(Port, { PORT: 8080 }),
 *   Context.add(Timeout, { TIMEOUT: 5000 })
 * )
 *
 * Context.get(context, Timeout).TIMEOUT // => 5000
 * ```
 *
 * @see {@link getOption} for optional service access
 * @see {@link getOrElse} for fallback values
 *
 * @category getters
 * @since 2.0.0
 */
const get = getUnsafe;
const defaultValueCacheKey = "~effect/Context/defaultValue";
const getDefaultValue = ref => {
  if (defaultValueCacheKey in ref) {
    return ref[defaultValueCacheKey];
  }
  return ref[defaultValueCacheKey] = ref.defaultValue();
};
const serviceNotFoundError = service => {
  const error = new Error(`Service not found${service.key ? `: ${String(service.key)}` : ""}`);
  if (error.stack) {
    const lines = error.stack.split("\n");
    lines.splice(1, 3);
    error.stack = lines.join("\n");
  }
  return error;
};
/**
 * Gets the service for a key safely wrapped in an `Option`.
 *
 * **When to use**
 *
 * Use when you need to read a `Context` service as an `Option` so absence is
 * represented as data.
 *
 * **Details**
 *
 * Returns `Option.some` when the service is stored in the context. If the key
 * is a `Context.Reference` and no override is stored, returns `Option.some` of
 * the cached default value. Missing non-reference keys return `Option.none`.
 *
 * **Example** (Getting optional services)
 *
 * ```ts import.meta.vitest
 * import { Context, Option } from "effect"
 *
 * const Port = Context.Service<{ PORT: number }>("Port")
 * const Timeout = Context.Service<{ TIMEOUT: number }>("Timeout")
 *
 * const context = Context.make(Port, { PORT: 8080 })
 *
 * Context.getOption(context, Port) // => Option.some({ PORT: 8080 })
 * Context.getOption(context, Timeout) // => Option.none()
 * ```
 *
 * @see {@link getOrElse} for returning a fallback value directly
 *
 * @category getters
 * @since 2.0.0
 */
const getOption = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (self, service) => {
  const value = lookup(self, service.key);
  if (value !== notFound) return Option.some(value);
  return isReference(service) ? Option.some(getDefaultValue(service)) : Option.none();
})));
/**
 * Merges two `Context`s into one.
 *
 * **When to use**
 *
 * Use when you need to combine two contexts.
 *
 * **Details**
 *
 * When both contexts contain the same service key, the service from `that`
 * overrides the service from `self`.
 *
 * **Example** (Merging two contexts)
 *
 * ```ts import.meta.vitest
 * import { Context } from "effect"
 *
 * const Port = Context.Service<{ PORT: number }>("Port")
 * const Timeout = Context.Service<{ TIMEOUT: number }>("Timeout")
 *
 * const firstContext = Context.make(Port, { PORT: 8080 })
 * const secondContext = Context.make(Timeout, { TIMEOUT: 5000 })
 *
 * const context = Context.merge(firstContext, secondContext)
 *
 * const values = [Context.get(context, Port).PORT, Context.get(context, Timeout).TIMEOUT]
 * values // => [8080, 5000]
 * ```
 *
 * @see {@link mergeAll} for merging more than two contexts at once
 *
 * @category combining
 * @since 2.0.0
 */
const merge = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (self, that) => {
  if (self.mapUnsafe.size === 0) return that;
  if (that.mapUnsafe.size === 0) return self;
  return withFlat(self, map => that.mapUnsafe.forEach((value, key) => map.set(key, value)));
})));
/**
 * Merges any number of `Context`s into one.
 *
 * **When to use**
 *
 * Use when you need to combine a variadic list of contexts.
 *
 * **Details**
 *
 * When multiple contexts contain the same service key, the service from the
 * last context with that key is kept.
 *
 * **Example** (Merging multiple contexts)
 *
 * ```ts import.meta.vitest
 * import { Context } from "effect"
 *
 * const Port = Context.Service<{ PORT: number }>("Port")
 * const Timeout = Context.Service<{ TIMEOUT: number }>("Timeout")
 * const Host = Context.Service<{ HOST: string }>("Host")
 *
 * const firstContext = Context.make(Port, { PORT: 8080 })
 * const secondContext = Context.make(Timeout, { TIMEOUT: 5000 })
 * const thirdContext = Context.make(Host, { HOST: "localhost" })
 *
 * const context = Context.mergeAll(
 *   firstContext,
 *   secondContext,
 *   thirdContext
 * )
 *
 * context.mapUnsafe.size // => 3
 * ```
 *
 * @see {@link merge} for merging two contexts
 *
 * @category combining
 * @since 3.12.0
 */
const mergeAll = (...ctxs) => {
  const map = new Map();
  for (let i = 0; i < ctxs.length; i++) {
    ctxs[i].mapUnsafe.forEach((value, key) => {
      map.set(key, value);
    });
  }
  return makeUnsafe(map);
};
/**
 * Returns a new `Context` that contains only the specified services.
 *
 * **When to use**
 *
 * Use when you want to keep an allowlist of services in a `Context`.
 *
 * **Example** (Picking services from a context)
 *
 * ```ts import.meta.vitest
 * import { Context, Option, pipe } from "effect"
 *
 * const Port = Context.Service<{ PORT: number }>("Port")
 * const Timeout = Context.Service<{ TIMEOUT: number }>("Timeout")
 *
 * const someContext = pipe(
 *   Context.make(Port, { PORT: 8080 }),
 *   Context.add(Timeout, { TIMEOUT: 5000 })
 * )
 *
 * const context = pipe(someContext, Context.pick(Port))
 *
 * Context.getOption(context, Port) // => Option.some({ PORT: 8080 })
 * Context.getOption(context, Timeout) // => Option.none()
 * ```
 *
 * @see {@link omit} for removing selected services
 *
 * @category filtering
 * @since 2.0.0
 */
const pick = (...services) => self => {
  const keep = new Set(services.map(key => key.key));
  return withFlat(self, map => map.forEach((_, key) => {
    if (!keep.has(key)) map.delete(key);
  }));
};
/**
 * Returns a new `Context` with the specified service keys removed.
 *
 * **When to use**
 *
 * Use when you want to remove a denylist of services from a `Context`.
 *
 * **Example** (Omitting services from a context)
 *
 * ```ts import.meta.vitest
 * import { Context, Option, pipe } from "effect"
 *
 * const Port = Context.Service<{ PORT: number }>("Port")
 * const Timeout = Context.Service<{ TIMEOUT: number }>("Timeout")
 *
 * const someContext = pipe(
 *   Context.make(Port, { PORT: 8080 }),
 *   Context.add(Timeout, { TIMEOUT: 5000 })
 * )
 *
 * const context = pipe(someContext, Context.omit(Timeout))
 *
 * Context.getOption(context, Port) // => Option.some({ PORT: 8080 })
 * Context.getOption(context, Timeout) // => Option.none()
 * ```
 *
 * @see {@link pick} for keeping selected services
 *
 * @category filtering
 * @since 2.0.0
 */
const omit = (...keys) => self => withFlat(self, map => {
  for (let i = 0; i < keys.length; i++) {
    map.delete(keys[i].key);
  }
});
/**
 * Creates a context key with a default value.
 *
 * **When to use**
 *
 * Use when you need to define a context key with a lazily computed default
 * value.
 *
 * **Details**
 *
 * `Context.Reference` allows you to create a key that can hold a value. You
 * can provide a default value for the service, which will automatically be used
 * when the context is accessed, or override it with a custom implementation
 * when needed. The default value is computed lazily and cached on the
 * reference.
 *
 * **Example** (Creating references with default values)
 *
 * ```ts import.meta.vitest
 * import { Context } from "effect"
 *
 * // Create a reference with a default value
 * const messages: Array<string> = []
 * const LoggerRef = Context.Reference("Logger", {
 *   defaultValue: () => ({ log: (msg: string) => messages.push(`Default: ${msg}`) })
 * })
 *
 * // The reference provides the default value when accessed from an empty context
 * const context = Context.empty()
 * const logger = Context.get(context, LoggerRef)
 *
 * // You can also override the default value
 * const customContext = Context.make(LoggerRef, {
 *   log: (msg: string) => messages.push(`Custom: ${msg}`)
 * })
 * const customLogger = Context.get(customContext, LoggerRef)
 * logger.log("default")
 * customLogger.log("message")
 * messages // => ["Default: default", "Custom: message"]
 * ```
 *
 * @see {@link Service} for required services without default values
 *
 * @category services
 * @since 3.11.0
 */
const Reference = (/* unused pure expression or super */ null && (Service));
//# sourceMappingURL=Context.js.map
__webpack_require__.d(__webpack_exports__, {
}, {
  kl: Service
});


},
"./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Effectable.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _internal_core_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/internal/core.js");

/**
 * Create a low-level `Effect` prototype.
 *
 * **When to use**
 *
 * Use when you need to create a custom Effect-like value without extending a
 * class, by providing a label and an evaluate function that receives the
 * current fiber.
 *
 * **Details**
 *
 * When the effect is evaluated, it calls `evaluate` with the current fiber.
 *
 * @see {@link Class} for a class-based approach to defining custom Effect values
 * @see {@link Mixin} for wrapping an existing class constructor
 *
 * @category prototypes
 * @since 4.0.0
 */
const Prototype = options => (0,_internal_core_js__rspack_import_0/* .makePrimitiveProto */.yj)({
  op: options.label,
  [_internal_core_js__rspack_import_0/* .evaluate */._3]: options.evaluate
});
const proto = /*#__PURE__*/(/* unused pure expression or super */ null && (Prototype({
  label: "Effectable",
  evaluate(_) {
    return this.asEffect();
  }
})));
const Base = /*#__PURE__*/(/* unused pure expression or super */ null && ((() => {
  const Base = function () {};
  Base.prototype = proto;
  return Base;
})()));
/**
 * Provides an abstract class that can be extended to create an `Effect`.
 *
 * **When to use**
 *
 * Use as an abstract base class to define custom classes whose instances behave
 * as `Effect` values.
 *
 * @see {@link Prototype} for a lower-level primitive approach to creating custom Effect-like values without a class
 * @see {@link Mixin} for wrapping an existing class constructor
 * @category constructors
 * @since 2.0.0
 */
class Class extends (/* unused pure expression or super */ null && (Base)) {}
/**
 * Returns a subclass of the provided class that inserts the Effect prototype
 * into the inheritance chain.
 *
 * **When to use**
 *
 * Use to make instances of an existing class behave as `Effect` values without
 * extending {@link Class} or modifying the original prototype.
 *
 * **Details**
 *
 * Pass the class to wrap, then implement `asEffect` on the final class. The
 * returned class is abstract, and the success, error, and service types are
 * inferred from the concrete `asEffect` return type. Concrete and abstract base
 * classes are supported. Constructor parameters and instance members are
 * preserved, except that Effect's prototype members shadow base prototype
 * members with the same name: `pipe`, `toString`, `toJSON`, `[Symbol.iterator]`,
 * and `[Symbol.for("nodejs.util.inspect.custom")]`.
 *
 * **Example** (Evaluating a mixed-in class)
 *
 * ```ts import.meta.vitest
 * import { Effect, Effectable } from "effect"
 *
 * class Box {
 *   constructor(readonly value: number) {}
 * }
 *
 * class EffectBox extends Effectable.Mixin(Box) {
 *   asEffect() {
 *     return Effect.succeed(this.value)
 *   }
 * }
 *
 * const box = new EffectBox(2)
 * Effect.isEffect(box) // => true
 * await Effect.runPromise(box) // => 2
 * ```
 *
 * @see {@link Prototype} for a lower-level primitive approach to creating custom Effect-like values without a class
 * @see {@link Class} for a base constructor to extend
 * @category constructors
 * @since 4.0.0
 */
const Mixin = klass => {
  class Mixed extends klass {}
  Object.defineProperties(Mixed.prototype, Object.getOwnPropertyDescriptors(proto));
  return Mixed;
};
//# sourceMappingURL=Effectable.js.map
__webpack_require__.d(__webpack_exports__, {
}, {
  bp: Prototype
});


},
"./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Equal.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _Hash_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Hash.js");
/* import */ var _internal_equal_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/internal/equal.js");
/* import */ var _Predicate_js__rspack_import_2 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Predicate.js");



/**
 * Defines the unique string identifier for the `Equal` interface.
 *
 * **When to use**
 *
 * Use when you implement custom equality and need the computed property key for
 * the equality method.
 *
 * **Details**
 *
 * This is a pure constant with no allocation or side effects.
 *
 * **Example** (Implementing Equal on a class)
 *
 * ```ts import.meta.vitest
 * import { Equal, Hash } from "effect"
 *
 * class UserId implements Equal.Equal {
 *   constructor(readonly id: string) {}
 *
 *   [Equal.symbol](that: Equal.Equal): boolean {
 *     return that instanceof UserId && this.id === that.id
 *   }
 *
 *   [Hash.symbol](): number {
 *     return Hash.string(this.id)
 *   }
 * }
 *
 * Equal.equals(new UserId("1"), new UserId("1")) // => true
 * Equal.equals(new UserId("1"), new UserId("2")) // => false
 * ```
 *
 * @see {@link Equal} — the interface that uses this symbol
 * @see {@link isEqual} — type guard for `Equal` implementors
 * @category symbols
 * @since 2.0.0
 */
const symbol = "~effect/Equal";
function equals() {
  if (arguments.length === 1) {
    return self => compareBoth(self, arguments[0]);
  }
  return compareBoth(arguments[0], arguments[1]);
}
function compareBoth(self, that) {
  if (self === that) return true;
  if (self == null || that == null) return false;
  const selfType = typeof self;
  if (selfType !== typeof that) {
    return false;
  }
  // Special case for NaN: NaN should be considered equal to NaN
  if (selfType === "number" && self !== self && that !== that) {
    return true;
  }
  if (selfType !== "object" && selfType !== "function") {
    return false;
  }
  if (_internal_equal_js__rspack_import_0/* .byReferenceInstances.has */.J.has(self) || _internal_equal_js__rspack_import_0/* .byReferenceInstances.has */.J.has(that)) {
    return false;
  }
  // For objects and functions, use cached comparison
  return withCache(self, that, compareObjects);
}
/** Helper to run comparison with proper visited tracking */
function withVisitedTracking(self, that, fn) {
  const hasLeft = visitedLeft.has(self);
  const hasRight = visitedRight.has(that);
  // Check for circular references before adding
  if (hasLeft && hasRight) {
    return true; // Both are circular at the same level
  }
  if (hasLeft || hasRight) {
    return false; // Only one is circular
  }
  visitedLeft.add(self);
  visitedRight.add(that);
  const result = fn();
  visitedLeft.delete(self);
  visitedRight.delete(that);
  return result;
}
const visitedLeft = /*#__PURE__*/new WeakSet();
const visitedRight = /*#__PURE__*/new WeakSet();
/** Helper to perform cached object comparison */
function compareObjects(self, that) {
  if (_Hash_js__rspack_import_1/* .hash */.tW(self) !== _Hash_js__rspack_import_1/* .hash */.tW(that)) {
    return false;
  } else if (self instanceof Date) {
    if (!(that instanceof Date)) return false;
    const selfTime = self.getTime();
    const thatTime = that.getTime();
    return selfTime === thatTime || Number.isNaN(selfTime) && Number.isNaN(thatTime);
  } else if (self instanceof RegExp) {
    if (!(that instanceof RegExp)) return false;
    return self.toString() === that.toString();
  }
  const selfIsEqual = isEqual(self);
  const thatIsEqual = isEqual(that);
  if (selfIsEqual !== thatIsEqual) return false;
  const bothEquals = selfIsEqual && thatIsEqual;
  if (typeof self === "function" && !bothEquals) {
    return false;
  }
  return withVisitedTracking(self, that, () => {
    if (bothEquals) {
      return self[symbol](that);
    } else if (Array.isArray(self)) {
      if (!Array.isArray(that) || self.length !== that.length) {
        return false;
      }
      return compareArrays(self, that);
    } else if (ArrayBuffer.isView(self)) {
      const selfIsDataView = self instanceof DataView;
      if (!ArrayBuffer.isView(that) || self.byteLength !== that.byteLength || selfIsDataView !== that instanceof DataView) {
        return false;
      }
      if (selfIsDataView) {
        const thatDataView = that;
        return compareTypedArrays(new Uint8Array(self.buffer, self.byteOffset, self.byteLength), new Uint8Array(thatDataView.buffer, thatDataView.byteOffset, thatDataView.byteLength));
      }
      return compareTypedArrays(self, that);
    } else if (self instanceof Map) {
      if (!(that instanceof Map) || self.size !== that.size) {
        return false;
      }
      return compareMaps(self, that);
    } else if (self instanceof Set) {
      if (!(that instanceof Set) || self.size !== that.size) {
        return false;
      }
      return compareSets(self, that);
    }
    return compareRecords(self, that);
  });
}
function withCache(self, that, f) {
  // Check cache first
  let selfMap = equalityCache.get(self);
  if (!selfMap) {
    selfMap = new WeakMap();
    equalityCache.set(self, selfMap);
  } else if (selfMap.has(that)) {
    return selfMap.get(that);
  }
  // Perform the comparison
  const result = f(self, that);
  // Cache the result bidirectionally
  selfMap.set(that, result);
  let thatMap = equalityCache.get(that);
  if (!thatMap) {
    thatMap = new WeakMap();
    equalityCache.set(that, thatMap);
  }
  thatMap.set(self, result);
  return result;
}
const equalityCache = /*#__PURE__*/new WeakMap();
function compareArrays(self, that) {
  for (let i = 0; i < self.length; i++) {
    if (!compareBoth(self[i], that[i])) {
      return false;
    }
  }
  return true;
}
function compareTypedArrays(self, that) {
  if (self.length !== that.length) {
    return false;
  }
  for (let i = 0; i < self.length; i++) {
    if (self[i] !== that[i]) {
      return false;
    }
  }
  return true;
}
function compareRecords(self, that) {
  const selfKeys = (0,_internal_equal_js__rspack_import_0/* .getAllObjectKeys */.X)(self);
  const thatKeys = (0,_internal_equal_js__rspack_import_0/* .getAllObjectKeys */.X)(that);
  if (selfKeys.size !== thatKeys.size) {
    return false;
  }
  for (const key of selfKeys) {
    if (!thatKeys.has(key) || !compareBoth(self[key], that[key])) {
      return false;
    }
  }
  return true;
}
/** @internal */
function makeCompareMap(keyEquivalence, valueEquivalence) {
  return function compareMaps(self, that) {
    const thatEntries = Array.from(that);
    for (const [selfKey, selfValue] of self) {
      let found = false;
      for (let i = 0; i < thatEntries.length; i++) {
        const [thatKey, thatValue] = thatEntries[i];
        if (keyEquivalence(selfKey, thatKey) && valueEquivalence(selfValue, thatValue)) {
          thatEntries[i] = thatEntries[thatEntries.length - 1];
          thatEntries.pop();
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  };
}
const compareMaps = /*#__PURE__*/makeCompareMap(compareBoth, compareBoth);
/** @internal */
function makeCompareSet(equivalence) {
  return function compareSets(self, that) {
    const thatValues = Array.from(that);
    for (const selfValue of self) {
      let found = false;
      for (let i = 0; i < thatValues.length; i++) {
        const thatValue = thatValues[i];
        if (equivalence(selfValue, thatValue)) {
          thatValues[i] = thatValues[thatValues.length - 1];
          thatValues.pop();
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  };
}
const compareSets = /*#__PURE__*/makeCompareSet(compareBoth);
/**
 * Checks whether a value implements the {@link Equal} interface.
 *
 * **When to use**
 *
 * Use when you need generic utility code to distinguish `Equal` implementors
 * from plain values before calling `[Equal.symbol]` directly.
 *
 * **Details**
 *
 * - Pure function, no side effects.
 * - Returns `true` if and only if `u` has a property keyed by
 *   {@link symbol}.
 * - Acts as a TypeScript type guard, narrowing the input to {@link Equal}.
 *
 * **Example** (Checking Equal values)
 *
 * ```ts import.meta.vitest
 * import { Equal, Hash } from "effect"
 *
 * class Token implements Equal.Equal {
 *   constructor(readonly value: string) {}
 *   [Equal.symbol](that: Equal.Equal): boolean {
 *     return that instanceof Token && this.value === that.value
 *   }
 *   [Hash.symbol](): number {
 *     return Hash.string(this.value)
 *   }
 * }
 *
 * Equal.isEqual(new Token("abc")) // => true
 * Equal.isEqual({ x: 1 }) // => false
 * Equal.isEqual(42) // => false
 * ```
 *
 * @see {@link Equal} — the interface being checked
 * @see {@link symbol} — the property key that signals `Equal` support
 * @category guards
 * @since 2.0.0
 */
const isEqual = u => (0,_Predicate_js__rspack_import_2/* .hasProperty */.i5)(u, symbol);
/**
 * Wraps {@link equals} as an `Equivalence<A>`.
 *
 * **When to use**
 *
 * Use when you want to pass `Equal.equals` to APIs that require an
 * `Equivalence`.
 *
 * **Details**
 *
 * - Returns a function `(a: A, b: A) => boolean` that delegates to
 *   {@link equals}.
 * - Pure; allocates a thin wrapper on each call.
 *
 * **Example** (Deduplicating with Equal semantics)
 *
 * ```ts import.meta.vitest
 * import { Array, Equal } from "effect"
 *
 * Array.dedupeWith([1, 2, 2, 3, 1], Equal.asEquivalence<number>()) // => [1, 2, 3]
 * ```
 *
 * @see {@link equals} — the underlying comparison function
 * @category instances
 * @since 4.0.0
 */
const asEquivalence = () => equals;
/**
 * Creates a proxy that uses reference equality instead of structural equality.
 *
 * **When to use**
 *
 * Use when you need to compare a plain object or array by identity without
 * mutating the original value.
 *
 * **Details**
 *
 * - Returns a `Proxy` wrapping `obj`. The proxy reads through to the
 *   original, so property access is unchanged.
 * - The proxy is registered in an internal WeakSet; {@link equals} returns
 *   `false` for any pair where at least one operand is in that set (unless
 *   they are the same reference).
 * - Each call creates a **new** proxy, so `byReference(x) !== byReference(x)`.
 * - Does **not** mutate the original object (unlike {@link byReferenceUnsafe}).
 *
 * **Example** (Opting out of structural equality)
 *
 * ```ts import.meta.vitest
 * import { Equal } from "effect"
 *
 * const a = { x: 1 }
 * const b = { x: 1 }
 *
 * Equal.equals(a, b) // => true
 *
 * const aRef = Equal.byReference(a)
 * Equal.equals(aRef, b) // => false
 * Equal.equals(aRef, aRef) // => true
 * aRef.x // => 1
 * ```
 *
 * @see {@link byReferenceUnsafe} — same effect without a proxy (mutates the
 *   original)
 * @see {@link equals} — the comparison function affected by this opt-out
 * @category equality
 * @since 4.0.0
 */
const byReference = obj => byReferenceUnsafe(new Proxy(obj, {}));
/**
 * Marks an object permanently to use reference equality, without creating a proxy.
 *
 * **When to use**
 *
 * Use when you need reference equality without proxy allocation and accept
 * permanently marking the original object for reference-only equality.
 *
 * **Details**
 *
 * - Adds `obj` to an internal WeakSet. From that point on, {@link equals}
 *   treats it as reference-only.
 * - Returns the **same** object (not a copy or proxy), so
 *   `byReferenceUnsafe(x) === x`.
 * - Does **not** affect the object's prototype, properties, or behavior
 *   beyond equality checks.
 *
 * **Gotchas**
 *
 * The marking is irreversible for the lifetime of the object.
 *
 * **Example** (Marking an object for reference equality)
 *
 * ```ts import.meta.vitest
 * import { Equal } from "effect"
 *
 * const obj1 = { a: 1, b: 2 }
 * const obj2 = { a: 1, b: 2 }
 *
 * const marked = Equal.byReferenceUnsafe(obj1)
 *
 * Equal.equals(obj1, obj2) // => false
 * Equal.equals(obj1, obj1) // => true
 * marked === obj1 // => true
 * ```
 *
 * @see {@link byReference} — safer alternative that creates a proxy
 * @see {@link equals} — the comparison function affected by this opt-out
 * @category unsafe
 * @since 4.0.0
 */
const byReferenceUnsafe = obj => {
  byReferenceInstances.add(obj);
  return obj;
};
//# sourceMappingURL=Equal.js.map
__webpack_require__.d(__webpack_exports__, {
  aI: () => (equals)
}, {
  HR: symbol
});


},
"./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Formatter.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _Predicate_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Predicate.js");
/* import */ var _Redactable_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Redactable.js");
/**
 * Formats JavaScript values into readable strings.
 *
 * `format` is intended for logs, diagnostics, and error messages. It handles
 * primitives, objects, arrays, dates, regular expressions, maps, sets, class
 * instances, errors, circular references, and redactable values. `formatJson`
 * wraps JSON formatting with redaction and circular-reference handling, and the
 * module also includes helpers for property keys, paths, and dates.
 *
 * @since 4.0.0
 */


/**
 * Converts any JavaScript value into a human-readable string.
 *
 * **When to use**
 *
 * Use when you need to format arbitrary JavaScript values for debugging,
 * logging, or error messages.
 *
 * **Details**
 *
 * - Output is **not** valid JSON; use {@link formatJson} when you need
 *   parseable JSON.
 * - Handles `BigInt`, `Symbol`, `Set`, `Map`, `Date`, `RegExp`, and class
 *   instances that `JSON.stringify` cannot represent.
 * - Circular references are shown as `"[Circular]"` instead of throwing.
 * - Failures while inspecting a value are rendered as diagnostic placeholders instead of throwing.
 * - Primitives: stringified naturally (`null`, `undefined`, `123`, `true`).
 *   Strings are JSON-quoted.
 * - Objects with a custom `toString` (not `Object.prototype.toString`):
 *   `toString()` is called unless `ignoreToString` is `true`.
 * - Errors with a `cause`: formatted as `"<message> (cause: <cause>)"`.
 * - Iterables (`Set`, `Map`, etc.): formatted as
 *   `ClassName([...elements])`.
 * - Class instances: wrapped as `ClassName({...})`.
 * - `Redactable` values are automatically redacted.
 * - Arrays/objects with 0–1 entries are inline; larger ones are
 *   pretty-printed when `space` is set.
 * - `space` — indentation unit (number of spaces, or a string like
 *   `"\t"`). Defaults to `0` (compact).
 * - `ignoreToString` — skip calling `toString()`. Defaults to `false`.
 *
 * **Example** (Formatting compact output)
 *
 * ```ts import.meta.vitest
 * import { Formatter } from "effect"
 *
 * Formatter.format({ a: 1, b: [2, 3] }) // => "{\"a\":1,\"b\":[2,3]}"
 * ```
 *
 * **Example** (Pretty-printed output)
 *
 * ```ts import.meta.vitest
 * import { Formatter } from "effect"
 *
 * const output = Formatter.format({ a: 1, b: [2, 3] }, { space: 2 })
 * output // => "{\n  \"a\": 1,\n  \"b\": [\n    2,\n    3\n  ]\n}"
 * ```
 *
 * **Example** (Handling circular references)
 *
 * ```ts import.meta.vitest
 * import { Formatter } from "effect"
 *
 * const obj: any = { name: "loop" }
 * obj.self = obj
 * Formatter.format(obj) // => "{\"name\":\"loop\",\"self\":[Circular]}"
 * ```
 *
 * @see {@link formatJson}
 * @see {@link Formatter}
 * @category formatting
 * @since 2.0.0
 */
function format(input, options) {
  const space = options?.space ?? 0;
  const ancestors = new WeakSet();
  const gap = !space ? "" : typeof space === "number" ? " ".repeat(space) : space;
  const ind = d => gap.repeat(d);
  const wrap = (v, body) => {
    const ctor = v?.constructor;
    return ctor && ctor !== Object.prototype.constructor && ctor.name ? `${ctor.name}(${body})` : body;
  };
  const ownKeys = o => {
    try {
      return Reflect.ownKeys(o);
    } catch {
      return ["[ownKeys threw]"];
    }
  };
  function recur(v, d = 0) {
    try {
      return recurUnsafe(v, d);
    } catch {
      if (typeof v === "object" && v !== null || typeof v === "function") ancestors.delete(v);
      return "[inspection threw]";
    }
  }
  function recurUnsafe(v, d = 0) {
    if (typeof v === "string") return JSON.stringify(v);
    if (typeof v === "number" || v == null || typeof v === "boolean" || typeof v === "symbol") return String(v);
    if (typeof v === "bigint") return String(v) + "n";
    if (typeof v === "object" || typeof v === "function") {
      if (ancestors.has(v)) return CIRCULAR;
      ancestors.add(v);
      let output;
      if (_Redactable_js__rspack_import_0/* .symbolRedactable */.uC in v) {
        output = recur((0,_Redactable_js__rspack_import_0/* .getRedacted */.f6)(v), d);
      } else if (Array.isArray(v)) {
        output = !gap || v.length <= 1 ? `[${v.map(x => recur(x, d)).join(",")}]` : `[\n${ind(d + 1)}${v.map(x => recur(x, d + 1)).join(",\n" + ind(d + 1))}\n${ind(d)}]`;
      } else if (v instanceof Date) {
        output = formatDate(v);
      } else if (!options?.ignoreToString && _Predicate_js__rspack_import_1/* .hasProperty */.i5(v, "toString") && typeof v["toString"] === "function" && v["toString"] !== Object.prototype.toString && v["toString"] !== Array.prototype.toString) {
        const s = safeToString(v);
        output = v instanceof Error && v.cause !== undefined ? `${s} (cause: ${recur(v.cause, d)})` : s;
      } else if (Symbol.iterator in v) {
        output = `${v.constructor.name}(${recur(Array.from(v), d)})`;
      } else {
        const keys = ownKeys(v);
        if (!gap || keys.length <= 1) {
          const body = `{${keys.map(k => `${formatPropertyKey(k)}:${recur(safeGet(v, k), d)}`).join(",")}}`;
          output = wrap(v, body);
        } else {
          const body = `{\n${keys.map(k => `${ind(d + 1)}${formatPropertyKey(k)}: ${recur(safeGet(v, k), d + 1)}`).join(",\n")}\n${ind(d)}}`;
          output = wrap(v, body);
        }
      }
      ancestors.delete(v);
      return output;
    }
    return String(v);
  }
  return recur(input, 0);
}
const CIRCULAR = "[Circular]";
/**
 * @internal
 */
function formatPropertyKey(name) {
  return typeof name === "string" ? JSON.stringify(name) : String(name);
}
/**
 * Formats an array of property keys as a bracket-notation path string.
 *
 * @internal
 */
function formatPath(path) {
  return path.map(key => `[${formatPropertyKey(key)}]`).join("");
}
/**
 * Formats a `Date` as an ISO 8601 string, returning `"Invalid Date"` for
 * invalid dates instead of throwing.
 *
 * @internal
 */
function formatDate(date) {
  try {
    return date.toISOString();
  } catch {
    return "Invalid Date";
  }
}
function safeToString(input) {
  try {
    const s = input.toString();
    return typeof s === "string" ? s : String(s);
  } catch {
    return "[toString threw]";
  }
}
function safeGet(input, key) {
  try {
    return input[key];
  } catch {
    return "[property access threw]";
  }
}
/**
 * Stringifies a value to JSON safely, silently dropping circular references.
 *
 * **When to use**
 *
 * Use when you need valid JSON output, unlike `format`, and the input may
 * contain circular references that should be silently omitted rather than
 * throwing a `TypeError`.
 *
 * **Details**
 *
 * Uses `JSON.stringify` internally with a replacer that tracks the current
 * object ancestry. Circular references are replaced with `undefined`, which
 * omits them from object output. `Redactable` values are automatically redacted
 * before serialization. `BigInt` values are stringified with an `n` suffix.
 * Values not supported by JSON otherwise follow standard `JSON.stringify`
 * behavior. The `space` parameter controls indentation and defaults to `0`.
 *
 * **Gotchas**
 *
 * When the root input is `undefined`, a symbol, or a function, `formatJson`
 * returns `"null"` instead of the `undefined` returned by `JSON.stringify`.
 * Nested values retain standard `JSON.stringify` behavior.
 *
 * **Example** (Formatting compact JSON)
 *
 * ```ts import.meta.vitest
 * import { Formatter } from "effect"
 *
 * Formatter.formatJson({ name: "Alice", age: 30 }) // => "{\"name\":\"Alice\",\"age\":30}"
 * ```
 *
 * **Example** (Handling circular references)
 *
 * ```ts import.meta.vitest
 * import { Formatter } from "effect"
 *
 * const obj: any = { name: "test" }
 * obj.self = obj
 * Formatter.formatJson(obj) // => "{\"name\":\"test\"}"
 * ```
 *
 * **Example** (Pretty-printed JSON)
 *
 * ```ts import.meta.vitest
 * import { Formatter } from "effect"
 *
 * const output = Formatter.formatJson({ name: "Alice", age: 30 }, { space: 2 })
 * output // => "{\n  \"name\": \"Alice\",\n  \"age\": 30\n}"
 * ```
 *
 * @see {@link format}
 * @see {@link Formatter}
 * @category serialization
 * @since 4.0.0
 */
function formatJson(input, options) {
  const ancestors = [];
  return JSON.stringify(input, function (key, value) {
    const original = Object.getOwnPropertyDescriptor(this, key)?.value;
    const redacted = Predicate.hasProperty(original, symbolRedactable) ? redact(original) : redact(value);
    if (typeof redacted === "bigint") {
      return format(redacted);
    }
    if (typeof redacted !== "object" || redacted === null) {
      return redacted;
    }
    while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
      ancestors.pop();
    }
    if (ancestors.includes(redacted)) {
      return undefined; // circular reference
    }
    ancestors.push(redacted);
    return redacted;
  }, options?.space) ?? "null";
}
//# sourceMappingURL=Formatter.js.map
__webpack_require__.d(__webpack_exports__, {
  GP: () => (format)
});


},
"./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Function.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {

/**
 * Creates a function that can be called in data-first style or data-last
 * (`pipe`-friendly) style.
 *
 * **When to use**
 *
 * Use to expose one implementation through both direct and `pipe`-friendly
 * call styles.
 *
 * **Details**
 *
 * Pass either the arity of the uncurried function or a predicate that decides
 * whether the current call is data-first. Arity is the common case. Use a
 * predicate when optional arguments make arity ambiguous.
 *
 * **Example** (Selecting data-first or data-last style by arity)
 *
 * ```ts import.meta.vitest
 * import { Function, pipe } from "effect"
 *
 * const sum = Function.dual<
 *   (that: number) => (self: number) => number,
 *   (self: number, that: number) => number
 * >(2, (self, that) => self + that)
 *
 * sum(2, 3) // => 5
 * pipe(2, sum(3)) // => 5
 * ```
 *
 * **Example** (Defining overloads with call signatures)
 *
 * ```ts import.meta.vitest
 * import { Function, pipe } from "effect"
 *
 * const sum: {
 *   (that: number): (self: number) => number
 *   (self: number, that: number): number
 * } = Function.dual(2, (self: number, that: number): number => self + that)
 *
 * sum(2, 3) // => 5
 * pipe(2, sum(3)) // => 5
 * ```
 *
 * **Example** (Selecting data-first or data-last style with a predicate)
 *
 * ```ts import.meta.vitest
 * import { Function, pipe } from "effect"
 *
 * const sum = Function.dual<
 *   (that: number) => (self: number) => number,
 *   (self: number, that: number) => number
 * >(
 *   (args) => args.length === 2,
 *   (self, that) => self + that
 * )
 *
 * sum(2, 3) // => 5
 * pipe(2, sum(3)) // => 5
 * ```
 *
 * @category combinators
 * @since 2.0.0
 */
const dual = function (arity, body) {
  if (typeof arity === "function") {
    return function () {
      return arity(arguments) ? body.apply(this, arguments) : self => body(self, ...arguments);
    };
  }
  switch (arity) {
    case 0:
    case 1:
      throw new RangeError(`Invalid arity ${arity}`);
    case 2:
      return function (a, b) {
        if (arguments.length >= 2) {
          return body(a, b);
        }
        return function (self) {
          return body(self, a);
        };
      };
    case 3:
      return function (a, b, c) {
        if (arguments.length >= 3) {
          return body(a, b, c);
        }
        return function (self) {
          return body(self, a, b);
        };
      };
    default:
      return function () {
        if (arguments.length >= arity) {
          // @ts-expect-error
          return body.apply(this, arguments);
        }
        const args = arguments;
        return function (self) {
          return body(self, ...args);
        };
      };
  }
};
/**
 * Applies a function to a given value.
 *
 * **When to use**
 *
 * Use to pass a fixed value into a unary function, especially when the function
 * is the value flowing through `pipe`.
 *
 * **Details**
 *
 * `apply(a)(f)` is equivalent to `f(a)`.
 *
 * **Example** (Applying an argument to a function)
 *
 * ```ts import.meta.vitest
 * import { Function, pipe, String } from "effect"
 *
 * pipe(String.length, Function.apply("hello")) // => 5
 * ```
 *
 * @see {@link pipe} for building left-to-right pipelines
 *
 * @category combinators
 * @since 2.0.0
 */
const apply = a => self => self(a);
/**
 * Returns its input argument unchanged.
 *
 * **When to use**
 *
 * Use to return a value unchanged where a function is required.
 *
 * **Example** (Returning the same value)
 *
 * ```ts import.meta.vitest
 * import { identity } from "effect"
 *
 * identity(5) // => 5
 * ```
 *
 * @category combinators
 * @since 2.0.0
 */
const identity = a => a;
/**
 * Ensures that the type of an expression matches some type,
 * without changing the resulting type of that expression.
 *
 * **When to use**
 *
 * Use to check assignability while preserving the expression's precise inferred
 * type.
 *
 * **Example** (Checking an expression against a type)
 *
 * ```ts import.meta.vitest
 * import { Function } from "effect"
 *
 * const test1 = Function.satisfies<number>()(5 as const) // => 5
 * // ^? const test: 5
 * // @ts-expect-error
 * const test2 = Function.satisfies<string>()(5)
 * // ^? Argument of type 'number' is not assignable to parameter of type 'string'
 * ```
 *
 * @see {@link cast} for changing only the static TypeScript type
 *
 * @category utility types
 * @since 2.0.0
 */
const satisfies = () => b => b;
/**
 * Returns the input value with a different static type.
 *
 * **When to use**
 *
 * Use when you need an explicit type-level cast and accept that the value is
 * returned unchanged at runtime.
 *
 * **Gotchas**
 *
 * This is a type-level cast only; it performs no runtime validation or
 * conversion.
 *
 * @see {@link satisfies} for checking assignability without changing the resulting type
 *
 * @category utility types
 * @since 4.0.0
 */
const cast = (/* unused pure expression or super */ null && (identity));
/**
 * Creates a zero-argument function that always returns the provided value.
 *
 * **When to use**
 *
 * Use when you need a thunk or callback that returns the same value on every
 * invocation.
 *
 * **Example** (Creating a constant thunk)
 *
 * ```ts import.meta.vitest
 * import { Function } from "effect"
 *
 * const constNull = Function.constant(null)
 *
 * constNull() // => null
 * constNull() // => null
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
const constant = value => () => value;
/**
 * Returns `true` when called.
 *
 * **When to use**
 *
 * Use when you need a thunk that returns `true` on every invocation.
 *
 * **Example** (Returning true from a thunk)
 *
 * ```ts import.meta.vitest
 * import { Function } from "effect"
 *
 * Function.constTrue() // => true
 * ```
 *
 * @category constants
 * @since 2.0.0
 */
const constTrue = /*#__PURE__*/(/* unused pure expression or super */ null && (constant(true)));
/**
 * Returns `false` when called.
 *
 * **When to use**
 *
 * Use when you need a thunk that returns `false` on every invocation.
 *
 * **Example** (Returning false from a thunk)
 *
 * ```ts import.meta.vitest
 * import { Function } from "effect"
 *
 * Function.constFalse() // => false
 * ```
 *
 * @category constants
 * @since 2.0.0
 */
const constFalse = /*#__PURE__*/(/* unused pure expression or super */ null && (constant(false)));
/**
 * Returns `null` when called.
 *
 * **When to use**
 *
 * Use when you need a thunk that returns `null` on every invocation.
 *
 * **Example** (Returning null from a thunk)
 *
 * ```ts import.meta.vitest
 * import { Function } from "effect"
 *
 * Function.constNull() // => null
 * ```
 *
 * @category constants
 * @since 2.0.0
 */
const constNull = /*#__PURE__*/(/* unused pure expression or super */ null && (constant(null)));
/**
 * Returns `undefined` when called.
 *
 * **When to use**
 *
 * Use when you need a thunk that returns `undefined` on every invocation.
 *
 * **Example** (Returning undefined from a thunk)
 *
 * ```ts import.meta.vitest
 * import { Function } from "effect"
 *
 * Function.constUndefined() // => undefined
 * ```
 *
 * @category constants
 * @since 2.0.0
 */
const constUndefined = /*#__PURE__*/(/* unused pure expression or super */ null && (constant(undefined)));
/**
 * Returns no meaningful value when called.
 *
 * **When to use**
 *
 * Use when you need a thunk that is called only for its effect and has no
 * meaningful return value.
 *
 * **Example** (Returning void from a thunk)
 *
 * ```ts import.meta.vitest
 * import { Function } from "effect"
 *
 * Function.constVoid() // => undefined
 * ```
 *
 * @category constants
 * @since 2.0.0
 */
const constVoid = (/* unused pure expression or super */ null && (constUndefined));
/**
 * Reverses the order of arguments for a curried function.
 *
 * **When to use**
 *
 * Use to adapt a curried function when its argument groups need to be supplied
 * in the opposite order.
 *
 * **Example** (Flipping curried arguments)
 *
 * ```ts import.meta.vitest
 * import { Function } from "effect"
 *
 * const f = (a: number) => (b: string) => a - b.length
 *
 * Function.flip(f)("aaa")(2) // => -1
 * ```
 *
 * @category combinators
 * @since 2.0.0
 */
const flip = f => (...b) => (...a) => f(...a)(...b);
/**
 * Composes two functions, `ab` and `bc` into a single function that takes in an argument `a` of type `A` and returns a result of type `C`.
 * The result is obtained by first applying the `ab` function to `a` and then applying the `bc` function to the result of `ab`.
 *
 * **When to use**
 *
 * Use to compose exactly two unary functions into a reusable unary function.
 *
 * **Example** (Composing two functions)
 *
 * ```ts import.meta.vitest
 * import { Function } from "effect"
 *
 * const increment = (n: number) => n + 1
 * const square = (n: number) => n * n
 *
 * Function.compose(increment, square)(2) // => 9
 * ```
 *
 * @see {@link flow} for composing a left-to-right sequence of functions
 * @see {@link pipe} for applying a value through a left-to-right sequence immediately
 *
 * @category combinators
 * @since 2.0.0
 */
const compose = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (ab, bc) => a => bc(ab(a)))));
/**
 * Marks an impossible branch by accepting a `never` value and returning any
 * type.
 *
 * **When to use**
 *
 * Use when you need a return value in a branch that exhaustive checks prove
 * cannot be reached.
 *
 * **Gotchas**
 *
 * Calling `absurd` throws, because a value of type `never` should be
 * impossible at runtime.
 *
 * **Example** (Handling impossible values)
 *
 * ```ts import.meta.vitest
 * import { absurd } from "effect"
 *
 * const handleNever = (value: never) => {
 *   return absurd(value) // This will throw an error if called
 * }
 * ```
 *
 * @category utility types
 * @since 2.0.0
 */
const absurd = _ => {
  throw new Error("Called `absurd` function which should be uncallable");
};
/**
 * Creates a tupled version of this function: instead of `n` arguments, it accepts a single tuple argument.
 *
 * **When to use**
 *
 * Use to adapt a multi-argument function so it accepts one tuple argument.
 *
 * **Example** (Converting arguments to a tuple)
 *
 * ```ts import.meta.vitest
 * import { Function } from "effect"
 *
 * const sumTupled = Function.tupled((x: number, y: number): number => x + y)
 *
 * sumTupled([1, 2]) // => 3
 * ```
 *
 * @see {@link untupled} for adapting a tuple-argument function back to multiple arguments
 *
 * @category combinators
 * @since 2.0.0
 */
const tupled = f => a => f(...a);
/**
 * Converts a tupled function back to an uncurried function.
 *
 * **When to use**
 *
 * Use to adapt a tuple-argument function so it accepts multiple arguments.
 *
 * **Example** (Converting a tuple to arguments)
 *
 * ```ts import.meta.vitest
 * import { Function } from "effect"
 *
 * const getFirst = Function.untupled(<A, B>(tuple: [A, B]): A => tuple[0])
 *
 * getFirst(1, 2) // => 1
 * ```
 *
 * @see {@link tupled} for adapting a multi-argument function to one tuple argument
 *
 * @category combinators
 * @since 2.0.0
 */
const untupled = f => (...a) => f(a);
function pipe(a, ...args) {
  return pipeArguments(a, args);
}
function flow(ab, bc, cd, de, ef, fg, gh, hi, ij) {
  switch (arguments.length) {
    case 1:
      return ab;
    case 2:
      return function () {
        return bc(ab.apply(this, arguments));
      };
    case 3:
      return function () {
        return cd(bc(ab.apply(this, arguments)));
      };
    case 4:
      return function () {
        return de(cd(bc(ab.apply(this, arguments))));
      };
    case 5:
      return function () {
        return ef(de(cd(bc(ab.apply(this, arguments)))));
      };
    case 6:
      return function () {
        return fg(ef(de(cd(bc(ab.apply(this, arguments))))));
      };
    case 7:
      return function () {
        return gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))));
      };
    case 8:
      return function () {
        return hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments))))))));
      };
    case 9:
      return function () {
        return ij(hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))))));
      };
  }
  return;
}
/**
 * Creates a compile-time placeholder for a value of any type.
 *
 * **When to use**
 *
 * Use as a temporary typed placeholder while developing incomplete code.
 *
 * **Gotchas**
 *
 * `hole` is intended for temporary development use. If the placeholder is
 * evaluated at runtime, it throws.
 *
 * **Example** (Creating a development placeholder)
 *
 * ```ts import.meta.vitest
 * import { hole } from "effect"
 *
 * // Intentionally not called: `hole` throws if the placeholder is evaluated.
 * const buildUser = (id: number): { readonly id: number; readonly name: string } => ({
 *   id,
 *   name: hole<string>()
 * })
 *
 * ```
 *
 * @category utility types
 * @since 2.0.0
 */
const hole = /*#__PURE__*/(/* unused pure expression or super */ null && (cast(absurd)));
/**
 * Returns the second argument and discards the first. The SK combinator is
 * a fundamental combinator in the lambda calculus and the SKI combinator
 * calculus.
 *
 * **When to use**
 *
 * Use to discard the first argument and return the second argument.
 *
 * **Example** (Discarding the first argument)
 *
 * ```ts import.meta.vitest
 * import { Function } from "effect"
 *
 * Function.SK(0, "hello") // => "hello"
 * ```
 *
 * @category combinators
 * @since 2.0.0
 */
const SK = (_, b) => b;
/**
 * Creates a memoized function whose input is an object, caching results by
 * object identity.
 *
 * **When to use**
 *
 * Use to reuse the result of a synchronous computation whose output is stable
 * for a given object reference.
 *
 * **Details**
 *
 * Each memoized wrapper owns a private `WeakMap` keyed by object identity.
 *
 * **Gotchas**
 *
 * `undefined` is reserved to represent a cache miss and is therefore not
 * supported as a return value.
 *
 * Structurally equal objects do not share cache entries. If the same object is
 * mutated after its first call, later calls still return the cached result for
 * that reference.
 *
 * @category caching
 * @since 4.0.0
 */
function memoize(f) {
  const cache = new WeakMap();
  return a => {
    const cached = cache.get(a);
    if (cached !== undefined) return cached;
    const result = f(a);
    cache.set(a, result);
    return result;
  };
}
/**
 * Creates a memoized idempotent object transformation that caches both inputs
 * and their outputs by object identity.
 *
 * **When to use**
 *
 * Use when an object transformation is idempotent and its output can be safely
 * reused as a fixed point.
 *
 * **Details**
 *
 * After computing an input, the returned function caches both the input and
 * the output. Calling it with either reference returns the output without
 * invoking the supplied function again.
 *
 * **Gotchas**
 *
 * The returned function treats each computed output as a fixed point. If
 * applying the supplied function to an output would produce an observably
 * different value, this memoization changes that behavior.
 *
 * @see {@link memoize} for memoizing functions without an idempotence requirement
 * @category caching
 * @since 4.0.0
 */
function memoizeIdempotent(f) {
  const cache = new WeakMap();
  return a => {
    const cached = cache.get(a);
    if (cached !== undefined) return cached;
    const result = f(a);
    cache.set(a, result);
    cache.set(result, result);
    return result;
  };
}
//# sourceMappingURL=Function.js.map
__webpack_require__.d(__webpack_exports__, {
}, {
  D_: identity,
  XY: dual
});


},
"./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Hash.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _Function_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Function.js");
/* import */ var _internal_equal_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/internal/equal.js");
/* import */ var _Predicate_js__rspack_import_2 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Predicate.js");
/**
 * Computes Effect hash values and defines the interface for objects that want
 * to provide their own hash implementation. Hashes are small numeric
 * fingerprints used by Effect data structures to bucket values quickly; they
 * are not cryptographic digests and they are not proof that two values are
 * equal. The module also includes helpers for primitive, structure, array, and
 * reference-based hashes, plus functions for combining and optimizing numeric
 * hash values.
 *
 * @since 2.0.0
 */



/**
 * Defines the unique identifier used to identify objects that implement the Hash interface.
 *
 * **When to use**
 *
 * Use as the computed property key for the method that supplies a custom hash
 * value on a `Hash` implementor.
 *
 * @see {@link Hash} for the interface implemented with this symbol
 * @see {@link isHash} for checking whether a value implements `Hash`
 * @see {@link hash} for computing hash values
 *
 * @category symbols
 * @since 2.0.0
 */
const symbol = "~effect/Hash";
/**
 * Computes a hash value for any given value.
 *
 * **When to use**
 *
 * Use to compute an Effect hash for primitives, collections, and hashable
 * objects.
 *
 * **Details**
 *
 * This function can hash primitives (numbers, strings, booleans, etc.) as well as
 * objects, arrays, and other complex data structures. It automatically handles
 * different types and provides a consistent hash value for equivalent inputs.
 *
 * **Gotchas**
 *
 * Objects being hashed must be treated as immutable after their first hash
 * computation. Hash results are cached, so mutating an object after hashing will
 * lead to stale cached values and broken hash-based operations. For mutable
 * objects, implement a custom `Hash` interface that hashes the object reference
 * rather than its content.
 *
 * **Example** (Hashing different values)
 *
 * ```ts import.meta.vitest
 * import { Hash } from "effect"
 *
 * Hash.hash(42) === Hash.hash(42) // => true
 * Hash.hash("hello") === Hash.hash("hello") // => true
 * Hash.hash([1, 2, 3]) === Hash.hash([1, 2, 3]) // => true
 * ```
 *
 * @category hashing
 * @since 2.0.0
 */
const hash = self => {
  switch (typeof self) {
    case "number":
      return number(self);
    case "bigint":
      return string(self.toString(10));
    case "string":
      return string(self);
    case "undefined":
      return string("undefined");
    case "function":
    case "object":
      {
        if (self === null) {
          return string("null");
        } else if (self instanceof Date) {
          if (Number.isNaN(self.getTime())) {
            return string("Invalid Date");
          }
          return string(self.toISOString());
        } else if (self instanceof RegExp) {
          return string(self.toString());
        } else {
          if (_internal_equal_js__rspack_import_0/* .byReferenceInstances.has */.J.has(self)) {
            return random(self);
          }
          if (hashCache.has(self)) {
            return hashCache.get(self);
          }
          const h = withVisitedTracking(self, () => {
            if (isHash(self)) {
              return self[symbol]();
            } else if (typeof self === "function") {
              return random(self);
            } else if (self instanceof DataView) {
              return array(new Uint8Array(self.buffer, self.byteOffset, self.byteLength));
            } else if (Array.isArray(self) || ArrayBuffer.isView(self)) {
              return array(self);
            } else if (self instanceof Map) {
              return hashMap(self);
            } else if (self instanceof Set) {
              return hashSet(self);
            }
            return structure(self);
          });
          hashCache.set(self, h);
          return h;
        }
      }
    default:
      // The remaining primitive types are boolean and symbol.
      return string(String(self));
  }
};
/**
 * Generates a random hash value for an object and caches it.
 *
 * **When to use**
 *
 * Use to hash an object by reference identity instead of structural content.
 *
 * **Details**
 *
 * This function creates a random hash value for objects that don't have their own
 * hash implementation. The hash value is cached using a WeakMap, so the same object
 * will always return the same hash value during its lifetime.
 *
 * **Example** (Hashing objects by reference)
 *
 * ```ts import.meta.vitest
 * import { Hash } from "effect"
 *
 * const obj1 = { a: 1 }
 * const obj2 = { a: 1 }
 *
 * Hash.random(obj1) === Hash.random(obj1) // => true
 *
 * typeof Hash.random(obj2) // => "number"
 * ```
 *
 * @category hashing
 * @since 2.0.0
 */
const random = self => {
  if (!randomHashCache.has(self)) {
    randomHashCache.set(self, number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)));
  }
  return randomHashCache.get(self);
};
/**
 * Combines two hash values into a single hash value.
 *
 * **When to use**
 *
 * Use to build a hash for a composite value by folding together hash values for
 * its parts.
 *
 * **Details**
 *
 * Supports both direct and pipeable usage. The implementation combines two
 * hash values with `(self * 53) ^ b`.
 *
 * **Example** (Combining hash values)
 *
 * ```ts import.meta.vitest
 * import { Hash, pipe } from "effect"
 *
 * const hash1 = Hash.hash("hello")
 * const hash2 = Hash.hash("world")
 *
 * const combined = Hash.combine(hash2)(hash1)
 * combined === pipe(hash1, Hash.combine(hash2)) // => true
 * ```
 *
 * @see {@link hash} for computing hash values from arbitrary inputs
 * @see {@link structureKeys} for hashing selected object fields without manual combination
 *
 * @category hashing
 * @since 2.0.0
 */
const combine = /*#__PURE__*/(0,_Function_js__rspack_import_1/* .dual */.XY)(2, (self, b) => self * 53 ^ b);
/**
 * Applies bit manipulation techniques to optimize a hash value.
 *
 * **When to use**
 *
 * Use to improve the bit distribution of a raw numeric hash value.
 *
 * **Details**
 *
 * This function takes a hash value and applies bitwise operations to improve
 * the distribution of hash values, reducing the likelihood of collisions.
 *
 * **Example** (Optimizing a hash value)
 *
 * ```ts import.meta.vitest
 * import { Hash } from "effect"
 *
 * Hash.optimize(1234567890) // => 160826066
 * ```
 *
 * @category hashing
 * @since 2.0.0
 */
const optimize = n => n & 0xbfffffff | n >>> 1 & 0x40000000;
/**
 * Checks whether a value implements the Hash interface.
 *
 * **When to use**
 *
 * Use to detect whether an unknown value provides a custom hash implementation.
 *
 * **Details**
 *
 * This function determines whether a given value has the Hash symbol property,
 * indicating that it can provide its own hash value implementation.
 *
 * **Example** (Checking for Hash support)
 *
 * ```ts import.meta.vitest
 * import { Hash } from "effect"
 *
 * class MyHashable implements Hash.Hash {
 *   [Hash.symbol]() {
 *     return 42
 *   }
 * }
 *
 * Hash.isHash(new MyHashable()) // => true
 * Hash.isHash({}) // => false
 * Hash.isHash("string") // => false
 * ```
 *
 * @category guards
 * @since 2.0.0
 */
const isHash = u => (0,_Predicate_js__rspack_import_2/* .hasProperty */.i5)(u, symbol);
/**
 * Computes a hash value for a number.
 *
 * **When to use**
 *
 * Use to hash a JavaScript number with Effect's numeric hash semantics.
 *
 * **Details**
 *
 * This function creates a hash value for numeric inputs, handling special cases
 * like NaN, Infinity, and -Infinity with distinct hash values. It uses bitwise operations to ensure good distribution
 * of hash values across different numeric inputs.
 *
 * **Example** (Hashing numbers)
 *
 * ```ts import.meta.vitest
 * import { Hash } from "effect"
 *
 * Number.isInteger(Hash.number(42)) // => true
 * Number.isInteger(Hash.number(3.14)) // => true
 * Hash.number(NaN) === Hash.number(NaN) // => true
 * Hash.number(Infinity) === Hash.number(Infinity) // => true
 * Hash.number(100) === Hash.number(100) // => true
 * ```
 *
 * @category hashing
 * @since 2.0.0
 */
const number = n => {
  if (n !== n || n === Infinity || n === -Infinity) {
    return string(String(n));
  }
  let h = n | 0;
  if (h !== n) {
    h ^= n * 0xffffffff;
  }
  while (n > 0xffffffff) {
    h ^= n /= 0xffffffff;
  }
  return optimize(h);
};
/**
 * Computes a hash value for a string using the djb2 algorithm.
 *
 * **When to use**
 *
 * Use when you need a string field to contribute to a custom structural hash
 * implementation.
 *
 * **Details**
 *
 * This function implements a variation of the djb2 hash algorithm, which is
 * known for its good distribution properties and speed. It processes each
 * character of the string to produce a consistent hash value.
 *
 * **Example** (Hashing strings)
 *
 * ```ts import.meta.vitest
 * import { Hash } from "effect"
 *
 * Hash.string("hello") // => 181380007
 * Hash.string("world") // => 164394279
 * Hash.string("") // => 5381
 * Hash.string("test") === Hash.string("test") // => true
 * ```
 *
 * @category hashing
 * @since 2.0.0
 */
const string = str => {
  let h = 5381,
    i = str.length;
  while (i) {
    h = h * 33 ^ str.charCodeAt(--i);
  }
  return optimize(h);
};
/**
 * Computes a hash value for an object using only the specified keys.
 *
 * **When to use**
 *
 * Use to hash an object by a selected set of property keys.
 *
 * **Details**
 *
 * This function allows you to hash an object by considering only specific keys,
 * which is useful when you want to create a hash based on a subset of an object's
 * properties.
 *
 * **Example** (Hashing selected object keys)
 *
 * ```ts import.meta.vitest
 * import { Hash } from "effect"
 *
 * const person = { name: "John", age: 30, city: "New York" }
 *
 * const hash1 = Hash.structureKeys(person, ["name", "age"])
 * const hash2 = Hash.structureKeys(person, ["name", "city"])
 *
 * hash1 // => -590673747
 * hash2 // => 284850673
 *
 * const person2 = { name: "John", age: 30, city: "Boston" }
 * const hash3 = Hash.structureKeys(person2, ["name", "age"])
 * hash1 === hash3 // => true
 * ```
 *
 * @category hashing
 * @since 2.0.0
 */
const structureKeys = (o, keys) => {
  let h = 12289;
  for (const key of keys) {
    h ^= combine(hash(key), hash(o[key]));
  }
  return optimize(h);
};
/**
 * Computes a structural hash for an object using Effect's object key collection.
 *
 * **When to use**
 *
 * Use to hash an object from all structural keys collected by Effect.
 *
 * **Details**
 *
 * The hash is based on the object's structural keys and their values, including
 * symbol keys and relevant prototype keys for non-plain objects.
 *
 * **Example** (Hashing object structures)
 *
 * ```ts import.meta.vitest
 * import { Hash } from "effect"
 *
 * const obj1 = { name: "John", age: 30 }
 * const obj2 = { name: "Jane", age: 25 }
 * const obj3 = { name: "John", age: 30 }
 *
 * Hash.structure(obj1) // => -590673747
 * Hash.structure(obj2) // => -590160631
 * Hash.structure(obj3) // => -590673747
 * Hash.structure(obj1) === Hash.structure(obj3) // => true
 * ```
 *
 * @category hashing
 * @since 2.0.0
 */
const structure = o => structureKeys(o, (0,_internal_equal_js__rspack_import_0/* .getAllObjectKeys */.X)(o));
const iterableWith = (seed, f) => iter => {
  let h = seed;
  for (const element of iter) {
    h ^= f(element);
  }
  return optimize(h);
};
/**
 * Computes a hash value for an iterable by hashing all of its elements.
 *
 * **When to use**
 *
 * Use to hash the values yielded by an iterable with Effect hash semantics.
 *
 * **Details**
 *
 * The implementation folds element hashes from the seed `6151` with XOR and
 * then optimizes the final hash.
 *
 * **Gotchas**
 *
 * A hash is not an equality proof. Because this implementation uses XOR,
 * reordered inputs can produce the same hash.
 *
 * **Example** (Hashing arrays)
 *
 * ```ts import.meta.vitest
 * import { Hash } from "effect"
 *
 * const arr1 = [1, 2, 3]
 * const arr2 = [1, 2, 3]
 * const arr3 = [3, 2, 1]
 *
 * Hash.array(arr1) // => 6151
 * Hash.array(arr2) // => 6151
 * Hash.array(arr3) // => 6151
 * Hash.array(arr1) === Hash.array(arr2) // => true
 * Hash.array(arr1) === Hash.array(arr3) // => true
 * ```
 *
 * @see {@link hash} for the general-purpose hash dispatcher
 *
 * @category hashing
 * @since 2.0.0
 */
const array = /*#__PURE__*/iterableWith(6151, hash);
const hashMap = /*#__PURE__*/iterableWith(/*#__PURE__*/string("Map"), ([k, v]) => combine(hash(k), hash(v)));
const hashSet = /*#__PURE__*/iterableWith(/*#__PURE__*/string("Set"), hash);
const randomHashCache = /*#__PURE__*/new WeakMap();
const hashCache = /*#__PURE__*/new WeakMap();
const visitedObjects = /*#__PURE__*/new WeakSet();
function withVisitedTracking(obj, fn) {
  if (visitedObjects.has(obj)) {
    return string("[Circular]");
  }
  visitedObjects.add(obj);
  const result = fn();
  visitedObjects.delete(obj);
  return result;
}
//# sourceMappingURL=Hash.js.map
__webpack_require__.d(__webpack_exports__, {
}, {
  HR: symbol,
  YO: array,
  Yj: string,
  ai: number,
  kg: combine,
  tW: hash,
  uN: structureKeys
});


},
"./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Inspectable.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/**
 * Controls how values appear in logs and debugging output.
 *
 * Effect data types use `Inspectable` to provide stable string, JSON, and
 * Node.js inspection output. This keeps custom values readable in logs, REPLs,
 * test failures, and diagnostics. This module defines the Node inspect symbol,
 * the `Inspectable` interface, safe conversion helpers, and shared prototype or
 * class implementations for custom values.
 *
 * @since 2.0.0
 */



/**
 * Defines the symbol used by Node.js for custom object inspection.
 *
 * **When to use**
 *
 * Use to implement Node.js custom inspection for a value.
 *
 * **Details**
 *
 * This symbol is recognized by Node.js's `util.inspect()` function and the REPL
 * for custom object representation. When an object has a method with this symbol,
 * it will be called to determine how the object should be displayed.
 *
 * **Example** (Defining custom Node inspection)
 *
 * ```ts import.meta.vitest
 * import { Inspectable } from "effect"
 *
 * class CustomObject {
 *   constructor(private value: string) {}
 *
 *   [Inspectable.NodeInspectSymbol]() {
 *     return `CustomObject(${this.value})`
 *   }
 * }
 *
 * const obj = new CustomObject("hello")
 * obj[Inspectable.NodeInspectSymbol]() // => "CustomObject(hello)"
 * ```
 *
 * @category symbols
 * @since 2.0.0
 */
const NodeInspectSymbol = /*#__PURE__*/Symbol.for("nodejs.util.inspect.custom");
/**
 * Converts a value to its structured inspection representation.
 *
 * **When to use**
 *
 * Use when you need the structured representation of an inspectable value
 * without risking unhandled errors.
 *
 * **Details**
 *
 * This function applies redaction before extracting data from objects that
 * implement `toJSON`, recursively processes arrays, and handles errors
 * gracefully. Plain objects are returned unchanged, so the result is not
 * guaranteed to be accepted by `JSON.stringify`; it may still contain values
 * such as `BigInt`, functions, or circular references.
 *
 * @see {@link toStringUnknown} for converting unknown values to strings
 *
 * @category converting
 * @since 4.0.0
 */
const toJson = input => {
  try {
    input = redact(input);
    if (Predicate.hasProperty(input, "toJSON") && Predicate.isFunction(input["toJSON"]) && input["toJSON"].length === 0) {
      return input.toJSON();
    } else if (Array.isArray(input)) {
      return input.map(toJson);
    }
    return input;
  } catch {
    return "[toJSON threw]";
  }
};
/**
 * Converts an unknown value to a string for diagnostics.
 *
 * **When to use**
 *
 * Use to produce a diagnostic string from a value whose runtime type is unknown.
 *
 * **Details**
 *
 * Strings are returned unchanged. Objects are formatted as JSON using the
 * provided whitespace setting when possible, and values that cannot be
 * formatted are converted with `String`.
 *
 * @category converting
 * @since 2.0.0
 */
const toStringUnknown = (u, whitespace = 2) => {
  if (typeof u === "string") {
    return u;
  }
  try {
    return typeof u === "object" ? formatJson(u, {
      space: whitespace
    }) : format(u, {
      space: whitespace
    });
  } catch {
    return String(u);
  }
};
/**
 * A base prototype object that implements the {@link Inspectable} interface.
 *
 * **When to use**
 *
 * Use as a prototype for plain objects that should share standard inspectable behavior.
 *
 * **Details**
 *
 * This object provides default implementations for the {@link Inspectable} methods.
 * It can be used as a prototype for objects that want to be inspectable,
 * or as a mixin to add inspection capabilities to existing objects.
 *
 * **Example** (Using the base inspectable prototype)
 *
 * ```ts import.meta.vitest
 * import { Inspectable } from "effect"
 *
 * // Use as prototype
 * const myObject = Object.create(Inspectable.BaseProto)
 * myObject.name = "example"
 * myObject.value = 42
 *
 * myObject.toString() // => "\"[toJSON threw]\""
 *
 * // Or extend in a constructor
 * function MyClass(this: any, name: string) {
 *   this.name = name
 * }
 * MyClass.prototype = Object.create(Inspectable.BaseProto)
 * MyClass.prototype.constructor = MyClass
 * ```
 *
 * @category prototypes
 * @since 2.0.0
 */
const BaseProto = (/* unused pure expression or super */ null && ({
  toJSON() {
    return toJson(this);
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  toString() {
    return format(this.toJSON());
  }
}));
/**
 * Provides an abstract base class that implements the Inspectable interface.
 *
 * **When to use**
 *
 * Use as a base class for inspectable objects that define their own JSON representation.
 *
 * **Details**
 *
 * This class provides a convenient way to create inspectable objects by extending it.
 * Subclasses only need to implement the `toJSON()` method, and they automatically
 * get proper `toString()` and Node.js inspection support.
 *
 * **Example** (Extending the inspectable base class)
 *
 * ```ts import.meta.vitest
 * import { Inspectable } from "effect"
 *
 * class User extends Inspectable.Class {
 *   constructor(
 *     public readonly id: number,
 *     public readonly name: string,
 *     public readonly email: string
 *   ) {
 *     super()
 *   }
 *
 *   toJSON() {
 *     return {
 *       _tag: "User",
 *       id: this.id,
 *       name: this.name,
 *       email: this.email
 *     }
 *   }
 * }
 *
 * const user = new User(1, "Alice", "alice@example.com")
 * user.toString() // => "{\"_tag\":\"User\",\"id\":1,\"name\":\"Alice\",\"email\":\"alice@example.com\"}"
 * user[Inspectable.NodeInspectSymbol]() // => { _tag: "User", id: 1, name: "Alice", email: "alice@example.com" }
 * ```
 *
 * @category models
 * @since 2.0.0
 */
class Class {
  /**
   * Node.js custom inspection method.
   *
   * **When to use**
   *
   * Use to expose the class JSON representation to Node.js inspection.
   *
   * @since 2.0.0
   */
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  /**
   * Returns a formatted string representation of this object.
   *
   * **When to use**
   *
   * Use to format the class JSON representation as a string.
   *
   * @since 2.0.0
   */
  toString() {
    return format(this.toJSON());
  }
}
//# sourceMappingURL=Inspectable.js.map
__webpack_require__.d(__webpack_exports__, {
}, {
  FX: NodeInspectSymbol
});


},
"./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Pipeable.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/**
 * The `Pipeable` module defines the shared interface and implementation helpers
 * for values that support Effect-style method chaining with `.pipe(...)`.
 *
 * A `Pipeable` value can pass itself through a sequence of unary functions from
 * left to right, so code can be written as `value.pipe(f, g, h)` instead of
 * deeply nesting calls. This is the method form used by many Effect data types
 * to compose transformations, validations, and effectful operations while
 * keeping the original value as the starting point of the pipeline.
 *
 * @since 2.0.0
 */
/**
 * Applies a `pipe` method's variadic arguments to an initial value from left
 * to right.
 *
 * **When to use**
 *
 * Use to implement a custom `.pipe(...)` method from JavaScript's `arguments`
 * object.
 *
 * **Details**
 *
 * This helper is intended for implementing `Pipeable.pipe` methods that
 * receive JavaScript's `arguments` object. With no functions it returns the
 * original value; otherwise it feeds each result into the next function.
 *
 * **Example** (Implementing a pipe method)
 *
 * ```ts import.meta.vitest
 * import { Pipeable } from "effect"
 *
 * class NumberBox {
 *   constructor(readonly value: number) {}
 *
 *   pipe(..._fns: ReadonlyArray<(value: number) => number>): number {
 *     return Pipeable.pipeArguments(this.value, arguments) as number
 *   }
 * }
 *
 * const result = new NumberBox(5).pipe(
 *   (n) => n + 2,
 *   (n) => n * 3
 * )
 * result // => 21
 * ```
 *
 * @category combinators
 * @since 2.0.0
 */
const pipeArguments = (self, args) => {
  switch (args.length) {
    case 0:
      return self;
    case 1:
      return args[0](self);
    case 2:
      return args[1](args[0](self));
    case 3:
      return args[2](args[1](args[0](self)));
    case 4:
      return args[3](args[2](args[1](args[0](self))));
    case 5:
      return args[4](args[3](args[2](args[1](args[0](self)))));
    case 6:
      return args[5](args[4](args[3](args[2](args[1](args[0](self))))));
    case 7:
      return args[6](args[5](args[4](args[3](args[2](args[1](args[0](self)))))));
    case 8:
      return args[7](args[6](args[5](args[4](args[3](args[2](args[1](args[0](self))))))));
    case 9:
      return args[8](args[7](args[6](args[5](args[4](args[3](args[2](args[1](args[0](self)))))))));
    default:
      {
        let ret = self;
        for (let i = 0, len = args.length; i < len; i++) {
          ret = args[i](ret);
        }
        return ret;
      }
  }
};
/**
 * Reusable prototype that implements `Pipeable.pipe`.
 *
 * **When to use**
 *
 * Use when classes or object prototypes can reuse this value when they need the
 * standard pipe implementation backed by `pipeArguments`.
 *
 * @category prototypes
 * @since 3.15.0
 */
const Prototype = (/* unused pure expression or super */ null && ({
  pipe() {
    return pipeArguments(this, arguments);
  }
}));
/**
 * Provides a base constructor whose instances implement the standard `Pipeable.pipe`
 * method.
 *
 * **When to use**
 *
 * Use when you need to define a class that supports Effect-style method
 * chaining through `.pipe(...)`.
 *
 * @category constructors
 * @since 3.15.0
 */
const Class = /*#__PURE__*/(/* unused pure expression or super */ null && (function () {
  function PipeableBase() {}
  PipeableBase.prototype = Prototype;
  return PipeableBase;
}()));
/**
 * Returns a subclass of the provided class that adds the standard `pipe`
 * method.
 *
 * **When to use**
 *
 * Use to add pipe support to an existing class without extending a base class
 * or modifying its prototype.
 *
 * **Details**
 *
 * The original constructor and instance members are preserved, and the added
 * method delegates to `pipeArguments`.
 *
 * @see {@link Prototype} for a reusable prototype object
 * @see {@link Class} for a base constructor to extend
 * @category constructors
 * @since 4.0.0
 */
const Mixin = klass => class extends klass {
  pipe() {
    return pipeArguments(this, arguments);
  }
};
//# sourceMappingURL=Pipeable.js.map
__webpack_require__.d(__webpack_exports__, {
}, {
  tT: pipeArguments
});


},
"./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Predicate.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _Function_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Function.js");
/**
 * Defines runtime checks for values.
 *
 * A `Predicate<A>` returns `true` or `false` for an `A`. A
 * `Refinement<A, B>` is a predicate that also narrows the TypeScript type when
 * it succeeds. This module includes guards for common JavaScript values,
 * property and tag checks, tuple and struct checks, boolean combinators, and
 * helpers for composing predicates and refinements.
 *
 * @since 2.0.0
 */

/**
 * Transforms the input of a predicate using a mapping function.
 *
 * **When to use**
 *
 * Use when you have a predicate on `A` and want to check `B` values by mapping
 * each `B` to an `A`, such as checking lengths or projections.
 *
 * **Details**
 *
 * Returns a new predicate that applies `f` before `self`. There is no
 * additional short-circuiting beyond what `self` does.
 *
 * **Example** (Checking string length)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const isLongerThan2 = Predicate.mapInput((s: string) => s.length)(
 *   (n: number) => n > 2
 * )
 *
 * isLongerThan2("hello") // => true
 * ```
 *
 * @see {@link Predicate}
 * @see {@link and}
 * @see {@link not}
 * @category combinators
 * @since 2.0.0
 */
const mapInput = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (self, f) => b => self(f(b)))));
/**
 * Checks whether a readonly array has exactly `n` elements.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard for exact tuple length that narrows
 * `ReadonlyArray<T>` to `TupleOf<N, T>`.
 *
 * **Details**
 *
 * This only checks length, not element types, and returns a refinement on the
 * array type.
 *
 * **Example** (Checking exact length)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const isPair = Predicate.isTupleOf(2)
 *
 * isPair([1, 2]) // => true
 * ```
 *
 * @see {@link isTupleOfAtLeast}
 * @see {@link Tuple}
 * @category guards
 * @since 3.3.0
 */
const isTupleOf = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (self, n) => self.length === n)));
/**
 * Checks whether a readonly array has at least `n` elements.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard for tuple-like minimum length that
 * narrows `ReadonlyArray<T>` to `TupleOfAtLeast<N, T>`.
 *
 * **Details**
 *
 * This only checks length, not element types, and returns a refinement on the
 * array type.
 *
 * **Example** (Checking minimum length)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const hasAtLeast2 = Predicate.isTupleOfAtLeast(2)
 *
 * hasAtLeast2([1, 2, 3]) // => true
 * ```
 *
 * @see {@link isTupleOf}
 * @see {@link Tuple}
 * @category guards
 * @since 3.3.0
 */
const isTupleOfAtLeast = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (self, n) => self.length >= n)));
/**
 * Checks whether a value is truthy.
 *
 * **When to use**
 *
 * Use when you want a predicate that mirrors JavaScript truthiness and filters
 * out falsy values like `0`, `""`, and `false`.
 *
 * **Details**
 *
 * This uses `!!input` and treats `0`, `""`, `false`, `null`, and `undefined`
 * as false.
 *
 * **Example** (Filtering truthy values)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const values = [0, 1, "", "ok", false]
 * const truthy = values.filter(Predicate.isTruthy) // => [1, "ok"]
 * ```
 *
 * @see {@link isNullish}
 * @see {@link isNotNullish}
 * @category predicates
 * @since 2.0.0
 */
function isTruthy(input) {
  return !!input;
}
/**
 * Checks whether a value is a `Set`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` runtime guard for `Set` values.
 *
 * **Details**
 *
 * Uses `instanceof Set`.
 *
 * **Example** (Guarding a Set)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = new Set([1, 2])
 *
 * if (Predicate.isSet(data)) {
 *   data.size // => 2
 * }
 * ```
 *
 * @see {@link isMap}
 * @see {@link isIterable}
 * @category guards
 * @since 2.0.0
 */
function isSet(input) {
  return input instanceof Set;
}
/**
 * Checks whether a value is a `Map`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` runtime guard for `Map` values.
 *
 * **Details**
 *
 * Uses `instanceof Map`.
 *
 * **Example** (Guarding a Map)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = new Map([["a", 1]])
 *
 * if (Predicate.isMap(data)) {
 *   data.size // => 1
 * }
 * ```
 *
 * @see {@link isSet}
 * @see {@link isIterable}
 * @category guards
 * @since 2.0.0
 */
function isMap(input) {
  return input instanceof Map;
}
/**
 * Checks whether a value is a `string`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard to narrow an `unknown` value to a
 * string.
 *
 * **Details**
 *
 * Uses `typeof input === "string"`.
 *
 * **Example** (Guarding strings)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = "hi"
 *
 * if (Predicate.isString(data)) {
 *   data.toUpperCase() // => "HI"
 * }
 * ```
 *
 * @see {@link isNumber}
 * @see {@link isBoolean}
 * @see {@link Refinement}
 * @category guards
 * @since 2.0.0
 */
function isString(input) {
  return typeof input === "string";
}
/**
 * Checks whether a value is a `number`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard to narrow an `unknown` value to a
 * number.
 *
 * **Details**
 *
 * Uses `typeof input === "number"` and does not exclude `NaN` or `Infinity`.
 *
 * **Example** (Guarding numbers)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = 42
 *
 * if (Predicate.isNumber(data)) {
 *   data + 1 // => 43
 * }
 * ```
 *
 * @see {@link isBigInt}
 * @see {@link isString}
 * @category guards
 * @since 2.0.0
 */
function isNumber(input) {
  return typeof input === "number";
}
/**
 * Checks whether a value is a `boolean`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard to narrow an `unknown` value to a
 * boolean.
 *
 * **Details**
 *
 * Uses `typeof input === "boolean"`.
 *
 * **Example** (Guarding booleans)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = true
 *
 * if (Predicate.isBoolean(data)) {
 *   data ? "yes" : "no" // => "yes"
 * }
 * ```
 *
 * @see {@link isString}
 * @see {@link isNumber}
 * @category guards
 * @since 2.0.0
 */
function isBoolean(input) {
  return typeof input === "boolean";
}
/**
 * Checks whether a value is a `bigint`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard to narrow an `unknown` value to a
 * bigint.
 *
 * **Details**
 *
 * Uses `typeof input === "bigint"`.
 *
 * **Example** (Guarding bigints)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = 1n
 *
 * if (Predicate.isBigInt(data)) {
 *   data + 2n // => 3n
 * }
 * ```
 *
 * @see {@link isNumber}
 * @category guards
 * @since 2.0.0
 */
function isBigInt(input) {
  return typeof input === "bigint";
}
/**
 * Checks whether a value is a `symbol`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard to narrow an `unknown` value to a
 * symbol.
 *
 * **Details**
 *
 * Uses `typeof input === "symbol"`.
 *
 * **Example** (Guarding symbols)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = Symbol.for("id")
 *
 * if (Predicate.isSymbol(data)) {
 *   data.description // => "id"
 * }
 * ```
 *
 * @see {@link isPropertyKey}
 * @category guards
 * @since 2.0.0
 */
function isSymbol(input) {
  return typeof input === "symbol";
}
/**
 * Checks whether a value is a valid `PropertyKey` (string, number, or symbol).
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard for unknown property keys before
 * indexing.
 *
 * **Details**
 *
 * Uses `isString`, `isNumber`, and `isSymbol`.
 *
 * **Example** (Guarding property keys)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const key: unknown = "name"
 * const obj: Record<PropertyKey, unknown> = { name: "Ada" }
 *
 * if (Predicate.isPropertyKey(key) && key in obj) {
 *   obj[key] // => "Ada"
 * }
 * ```
 *
 * @see {@link isString}
 * @see {@link isNumber}
 * @see {@link isSymbol}
 * @category guards
 * @since 4.0.0
 */
function isPropertyKey(u) {
  return isString(u) || isNumber(u) || isSymbol(u);
}
/**
 * Checks whether a value is a `function`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard to narrow an `unknown` value to a
 * callable function.
 *
 * **Details**
 *
 * Uses `typeof input === "function"`.
 *
 * **Example** (Guarding functions)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = () => 1
 *
 * if (Predicate.isFunction(data)) {
 *   data() // => 1
 * }
 * ```
 *
 * @see {@link isObjectKeyword}
 * @category guards
 * @since 2.0.0
 */
function isFunction(input) {
  return typeof input === "function";
}
/**
 * Checks whether a value is `undefined`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard for values that are exactly
 * `undefined`.
 *
 * **Details**
 *
 * Uses `input === undefined`.
 *
 * **Example** (Guarding undefined values)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = undefined
 *
 * Predicate.isUndefined(data) // => true
 * ```
 *
 * @see {@link isNotUndefined}
 * @see {@link isNullish}
 * @category guards
 * @since 2.0.0
 */
function isUndefined(input) {
  return input === undefined;
}
/**
 * Checks whether a value is not `undefined`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` refinement that filters out `undefined`
 * while preserving other falsy values.
 *
 * **Details**
 *
 * Returns a refinement that excludes `undefined`.
 *
 * **Example** (Filtering undefined values)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const values = [1, undefined, 2]
 * const defined = values.filter(Predicate.isNotUndefined) // => [1, 2]
 * ```
 *
 * @see {@link isUndefined}
 * @see {@link isNotNullish}
 * @category guards
 * @since 2.0.0
 */
function isNotUndefined(input) {
  return input !== undefined;
}
/**
 * Checks whether a value is `null`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard for nullable values.
 *
 * **Details**
 *
 * Uses `input === null`.
 *
 * **Example** (Guarding null values)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = null
 *
 * Predicate.isNull(data) // => true
 * ```
 *
 * @see {@link isNotNull}
 * @see {@link isNullish}
 * @category guards
 * @since 2.0.0
 */
function isNull(input) {
  return input === null;
}
/**
 * Checks whether a value is not `null`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` refinement that filters out `null` while
 * preserving other falsy values.
 *
 * **Details**
 *
 * Returns a refinement that excludes `null`.
 *
 * **Example** (Filtering null values)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const values = [1, null, 2]
 * const nonNull = values.filter(Predicate.isNotNull) // => [1, 2]
 * ```
 *
 * @see {@link isNull}
 * @see {@link isNotNullish}
 * @category guards
 * @since 2.0.0
 */
function isNotNull(input) {
  return input !== null;
}
/**
 * Checks whether a value is `null` or `undefined`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard for nullish values.
 *
 * **Details**
 *
 * Uses `input === null || input === undefined`.
 *
 * **Example** (Guarding nullish values)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const values = [0, null, "", undefined]
 * const nullish = values.filter(Predicate.isNullish) // => [null, undefined]
 * ```
 *
 * @see {@link isNotNullish}
 * @see {@link isUndefined}
 * @see {@link isNull}
 * @category guards
 * @since 4.0.0
 */
function isNullish(input) {
  return input === null || input === undefined;
}
/**
 * Checks whether a value is not `null` and not `undefined`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` refinement that filters out nullish values
 * but keeps other falsy ones.
 *
 * **Details**
 *
 * Uses `input != null`.
 *
 * **Example** (Filtering non-nullish values)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const values = [0, null, "", undefined]
 * const present = values.filter(Predicate.isNotNullish) // => [0, ""]
 * ```
 *
 * @see {@link isNullish}
 * @see {@link isNotNull}
 * @see {@link isNotUndefined}
 * @category guards
 * @since 4.0.0
 */
function isNotNullish(input) {
  return input != null;
}
/**
 * Type guard that always returns `false`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` that never accepts, e.g. in default branches.
 *
 * **Example** (Matching no values)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * Predicate.isNever("anything") // => false
 * ```
 *
 * @see {@link isUnknown}
 * @category guards
 * @since 2.0.0
 */
function isNever(_) {
  return false;
}
/**
 * Type guard that always returns `true`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` that always accepts, e.g. as a placeholder.
 *
 * **Example** (Matching every value)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * Predicate.isUnknown(123) // => true
 * ```
 *
 * @see {@link isNever}
 * @category guards
 * @since 2.0.0
 */
function isUnknown(_) {
  return true;
}
/**
 * Checks whether a value is an object or an array (non-null object).
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard that accepts plain objects and arrays,
 * but not `null`.
 *
 * **Details**
 *
 * Uses `typeof input === "object" && input !== null` and includes arrays.
 *
 * **Example** (Checking objects or arrays)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * Predicate.isObjectOrArray([]) // => true
 * ```
 *
 * @see {@link isObject}
 * @see {@link isObjectKeyword}
 * @category guards
 * @since 4.0.0
 */
function isObjectOrArray(input) {
  return typeof input === "object" && input !== null;
}
/**
 * Checks whether a value is a non-null object value that is not an array.
 *
 * **When to use**
 *
 * Use to narrow unknown input to a non-null, non-array object with a
 * `Predicate` guard.
 *
 * **Details**
 *
 * This is a structural runtime check using `typeof input === "object"`, so it
 * also accepts object instances such as `Date`, `Map`, class instances, and
 * typed arrays. It excludes `null` and arrays.
 *
 * **Example** (Guarding objects)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * Predicate.isObject({ a: 1 }) // => true
 * Predicate.isObject([1, 2]) // => false
 * ```
 *
 * @see {@link isObjectOrArray}
 * @see {@link isReadonlyObject}
 * @category guards
 * @since 2.0.0
 */
function isObject(input) {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
/**
 * Checks whether a value is a non-null, non-array object and narrows it to a
 * readonly indexable object type.
 *
 * **When to use**
 *
 * Use to narrow unknown input to a readonly view of a non-null, non-array
 * object with a `Predicate` guard.
 *
 * **Details**
 *
 * Readonly-ness is a TypeScript type-level view; it is not observable at
 * runtime. This delegates to `isObject`, so class instances and built-in object
 * instances are accepted.
 *
 * **Example** (Checking readonly objects)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = { a: 1 }
 *
 * Predicate.isReadonlyObject(data) // => true
 * ```
 *
 * @see {@link isObject}
 * @category guards
 * @since 4.0.0
 */
function isReadonlyObject(input) {
  return isObject(input);
}
/**
 * Checks whether a value is an `object` in the JavaScript sense (objects, arrays, functions).
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard that accepts arrays and functions as
 * well as objects.
 *
 * **Details**
 *
 * Returns `true` for arrays and functions, and `false` for `null`.
 *
 * **Example** (Checking object keywords)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * Predicate.isObjectKeyword(() => 1) // => true
 * Predicate.isObjectKeyword(null) // => false
 * ```
 *
 * @see {@link isObject}
 * @see {@link isObjectOrArray}
 * @category guards
 * @since 4.0.0
 */
function isObjectKeyword(input) {
  return typeof input === "object" && input !== null || isFunction(input);
}
/**
 * Checks whether a value has a given property key.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard for property access on `unknown`
 * values with a simple structural object check.
 *
 * **Details**
 *
 * Uses the `in` operator and `isObjectKeyword`. This does not check property
 * value types.
 *
 * **Example** (Guarding object properties)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const hasName = Predicate.hasProperty("name")
 * const data: unknown = { name: "Ada" }
 *
 * if (hasName(data)) {
 *   data.name // => "Ada"
 * }
 * ```
 *
 * @see {@link isTagged}
 * @see {@link isObjectKeyword}
 * @category guards
 * @since 2.0.0
 */
const hasProperty = /*#__PURE__*/(0,_Function_js__rspack_import_0/* .dual */.XY)(2, (self, property) => isObjectKeyword(self) && property in self);
/**
 * Checks whether a value has a `_tag` property equal to the given tag.
 *
 * **When to use**
 *
 * Use when you model tagged unions with a `_tag` field and want a quick
 * `Predicate` guard for tagged values.
 *
 * **Details**
 *
 * Uses `hasProperty` and strict equality on `_tag`.
 *
 * **Example** (Guarding tagged values)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const isOk = Predicate.isTagged("Ok")
 *
 * isOk({ _tag: "Ok", value: 1 }) // => true
 * ```
 *
 * @see {@link hasProperty}
 * @category guards
 * @since 2.0.0
 */
const isTagged = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (self, tag) => hasProperty(self, "_tag") && self["_tag"] === tag)));
/**
 * Checks whether a value is an `Error`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard for errors caught from unknown sources.
 *
 * **Details**
 *
 * Uses `instanceof Error`.
 *
 * **Example** (Guarding errors)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = new Error("boom")
 *
 * Predicate.isError(data) // => true
 * ```
 *
 * @see {@link isUnknown}
 * @category guards
 * @since 2.0.0
 */
function isError(input) {
  return input instanceof Error;
}
/**
 * Checks whether a value is a `Uint8Array`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` runtime guard for binary data.
 *
 * **Details**
 *
 * Uses `instanceof Uint8Array`.
 *
 * **Example** (Guarding Uint8Array values)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = new Uint8Array([1, 2])
 *
 * Predicate.isUint8Array(data) // => true
 * ```
 *
 * @see {@link isIterable}
 * @see {@link isSet}
 * @category guards
 * @since 2.0.0
 */
function isUint8Array(input) {
  return input instanceof Uint8Array;
}
/**
 * Checks whether a value is a `Date`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` runtime guard for dates.
 *
 * **Details**
 *
 * Uses `instanceof Date`.
 *
 * **Example** (Guarding Date values)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = new Date()
 *
 * Predicate.isDate(data) // => true
 * ```
 *
 * @see {@link isRegExp}
 * @category guards
 * @since 2.0.0
 */
function isDate(input) {
  return input instanceof Date;
}
/**
 * Checks whether a value is iterable.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard before iterating an unknown value.
 *
 * **Details**
 *
 * Accepts strings as iterable and uses `hasProperty` for `Symbol.iterator`.
 *
 * **Example** (Guarding iterables)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = [1, 2, 3]
 *
 * Predicate.isIterable(data) // => true
 * ```
 *
 * @see {@link isSet}
 * @see {@link isMap}
 * @category guards
 * @since 2.0.0
 */
function isIterable(input) {
  return hasProperty(input, Symbol.iterator) || isString(input);
}
/**
 * Checks whether a value is a `Promise`-like object with `then` and `catch`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard for promise instances across realms.
 *
 * **Details**
 *
 * Performs a structural check for `then` and `catch` functions.
 *
 * **Example** (Guarding promises)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = Promise.resolve(1)
 *
 * Predicate.isPromise(data) // => true
 * ```
 *
 * @see {@link isPromiseLike}
 * @category guards
 * @since 2.0.0
 */
function isPromise(input) {
  return hasProperty(input, "then") && "catch" in input && isFunction(input.then) && isFunction(input.catch);
}
/**
 * Checks whether a value is `PromiseLike` (has a `then` method).
 *
 * **When to use**
 *
 * Use when you need a `Predicate` guard for promise-like values with a
 * callable `then` method.
 *
 * **Details**
 *
 * Performs a structural check for a callable `then`.
 *
 * **Example** (Guarding promise-like values)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = { then: () => {} }
 *
 * Predicate.isPromiseLike(data) // => true
 * ```
 *
 * @see {@link isPromise}
 * @category guards
 * @since 2.0.0
 */
function isPromiseLike(input) {
  return hasProperty(input, "then") && isFunction(input.then);
}
/**
 * Checks whether a value is a `RegExp`.
 *
 * **When to use**
 *
 * Use when you need a `Predicate` runtime guard for regular expressions.
 *
 * **Details**
 *
 * Uses `instanceof RegExp`.
 *
 * **Example** (Guarding RegExp values)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const data: unknown = /abc/
 *
 * Predicate.isRegExp(data) // => true
 * ```
 *
 * @see {@link isDate}
 * @category guards
 * @since 3.9.0
 */
function isRegExp(input) {
  return input instanceof RegExp;
}
/**
 * Composes two predicates or refinements into one.
 *
 * **When to use**
 *
 * Use when you want to compose two `Predicate` checks in sequence, especially
 * when chaining refinements for progressive narrowing.
 *
 * **Details**
 *
 * For refinements, the output type is narrowed by both checks. Evaluation
 * short-circuits on the first `false`.
 *
 * **Example** (Composing refinements)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const isNumber: Predicate.Refinement<unknown, number> = (u): u is number => typeof u === "number"
 * const isInteger: Predicate.Refinement<number, number> = (n): n is number => Number.isInteger(n)
 *
 * const isIntegerNumber = Predicate.compose(isNumber, isInteger)
 *
 * isIntegerNumber(1) // => true
 * ```
 *
 * @see {@link and}
 * @see {@link Refinement}
 * @category combinators
 * @since 2.0.0
 */
const compose = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (ab, bc) => a => ab(a) && bc(a))));
/**
 * Creates a predicate for tuples by applying predicates to each element.
 *
 * **When to use**
 *
 * Use when you want to validate tuple positions independently by lifting
 * element predicates into a tuple predicate.
 *
 * **Details**
 *
 * Returns a refinement if any element predicate is a refinement. Evaluation
 * stops at the first failing element.
 *
 * **Example** (Checking tuples)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const tupleCheck = Predicate.Tuple([(n: number) => n > 0, Predicate.isString])
 *
 * tupleCheck([1, "ok"]) // => true
 * ```
 *
 * @see {@link Struct}
 * @see {@link isTupleOf}
 * @category combinators
 * @since 4.0.0
 */
function Tuple(elements) {
  return as => {
    for (let i = 0; i < elements.length; i++) {
      if (elements[i](as[i]) === false) {
        return false;
      }
    }
    return true;
  };
}
/**
 * Creates a predicate for objects by applying predicates to named properties.
 *
 * **When to use**
 *
 * Use when you want to validate a record shape at runtime by lifting property
 * predicates into an object predicate.
 *
 * **Details**
 *
 * Returns a refinement if any field predicate is a refinement. Only the
 * specified keys are checked, and extra keys are ignored.
 *
 * **Example** (Checking structs)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const userCheck = Predicate.Struct({
 *   id: Predicate.isNumber,
 *   name: Predicate.isString
 * })
 *
 * userCheck({ id: 1, name: "Ada" }) // => true
 * ```
 *
 * @see {@link Tuple}
 * @see {@link hasProperty}
 * @category combinators
 * @since 4.0.0
 */
function Struct(fields) {
  const keys = Object.keys(fields);
  return a => {
    for (const key of keys) {
      if (!fields[key](a[key])) {
        return false;
      }
    }
    return true;
  };
}
/**
 * Negates a predicate.
 *
 * **When to use**
 *
 * Use when you want the inverse of an existing predicate.
 *
 * **Details**
 *
 * Returns a new predicate that flips the boolean result.
 *
 * **Example** (Negating a predicate)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const isNotString = Predicate.not(Predicate.isString)
 *
 * isNotString(1) // => true
 * ```
 *
 * @see {@link and}
 * @see {@link or}
 * @see {@link xor}
 * @category combinators
 * @since 2.0.0
 */
function not(self) {
  return a => !self(a);
}
/**
 * Creates a predicate that returns `true` if either predicate is `true`.
 *
 * **When to use**
 *
 * Use when you want to combine `Predicate`s with OR, accepting values that
 * satisfy at least one condition, including refinements that narrow to a union.
 *
 * **Details**
 *
 * Evaluation short-circuits on the first `true`. For refinements, the output
 * type is a union.
 *
 * **Example** (Checking either condition)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const isStringOrNumber = Predicate.or(Predicate.isString, Predicate.isNumber)
 *
 * isStringOrNumber("a") // => true
 * ```
 *
 * @see {@link and}
 * @see {@link xor}
 * @category combinators
 * @since 2.0.0
 */
const or = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (self, that) => a => self(a) || that(a))));
/**
 * Creates a predicate that returns `true` only if both predicates are `true`.
 *
 * **When to use**
 *
 * Use when you want to combine `Predicate`s with AND, accepting values that
 * satisfy multiple conditions, including refinements that narrow to an
 * intersection.
 *
 * **Details**
 *
 * Evaluation short-circuits on the first `false`. For refinements, the output
 * type is an intersection.
 *
 * **Example** (Checking both conditions)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const hasAAndB = Predicate.and(
 *   Predicate.hasProperty("a"),
 *   Predicate.hasProperty("b")
 * )
 *
 * const input: unknown = JSON.parse(`{"a":1,"b":"ok"}`)
 * if (hasAAndB(input)) {
 *   // input has both properties at this point
 *   const a = input.a
 *   const b = input.b
 *
 *   const values = [a, b] // => [1, "ok"]
 * }
 * ```
 *
 * @see {@link or}
 * @see {@link not}
 * @category combinators
 * @since 2.0.0
 */
const and = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (self, that) => a => self(a) && that(a))));
/**
 * Creates a predicate that returns `true` if exactly one predicate is `true`.
 *
 * **When to use**
 *
 * Use when you want to combine two `Predicate`s with exclusive-or semantics.
 *
 * **Details**
 *
 * Returns `true` when results differ.
 *
 * **Example** (Checking exclusive-or conditions)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const isEven = (n: number) => n % 2 === 0
 * const isPositive = (n: number) => n > 0
 * const either = Predicate.xor(isEven, isPositive)
 *
 * either(-2) // => true
 * ```
 *
 * @see {@link or}
 * @see {@link and}
 * @category combinators
 * @since 2.0.0
 */
const xor = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (self, that) => a => self(a) !== that(a))));
/**
 * Creates a predicate that returns `true` when both predicates agree.
 *
 * **When to use**
 *
 * Use when you want to check equivalence of two `Predicate`s.
 *
 * **Details**
 *
 * Returns `true` when both results are equal.
 *
 * **Example** (Defining equivalence)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const isEven = (n: number) => n % 2 === 0
 * const same = Predicate.eqv(isEven, isEven)
 *
 * same(3) // => true
 * ```
 *
 * @see {@link xor}
 * @category combinators
 * @since 2.0.0
 */
const eqv = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (self, that) => a => self(a) === that(a))));
/**
 * Creates a predicate representing logical implication: if `antecedent`, then `consequent`.
 *
 * **When to use**
 *
 * Use when you need to encode logical implication between `Predicate` rules,
 * where one rule only applies when a precondition holds.
 *
 * **Details**
 *
 * Models constraints like "if A then B" and returns `true` when the antecedent
 * is `false`.
 *
 * **Example** (Checking implication)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const isAdult = (age: number) => age >= 18
 * const canVote = (age: number) => age >= 18
 * const implies = Predicate.implies(isAdult, canVote)
 *
 * implies(16) // => true
 * ```
 *
 * @see {@link and}
 * @see {@link or}
 * @category combinators
 * @since 2.0.0
 */
const implies = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (antecedent, consequent) => a => antecedent(a) ? consequent(a) : true)));
/**
 * Creates a predicate that returns `true` when neither predicate is `true`.
 *
 * **When to use**
 *
 * Use when you want to combine two `Predicate`s with logical NOR semantics.
 *
 * **Details**
 *
 * Returns the negation of `or`.
 *
 * **Example** (Checking NOR conditions)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const neither = Predicate.nor(Predicate.isString, Predicate.isNumber)
 *
 * neither(true) // => true
 * ```
 *
 * @see {@link or}
 * @see {@link not}
 * @category combinators
 * @since 2.0.0
 */
const nor = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (self, that) => a => !(self(a) || that(a)))));
/**
 * Creates a predicate that returns `true` unless both predicates are `true`.
 *
 * **When to use**
 *
 * Use when you want to combine two `Predicate`s with logical NAND semantics.
 *
 * **Details**
 *
 * Returns the negation of `and`.
 *
 * **Example** (Checking NAND conditions)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const notBoth = Predicate.nand(Predicate.isString, Predicate.isNumber)
 *
 * notBoth("a") // => true
 * ```
 *
 * @see {@link and}
 * @see {@link not}
 * @category combinators
 * @since 2.0.0
 */
const nand = /*#__PURE__*/(/* unused pure expression or super */ null && (dual(2, (self, that) => a => !(self(a) && that(a)))));
/**
 * Creates a predicate that returns `true` if all predicates in the collection return `true`.
 *
 * **When to use**
 *
 * Use when you have a dynamic list of predicates to apply.
 *
 * **Details**
 *
 * Evaluation short-circuits on the first `false`. The collection is iterated
 * each time the predicate is called.
 *
 * **Example** (Checking all predicates)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const allChecks = Predicate.every([Predicate.isNumber, (n: number) => n > 0])
 *
 * allChecks(2) // => true
 * ```
 *
 * @see {@link some}
 * @see {@link and}
 * @category combining
 * @since 2.0.0
 */
function every(collection) {
  return a => {
    for (const p of collection) {
      if (!p(a)) {
        return false;
      }
    }
    return true;
  };
}
/**
 * Creates a predicate that returns `true` if any predicate in the collection returns `true`.
 *
 * **When to use**
 *
 * Use when you have a dynamic list of predicates and only need one to pass.
 *
 * **Details**
 *
 * Evaluation short-circuits on the first `true`. The collection is iterated
 * each time the predicate is called.
 *
 * **Example** (Checking any predicate)
 *
 * ```ts import.meta.vitest
 * import { Predicate } from "effect"
 *
 * const anyCheck = Predicate.some([Predicate.isString, Predicate.isNumber])
 *
 * anyCheck("ok") // => true
 * ```
 *
 * @see {@link every}
 * @see {@link or}
 * @category combining
 * @since 2.0.0
 */
function some(collection) {
  return a => {
    for (const p of collection) {
      if (p(a)) {
        return true;
      }
    }
    return false;
  };
}
//# sourceMappingURL=Predicate.js.map
__webpack_require__.d(__webpack_exports__, {
}, {
  i5: hasProperty
});


},
"./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Redactable.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _Pipeable_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Pipeable.js");


/**
 * Defines the symbol used to identify objects that implement the {@link Redactable}
 * protocol.
 *
 * **When to use**
 *
 * Use as the property key when implementing the `Redactable` protocol.
 *
 * **Details**
 *
 * Add a method under this key to make an object redactable. The method receives
 * the current `Context` and must return the replacement value. The symbol is
 * registered globally via `Symbol.for("~effect/Redactable")`, so it is
 * identical across multiple copies of the library at runtime.
 *
 * **Example** (Masking an API key)
 *
 * ```ts import.meta.vitest
 * import { Context, Redactable } from "effect"
 *
 * class ApiKey {
 *   constructor(readonly raw: string) {}
 *
 *   [Redactable.symbolRedactable](_ctx: Context.Context<never>) {
 *     return this.raw.slice(0, 4) + "..."
 *   }
 * }
 *
 * Redactable.redact(new ApiKey("secret-key")) // => "secr..."
 * ```
 *
 * @see {@link Redactable} for the interface this symbol belongs to
 * @see {@link isRedactable} to check whether a value has this symbol
 * @category symbols
 * @since 3.10.0
 */
const symbolRedactable = /*#__PURE__*/Symbol.for("~effect/Redactable");
/**
 * Type guard that checks whether a value implements the {@link Redactable}
 * interface.
 *
 * **When to use**
 *
 * Use to narrow an unknown value before calling redaction-specific helpers.
 *
 * @see {@link Redactable} for the interface being checked
 * @see {@link redact} to apply redaction if the value is redactable
 * @category guards
 * @since 3.10.0
 */
const isRedactable = u => hasProperty(u, symbolRedactable);
/**
 * Returns a redacted value if it implements {@link Redactable}, otherwise returns it
 * unchanged.
 *
 * **When to use**
 *
 * Use as the general-purpose entry point for redaction when the input may
 * or may not implement the redaction protocol.
 *
 * **Details**
 *
 * This function calls {@link isRedactable} and, when it returns `true`,
 * delegates to {@link getRedacted}.
 *
 * **Gotchas**
 *
 * Redaction is not recursive. Nested redactable values inside the returned
 * object are not automatically redacted.
 *
 * @see {@link isRedactable} to check before redacting
 * @see {@link getRedacted} for the lower-level variant for known redactables
 * @category destructors
 * @since 3.10.0
 */
function redact(u) {
  if (isRedactable(u)) return getRedacted(u);
  return u;
}
/**
 * Returns the result of calling `[symbolRedactable]` on a value that is
 * already known to be {@link Redactable}.
 *
 * **When to use**
 *
 * Use when you need to read the redacted representation from a value already
 * verified as `Redactable`.
 *
 * **Details**
 *
 * This function reads the current fiber's `Context` from the global fiber
 * reference and passes it to the redaction method.
 *
 * **Gotchas**
 *
 * If no fiber is active, an empty `Context` is passed to the redaction method.
 *
 * @see {@link redact} for the higher-level variant that handles non-redactable values
 * @see {@link isRedactable} for the type guard to verify before calling this
 * @category destructors
 * @since 4.0.0
 */
function getRedacted(redactable) {
  return redactable[symbolRedactable](globalThis[currentFiberTypeId]?.context ?? emptyContext);
}
/** @internal */
const currentFiberTypeId = "~effect/Fiber/currentFiber";
const emptyMap = /*#__PURE__*/new Map();
const emptyContext = {
  "~effect/Context": {},
  base: emptyMap,
  depth: 0,
  mapUnsafe: emptyMap,
  pipe() {
    return (0,_Pipeable_js__rspack_import_0/* .pipeArguments */.tT)(this, arguments);
  }
};
//# sourceMappingURL=Redactable.js.map
__webpack_require__.d(__webpack_exports__, {
  f6: () => (getRedacted)
}, {
  uC: symbolRedactable
});


},
"./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Utils.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {

/**
 * Yields its wrapped value exactly once through an `IterableIterator`.
 *
 * **When to use**
 *
 * Use to implement `[Symbol.iterator]()` on Effect-like types so they can be
 * `yield*`-ed inside generator functions, such as `Effect.gen` and
 * `Option.gen`.
 *
 * **Details**
 *
 * The first call to `next()` returns `{ value: self, done: false }`. Every
 * subsequent call returns `{ value: a, done: true }` where `a` is the argument
 * passed to `next()`. `[Symbol.iterator]()` returns a **new** `SingleShotGen`
 * wrapping the same value, so the outer type can be iterated multiple times.
 *
 * **Example** (Yielding a wrapped value in a generator)
 *
 * ```ts import.meta.vitest
 * import { Utils } from "effect"
 *
 * const gen = new Utils.SingleShotGen<string, number>("hello")
 *
 * gen.next(0) // => { value: "hello", done: false }
 *
 * gen.next(42) // => { value: 42, done: true }
 * ```
 *
 * @see {@link Gen} for the type-level signature that relies on `SingleShotGen`
 * @category constructors
 * @since 2.0.0
 */
class SingleShotGen {
  called = false;
  self;
  constructor(self) {
    this.self = self;
  }
  /**
   * Yields the stored value once, then completes with the value sent back in.
   *
   * **When to use**
   *
   * Use to advance a `SingleShotGen` through its single yield and completion
   * step.
   *
   * @since 2.0.0
   */
  next(a) {
    return this.called ? {
      value: a,
      done: true
    } : (this.called = true, {
      value: this.self,
      done: false
    });
  }
  /**
   * Creates a fresh single-shot iterator over the stored value.
   *
   * **When to use**
   *
   * Use to iterate the wrapped value again without reusing the consumed
   * iterator state.
   *
   * @since 2.0.0
   */
  [Symbol.iterator]() {
    return new SingleShotGen(this.self);
  }
}
// the probe is wrapped in a single function call (rather than module-level
// statements) so the whole selection is pure-annotated by the build and
// tree-shakable when `internalCall` is unused.
const pickInternalCall = () => {
  const InternalTypeId = "~effect/Utils/internal";
  const standard = {
    [InternalTypeId]: body => {
      return body();
    }
  };
  const forced = {
    [InternalTypeId]: body => {
      try {
        return body();
      } finally {
        //
      }
    }
  };
  const isNotOptimizedAway = getStackTraceLimit() !== 0 && standard[InternalTypeId](() => new Error().stack)?.includes(InternalTypeId) === true;
  return isNotOptimizedAway ? standard[InternalTypeId] : forced[InternalTypeId];
};
/** @internal */
const internalCall = /*#__PURE__*/(/* unused pure expression or super */ null && (pickInternalCall()));
//# sourceMappingURL=Utils.js.map
__webpack_require__.d(__webpack_exports__, {
  B: () => (SingleShotGen)
});


},
"./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/internal/core.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _Equal_js__rspack_import_5 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Equal.js");
/* import */ var _Formatter_js__rspack_import_2 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Formatter.js");
/* import */ var _Function_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Function.js");
/* import */ var _Hash_js__rspack_import_4 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Hash.js");
/* import */ var _Inspectable_js__rspack_import_3 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Inspectable.js");
/* import */ var _Pipeable_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Pipeable.js");
/* import */ var _Predicate_js__rspack_import_7 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Predicate.js");
/* import */ var _Utils_js__rspack_import_6 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/Utils.js");
/* import */ var _record_js__rspack_import_8 = __webpack_require__("./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/internal/record.js");









/** @internal */
const EffectTypeId = `~effect/Effect`;
/** @internal */
const ExitTypeId = `~effect/Exit`;
const effectVariance = {
  _A: _Function_js__rspack_import_0/* .identity */.D_,
  _E: _Function_js__rspack_import_0/* .identity */.D_,
  _R: _Function_js__rspack_import_0/* .identity */.D_
};
/** @internal */
const identifier = `${EffectTypeId}/identifier`;
/** @internal */
const args = `${EffectTypeId}/args`;
/** @internal */
const evaluate = `${EffectTypeId}/evaluate`;
/** @internal */
const contA = `${EffectTypeId}/successCont`;
/** @internal */
const contE = `${EffectTypeId}/failureCont`;
/** @internal */
const contAll = `${EffectTypeId}/ensureCont`;
/** @internal */
const Yield = /*#__PURE__*/(/* unused pure expression or super */ null && (Symbol.for("effect/Effect/Yield")));
/** @internal */
const PipeInspectableProto = {
  pipe() {
    return (0,_Pipeable_js__rspack_import_1/* .pipeArguments */.tT)(this, arguments);
  },
  toJSON() {
    return {
      ...this
    };
  },
  toString() {
    return (0,_Formatter_js__rspack_import_2/* .format */.GP)(this.toJSON(), {
      ignoreToString: true,
      space: 2
    });
  },
  [_Inspectable_js__rspack_import_3/* .NodeInspectSymbol */.FX]() {
    return this.toJSON();
  }
};
/** @internal */
const StructuralProto = {
  [_Hash_js__rspack_import_4/* .symbol */.HR]() {
    return _Hash_js__rspack_import_4/* .structureKeys */.uN(this, Object.keys(this));
  },
  [_Equal_js__rspack_import_5/* .symbol */.HR](that) {
    const selfKeys = Object.keys(this);
    const thatKeys = Object.keys(that);
    if (selfKeys.length !== thatKeys.length) return false;
    for (let i = 0; i < selfKeys.length; i++) {
      if (selfKeys[i] !== thatKeys[i] || !_Equal_js__rspack_import_5/* .equals */.aI(this[selfKeys[i]], that[selfKeys[i]])) {
        return false;
      }
    }
    return true;
  }
};
/** @internal */
const EffectProto = {
  [EffectTypeId]: effectVariance,
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new _Utils_js__rspack_import_6/* .SingleShotGen */.B(this);
  },
  toJSON() {
    return {
      _id: "Effect",
      op: this[identifier],
      ...(args in this ? {
        args: this[args]
      } : undefined)
    };
  }
};
/** @internal */
const isEffect = u => hasProperty(u, EffectTypeId);
/** @internal */
const isExit = u => (0,_Predicate_js__rspack_import_7/* .hasProperty */.i5)(u, ExitTypeId);
// ----------------------------------------------------------------------------
// Cause
// ----------------------------------------------------------------------------
/** @internal */
const CauseTypeId = "~effect/Cause";
/** @internal */
const CauseReasonTypeId = "~effect/Cause/Reason";
/** @internal */
const isCause = self => (0,_Predicate_js__rspack_import_7/* .hasProperty */.i5)(self, CauseTypeId);
/** @internal */
const isCauseReason = self => hasProperty(self, CauseReasonTypeId);
/** @internal */
class CauseImpl {
  constructor(failures) {
    this[CauseTypeId] = CauseTypeId;
    this.reasons = failures;
  }
  pipe() {
    return (0,_Pipeable_js__rspack_import_1/* .pipeArguments */.tT)(this, arguments);
  }
  toJSON() {
    return {
      _id: "Cause",
      failures: this.reasons.map(f => f.toJSON())
    };
  }
  toString() {
    return `Cause(${(0,_Formatter_js__rspack_import_2/* .format */.GP)(this.reasons)})`;
  }
  [_Inspectable_js__rspack_import_3/* .NodeInspectSymbol */.FX]() {
    return this.toJSON();
  }
  [_Equal_js__rspack_import_5/* .symbol */.HR](that) {
    return isCause(that) && this.reasons.length === that.reasons.length && this.reasons.every((e, i) => _Equal_js__rspack_import_5/* .equals */.aI(e, that.reasons[i]));
  }
  [_Hash_js__rspack_import_4/* .symbol */.HR]() {
    return _Hash_js__rspack_import_4/* .array */.YO(this.reasons);
  }
}
const annotationsMap = /*#__PURE__*/new WeakMap();
/** @internal */
class ReasonBase {
  [CauseReasonTypeId];
  annotations;
  _tag;
  constructor(_tag, annotations, originalError) {
    this[CauseReasonTypeId] = CauseReasonTypeId;
    this._tag = _tag;
    if (annotations !== constEmptyAnnotations && typeof originalError === "object" && originalError !== null && annotations.size > 0) {
      const prevAnnotations = annotationsMap.get(originalError);
      if (prevAnnotations) {
        annotations = new Map([...prevAnnotations, ...annotations]);
      }
      annotationsMap.set(originalError, annotations);
    }
    this.annotations = annotations;
  }
  annotate(annotations, options) {
    if (annotations.mapUnsafe.size === 0) return this;
    const newAnnotations = new Map(this.annotations);
    annotations.mapUnsafe.forEach((value, key) => {
      if (options?.overwrite !== true && newAnnotations.has(key)) return;
      newAnnotations.set(key, value);
    });
    const self = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    self.annotations = newAnnotations;
    return self;
  }
  pipe() {
    return (0,_Pipeable_js__rspack_import_1/* .pipeArguments */.tT)(this, arguments);
  }
  toString() {
    return (0,_Formatter_js__rspack_import_2/* .format */.GP)(this);
  }
  [_Inspectable_js__rspack_import_3/* .NodeInspectSymbol */.FX]() {
    return this.toString();
  }
}
/** @internal */
const constEmptyAnnotations = /*#__PURE__*/new Map();
/** @internal */
class Fail extends ReasonBase {
  constructor(error, annotations = constEmptyAnnotations) {
    super("Fail", annotations, error);
    this.error = error;
  }
  toString() {
    return `Fail(${(0,_Formatter_js__rspack_import_2/* .format */.GP)(this.error)})`;
  }
  toJSON() {
    return {
      _tag: "Fail",
      error: this.error
    };
  }
  [_Equal_js__rspack_import_5/* .symbol */.HR](that) {
    return isFailReason(that) && _Equal_js__rspack_import_5/* .equals */.aI(this.error, that.error) && _Equal_js__rspack_import_5/* .equals */.aI(this.annotations, that.annotations);
  }
  [_Hash_js__rspack_import_4/* .symbol */.HR]() {
    return _Hash_js__rspack_import_4/* .combine */.kg(_Hash_js__rspack_import_4/* .string */.Yj(this._tag))(_Hash_js__rspack_import_4/* .combine */.kg(_Hash_js__rspack_import_4/* .hash */.tW(this.error))(_Hash_js__rspack_import_4/* .hash */.tW(this.annotations)));
  }
}
/** @internal */
const causeFromReasons = reasons => new CauseImpl(reasons);
/** @internal */
const causeEmpty = /*#__PURE__*/(/* unused pure expression or super */ null && (new CauseImpl([])));
/** @internal */
const causeFail = error => new CauseImpl([new Fail(error)]);
/** @internal */
class Die extends ReasonBase {
  constructor(defect, annotations = constEmptyAnnotations) {
    super("Die", annotations, defect);
    this.defect = defect;
  }
  toString() {
    return `Die(${(0,_Formatter_js__rspack_import_2/* .format */.GP)(this.defect)})`;
  }
  toJSON() {
    return {
      _tag: "Die",
      defect: this.defect
    };
  }
  [_Equal_js__rspack_import_5/* .symbol */.HR](that) {
    return isDieReason(that) && _Equal_js__rspack_import_5/* .equals */.aI(this.defect, that.defect) && _Equal_js__rspack_import_5/* .equals */.aI(this.annotations, that.annotations);
  }
  [_Hash_js__rspack_import_4/* .symbol */.HR]() {
    return _Hash_js__rspack_import_4/* .combine */.kg(_Hash_js__rspack_import_4/* .string */.Yj(this._tag))(_Hash_js__rspack_import_4/* .combine */.kg(_Hash_js__rspack_import_4/* .hash */.tW(this.defect))(_Hash_js__rspack_import_4/* .hash */.tW(this.annotations)));
  }
}
/** @internal */
const causeDie = defect => new CauseImpl([new Die(defect)]);
/** @internal */
const causeAnnotate = /*#__PURE__*/(0,_Function_js__rspack_import_0/* .dual */.XY)(args => isCause(args[0]), (self, annotations, options) => {
  if (annotations.mapUnsafe.size === 0) return self;
  return new CauseImpl(self.reasons.map(f => f.annotate(annotations, options)));
});
/** @internal */
const isFailReason = self => self._tag === "Fail";
/** @internal */
const isDieReason = self => self._tag === "Die";
/** @internal */
const isInterruptReason = self => self._tag === "Interrupt";
function defaultEvaluate(_fiber) {
  return exitDie(`Effect.evaluate: Not implemented`);
}
/** @internal */
const makePrimitiveProto = options => ({
  ...EffectProto,
  [identifier]: options.op,
  [evaluate]: options[evaluate] ?? defaultEvaluate,
  [contA]: options[contA],
  [contE]: options[contE],
  [contAll]: options[contAll]
});
/** @internal */
const makePrimitive = options => {
  const Proto = makePrimitiveProto(options);
  const PrimitiveImpl = function (value) {
    this[args] = value;
  };
  PrimitiveImpl.prototype = Proto;
  return function (value) {
    return new PrimitiveImpl(value);
  };
};
/** @internal */
const makeExit = options => {
  const Proto = {
    [ExitTypeId]: ExitTypeId,
    _tag: options.op,
    get [options.prop]() {
      return this[args];
    },
    ...makePrimitiveProto(options),
    toString() {
      return `${options.op}(${(0,_Formatter_js__rspack_import_2/* .format */.GP)(this[args])})`;
    },
    toJSON() {
      return {
        _id: "Exit",
        _tag: options.op,
        [options.prop]: this[args]
      };
    },
    [_Equal_js__rspack_import_5/* .symbol */.HR](that) {
      return isExit(that) && that._tag === this._tag && _Equal_js__rspack_import_5/* .equals */.aI(this[args], that[args]);
    },
    [_Hash_js__rspack_import_4/* .symbol */.HR]() {
      return _Hash_js__rspack_import_4/* .combine */.kg(_Hash_js__rspack_import_4/* .string */.Yj(options.op), _Hash_js__rspack_import_4/* .hash */.tW(this[args]));
    }
  };
  const ExitPrimitive = function (value) {
    this[args] = value;
  };
  ExitPrimitive.prototype = Proto;
  return function (value) {
    return new ExitPrimitive(value);
  };
};
/** @internal */
const exitSucceed = /*#__PURE__*/makeExit({
  op: "Success",
  prop: "value",
  [evaluate](fiber) {
    const cont = fiber.getCont(contA);
    return cont ? cont[contA](this[args], fiber, this) : fiber.yieldWith(this);
  }
});
/** @internal */
const StackTraceKey = {
  key: "effect/Cause/StackTrace"
};
/** @internal */
const InterruptorStackTrace = (/* unused pure expression or super */ null && ({
  key: "effect/Cause/InterruptorStackTrace"
}));
/** @internal */
const exitFailCause = /*#__PURE__*/makeExit({
  op: "Failure",
  prop: "cause",
  [evaluate](fiber) {
    let cause = this[args];
    let annotated = false;
    if (fiber.cache.stackFrame) {
      cause = causeAnnotate(cause, {
        mapUnsafe: new Map([[StackTraceKey.key, fiber.cache.stackFrame]])
      });
      annotated = true;
    }
    let cont = fiber.getCont(contE);
    while (fiber.interruptible && fiber._interruptedCause && cont) {
      cont = fiber.getCont(contE);
    }
    return cont ? cont[contE](cause, fiber, annotated ? undefined : this) : fiber.yieldWith(annotated ? exitFailCause(cause) : this);
  }
});
/** @internal */
const exitFail = e => exitFailCause(causeFail(e));
/** @internal */
const exitDie = defect => exitFailCause(causeDie(defect));
/** @internal */
const withFiber = /*#__PURE__*/makePrimitive({
  op: "WithFiber",
  [evaluate](fiber) {
    return this[args](fiber);
  }
});
/**
 * Accesses the current fiber to compute a value without a separate `succeed`
 * operation.
 *
 * @internal
 */
const withFiberSucceed = /*#__PURE__*/(/* unused pure expression or super */ null && (makePrimitive({
  op: "WithFiberSucceed",
  [evaluate](fiber) {
    const value = this[args](fiber);
    const cont = fiber.getCont(contA);
    return cont ? cont[contA](value, fiber) : fiber.yieldWith(exitSucceed(value));
  }
})));
/** @internal */
const YieldableError = /*#__PURE__*/function () {
  class YieldableError extends globalThis.Error {}
  const proto = /*#__PURE__*/makePrimitiveProto({
    op: "YieldableError",
    [evaluate]() {
      return exitFail(this);
    }
  });
  delete proto.toString;
  Object.assign(YieldableError.prototype, proto);
  return YieldableError;
}();
/** @internal */
const Error = /*#__PURE__*/function () {
  const plainArgsSymbol = /*#__PURE__*/Symbol.for("effect/Data/Error/plainArgs");
  return class Base extends YieldableError {
    constructor(args) {
      super(args?.message, args?.cause ? {
        cause: args.cause
      } : undefined);
      if (args) {
        _record_js__rspack_import_8/* .assignProperties */.z(this, args);
        // @effect-diagnostics-next-line floatingEffect:off
        Object.defineProperty(this, plainArgsSymbol, {
          value: args,
          enumerable: false
        });
      }
    }
    toJSON() {
      return {
        ...this[plainArgsSymbol],
        ...this
      };
    }
  };
}();
/** @internal */
const TaggedError = tag => {
  class Base extends Error {
    _tag = tag;
  }
  ;
  Base.prototype.name = tag;
  return Base;
};
/** @internal */
const NoSuchElementErrorTypeId = "~effect/Cause/NoSuchElementError";
/** @internal */
const isNoSuchElementError = u => hasProperty(u, NoSuchElementErrorTypeId);
/** @internal */
class NoSuchElementError extends /*#__PURE__*/TaggedError("NoSuchElementError") {
  [NoSuchElementErrorTypeId] = NoSuchElementErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
}
/** @internal */
const DoneTypeId = "~effect/Cause/Done";
/** @internal */
const isDone = u => hasProperty(u, DoneTypeId);
const DoneVoid = (/* unused pure expression or super */ null && ({
  [DoneTypeId]: DoneTypeId,
  _tag: "Done",
  value: undefined
}));
/** @internal */
const Done = value => {
  if (value === undefined) return DoneVoid;
  return {
    [DoneTypeId]: DoneTypeId,
    _tag: "Done",
    value
  };
};
const doneVoid = /*#__PURE__*/(/* unused pure expression or super */ null && (exitFail(DoneVoid)));
/** @internal */
const done = value => {
  if (value === undefined) return doneVoid;
  return exitFail(Done(value));
};
//# sourceMappingURL=core.js.map
__webpack_require__.d(__webpack_exports__, {
}, {
  R6: withFiber,
  _3: evaluate,
  fU: PipeInspectableProto,
  xt: exitSucceed,
  yj: makePrimitiveProto
});


},
"./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/internal/equal.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/** @internal */
const getAllObjectKeys = obj => {
  const keys = new Set(Reflect.ownKeys(obj));
  if (obj.constructor === Object) return keys;
  if (obj instanceof Error) {
    keys.delete("stack");
  }
  const proto = Object.getPrototypeOf(obj);
  let current = proto;
  while (current !== null && current !== Object.prototype) {
    const ownKeys = Reflect.ownKeys(current);
    for (let i = 0; i < ownKeys.length; i++) {
      keys.add(ownKeys[i]);
    }
    current = Object.getPrototypeOf(current);
  }
  if (keys.has("constructor") && typeof obj.constructor === "function" && proto === obj.constructor.prototype) {
    keys.delete("constructor");
  }
  return keys;
};
/** @internal */
const byReferenceInstances = /*#__PURE__*/new WeakSet();
//# sourceMappingURL=equal.js.map
__webpack_require__.d(__webpack_exports__, {
}, {
  J: byReferenceInstances,
  X: getAllObjectKeys
});


},
"./node_modules/.pnpm/effect@4.0.0-rc.117/node_modules/effect/dist/internal/record.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/** @internal */
function assignProperty(self, key, value) {
  if (key === "__proto__") {
    Object.defineProperty(self, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true
    });
  } else {
    ;
    self[key] = value;
  }
}
/** @internal */
function assignProperties(self, source) {
  for (const key of Reflect.ownKeys(source)) {
    if (Object.prototype.propertyIsEnumerable.call(source, key)) {
      assignProperty(self, key, source[key]);
    }
  }
}
//# sourceMappingURL=record.js.map
__webpack_require__.d(__webpack_exports__, {
  z: () => (assignProperties)
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/classic/errors.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _core_index_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/errors.js");
/* import */ var _core_index_js__rspack_import_2 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/core.js");
/* import */ var _core_util_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js");



/* Prototypes that already carry the lazy helper methods. Seeded with the
 * intrinsics so that `init` on a foreign object — it accepts any object —
 * can never install an accessor onto a prototype we do not own. */
const _installedErrorProtos = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
/* Helper methods live as non-enumerable lazy getters on the shared
 * prototype instead of own properties on every instance. On first
 * access the getter allocates the per-instance closure and caches it
 * as a non-enumerable own property, so detached usage still works and
 * the allocation only happens for methods actually touched. */
function _lazyMethod(proto, key, make) {
    Object.defineProperty(proto, key, {
        configurable: true,
        enumerable: false,
        get() {
            const value = make(this);
            Object.defineProperty(this, key, { value, configurable: true, writable: true });
            return value;
        },
        set(value) {
            Object.defineProperty(this, key, { value, configurable: true, writable: true });
        },
    });
}
const initializer = (inst, issues) => {
    _core_index_js__rspack_import_0/* .$ZodError.init */.a$.init(inst, issues);
    inst.name = "ZodError";
    const proto = Object.getPrototypeOf(inst);
    if (_installedErrorProtos.has(proto))
        return;
    _installedErrorProtos.add(proto);
    _lazyMethod(proto, "format", (self) => (mapper) => _core_index_js__rspack_import_0/* .formatError */.Wk(self, mapper));
    _lazyMethod(proto, "flatten", (self) => (mapper) => _core_index_js__rspack_import_0/* .flattenError */.JM(self, mapper));
    _lazyMethod(proto, "addIssue", (self) => (issue) => {
        self.issues.push(issue);
        self.message = JSON.stringify(self.issues, _core_util_js__rspack_import_1/* .jsonStringifyReplacer */.k8, 2);
    });
    _lazyMethod(proto, "addIssues", (self) => (issues) => {
        self.issues.push(...issues);
        self.message = JSON.stringify(self.issues, _core_util_js__rspack_import_1/* .jsonStringifyReplacer */.k8, 2);
    });
    Object.defineProperty(proto, "isEmpty", {
        configurable: true,
        enumerable: false,
        get() {
            return this.issues.length === 0;
        },
    });
};
const ZodError = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodError", initializer)));
const ZodRealError = /*@__PURE__*/ _core_index_js__rspack_import_2/* .$constructor */.xI("ZodError", initializer, undefined, {
    Parent: Error,
});
// /** @deprecated Use `z.core.$ZodErrorMapCtx` instead. */
// export type ErrorMapCtx = core.$ZodErrorMapCtx;

__webpack_require__.d(__webpack_exports__, {
}, {
  g: ZodRealError
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/classic/parse.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _core_index_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/parse.js");
/* import */ var _errors_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/classic/errors.js");


const parse = /* @__PURE__ */ _core_index_js__rspack_import_0/* ._parse */.Tj(_errors_js__rspack_import_1/* .ZodRealError */.g);
const parseAsync = /* @__PURE__ */ _core_index_js__rspack_import_0/* ._parseAsync */.Rb(_errors_js__rspack_import_1/* .ZodRealError */.g);
const safeParse = /* @__PURE__ */ _core_index_js__rspack_import_0/* ._safeParse */.Od(_errors_js__rspack_import_1/* .ZodRealError */.g);
const safeParseAsync = /* @__PURE__ */ _core_index_js__rspack_import_0/* ._safeParseAsync */.wG(_errors_js__rspack_import_1/* .ZodRealError */.g);

// Codec functions
const encode = /* @__PURE__ */ _core_index_js__rspack_import_0/* ._encode */.Mv(_errors_js__rspack_import_1/* .ZodRealError */.g);
const decode = /* @__PURE__ */ _core_index_js__rspack_import_0/* ._decode */.e2(_errors_js__rspack_import_1/* .ZodRealError */.g);
const encodeAsync = /* @__PURE__ */ _core_index_js__rspack_import_0/* ._encodeAsync */.GW(_errors_js__rspack_import_1/* .ZodRealError */.g);
const decodeAsync = /* @__PURE__ */ _core_index_js__rspack_import_0/* ._decodeAsync */.or(_errors_js__rspack_import_1/* .ZodRealError */.g);
const safeEncode = /* @__PURE__ */ _core_index_js__rspack_import_0/* ._safeEncode */.rh(_errors_js__rspack_import_1/* .ZodRealError */.g);
const safeDecode = /* @__PURE__ */ _core_index_js__rspack_import_0/* ._safeDecode */.VS(_errors_js__rspack_import_1/* .ZodRealError */.g);
const safeEncodeAsync = /* @__PURE__ */ _core_index_js__rspack_import_0/* ._safeEncodeAsync */.v_(_errors_js__rspack_import_1/* .ZodRealError */.g);
const safeDecodeAsync = /* @__PURE__ */ _core_index_js__rspack_import_0/* ._safeDecodeAsync */.R3(_errors_js__rspack_import_1/* .ZodRealError */.g);

__webpack_require__.d(__webpack_exports__, {
}, {
  D4: decode,
  EJ: parseAsync,
  EM: safeEncodeAsync,
  Re: decodeAsync,
  X$: encodeAsync,
  bp: safeParseAsync,
  ex: safeDecode,
  lF: encode,
  qg: parse,
  wy: safeEncode,
  xL: safeParse,
  yR: safeDecodeAsync
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/classic/schemas.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _core_index_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/core.js");
/* import */ var _core_index_js__rspack_import_2 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/memoizer.js");
/* import */ var _core_index_js__rspack_import_3 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/schemas.js");
/* import */ var _core_index_js__rspack_import_4 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js");
/* import */ var _core_index_js__rspack_import_6 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/registries.js");
/* import */ var _checks_js__rspack_import_5 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/api.js");
/* import */ var _core_json_schema_processors_js__rspack_import_10 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/json-schema-processors.js");
/* import */ var _core_to_json_schema_js__rspack_import_7 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/to-json-schema.js");
/* import */ var _locales_en_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/locales/en.js");
/* import */ var _parse_js__rspack_import_8 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/classic/parse.js");
/* import */ var _parse_js__rspack_import_9 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/parse.js");








// Register English as the default locale on first ZodType construction. Hooked into the `ZodType` `$constructor` (rather than a top-level `config(en())` in `external.ts`) so bundlers honoring `sideEffects: false` can't tree-shake it out — see #5953, #5725. An explicit `z.config(z.locales.xx())` call wins regardless of order, since this only sets the default when none is present.
function _ensureDefaultLocale() {
    if (!_core_index_js__rspack_import_0/* .globalConfig.localeError */.cr.localeError)
        _core_index_js__rspack_import_0/* .config */.$W((0,_locales_en_js__rspack_import_1/* ["default"] */.A)());
}
// the default memoizer is read by the core container init, which runs before `ZodType.init`, so each container calls this first
function _ensureDefaultMemoizer() {
    if (!_core_index_js__rspack_import_0/* .globalConfig.memoizer */.cr.memoizer)
        _core_index_js__rspack_import_0/* .config */.$W({ memoizer: _core_index_js__rspack_import_2/* .memoizer */.x3() });
}
const ZodType = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodType", (inst, def) => {
    _ensureDefaultLocale();
    _core_index_js__rspack_import_3/* .$ZodType.init */.W4.init(inst, def);
    inst.def = def;
    inst.type = def.type;
    return inst;
}, {
    check(...chks) {
        const def = this.def;
        return this.clone(_core_index_js__rspack_import_4/* .mergeDefs */.zM(def, {
            checks: [
                ...(def.checks ?? []),
                ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch),
            ],
        }), { parent: true });
    },
    with(...chks) {
        return this.check(...chks);
    },
    clone(def, params) {
        return _core_index_js__rspack_import_4/* .clone */.o8(this, def, params);
    },
    brand() {
        return this;
    },
    register(reg, meta) {
        reg.add(this, meta);
        return this;
    },
    refine(check, params) {
        return this.check(refine(check, params));
    },
    superRefine(refinement, params) {
        return this.check(superRefine(refinement, params));
    },
    overwrite(fn) {
        return this.check(_checks_js__rspack_import_5/* ._overwrite */.bS(fn));
    },
    optional() {
        return optional(this);
    },
    exactOptional() {
        return exactOptional(this);
    },
    nullable() {
        return nullable(this);
    },
    nullish() {
        return optional(nullable(this));
    },
    nonoptional(params) {
        return nonoptional(this, params);
    },
    array() {
        return array(this);
    },
    or(arg) {
        return union([this, arg]);
    },
    and(arg) {
        return intersection(this, arg);
    },
    transform(tx) {
        return pipe(this, transform(tx));
    },
    default(d) {
        return _default(this, d);
    },
    prefault(d) {
        return prefault(this, d);
    },
    catch(params) {
        return _catch(this, params);
    },
    pipe(target) {
        return pipe(this, target);
    },
    readonly() {
        return readonly(this);
    },
    describe(description) {
        const cl = this.clone();
        _core_index_js__rspack_import_6/* .globalRegistry.add */.fd.add(cl, { description });
        return cl;
    },
    meta(...args) {
        // overloaded: meta() returns the registered metadata, meta(data) returns a clone with `data` registered. The mapped type picks up the second overload, so we accept variadic any-args and return `any` to satisfy both at runtime.
        if (args.length === 0)
            return _core_index_js__rspack_import_6/* .globalRegistry.get */.fd.get(this);
        const cl = this.clone();
        _core_index_js__rspack_import_6/* .globalRegistry.add */.fd.add(cl, args[0]);
        return cl;
    },
    isOptional() {
        return this.safeParse(undefined).success;
    },
    isNullable() {
        return this.safeParse(null).success;
    },
    apply(fn, ...args) {
        return args.length === 0 ? fn(this) : fn(this, ...args);
    },
    // Overrides core's `~standard` to add `jsonSchema`. Must stay a prototype entry: redefining it per instance demotes instances to dictionary mode.
    get "~standard"() {
        return _core_index_js__rspack_import_4/* .hide */.jD(this, "~standard", {
            ..._core_index_js__rspack_import_3/* .standardProps */.YK(this),
            jsonSchema: {
                input: (0,_core_to_json_schema_js__rspack_import_7/* .createStandardJSONSchemaMethod */.uE)(this, "input"),
                output: (0,_core_to_json_schema_js__rspack_import_7/* .createStandardJSONSchemaMethod */.uE)(this, "output"),
            },
        });
    },
    set "~standard"(value) {
        _core_index_js__rspack_import_4/* .own */.qh(this, "~standard", value);
    },
    parse: function _parse(data, params) {
        return _parse_js__rspack_import_8/* .parse */.qg(this, data, params, { callee: _parse });
    },
    parseAsync: async function _parseAsync(data, params) {
        return await _parse_js__rspack_import_8/* .parseAsync */.EJ(this, data, params, { callee: _parseAsync });
    },
    safeParse(data, params) {
        return _parse_js__rspack_import_8/* .safeParse */.xL(this, data, params);
    },
    async safeParseAsync(data, params) {
        return _parse_js__rspack_import_8/* .safeParseAsync */.bp(this, data, params);
    },
    // `spa` is an alias: same function object as `safeParseAsync`, as before.
    get spa() {
        return this?.safeParseAsync;
    },
    set spa(value) {
        _core_index_js__rspack_import_4/* .own */.qh(this, "spa", value);
    },
    validate(data, params) {
        return _parse_js__rspack_import_9/* .validate */.tf(this, data, params);
    },
    validateAsync(data, params) {
        return _parse_js__rspack_import_9/* .validateAsync */.F0(this, data, params);
    },
    encode: function _encode(data, params) {
        return _parse_js__rspack_import_8/* .encode */.lF(this, data, params, { callee: _encode });
    },
    decode: function _decode(data, params) {
        return _parse_js__rspack_import_8/* .decode */.D4(this, data, params, { callee: _decode });
    },
    encodeAsync: async function _encodeAsync(data, params) {
        return await _parse_js__rspack_import_8/* .encodeAsync */.X$(this, data, params, { callee: _encodeAsync });
    },
    decodeAsync: async function _decodeAsync(data, params) {
        return await _parse_js__rspack_import_8/* .decodeAsync */.Re(this, data, params, { callee: _decodeAsync });
    },
    safeEncode(data, params) {
        return _parse_js__rspack_import_8/* .safeEncode */.wy(this, data, params);
    },
    safeDecode(data, params) {
        return _parse_js__rspack_import_8/* .safeDecode */.ex(this, data, params);
    },
    async safeEncodeAsync(data, params) {
        return _parse_js__rspack_import_8/* .safeEncodeAsync */.EM(this, data, params);
    },
    async safeDecodeAsync(data, params) {
        return _parse_js__rspack_import_8/* .safeDecodeAsync */.yR(this, data, params);
    },
    toJSONSchema(params) {
        return (0,_core_to_json_schema_js__rspack_import_7/* .createToJSONSchemaMethod */.OA)(this, {})(params);
    },
    // Reads through to the registry on every access, so it must not cache.
    get description() {
        return _core_index_js__rspack_import_6/* .globalRegistry */.fd.get(this)?.description;
    },
    // No setter: `schema._def = x` throws, as it did when `_def` was a non-writable own property.
    get _def() {
        return this._zod.def;
    },
});
/** @internal */
const _ZodString = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("_ZodString", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodString.init */.$v.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .stringProcessor */.SW(inst, ctx, json, params);
}, 
/*@__PURE__*/ _core_index_js__rspack_import_4/* .derived */.un({
    format: (inst) => _core_json_schema_processors_js__rspack_import_10/* .aggregateChecks */.Fs(inst).format ?? null,
    minLength: (inst) => _core_json_schema_processors_js__rspack_import_10/* .aggregateChecks */.Fs(inst).minimum ?? null,
    maxLength: (inst) => _core_json_schema_processors_js__rspack_import_10/* .aggregateChecks */.Fs(inst).maximum ?? null,
}, {
    regex(...args) {
        return this.check(_checks_js__rspack_import_5/* ._regex */.Fk(...args));
    },
    includes(...args) {
        return this.check(_checks_js__rspack_import_5/* ._includes */.dR(...args));
    },
    startsWith(...args) {
        return this.check(_checks_js__rspack_import_5/* ._startsWith */.$S(...args));
    },
    endsWith(...args) {
        return this.check(_checks_js__rspack_import_5/* ._endsWith */.ER(...args));
    },
    min(...args) {
        return this.check(_checks_js__rspack_import_5/* ._minLength */.m9(...args));
    },
    max(...args) {
        return this.check(_checks_js__rspack_import_5/* ._maxLength */.Eb(...args));
    },
    length(...args) {
        return this.check(_checks_js__rspack_import_5/* ._length */.YA(...args));
    },
    nonempty(...args) {
        return this.check(_checks_js__rspack_import_5/* ._minLength */.m9(1, ...args));
    },
    lowercase(params) {
        return this.check(_checks_js__rspack_import_5/* ._lowercase */.hH(params));
    },
    uppercase(params) {
        return this.check(_checks_js__rspack_import_5/* ._uppercase */.qF(params));
    },
    trim() {
        return this.check(_checks_js__rspack_import_5/* ._trim */.WN());
    },
    normalize(...args) {
        return this.check(_checks_js__rspack_import_5/* ._normalize */.lo(...args));
    },
    toLowerCase() {
        return this.check(_checks_js__rspack_import_5/* ._toLowerCase */.Il());
    },
    toUpperCase() {
        return this.check(_checks_js__rspack_import_5/* ._toUpperCase */.xY());
    },
    slugify() {
        return this.check(_checks_js__rspack_import_5/* ._slugify */.TL());
    },
}));
const ZodString = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodString", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodString.init */.$v.init(inst, def);
    _ZodString.init(inst, def);
}, {
    email(params) {
        return this.check(_checks_js__rspack_import_5/* ._email */.Mu(ZodEmail, params));
    },
    url(params) {
        return this.check(_checks_js__rspack_import_5/* ._url */.Fn(ZodURL, params));
    },
    jwt(params) {
        return this.check(_checks_js__rspack_import_5/* ._jwt */.rk(ZodJWT, params));
    },
    emoji(params) {
        return this.check(_checks_js__rspack_import_5/* ._emoji */.aC(ZodEmoji, params));
    },
    guid(params) {
        return this.check(_checks_js__rspack_import_5/* ._guid */.tB(ZodGUID, params));
    },
    uuid(params) {
        return this.check(_checks_js__rspack_import_5/* ._uuid */.Be(ZodUUID, params));
    },
    uuidv4(params) {
        return this.check(_checks_js__rspack_import_5/* ._uuidv4 */.nA(ZodUUID, params));
    },
    uuidv6(params) {
        return this.check(_checks_js__rspack_import_5/* ._uuidv6 */.pY(ZodUUID, params));
    },
    uuidv7(params) {
        return this.check(_checks_js__rspack_import_5/* ._uuidv7 */.wA(ZodUUID, params));
    },
    nanoid(params) {
        return this.check(_checks_js__rspack_import_5/* ._nanoid */.Dl(ZodNanoID, params));
    },
    cuid(params) {
        return this.check(_checks_js__rspack_import_5/* ._cuid */.fs(ZodCUID, params));
    },
    cuid2(params) {
        return this.check(_checks_js__rspack_import_5/* ._cuid2 */.Bj(ZodCUID2, params));
    },
    ulid(params) {
        return this.check(_checks_js__rspack_import_5/* ._ulid */.Ct(ZodULID, params));
    },
    base64(params) {
        return this.check(_checks_js__rspack_import_5/* ._base64 */.rt(ZodBase64, params));
    },
    base64url(params) {
        return this.check(_checks_js__rspack_import_5/* ._base64url */.cU(ZodBase64URL, params));
    },
    xid(params) {
        return this.check(_checks_js__rspack_import_5/* ._xid */.Pw(ZodXID, params));
    },
    ksuid(params) {
        return this.check(_checks_js__rspack_import_5/* ._ksuid */._z(ZodKSUID, params));
    },
    ipv4(params) {
        return this.check(_checks_js__rspack_import_5/* ._ipv4 */.Ny(ZodIPv4, params));
    },
    ipv6(params) {
        return this.check(_checks_js__rspack_import_5/* ._ipv6 */.$O(ZodIPv6, params));
    },
    cidrv4(params) {
        return this.check(_checks_js__rspack_import_5/* ._cidrv4 */.Uy(ZodCIDRv4, params));
    },
    cidrv6(params) {
        return this.check(_checks_js__rspack_import_5/* ._cidrv6 */.gP(ZodCIDRv6, params));
    },
    e164(params) {
        return this.check(_checks_js__rspack_import_5/* ._e164 */.KB(ZodE164, params));
    },
    datetime(params) {
        return this.check(_checks_js__rspack_import_5/* ._isoDateTime */.G1(ZodISODateTime, params));
    },
    date(params) {
        return this.check(_checks_js__rspack_import_5/* ._isoDate */.db(ZodISODate, params));
    },
    time(params) {
        return this.check(_checks_js__rspack_import_5/* ._isoTime */.Kn(ZodISOTime, params));
    },
    duration(params) {
        return this.check(_checks_js__rspack_import_5/* ._isoDuration */.f2(ZodISODuration, params));
    },
});
function string(params) {
    return _checks_js__rspack_import_5/* ._string */.Rl(ZodString, params);
}
const ZodStringFormat = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodStringFormat", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodStringFormat.init */.EY.init(inst, def);
    _ZodString.init(inst, def);
});
const ZodISODateTime = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodISODateTime", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodISODateTime.init */.Ko.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodISODate = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodISODate", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodISODate.init */.v1.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodISOTime = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodISOTime", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodISOTime.init */.Ax.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodISODuration = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodISODuration", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodISODuration.init */.$N.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodEmail = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodEmail", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodEmail.init */.qG.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function email(params) {
    return core._email(ZodEmail, params);
}
const ZodGUID = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodGUID", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodGUID.init */.Zc.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function guid(params) {
    return core._guid(ZodGUID, params);
}
const ZodUUID = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodUUID", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodUUID.init */.Zn.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function uuid(params) {
    return core._uuid(ZodUUID, params);
}
function uuidv4(params) {
    return core._uuidv4(ZodUUID, params);
}
// ZodUUIDv6
function uuidv6(params) {
    return core._uuidv6(ZodUUID, params);
}
// ZodUUIDv7
function uuidv7(params) {
    return core._uuidv7(ZodUUID, params);
}
const ZodURL = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodURL", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodURL.init */.VY.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function url(params) {
    return core._url(ZodURL, params);
}
function httpUrl(params) {
    return core._url(ZodURL, {
        protocol: regexes.httpProtocol,
        hostname: regexes.domain,
        ...util.normalizeParams(params),
    });
}
const ZodEmoji = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodEmoji", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodEmoji.init */.cG.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function emoji(params) {
    return core._emoji(ZodEmoji, params);
}
const ZodNanoID = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodNanoID", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodNanoID.init */.Py.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function nanoid(params) {
    return core._nanoid(ZodNanoID, params);
}
/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link ZodCUID2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
const ZodCUID = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodCUID", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodCUID.init */.bl.init(inst, def);
    ZodStringFormat.init(inst, def);
});
/**
 * Validates a CUID v1 string.
 *
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link cuid2 | `z.cuid2()`} instead.
 * See https://github.com/paralleldrive/cuid.
 */
function cuid(params) {
    return core._cuid(ZodCUID, params);
}
const ZodCUID2 = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodCUID2", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodCUID2.init */.Zu.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function cuid2(params) {
    return core._cuid2(ZodCUID2, params);
}
const ZodULID = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodULID", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodULID.init */.g5.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function ulid(params) {
    return core._ulid(ZodULID, params);
}
const ZodXID = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodXID", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodXID.init */.TF.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function xid(params) {
    return core._xid(ZodXID, params);
}
const ZodKSUID = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodKSUID", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodKSUID.init */.GY.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function ksuid(params) {
    return core._ksuid(ZodKSUID, params);
}
const ZodIPv4 = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodIPv4", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodIPv4.init */.Lc.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function ipv4(params) {
    return core._ipv4(ZodIPv4, params);
}
const ZodMAC = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodMAC", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    core.$ZodMAC.init(inst, def);
    ZodStringFormat.init(inst, def);
})));
function mac(params) {
    return core._mac(ZodMAC, params);
}
const ZodIPv6 = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodIPv6", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodIPv6.init */.Zy.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function ipv6(params) {
    return core._ipv6(ZodIPv6, params);
}
const ZodCIDRv4 = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodCIDRv4", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodCIDRv4.init */.CI.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function cidrv4(params) {
    return core._cidrv4(ZodCIDRv4, params);
}
const ZodCIDRv6 = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodCIDRv6", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodCIDRv6.init */.Cn.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function cidrv6(params) {
    return core._cidrv6(ZodCIDRv6, params);
}
const ZodBase64 = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodBase64", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodBase64.init */.Dq.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function base64(params) {
    return core._base64(ZodBase64, params);
}
const ZodBase64URL = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodBase64URL", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodBase64URL.init */.CQ.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function base64url(params) {
    return core._base64url(ZodBase64URL, params);
}
const ZodE164 = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodE164", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodE164.init */.Oy.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function e164(params) {
    return core._e164(ZodE164, params);
}
const ZodCreditCard = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodCreditCard", (inst, def) => {
    core.$ZodCreditCard.init(inst, def);
    ZodStringFormat.init(inst, def);
})));
function creditCard(params) {
    return core._creditCard(ZodCreditCard, params);
}
const ZodIBAN = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodIBAN", (inst, def) => {
    core.$ZodIBAN.init(inst, def);
    ZodStringFormat.init(inst, def);
})));
function iban(params) {
    return core._iban(ZodIBAN, params);
}
const ZodJWT = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodJWT", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodJWT.init */.h8.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function jwt(params) {
    return core._jwt(ZodJWT, params);
}
const ZodCustomStringFormat = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodCustomStringFormat", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    core.$ZodCustomStringFormat.init(inst, def);
    ZodStringFormat.init(inst, def);
})));
function stringFormat(format, fnOrRegex, _params = {}) {
    return core._stringFormat(ZodCustomStringFormat, format, fnOrRegex, _params);
}
function hostname(_params) {
    return core._stringFormat(ZodCustomStringFormat, "hostname", regexes.hostname, _params);
}
function hex(_params) {
    return core._stringFormat(ZodCustomStringFormat, "hex", regexes.hex, _params);
}
function currencyCode(_params) {
    return core._stringFormat(ZodCustomStringFormat, "currency_code", regexes.currencyCode, _params);
}
function hash(alg, params) {
    const enc = params?.enc ?? "hex";
    const format = `${alg}_${enc}`;
    const regex = core.regexes[format];
    if (!regex)
        throw new Error(`Unrecognized hash format: ${format}`);
    return core._stringFormat(ZodCustomStringFormat, format, regex, params);
}
const ZodNumber = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodNumber", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodNumber.init */.vz.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .numberProcessor */.Wg(inst, ctx, json, params);
    inst.isFinite = true;
}, 
/*@__PURE__*/ _core_index_js__rspack_import_4/* .derived */.un({
    minValue: (inst) => {
        const { minimum, exclusiveMinimum } = _core_json_schema_processors_js__rspack_import_10/* .aggregateChecks */.Fs(inst);
        return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
    },
    maxValue: (inst) => {
        const { maximum, exclusiveMaximum } = _core_json_schema_processors_js__rspack_import_10/* .aggregateChecks */.Fs(inst);
        return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
    },
    isInt: (inst) => {
        const { isInt, multipleOf } = _core_json_schema_processors_js__rspack_import_10/* .aggregateChecks */.Fs(inst);
        return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
    },
    format: (inst) => _core_json_schema_processors_js__rspack_import_10/* .aggregateChecks */.Fs(inst).format ?? null,
}, {
    gt(value, params) {
        return this.check(_checks_js__rspack_import_5/* ._gt */.Tx(value, params));
    },
    gte(value, params) {
        return this.check(_checks_js__rspack_import_5/* ._gte */.qm(value, params));
    },
    min(value, params) {
        return this.check(_checks_js__rspack_import_5/* ._gte */.qm(value, params));
    },
    lt(value, params) {
        return this.check(_checks_js__rspack_import_5/* ._lt */.Au(value, params));
    },
    lte(value, params) {
        return this.check(_checks_js__rspack_import_5/* ._lte */.Zm(value, params));
    },
    max(value, params) {
        return this.check(_checks_js__rspack_import_5/* ._lte */.Zm(value, params));
    },
    int(params) {
        return this.check(int(params));
    },
    safe(params) {
        return this.check(int(params));
    },
    positive(params) {
        return this.check(_checks_js__rspack_import_5/* ._gt */.Tx(0, params));
    },
    nonnegative(params) {
        return this.check(_checks_js__rspack_import_5/* ._gte */.qm(0, params));
    },
    negative(params) {
        return this.check(_checks_js__rspack_import_5/* ._lt */.Au(0, params));
    },
    nonpositive(params) {
        return this.check(_checks_js__rspack_import_5/* ._lte */.Zm(0, params));
    },
    multipleOf(value, params) {
        return this.check(_checks_js__rspack_import_5/* ._multipleOf */.Hi(value, params));
    },
    step(value, params) {
        return this.check(_checks_js__rspack_import_5/* ._multipleOf */.Hi(value, params));
    },
    finite() {
        return this;
    },
}));
function number(params) {
    return _checks_js__rspack_import_5/* ._number */.F7(ZodNumber, params);
}
const ZodNumberFormat = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodNumberFormat", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodNumberFormat.init */.I.init(inst, def);
    ZodNumber.init(inst, def);
});
function int(params) {
    return _checks_js__rspack_import_5/* ._int */.LK(ZodNumberFormat, params);
}
function float32(params) {
    return core._float32(ZodNumberFormat, params);
}
function float64(params) {
    return core._float64(ZodNumberFormat, params);
}
function int32(params) {
    return core._int32(ZodNumberFormat, params);
}
function uint32(params) {
    return core._uint32(ZodNumberFormat, params);
}
const ZodBoolean = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodBoolean", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodBoolean.init */.sF.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .booleanProcessor */.dO(inst, ctx, json, params);
});
function boolean(params) {
    return _checks_js__rspack_import_5/* ._boolean */._L(ZodBoolean, params);
}
const ZodBigInt = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodBigInt", (inst, def) => {
    core.$ZodBigInt.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.bigintProcessor(inst, ctx, json, params);
}, 
/*@__PURE__*/ util.derived({
    minValue: (inst) => processors.aggregateChecks(inst).minimum ?? null,
    maxValue: (inst) => processors.aggregateChecks(inst).maximum ?? null,
    format: (inst) => processors.aggregateChecks(inst).format ?? null,
}, {
    gte(value, params) {
        return this.check(checks.gte(value, params));
    },
    min(value, params) {
        return this.check(checks.gte(value, params));
    },
    gt(value, params) {
        return this.check(checks.gt(value, params));
    },
    lt(value, params) {
        return this.check(checks.lt(value, params));
    },
    lte(value, params) {
        return this.check(checks.lte(value, params));
    },
    max(value, params) {
        return this.check(checks.lte(value, params));
    },
    positive(params) {
        return this.check(checks.gt(BigInt(0), params));
    },
    negative(params) {
        return this.check(checks.lt(BigInt(0), params));
    },
    nonpositive(params) {
        return this.check(checks.lte(BigInt(0), params));
    },
    nonnegative(params) {
        return this.check(checks.gte(BigInt(0), params));
    },
    multipleOf(value, params) {
        return this.check(checks.multipleOf(value, params));
    },
}))));
function bigint(params) {
    return core._bigint(ZodBigInt, params);
}
const ZodBigIntFormat = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodBigIntFormat", (inst, def) => {
    core.$ZodBigIntFormat.init(inst, def);
    ZodBigInt.init(inst, def);
})));
function int64(params) {
    return core._int64(ZodBigIntFormat, params);
}
function uint64(params) {
    return core._uint64(ZodBigIntFormat, params);
}
const ZodSymbol = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodSymbol", (inst, def) => {
    core.$ZodSymbol.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.symbolProcessor(inst, ctx, json, params);
})));
function symbol(params) {
    return core._symbol(ZodSymbol, params);
}
const ZodUndefined = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodUndefined", (inst, def) => {
    core.$ZodUndefined.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.undefinedProcessor(inst, ctx, json, params);
})));
function _undefined(params) {
    return core._undefined(ZodUndefined, params);
}

const ZodNull = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodNull", (inst, def) => {
    core.$ZodNull.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.nullProcessor(inst, ctx, json, params);
})));
function _null(params) {
    return core._null(ZodNull, params);
}

const ZodAny = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodAny", (inst, def) => {
    core.$ZodAny.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.anyProcessor(inst, ctx, json, params);
})));
function any() {
    return core._any(ZodAny);
}
const ZodUnknown = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodUnknown", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodUnknown.init */.GP.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .unknownProcessor */.NV(inst, ctx, json, params);
});
function unknown() {
    return _checks_js__rspack_import_5/* ._unknown */.em(ZodUnknown);
}
const ZodNever = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodNever", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodNever.init */.Um.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .neverProcessor */.RH(inst, ctx, json, params);
});
function never(params) {
    return _checks_js__rspack_import_5/* ._never */.G8(ZodNever, params);
}
const ZodVoid = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodVoid", (inst, def) => {
    core.$ZodVoid.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.voidProcessor(inst, ctx, json, params);
})));
function _void(params) {
    return core._void(ZodVoid, params);
}

const ZodDate = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodDate", (inst, def) => {
    core.$ZodDate.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.dateProcessor(inst, ctx, json, params);
    inst.min = (value, params) => inst.check(checks.gte(value, params));
    inst.max = (value, params) => inst.check(checks.lte(value, params));
}, 
/*@__PURE__*/ util.derived({
    minDate: (inst) => {
        const { minimum } = processors.aggregateChecks(inst);
        return minimum ? new Date(minimum) : null;
    },
    maxDate: (inst) => {
        const { maximum } = processors.aggregateChecks(inst);
        return maximum ? new Date(maximum) : null;
    },
}, {}))));
function date(params) {
    return core._date(ZodDate, params);
}
const ZodArray = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodArray", (inst, def) => {
    _ensureDefaultMemoizer();
    _core_index_js__rspack_import_3/* .$ZodArray.init */.$p.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .arrayProcessor */.cY(inst, ctx, json, params);
    inst.element = def.element;
}, {
    min(n, params) {
        return this.check(_checks_js__rspack_import_5/* ._minLength */.m9(n, params));
    },
    nonempty(params) {
        return this.check(_checks_js__rspack_import_5/* ._minLength */.m9(1, params));
    },
    max(n, params) {
        return this.check(_checks_js__rspack_import_5/* ._maxLength */.Eb(n, params));
    },
    length(n, params) {
        return this.check(_checks_js__rspack_import_5/* ._length */.YA(n, params));
    },
    unwrap() {
        return this.element;
    },
});
function array(element, params) {
    return _checks_js__rspack_import_5/* ._array */.dZ(ZodArray, element, params);
}
// .keyof
function keyof(schema) {
    const shape = schema._zod.def.shape;
    return _enum(Object.keys(shape));
}
const ZodObject = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodObject", (inst, def) => {
    _ensureDefaultMemoizer();
    _core_index_js__rspack_import_3/* .$ZodObjectJIT.init */.w.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .objectProcessor */.Ec(inst, ctx, json, params);
    _core_index_js__rspack_import_4/* .installLazyProp */.X(inst, "shape", (self) => self._zod.def.shape, false);
}, {
    keyof() {
        return _enum(Object.keys(this._zod.def.shape));
    },
    catchall(catchall) {
        // `mergeDefs` rather than a spread: spreading reads `shape`, and resolving it can mint a whole fresh subtree
        return this.clone(_core_index_js__rspack_import_4/* .mergeDefs */.zM(this._zod.def, { catchall: catchall }));
    },
    passthrough() {
        return this.clone(_core_index_js__rspack_import_4/* .mergeDefs */.zM(this._zod.def, { catchall: unknown() }));
    },
    loose() {
        return this.clone(_core_index_js__rspack_import_4/* .mergeDefs */.zM(this._zod.def, { catchall: unknown() }));
    },
    strict() {
        return this.clone(_core_index_js__rspack_import_4/* .mergeDefs */.zM(this._zod.def, { catchall: never() }));
    },
    strip() {
        return this.clone(_core_index_js__rspack_import_4/* .mergeDefs */.zM(this._zod.def, { catchall: undefined }));
    },
    extend(incoming) {
        return _core_index_js__rspack_import_4/* .extend */.X$(this, incoming);
    },
    safeExtend(incoming) {
        return _core_index_js__rspack_import_4/* .safeExtend */.W0(this, incoming);
    },
    merge(other) {
        return _core_index_js__rspack_import_4/* .merge */.h1(this, other);
    },
    pick(mask) {
        return _core_index_js__rspack_import_4/* .pick */.Up(this, mask);
    },
    omit(mask) {
        return _core_index_js__rspack_import_4/* .omit */.cJ(this, mask);
    },
    partial(...args) {
        return _core_index_js__rspack_import_4/* .partial */.OH(ZodOptional, this, args[0]);
    },
    exactPartial(...args) {
        return _core_index_js__rspack_import_4/* .partial */.OH(ZodExactOptional, this, args[0], "exactPartial");
    },
    required(...args) {
        return _core_index_js__rspack_import_4/* .required */.mw(ZodNonOptional, this, args[0]);
    },
});
function object(shape, params) {
    const def = {
        type: "object",
        shape: shape ?? {},
        ..._core_index_js__rspack_import_4/* .normalizeParams */.A2(params),
    };
    return new ZodObject(def);
}
// strictObject
function strictObject(shape, params) {
    return new ZodObject({
        type: "object",
        shape,
        catchall: never(),
        ...util.normalizeParams(params),
    });
}
// looseObject
function looseObject(shape, params) {
    return new ZodObject({
        type: "object",
        shape,
        catchall: unknown(),
        ...util.normalizeParams(params),
    });
}
const ZodUnion = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodUnion", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodUnion.init */.cu.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .unionProcessor */.iC(inst, ctx, json, params);
    inst.options = def.options;
});
function union(options, params) {
    return new ZodUnion({
        type: "union",
        options: options,
        ..._core_index_js__rspack_import_4/* .normalizeParams */.A2(params),
    });
}
const ZodXor = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodXor", (inst, def) => {
    ZodUnion.init(inst, def);
    core.$ZodXor.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.unionProcessor(inst, ctx, json, params);
    inst.options = def.options;
})));
/** Creates an exclusive union (XOR) where exactly one option must match.
 * Unlike regular unions that succeed when any option matches, xor fails if
 * zero or more than one option matches the input. */
function xor(options, params) {
    return new ZodXor({
        type: "union",
        options: options,
        inclusive: false,
        ...util.normalizeParams(params),
    });
}
const ZodDiscriminatedUnion = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodDiscriminatedUnion", (inst, def) => {
    ZodUnion.init(inst, def);
    _core_index_js__rspack_import_3/* .$ZodDiscriminatedUnion.init */.P0.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
    // const [options, params] = args;
    return new ZodDiscriminatedUnion({
        type: "union",
        options: options,
        discriminator,
        ..._core_index_js__rspack_import_4/* .normalizeParams */.A2(params),
    });
}
const ZodIntersection = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodIntersection", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodIntersection.init */.LJ.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .intersectionProcessor */.i_(inst, ctx, json, params);
});
function intersection(left, right) {
    return new ZodIntersection({
        type: "intersection",
        left: left,
        right: right,
    });
}
const ZodTuple = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodTuple", (inst, def) => {
    _ensureDefaultMemoizer();
    core.$ZodTuple.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.tupleProcessor(inst, ctx, json, params);
}, {
    rest(rest) {
        return this.clone({
            ...this._zod.def,
            rest: rest,
        });
    },
    partial() {
        const def = this._zod.def;
        // a refinement was authored against the full arity; partialing would run it on a shorter array
        if (def.checks?.length)
            throw new Error(".partial() cannot be used on tuple schemas containing refinements");
        return this.clone({
            ...def,
            items: def.items.map((item) => new ZodOptional({ type: "optional", innerType: item })),
        });
    },
})));
function tuple(items, _paramsOrRest, _params) {
    const hasRest = _paramsOrRest instanceof core.$ZodType;
    const params = hasRest ? _params : _paramsOrRest;
    const rest = hasRest ? _paramsOrRest : null;
    return new ZodTuple({
        type: "tuple",
        items: items,
        rest,
        ...util.normalizeParams(params),
    });
}
const ZodRecord = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodRecord", (inst, def) => {
    _ensureDefaultMemoizer();
    _core_index_js__rspack_import_3/* .$ZodRecord.init */.h.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .recordProcessor */.GC(inst, ctx, json, params);
    inst.keyType = def.keyType;
    inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
    // v3-compat: z.record(valueType, params?) — defaults keyType to z.string()
    if (!valueType || !valueType._zod) {
        return new ZodRecord({
            type: "record",
            keyType: string(),
            valueType: keyType,
            ..._core_index_js__rspack_import_4/* .normalizeParams */.A2(valueType),
        });
    }
    return new ZodRecord({
        type: "record",
        keyType,
        valueType: valueType,
        ..._core_index_js__rspack_import_4/* .normalizeParams */.A2(params),
    });
}
// type alksjf = core.output<core.$ZodRecordKey>;
function partialRecord(keyType, valueType, params) {
    return new ZodRecord({
        type: "record",
        keyType,
        valueType: valueType,
        ...util.normalizeParams(params),
        partial: true,
    });
}
function looseRecord(keyType, valueType, params) {
    return new ZodRecord({
        type: "record",
        keyType,
        valueType: valueType,
        mode: "loose",
        ...util.normalizeParams(params),
    });
}
const ZodMap = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodMap", (inst, def) => {
    _ensureDefaultMemoizer();
    core.$ZodMap.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.mapProcessor(inst, ctx, json, params);
    inst.keyType = def.keyType;
    inst.valueType = def.valueType;
    inst.min = (...args) => inst.check(core._minSize(...args));
    inst.nonempty = (params) => inst.check(core._minSize(1, params));
    inst.max = (...args) => inst.check(core._maxSize(...args));
    inst.size = (...args) => inst.check(core._size(...args));
})));
function map(keyType, valueType, params) {
    return new ZodMap({
        type: "map",
        keyType: keyType,
        valueType: valueType,
        ...util.normalizeParams(params),
    });
}
const ZodSet = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodSet", (inst, def) => {
    _ensureDefaultMemoizer();
    core.$ZodSet.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.setProcessor(inst, ctx, json, params);
    inst.min = (...args) => inst.check(core._minSize(...args));
    inst.nonempty = (params) => inst.check(core._minSize(1, params));
    inst.max = (...args) => inst.check(core._maxSize(...args));
    inst.size = (...args) => inst.check(core._size(...args));
})));
function set(valueType, params) {
    return new ZodSet({
        type: "set",
        valueType: valueType,
        ...util.normalizeParams(params),
    });
}
const ZodEnum = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodEnum", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodEnum.init */.VO.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .enumProcessor */.C0(inst, ctx, json, params);
    inst.enum = def.entries;
    // reuse the parsed value set so a numeric TS enum's reverse-mapping keys stay out
    inst.options = [...inst._zod.values];
    const keys = new Set(Object.keys(def.entries));
    inst.extract = (values, params) => {
        const newEntries = {};
        for (const value of values) {
            if (keys.has(value)) {
                newEntries[value] = def.entries[value];
            }
            else
                throw new Error(`Key ${value} not found in enum`);
        }
        return new ZodEnum({
            ...def,
            checks: [],
            ..._core_index_js__rspack_import_4/* .normalizeParams */.A2(params),
            entries: newEntries,
        });
    };
    inst.exclude = (values, params) => {
        const newEntries = { ...def.entries };
        for (const value of values) {
            if (keys.has(value)) {
                delete newEntries[value];
            }
            else
                throw new Error(`Key ${value} not found in enum`);
        }
        return new ZodEnum({
            ...def,
            checks: [],
            ..._core_index_js__rspack_import_4/* .normalizeParams */.A2(params),
            entries: newEntries,
        });
    };
});
function _enum(values, params) {
    const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
    return new ZodEnum({
        type: "enum",
        entries,
        ..._core_index_js__rspack_import_4/* .normalizeParams */.A2(params),
    });
}

/** @deprecated This API has been merged into `z.enum()`. Use `z.enum()` instead.
 *
 * ```ts
 * enum Colors { red, green, blue }
 * z.enum(Colors);
 * ```
 */
function nativeEnum(entries, params) {
    return new ZodEnum({
        type: "enum",
        entries,
        ...util.normalizeParams(params),
    });
}
const ZodLiteral = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodLiteral", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodLiteral.init */.nu.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .literalProcessor */.Yv(inst, ctx, json, params);
    inst.values = new Set(def.values);
    Object.defineProperty(inst, "value", {
        get() {
            if (def.values.length > 1) {
                throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
            }
            return def.values[0];
        },
    });
});
function literal(value, params) {
    return new ZodLiteral({
        type: "literal",
        values: Array.isArray(value) ? value : [value],
        ..._core_index_js__rspack_import_4/* .normalizeParams */.A2(params),
    });
}
const ZodFile = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodFile", (inst, def) => {
    core.$ZodFile.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.fileProcessor(inst, ctx, json, params);
    inst.min = (size, params) => inst.check(core._minSize(size, params));
    inst.max = (size, params) => inst.check(core._maxSize(size, params));
    inst.mime = (types, params) => inst.check(core._mime(Array.isArray(types) ? types : [types], params));
})));
function file(params) {
    return core._file(ZodFile, params);
}
const ZodTransform = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodTransform", (inst, def) => {
    _ensureDefaultMemoizer();
    _core_index_js__rspack_import_3/* .$ZodTransform.init */.Wc.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .transformProcessor */.xi(inst, ctx, json, params);
    inst._zod.parse = (payload, _ctx) => {
        if (_ctx.direction === "backward") {
            throw new _core_index_js__rspack_import_0/* .$ZodEncodeError */.cV(inst.constructor.name);
        }
        payload.addIssue = (issue) => {
            if (typeof issue === "string") {
                payload.issues.push(_core_index_js__rspack_import_4/* .issue */.sn(issue, payload.value, def));
            }
            else {
                // for Zod 3 backwards compatibility
                const _issue = issue;
                if (_issue.fatal)
                    _issue.continue = false;
                _issue.code ?? (_issue.code = "custom");
                if (!("input" in _issue))
                    _issue.input = payload.value;
                _issue.inst ?? (_issue.inst = inst);
                // _issue.continue ??= true;
                payload.issues.push(_core_index_js__rspack_import_4/* .issue */.sn(_issue));
            }
        };
        const output = def.transform(payload.value, payload);
        if (output instanceof Promise) {
            return output.then((output) => {
                payload.value = output;
                return payload;
            });
        }
        payload.value = output;
        return payload;
    };
});
function transform(fn) {
    return new ZodTransform({
        type: "transform",
        transform: fn,
    });
}
const ZodOptional = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodOptional", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodOptional.init */.ig.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .optionalProcessor */.$k(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
    return new ZodOptional({
        type: "optional",
        innerType: innerType,
    });
}
const ZodExactOptional = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodExactOptional", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodExactOptional.init */.RL.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .optionalProcessor */.$k(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
    return new ZodExactOptional({
        type: "optional",
        innerType: innerType,
    });
}
const ZodNullable = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodNullable", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodNullable.init */.qc.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .nullableProcessor */.yq(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
    return new ZodNullable({
        type: "nullable",
        innerType: innerType,
    });
}
// nullish
function nullish(innerType) {
    return optional(nullable(innerType));
}
const ZodDefault = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodDefault", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodDefault.init */.rv.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .defaultProcessor */.mh(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
    inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
    return new ZodDefault({
        type: "default",
        innerType: innerType,
        get defaultValue() {
            return typeof defaultValue === "function" ? defaultValue() : _core_index_js__rspack_import_4/* .shallowClone */.yG(defaultValue);
        },
    });
}
const ZodPrefault = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodPrefault", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodPrefault.init */.VF.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .prefaultProcessor */.A(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
    return new ZodPrefault({
        type: "prefault",
        innerType: innerType,
        get defaultValue() {
            return typeof defaultValue === "function" ? defaultValue() : _core_index_js__rspack_import_4/* .shallowClone */.yG(defaultValue);
        },
    });
}
const ZodNonOptional = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodNonOptional", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodNonOptional.init */.N$.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .nonoptionalProcessor */.cR(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
    return new ZodNonOptional({
        type: "nonoptional",
        innerType: innerType,
        ..._core_index_js__rspack_import_4/* .normalizeParams */.A2(params),
    });
}
const ZodSuccess = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodSuccess", (inst, def) => {
    core.$ZodSuccess.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.successProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
})));
function success(innerType) {
    return new ZodSuccess({
        type: "success",
        innerType: innerType,
    });
}
const ZodCatch = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodCatch", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodCatch.init */.t$.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .catchProcessor */.Q9(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
    inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
    return new ZodCatch({
        type: "catch",
        innerType: innerType,
        catchValue: (typeof catchValue === "function" ? catchValue : _core_index_js__rspack_import_4/* .constantCatch */.SS(catchValue)),
    });
}

const ZodNaN = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodNaN", (inst, def) => {
    core.$ZodNaN.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.nanProcessor(inst, ctx, json, params);
})));
function nan(params) {
    return core._nan(ZodNaN, params);
}
const ZodPipe = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodPipe", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodPipe.init */._m.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .pipeProcessor */.fs(inst, ctx, json, params);
    inst.in = def.in;
    inst.out = def.out;
});
function pipe(in_, out) {
    return new ZodPipe({
        type: "pipe",
        in: in_,
        out: out,
        // ...util.normalizeParams(params),
    });
}
const ZodCodec = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodCodec", (inst, def) => {
    ZodPipe.init(inst, def);
    core.$ZodCodec.init(inst, def);
})));
function codec(in_, out, params) {
    return new ZodCodec({
        type: "pipe",
        in: in_,
        out: out,
        transform: params.decode,
        reverseTransform: params.encode,
    });
}
function invertCodec(codec) {
    const def = codec._zod.def;
    return new ZodCodec({
        type: "pipe",
        in: def.out,
        out: def.in,
        transform: def.reverseTransform,
        reverseTransform: def.transform,
    });
}
const ZodPreprocess = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodPreprocess", (inst, def) => {
    ZodPipe.init(inst, def);
    core.$ZodPreprocess.init(inst, def);
})));
const ZodReadonly = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodReadonly", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodReadonly.init */.Sb.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .readonlyProcessor */.$X(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
    return new ZodReadonly({
        type: "readonly",
        innerType: innerType,
    });
}
const ZodTemplateLiteral = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodTemplateLiteral", (inst, def) => {
    core.$ZodTemplateLiteral.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.templateLiteralProcessor(inst, ctx, json, params);
})));
function templateLiteral(parts, params) {
    return new ZodTemplateLiteral({
        type: "template_literal",
        parts,
        ...util.normalizeParams(params),
    });
}
const ZodLazy = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodLazy", (inst, def) => {
    core.$ZodLazy.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.lazyProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.getter();
})));
function lazy(getter) {
    return new ZodLazy({
        type: "lazy",
        getter: getter,
    });
}
const ZodPromise = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodPromise", (inst, def) => {
    core.$ZodPromise.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.promiseProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
})));
function promise(innerType) {
    return new ZodPromise({
        type: "promise",
        innerType: innerType,
    });
}
const ZodFunction = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodFunction", (inst, def) => {
    core.$ZodFunction.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.functionProcessor(inst, ctx, json, params);
})));
function _function(params) {
    return new ZodFunction({
        type: "function",
        input: Array.isArray(params?.input) ? tuple(params?.input) : (params?.input ?? array(unknown())),
        output: params?.output ?? unknown(),
    });
}

const ZodCustom = /*@__PURE__*/ _core_index_js__rspack_import_0/* .$constructor */.xI("ZodCustom", (inst, def) => {
    _core_index_js__rspack_import_3/* .$ZodCustom.init */.b0.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => _core_json_schema_processors_js__rspack_import_10/* .customProcessor */.A6(inst, ctx, json, params);
});
// custom checks
function check(fn) {
    const ch = new core.$ZodCheck({
        check: "custom",
        // ...util.normalizeParams(params),
    });
    ch._zod.check = fn;
    return ch;
}
function custom(fn, _params) {
    return core._custom(ZodCustom, fn ?? (() => true), _params);
}
function refine(fn, _params = {}) {
    return _checks_js__rspack_import_5/* ._refine */.fU(ZodCustom, fn, _params);
}
// superRefine
function superRefine(fn, params) {
    return _checks_js__rspack_import_5/* ._superRefine */.MB(fn, params);
}
// Re-export describe and meta from core
const describe = _checks_js__rspack_import_5/* .describe */.q0;
const meta = _checks_js__rspack_import_5/* .meta */.mI;
const ZodInstanceOf = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodInstanceOf", (inst, def) => {
    ZodCustom.init(inst, def);
}, {
    properties(shape, params) {
        // asserts in place, so the narrowed output type is truthful without a wrapper
        return this.check(core._properties(shape, params));
    },
})));
function _instanceof(cls, params = {}) {
    const inst = new ZodInstanceOf({
        type: "custom",
        check: "custom",
        fn: (data) => data instanceof cls,
        abort: true,
        ...util.normalizeParams(params),
    });
    inst._zod.bag.Class = cls;
    // Override check to emit invalid_type instead of custom
    inst._zod.check = (payload) => {
        if (!(payload.value instanceof cls)) {
            payload.issues.push({
                code: "invalid_type",
                expected: cls.name,
                input: payload.value,
                inst,
                path: [...(inst._zod.def.path ?? [])],
            });
        }
    };
    return inst;
}

// stringbool
const stringbool = (...args) => core._stringbool({
    Codec: ZodCodec,
    Boolean: ZodBoolean,
    String: ZodString,
}, ...args);
function json(params) {
    const jsonSchema = lazy(() => {
        return union([string(params), number(), boolean(), _null(), array(jsonSchema), record(string(), jsonSchema)]);
    });
    return jsonSchema;
}
// preprocess
function preprocess(fn, schema) {
    return new ZodPreprocess({
        type: "pipe",
        in: transform(fn),
        out: schema,
    });
}

__webpack_require__.d(__webpack_exports__, {
  Ikc: () => (object),
  YOg: () => (array),
  YjP: () => (string),
  aig: () => (number),
  euz: () => (literal),
  g1P: () => (record),
  gMt: () => (discriminatedUnion),
  zMY: () => (boolean)
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/api.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _checks_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/checks.js");
/* import */ var _registries_js__rspack_import_2 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/registries.js");
/* import */ var _util_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js");




function snapshotChecks(def) {
    if (def.checks)
        def.checks = [...def.checks];
    return def;
}
// @__NO_SIDE_EFFECTS__
function _string(Class, params) {
    return new Class(snapshotChecks({ type: "string", ..._util_js__rspack_import_0/* .normalizeParams */.A2(params) }));
}
// @__NO_SIDE_EFFECTS__
function _coercedString(Class, params) {
    return new Class(snapshotChecks({ type: "string", coerce: true, ...util.normalizeParams(params) }));
}
// @__NO_SIDE_EFFECTS__
function _email(Class, params) {
    return new Class({
        type: "string",
        format: "email",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _guid(Class, params) {
    return new Class({
        type: "string",
        format: "guid",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        version: "v4",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        version: "v6",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        version: "v7",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _url(Class, params) {
    return new Class({
        type: "string",
        format: "url",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _emoji(Class, params) {
    return new Class({
        type: "string",
        format: "emoji",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class, params) {
    return new Class({
        type: "string",
        format: "nanoid",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link _cuid2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
// @__NO_SIDE_EFFECTS__
function _cuid(Class, params) {
    return new Class({
        type: "string",
        format: "cuid",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class, params) {
    return new Class({
        type: "string",
        format: "cuid2",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class, params) {
    return new Class({
        type: "string",
        format: "ulid",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _xid(Class, params) {
    return new Class({
        type: "string",
        format: "xid",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class, params) {
    return new Class({
        type: "string",
        format: "ksuid",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class, params) {
    return new Class({
        type: "string",
        format: "ipv4",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class, params) {
    return new Class({
        type: "string",
        format: "ipv6",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _mac(Class, params) {
    return new Class({
        type: "string",
        format: "mac",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class, params) {
    return new Class({
        type: "string",
        format: "cidrv4",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class, params) {
    return new Class({
        type: "string",
        format: "cidrv6",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _base64(Class, params) {
    return new Class({
        type: "string",
        format: "base64",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class, params) {
    return new Class({
        type: "string",
        format: "base64url",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _e164(Class, params) {
    return new Class({
        type: "string",
        format: "e164",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _creditCard(Class, params) {
    return new Class({
        type: "string",
        format: "credit_card",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _iban(Class, params) {
    return new Class({
        type: "string",
        format: "iban",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class, params) {
    return new Class({
        type: "string",
        format: "jwt",
        check: "string_format",
        abort: false,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
const TimePrecision = (/* unused pure expression or super */ null && ({
    Any: null,
    Minute: -1,
    Second: 0,
    Millisecond: 3,
    Microsecond: 6,
}));
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class, params) {
    return new Class({
        type: "string",
        format: "datetime",
        check: "string_format",
        offset: false,
        local: false,
        precision: null,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class, params) {
    return new Class({
        type: "string",
        format: "date",
        check: "string_format",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class, params) {
    return new Class({
        type: "string",
        format: "time",
        check: "string_format",
        precision: null,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class, params) {
    return new Class({
        type: "string",
        format: "duration",
        check: "string_format",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _number(Class, params) {
    return new Class(snapshotChecks({ type: "number", checks: [], ..._util_js__rspack_import_0/* .normalizeParams */.A2(params) }));
}
// @__NO_SIDE_EFFECTS__
function _coercedNumber(Class, params) {
    return new Class(snapshotChecks({ type: "number", coerce: true, checks: [], ...util.normalizeParams(params) }));
}
// @__NO_SIDE_EFFECTS__
function _int(Class, params) {
    return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "safeint",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _float32(Class, params) {
    return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "float32",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _float64(Class, params) {
    return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "float64",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _int32(Class, params) {
    return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "int32",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _uint32(Class, params) {
    return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "uint32",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class, params) {
    return new Class({
        type: "boolean",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _coercedBoolean(Class, params) {
    return new Class({
        type: "boolean",
        coerce: true,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _bigint(Class, params) {
    return new Class({
        type: "bigint",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _coercedBigint(Class, params) {
    return new Class({
        type: "bigint",
        coerce: true,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _int64(Class, params) {
    return new Class({
        type: "bigint",
        check: "bigint_format",
        abort: false,
        format: "int64",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _uint64(Class, params) {
    return new Class({
        type: "bigint",
        check: "bigint_format",
        abort: false,
        format: "uint64",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _symbol(Class, params) {
    return new Class({
        type: "symbol",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _undefined(Class, params) {
    return new Class({
        type: "undefined",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _null(Class, params) {
    return new Class({
        type: "null",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _any(Class) {
    return new Class({
        type: "any",
    });
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class) {
    return new Class({
        type: "unknown",
    });
}
// @__NO_SIDE_EFFECTS__
function _never(Class, params) {
    return new Class({
        type: "never",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _void(Class, params) {
    return new Class({
        type: "void",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _date(Class, params) {
    return new Class({
        type: "date",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _coercedDate(Class, params) {
    return new Class({
        type: "date",
        coerce: true,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _nan(Class, params) {
    return new Class({
        type: "nan",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
    return new _checks_js__rspack_import_1/* .$ZodCheckLessThan */.sm({
        check: "less_than",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
        value,
        inclusive: false,
    });
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
    return new _checks_js__rspack_import_1/* .$ZodCheckLessThan */.sm({
        check: "less_than",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
        value,
        inclusive: true,
    });
}

// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
    return new _checks_js__rspack_import_1/* .$ZodCheckGreaterThan */.J_({
        check: "greater_than",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
        value,
        inclusive: false,
    });
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
    return new _checks_js__rspack_import_1/* .$ZodCheckGreaterThan */.J_({
        check: "greater_than",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
        value,
        inclusive: true,
    });
}

// @__NO_SIDE_EFFECTS__
function _positive(params) {
    return _gt(0, params);
}
// negative
// @__NO_SIDE_EFFECTS__
function _negative(params) {
    return _lt(0, params);
}
// nonpositive
// @__NO_SIDE_EFFECTS__
function _nonpositive(params) {
    return _lte(0, params);
}
// nonnegative
// @__NO_SIDE_EFFECTS__
function _nonnegative(params) {
    return _gte(0, params);
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
    return new _checks_js__rspack_import_1/* .$ZodCheckMultipleOf */.Jk({
        check: "multiple_of",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
        value,
    });
}
// @__NO_SIDE_EFFECTS__
function _maxSize(maximum, params) {
    return new checks.$ZodCheckMaxSize({
        check: "max_size",
        ...util.normalizeParams(params),
        maximum,
    });
}
// @__NO_SIDE_EFFECTS__
function _minSize(minimum, params) {
    return new checks.$ZodCheckMinSize({
        check: "min_size",
        ...util.normalizeParams(params),
        minimum,
    });
}
// @__NO_SIDE_EFFECTS__
function _size(size, params) {
    return new checks.$ZodCheckSizeEquals({
        check: "size_equals",
        ...util.normalizeParams(params),
        size,
    });
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
    const ch = new _checks_js__rspack_import_1/* .$ZodCheckMaxLength */.Yk({
        check: "max_length",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
        maximum,
    });
    return ch;
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
    return new _checks_js__rspack_import_1/* .$ZodCheckMinLength */.Kk({
        check: "min_length",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
        minimum,
    });
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
    return new _checks_js__rspack_import_1/* .$ZodCheckLengthEquals */.RM({
        check: "length_equals",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
        length,
    });
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
    return new _checks_js__rspack_import_1/* .$ZodCheckRegex */.DG({
        check: "string_format",
        format: "regex",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
        pattern,
    });
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
    return new _checks_js__rspack_import_1/* .$ZodCheckLowerCase */.NI({
        check: "string_format",
        format: "lowercase",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
    return new _checks_js__rspack_import_1/* .$ZodCheckUpperCase */.kH({
        check: "string_format",
        format: "uppercase",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
    return new _checks_js__rspack_import_1/* .$ZodCheckIncludes */.Tt({
        check: "string_format",
        format: "includes",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
        includes,
    });
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
    return new _checks_js__rspack_import_1/* .$ZodCheckStartsWith */.J({
        check: "string_format",
        format: "starts_with",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
        prefix,
    });
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
    return new _checks_js__rspack_import_1/* .$ZodCheckEndsWith */.E6({
        check: "string_format",
        format: "ends_with",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
        suffix,
    });
}
// @__NO_SIDE_EFFECTS__
function _property(property, schema, params) {
    return new checks.$ZodCheckProperty({
        check: "property",
        property,
        schema,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _properties(shape, params) {
    return new checks.$ZodCheckProperties({
        check: "properties",
        shape,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _mime(types, params) {
    return new checks.$ZodCheckMimeType({
        check: "mime_type",
        mime: types,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
    return new _checks_js__rspack_import_1/* .$ZodCheckOverwrite */.v$({
        check: "overwrite",
        tx,
    });
}
// normalize
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
    return _overwrite((input) => input.normalize(form));
}
// trim
// @__NO_SIDE_EFFECTS__
function _trim() {
    return _overwrite((input) => input.trim());
}
// toLowerCase
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
    return _overwrite((input) => input.toLowerCase());
}
// toUpperCase
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
    return _overwrite((input) => input.toUpperCase());
}
// slugify
// @__NO_SIDE_EFFECTS__
function _slugify() {
    return _overwrite((input) => _util_js__rspack_import_0/* .slugify */.Yv(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class, element, params) {
    return new Class({
        type: "array",
        element,
        // get element() {
        //   return element;
        // },
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _union(Class, options, params) {
    return new Class({
        type: "union",
        options,
        ...util.normalizeParams(params),
    });
}
function _xor(Class, options, params) {
    return new Class({
        type: "union",
        options,
        inclusive: false,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _discriminatedUnion(Class, discriminator, options, params) {
    return new Class({
        type: "union",
        options: options,
        discriminator,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _intersection(Class, left, right) {
    return new Class({
        type: "intersection",
        left,
        right,
    });
}
// export function _tuple(
//   Class: util.SchemaClass<schemas.$ZodTuple>,
//   items: [],
//   params?: string | $ZodTupleParams
// ): schemas.$ZodTuple<[], null>;
// @__NO_SIDE_EFFECTS__
function _tuple(Class, items, _paramsOrRest, _params) {
    const hasRest = _paramsOrRest instanceof schemas.$ZodType;
    const params = hasRest ? _params : _paramsOrRest;
    const rest = hasRest ? _paramsOrRest : null;
    return new Class({
        type: "tuple",
        items,
        rest,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _record(Class, keyType, valueType, params) {
    return new Class({
        type: "record",
        keyType,
        valueType,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _map(Class, keyType, valueType, params) {
    return new Class({
        type: "map",
        keyType,
        valueType,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _set(Class, valueType, params) {
    return new Class({
        type: "set",
        valueType,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _enum(Class, values, params) {
    const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
    // if (Array.isArray(values)) {
    //   for (const value of values) {
    //     entries[value] = value;
    //   }
    // } else {
    //   Object.assign(entries, values);
    // }
    // const entries: util.EnumLike = {};
    // for (const val of values) {
    //   entries[val] = val;
    // }
    return new Class({
        type: "enum",
        entries,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
/** @deprecated This API has been merged into `z.enum()`. Use `z.enum()` instead.
 *
 * ```ts
 * enum Colors { red, green, blue }
 * z.enum(Colors);
 * ```
 */
function _nativeEnum(Class, entries, params) {
    return new Class({
        type: "enum",
        entries,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _literal(Class, value, params) {
    return new Class({
        type: "literal",
        values: Array.isArray(value) ? value : [value],
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _file(Class, params) {
    return new Class({
        type: "file",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _transform(Class, fn) {
    return new Class({
        type: "transform",
        transform: fn,
    });
}
// @__NO_SIDE_EFFECTS__
function _optional(Class, innerType) {
    return new Class({
        type: "optional",
        innerType,
    });
}
// @__NO_SIDE_EFFECTS__
function _nullable(Class, innerType) {
    return new Class({
        type: "nullable",
        innerType,
    });
}
// @__NO_SIDE_EFFECTS__
function _default(Class, innerType, defaultValue) {
    return new Class({
        type: "default",
        innerType,
        get defaultValue() {
            return typeof defaultValue === "function" ? defaultValue() : util.shallowClone(defaultValue);
        },
    });
}
// @__NO_SIDE_EFFECTS__
function _nonoptional(Class, innerType, params) {
    return new Class({
        type: "nonoptional",
        innerType,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _success(Class, innerType) {
    return new Class({
        type: "success",
        innerType,
    });
}
// @__NO_SIDE_EFFECTS__
function _catch(Class, innerType, catchValue) {
    return new Class({
        type: "catch",
        innerType,
        catchValue: (typeof catchValue === "function" ? catchValue : util.constantCatch(catchValue)),
    });
}
// @__NO_SIDE_EFFECTS__
function _pipe(Class, in_, out) {
    return new Class({
        type: "pipe",
        in: in_,
        out,
    });
}
// @__NO_SIDE_EFFECTS__
function _readonly(Class, innerType) {
    return new Class({
        type: "readonly",
        innerType,
    });
}
// @__NO_SIDE_EFFECTS__
function _templateLiteral(Class, parts, params) {
    return new Class({
        type: "template_literal",
        parts,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _lazy(Class, getter) {
    return new Class({
        type: "lazy",
        getter,
    });
}
// @__NO_SIDE_EFFECTS__
function _promise(Class, innerType) {
    return new Class({
        type: "promise",
        innerType,
    });
}
// @__NO_SIDE_EFFECTS__
function _custom(Class, fn, _params) {
    const norm = util.normalizeParams(_params);
    norm.abort ?? (norm.abort = true); // default to abort:false
    const schema = new Class({
        type: "custom",
        check: "custom",
        fn: fn,
        ...norm,
    });
    return schema;
}
// same as _custom but defaults to abort:false
// @__NO_SIDE_EFFECTS__
function _refine(Class, fn, _params) {
    const schema = new Class({
        type: "custom",
        check: "custom",
        fn: fn,
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(_params),
    });
    return schema;
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
    const ch = _check((payload) => {
        payload.addIssue = (issue) => {
            if (typeof issue === "string") {
                payload.issues.push(_util_js__rspack_import_0/* .issue */.sn(issue, payload.value, ch._zod.def));
            }
            else {
                // for Zod 3 backwards compatibility
                const _issue = issue;
                if (_issue.fatal)
                    _issue.continue = false;
                _issue.code ?? (_issue.code = "custom");
                if (!("input" in _issue))
                    _issue.input = payload.value;
                _issue.inst ?? (_issue.inst = ch);
                _issue.continue ?? (_issue.continue = !ch._zod.def.abort); // abort is always undefined, so this is always true...
                payload.issues.push(_util_js__rspack_import_0/* .issue */.sn(_issue));
            }
        };
        return fn(payload.value, payload);
    }, params);
    return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
    const ch = new _checks_js__rspack_import_1/* .$ZodCheck */.QP({
        check: "custom",
        ..._util_js__rspack_import_0/* .normalizeParams */.A2(params),
    });
    ch._zod.check = fn;
    return ch;
}
// @__NO_SIDE_EFFECTS__
function describe(description) {
    const ch = new _checks_js__rspack_import_1/* .$ZodCheck */.QP({ check: "describe" });
    ch._zod.onattach = [
        (inst) => {
            const existing = _registries_js__rspack_import_2/* .globalRegistry.get */.fd.get(inst) ?? {};
            _registries_js__rspack_import_2/* .globalRegistry.add */.fd.add(inst, { ...existing, description });
        },
    ];
    ch._zod.check = () => { }; // no-op check
    return ch;
}
// @__NO_SIDE_EFFECTS__
function meta(metadata) {
    const ch = new _checks_js__rspack_import_1/* .$ZodCheck */.QP({ check: "meta" });
    ch._zod.onattach = [
        (inst) => {
            const existing = _registries_js__rspack_import_2/* .globalRegistry.get */.fd.get(inst) ?? {};
            _registries_js__rspack_import_2/* .globalRegistry.add */.fd.add(inst, { ...existing, ...metadata });
        },
    ];
    ch._zod.check = () => { }; // no-op check
    return ch;
}
// @__NO_SIDE_EFFECTS__
function _stringbool(Classes, _params) {
    const params = util.normalizeParams(_params);
    let truthyArray = params.truthy ?? ["true", "1", "yes", "on", "y", "enabled"];
    let falsyArray = params.falsy ?? ["false", "0", "no", "off", "n", "disabled"];
    if (params.case !== "sensitive") {
        truthyArray = truthyArray.map((v) => (typeof v === "string" ? v.toLowerCase() : v));
        falsyArray = falsyArray.map((v) => (typeof v === "string" ? v.toLowerCase() : v));
    }
    const truthySet = new Set(truthyArray);
    const falsySet = new Set(falsyArray);
    const _Codec = Classes.Codec ?? schemas.$ZodCodec;
    const _Boolean = Classes.Boolean ?? schemas.$ZodBoolean;
    const _String = Classes.String ?? schemas.$ZodString;
    const stringSchema = new _String({ type: "string", error: params.error });
    const booleanSchema = new _Boolean({ type: "boolean", error: params.error });
    const codec = new _Codec({
        type: "pipe",
        in: stringSchema,
        out: booleanSchema,
        transform: ((input, payload) => {
            let data = input;
            if (params.case !== "sensitive")
                data = data.toLowerCase();
            if (truthySet.has(data)) {
                return true;
            }
            else if (falsySet.has(data)) {
                return false;
            }
            else {
                payload.issues.push({
                    code: "invalid_value",
                    expected: "stringbool",
                    values: [...truthySet, ...falsySet],
                    input: payload.value,
                    inst: codec,
                    continue: false,
                });
                return {};
            }
        }),
        reverseTransform: ((input, _payload) => {
            if (input === true) {
                return truthyArray[0] || "true";
            }
            else {
                return falsyArray[0] || "false";
            }
        }),
        error: params.error,
    });
    codec._zod.bag.truthy = truthyArray;
    codec._zod.bag.falsy = falsyArray;
    codec._zod.bag.case = params.case ?? "insensitive";
    return codec;
}
// @__NO_SIDE_EFFECTS__
function _stringFormat(Class, format, fnOrRegex, _params = {}) {
    const params = util.normalizeParams(_params);
    const def = {
        check: "string_format",
        type: "string",
        format,
        fn: typeof fnOrRegex === "function" ? fnOrRegex : (val) => fnOrRegex.test(val),
        ...params,
    };
    if (fnOrRegex instanceof RegExp) {
        def.pattern = fnOrRegex;
    }
    const inst = new Class(def);
    return inst;
}

__webpack_require__.d(__webpack_exports__, {
  $O: () => (_ipv6),
  $S: () => (_startsWith),
  Au: () => (_lt),
  Be: () => (_uuid),
  Bj: () => (_cuid2),
  Ct: () => (_ulid),
  Dl: () => (_nanoid),
  ER: () => (_endsWith),
  Eb: () => (_maxLength),
  F7: () => (_number),
  Fk: () => (_regex),
  Fn: () => (_url),
  G1: () => (_isoDateTime),
  G8: () => (_never),
  Hi: () => (_multipleOf),
  Il: () => (_toLowerCase),
  KB: () => (_e164),
  Kn: () => (_isoTime),
  LK: () => (_int),
  MB: () => (_superRefine),
  Mu: () => (_email),
  Ny: () => (_ipv4),
  Pw: () => (_xid),
  Rl: () => (_string),
  TL: () => (_slugify),
  Tx: () => (_gt),
  Uy: () => (_cidrv4),
  WN: () => (_trim),
  YA: () => (_length),
  Zm: () => (_lte),
  _L: () => (_boolean),
  _z: () => (_ksuid),
  aC: () => (_emoji),
  bS: () => (_overwrite),
  cU: () => (_base64url),
  dR: () => (_includes),
  dZ: () => (_array),
  db: () => (_isoDate),
  em: () => (_unknown),
  f2: () => (_isoDuration),
  fU: () => (_refine),
  fs: () => (_cuid),
  gP: () => (_cidrv6),
  hH: () => (_lowercase),
  lo: () => (_normalize),
  m9: () => (_minLength),
  mI: () => (meta),
  nA: () => (_uuidv4),
  pY: () => (_uuidv6),
  q0: () => (describe),
  qF: () => (_uppercase),
  qm: () => (_gte),
  rk: () => (_jwt),
  rt: () => (_base64),
  tB: () => (_guid),
  wA: () => (_uuidv7),
  xY: () => (_toUpperCase)
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/checks.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _core_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/core.js");
/* import */ var _regexes_js__rspack_import_2 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/regexes.js");
/* import */ var _util_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js");
// import { $ZodType } from "./schemas.js";



const $ZodCheck = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheck", (inst, def) => {
    var _a;
    inst._zod ?? (inst._zod = {});
    inst._zod.def = def;
    (_a = inst._zod).onattach ?? (_a.onattach = []);
});
/** Default `when` for size-based checks: run only on non-nullish values with a `size`. */
const _whenHasSize = (payload) => {
    const val = payload.value;
    return !util.nullish(val) && val.size !== undefined;
};
/** Default `when` for length-based checks: run only on non-nullish values with a `length`. */
const _whenHasLength = (payload) => {
    const val = payload.value;
    return !_util_js__rspack_import_1/* .nullish */.cl(val) && val.length !== undefined;
};
const numericOriginMap = {
    number: "number",
    bigint: "bigint",
    object: "date",
};
const $ZodCheckLessThan = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheckLessThan", (inst, def) => {
    $ZodCheck.init(inst, def);
    const origin = numericOriginMap[typeof def.value];
    inst._zod.check = (payload) => {
        if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
            return;
        }
        payload.issues.push({
            origin: numericOriginMap[typeof payload.value] ?? origin,
            code: "too_big",
            maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
            input: payload.value,
            inclusive: def.inclusive,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckGreaterThan = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheckGreaterThan", (inst, def) => {
    $ZodCheck.init(inst, def);
    const origin = numericOriginMap[typeof def.value];
    inst._zod.check = (payload) => {
        if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
            return;
        }
        payload.issues.push({
            origin: numericOriginMap[typeof payload.value] ?? origin,
            code: "too_small",
            minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
            input: payload.value,
            inclusive: def.inclusive,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckMultipleOf = 
/*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheckMultipleOf", (inst, def) => {
    $ZodCheck.init(inst, def);
    inst._zod.check = (payload) => {
        if (typeof payload.value !== typeof def.value)
            throw new Error("Cannot mix number and bigint in multiple_of check.");
        const isMultiple = typeof payload.value === "bigint"
            ? // `value % 0n` throws, and nothing is a multiple of zero — the number branch already fails this way via NaN
                def.value !== BigInt(0) && payload.value % def.value === BigInt(0)
            : _util_js__rspack_import_1/* .floatSafeRemainder */.LG(payload.value, def.value) === 0;
        if (isMultiple)
            return;
        payload.issues.push({
            origin: typeof payload.value,
            code: "not_multiple_of",
            divisor: def.value,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckNumberFormat = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheckNumberFormat", (inst, def) => {
    $ZodCheck.init(inst, def); // no format checks
    def.format = def.format || "float64";
    const isInt = def.format?.includes("int");
    const origin = isInt ? "int" : "number";
    const [minimum, maximum] = _util_js__rspack_import_1/* .NUMBER_FORMAT_RANGES */.zH[def.format];
    inst._zod.check = (payload) => {
        const input = payload.value;
        if (isInt) {
            if (!Number.isInteger(input)) {
                // invalid_format issue
                // payload.issues.push({
                //   expected: def.format,
                //   format: def.format,
                //   code: "invalid_format",
                //   input,
                //   inst,
                // });
                // invalid_type issue
                payload.issues.push({
                    expected: origin,
                    format: def.format,
                    code: "invalid_type",
                    continue: false,
                    input,
                    inst,
                });
                return;
                // not_multiple_of issue
                // payload.issues.push({
                //   code: "not_multiple_of",
                //   origin: "number",
                //   input,
                //   inst,
                //   divisor: 1,
                // });
            }
            if (!Number.isSafeInteger(input)) {
                if (input > 0) {
                    // too_big
                    payload.issues.push({
                        input,
                        code: "too_big",
                        maximum: Number.MAX_SAFE_INTEGER,
                        note: "Integers must be within the safe integer range.",
                        inst,
                        origin,
                        inclusive: true,
                        continue: !def.abort,
                    });
                }
                else {
                    // too_small
                    payload.issues.push({
                        input,
                        code: "too_small",
                        minimum: Number.MIN_SAFE_INTEGER,
                        note: "Integers must be within the safe integer range.",
                        inst,
                        origin,
                        inclusive: true,
                        continue: !def.abort,
                    });
                }
                return;
            }
        }
        if (input < minimum) {
            payload.issues.push({
                origin: "number",
                input,
                code: "too_small",
                minimum,
                inclusive: true,
                inst,
                continue: !def.abort,
            });
        }
        if (input > maximum) {
            payload.issues.push({
                origin: "number",
                input,
                code: "too_big",
                maximum,
                inclusive: true,
                inst,
                continue: !def.abort,
            });
        }
    };
});
const $ZodCheckBigIntFormat = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCheckBigIntFormat", (inst, def) => {
    $ZodCheck.init(inst, def); // no format checks
    const [minimum, maximum] = util.BIGINT_FORMAT_RANGES[def.format];
    inst._zod.check = (payload) => {
        const input = payload.value;
        if (input < minimum) {
            payload.issues.push({
                origin: "bigint",
                input,
                code: "too_small",
                minimum: minimum,
                inclusive: true,
                inst,
                continue: !def.abort,
            });
        }
        if (input > maximum) {
            payload.issues.push({
                origin: "bigint",
                input,
                code: "too_big",
                maximum,
                inclusive: true,
                inst,
                continue: !def.abort,
            });
        }
    };
})));
const $ZodCheckMaxSize = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCheckMaxSize", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = _whenHasSize);
    inst._zod.check = (payload) => {
        const input = payload.value;
        const size = input.size;
        if (size <= def.maximum)
            return;
        payload.issues.push({
            origin: util.getSizableOrigin(input),
            code: "too_big",
            maximum: def.maximum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort,
        });
    };
})));
const $ZodCheckMinSize = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCheckMinSize", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = _whenHasSize);
    inst._zod.check = (payload) => {
        const input = payload.value;
        const size = input.size;
        if (size >= def.minimum)
            return;
        payload.issues.push({
            origin: util.getSizableOrigin(input),
            code: "too_small",
            minimum: def.minimum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort,
        });
    };
})));
const $ZodCheckSizeEquals = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCheckSizeEquals", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = _whenHasSize);
    inst._zod.check = (payload) => {
        const input = payload.value;
        const size = input.size;
        if (size === def.size)
            return;
        const tooBig = size > def.size;
        payload.issues.push({
            origin: util.getSizableOrigin(input),
            ...(tooBig ? { code: "too_big", maximum: def.size } : { code: "too_small", minimum: def.size }),
            inclusive: true,
            exact: true,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
})));
const $ZodCheckMaxLength = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheckMaxLength", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
    inst._zod.check = (payload) => {
        const input = payload.value;
        const units = input.length;
        // Strings are measured in Unicode code points, not UTF-16 units. A code point is at most two units, so a string that already fits in units fits in code points; only an overflow has to be counted.
        const length = typeof input === "string" && units > def.maximum ? _util_js__rspack_import_1/* .codePointLength */.O7(input) : units;
        if (length <= def.maximum)
            return;
        const origin = _util_js__rspack_import_1/* .getLengthableOrigin */.Rc(input);
        payload.issues.push({
            origin,
            code: "too_big",
            maximum: def.maximum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckMinLength = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheckMinLength", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
    inst._zod.check = (payload) => {
        const input = payload.value;
        const units = input.length;
        // A code point is one or two UTF-16 units, so fewer units than the floor can never reach it and twice the floor always clears it. Only in between is the exact count in doubt.
        const length = typeof input === "string" && units >= def.minimum && units < def.minimum * 2
            ? _util_js__rspack_import_1/* .codePointLength */.O7(input)
            : units;
        if (length >= def.minimum)
            return;
        const origin = _util_js__rspack_import_1/* .getLengthableOrigin */.Rc(input);
        payload.issues.push({
            origin,
            code: "too_small",
            minimum: def.minimum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckLengthEquals = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheckLengthEquals", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
    inst._zod.check = (payload) => {
        const input = payload.value;
        const units = input.length;
        // A code point is one or two UTF-16 units, so outside `[length, length * 2]` units the target is missed either way — and missed in the same direction in both measures.
        const length = typeof input === "string" && units >= def.length && units <= def.length * 2
            ? _util_js__rspack_import_1/* .codePointLength */.O7(input)
            : units;
        if (length === def.length)
            return;
        const origin = _util_js__rspack_import_1/* .getLengthableOrigin */.Rc(input);
        const tooBig = length > def.length;
        payload.issues.push({
            origin,
            ...(tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length }),
            inclusive: true,
            exact: true,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckStringFormat = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheckStringFormat", (inst, def) => {
    var _a, _b;
    $ZodCheck.init(inst, def);
    if (def.pattern)
        (_a = inst._zod).check ?? (_a.check = (payload) => {
            def.pattern.lastIndex = 0;
            if (def.pattern.test(payload.value))
                return;
            payload.issues.push({
                origin: "string",
                code: "invalid_format",
                format: def.format,
                input: payload.value,
                ...(def.pattern ? { pattern: def.pattern.toString() } : {}),
                inst,
                continue: !def.abort,
            });
        });
    else
        (_b = inst._zod).check ?? (_b.check = () => { });
});
const $ZodCheckRegex = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheckRegex", (inst, def) => {
    $ZodCheckStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
        def.pattern.lastIndex = 0;
        if (def.pattern.test(payload.value))
            return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "regex",
            input: payload.value,
            pattern: def.pattern.toString(),
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckLowerCase = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheckLowerCase", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_2/* .lowercase */.AC);
    $ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckUpperCase = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheckUpperCase", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_2/* .uppercase */.Zv);
    $ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckIncludes = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheckIncludes", (inst, def) => {
    $ZodCheck.init(inst, def);
    const escapedRegex = _util_js__rspack_import_1/* .escapeRegex */.sD(def.includes);
    // `String.prototype.includes(sub, position)` matches `sub` at `position`
    // OR LATER, so the pattern must allow at least `position` leading chars
    // (`{N,}`), not exactly `position` chars (`{N}`).
    const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
    def.pattern = pattern;
    inst._zod.check = (payload) => {
        if (payload.value.includes(def.includes, def.position))
            return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "includes",
            includes: def.includes,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckStartsWith = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheckStartsWith", (inst, def) => {
    $ZodCheck.init(inst, def);
    const pattern = new RegExp(`^${_util_js__rspack_import_1/* .escapeRegex */.sD(def.prefix)}.*`);
    def.pattern ?? (def.pattern = pattern);
    inst._zod.check = (payload) => {
        if (payload.value.startsWith(def.prefix))
            return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "starts_with",
            prefix: def.prefix,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckEndsWith = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheckEndsWith", (inst, def) => {
    $ZodCheck.init(inst, def);
    const pattern = new RegExp(`.*${_util_js__rspack_import_1/* .escapeRegex */.sD(def.suffix)}$`);
    def.pattern ?? (def.pattern = pattern);
    inst._zod.check = (payload) => {
        if (payload.value.endsWith(def.suffix))
            return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "ends_with",
            suffix: def.suffix,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
///////////////////////////////////
/////    $ZodCheckProperty    /////
///////////////////////////////////
function handleCheckPropertyResult(result, payload, property) {
    if (result.issues.length) {
        payload.issues.push(...util.prefixIssues(property, result.issues));
    }
}
const $ZodCheckProperty = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCheckProperty", (inst, def) => {
    $ZodCheck.init(inst, def);
    inst._zod.check = (payload) => {
        const result = def.schema._zod.run({
            value: payload.value[def.property],
            issues: [],
        }, {});
        if (result instanceof Promise) {
            return result.then((result) => handleCheckPropertyResult(result, payload, def.property));
        }
        handleCheckPropertyResult(result, payload, def.property);
        return;
    };
})));
const $ZodCheckProperties = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCheckProperties", (inst, def) => {
    $ZodCheck.init(inst, def);
    util.hide(inst, Symbol.iterator, function* () {
        yield inst;
    });
    // key and schema snapshotted together: reading one live and the other cached lets a later mutation of the caller's shape object pair a stale key with a missing schema
    let entries;
    inst._zod.check = (payload) => {
        // the base schema already typed the value, so only a nullish one is rejected here: the properties read on a primitive too, matching z.property() on a string's length
        if (payload.value == null) {
            payload.issues.push({ expected: "object", code: "invalid_type", input: payload.value, inst });
            return undefined;
        }
        entries ?? (entries = Reflect.ownKeys(def.shape).map((key) => [key, def.shape[key]]));
        const input = payload.value;
        let proms;
        for (const [key, schema] of entries) {
            const result = schema._zod.run({ value: input[key], issues: [] }, {});
            if (result instanceof Promise) {
                proms ?? (proms = []);
                proms.push(result.then((result) => handleCheckPropertyResult(result, payload, key)));
            }
            else {
                handleCheckPropertyResult(result, payload, key);
            }
        }
        if (proms)
            return Promise.all(proms).then(() => undefined);
        return undefined;
    };
})));
const $ZodCheckMimeType = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCheckMimeType", (inst, def) => {
    $ZodCheck.init(inst, def);
    const mimeSet = new Set(def.mime);
    inst._zod.check = (payload) => {
        if (mimeSet.has(payload.value.type))
            return;
        payload.issues.push({
            code: "invalid_value",
            values: def.mime,
            input: payload.value.type,
            inst,
            continue: !def.abort,
        });
    };
})));
const $ZodCheckOverwrite = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCheckOverwrite", (inst, def) => {
    $ZodCheck.init(inst, def);
    inst._zod.check = (payload) => {
        payload.value = def.tx(payload.value);
    };
});

__webpack_require__.d(__webpack_exports__, {
}, {
  DG: $ZodCheckRegex,
  E6: $ZodCheckEndsWith,
  J: $ZodCheckStartsWith,
  J_: $ZodCheckGreaterThan,
  Jk: $ZodCheckMultipleOf,
  KH: $ZodCheckNumberFormat,
  Kk: $ZodCheckMinLength,
  NI: $ZodCheckLowerCase,
  QP: $ZodCheck,
  RM: $ZodCheckLengthEquals,
  Tt: $ZodCheckIncludes,
  Yk: $ZodCheckMaxLength,
  kH: $ZodCheckUpperCase,
  ql: $ZodCheckStringFormat,
  sm: $ZodCheckLessThan,
  v$: $ZodCheckOverwrite
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/core.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.d(__webpack_exports__, {
  $W: () => (config),
  GT: () => ($ZodAsyncError),
  cV: () => ($ZodEncodeError),
  cr: () => (globalConfig),
  xI: () => ($constructor)
});
/* import */ var _util_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js");
var _a;

/** A special constant with type `never` */
const NEVER = /*@__PURE__*/ (/* unused pure expression or super */ null && (Object.freeze({
    status: "aborted",
})));
/* Shared descriptor for installing `_zod`; defineProperty reads it
 * synchronously, so reusing one object avoids a per-instance allocation. */
const _zodDesc = { value: undefined, enumerable: false };
// null where suppressing the capture would be unrecoverable: `parse()` puts the frames back with `captureStackTrace`, so without it the throw would lose its stack. also latched to null once `stackTraceLimit` proves unassignable, which a realm can do at any point by hardening Error
let _E = "captureStackTrace" in Error ? Error : null;
// v8 captures a stack trace inside the Error constructor, which dominates a failed parse; costs only the frames, and parse() restores those. the constructor must RUN: Object.create is cheaper and passes instanceof, but Error.isError and util.types.isNativeError check an internal slot
function newError(Definition) {
    const E = _E;
    if (E) {
        const saved = E.stackTraceLimit;
        if (typeof saved === "number") {
            try {
                E.stackTraceLimit = 0;
            }
            catch {
                _E = null;
                return new Definition();
            }
            try {
                return new Definition();
            }
            finally {
                E.stackTraceLimit = saved;
            }
        }
    }
    return new Definition();
}
function $constructor(name, initializer, 
/** This trait's members, installed once on every prototype that composes it. They cannot be declared in the initializer above: that runs per instance, and the prototype is shared. */
proto, params) {
    // Prototype for this constructor's `_zod` internals. Lazily-derived fields (`values`, `pattern`, `optin`, …) install here once rather than as an accessor on every instance.
    const zodProto = {};
    // Assigning the fields in the constructor body is what gives instances in-object slots; building the object literally and reparenting it costs a second allocation and a generic property copy.
    function Internals(def) {
        this.def = def;
        this.constr = _;
        this.traits = new Set();
    }
    Internals.prototype = zodProto;
    const protoMembers = proto;
    // One trait's members land on every prototype whose chain composes it, so the answer is per prototype rather than per trait.
    const initialized = protoMembers && new WeakSet();
    function init(inst, def) {
        if (!inst._zod) {
            _zodDesc.value = new Internals(def);
            try {
                Object.defineProperty(inst, "_zod", _zodDesc);
            }
            finally {
                // Cleared even on throw, so the shared descriptor never leaks one instance's internals into the next.
                _zodDesc.value = undefined;
            }
        }
        else if (inst._zod.traits.has(name)) {
            return;
        }
        inst._zod.traits.add(name);
        initializer(inst, def);
        if (initialized) {
            // `super(def)` from a user subclass gives `this` a prototype the subclass owns, and installing there would overwrite whatever the subclass declared. `constr` built the instance, so its prototype is the one below the subclass's that should carry the members. A receiver whose chain never reaches that prototype installs on its own, which for a plain object handed straight to `init` means `Object.prototype` — unchanged from before.
            const own = Object.getPrototypeOf(inst);
            const ctorProto = inst._zod.constr.prototype;
            let up = own;
            while (up && up !== ctorProto)
                up = Object.getPrototypeOf(up);
            const target = up ?? own;
            if (!initialized.has(target)) {
                initialized.add(target);
                (0,_util_js__rspack_import_0/* .members */.ol)(target, protoMembers);
            }
        }
        // support prototype modifications; for-in avoids the array allocation of Object.keys on the (usually empty) prototype
        const proto = _.prototype;
        for (const k in proto) {
            if (!Object.prototype.hasOwnProperty.call(proto, k))
                continue;
            if (!(k in inst)) {
                inst[k] = proto[k].bind(inst);
            }
        }
    }
    // doesn't work if Parent has a constructor with arguments
    const Parent = params?.Parent ?? Object;
    class Definition extends Parent {
    }
    Object.defineProperty(Definition, "name", { value: name });
    function _(def) {
        const inst = params?.Parent ? newError(Definition) : this;
        init(inst, def);
        const deferred = inst._zod.deferred;
        if (deferred) {
            for (const fn of deferred) {
                fn();
            }
            // Released: initializers run once, and the list would otherwise be retained for the schema's lifetime.
            inst._zod.deferred = undefined;
        }
        // Global post-processor hook. Internal: installed by `import "zod/compile"` to enable AOT compilation for every constructed schema. Runs last, once the instance is fully built, because it hands the instance to compile(). The post-processor is expected to be reentrancy-guarded by its own implementation.
        const pp = globalThis.__zod_globalConfig?.postProcessor;
        if (pp)
            pp(inst);
        return inst;
    }
    Object.defineProperty(_, "init", { value: init });
    Object.defineProperty(_, Symbol.hasInstance, {
        value: (inst) => {
            if (params?.Parent && inst instanceof params.Parent)
                return true;
            return inst?._zod?.traits?.has(name);
        },
    });
    Object.defineProperty(_, "name", { value: name });
    return _;
}
//////////////////////////////   UTILITIES   ///////////////////////////////////////
const $brand = /*@__PURE__*/ (/* unused pure expression or super */ null && (Symbol("zod_brand")));
class $ZodAsyncError extends Error {
    constructor() {
        super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
    }
}
class $ZodEncodeError extends Error {
    constructor(name) {
        super(`Encountered unidirectional transform during encode: ${name}`);
        this.name = "ZodEncodeError";
    }
}
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
const globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
    if (newConfig)
        Object.assign(globalConfig, newConfig);
    return globalConfig;
}


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/doc.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
class Doc {
    constructor(args = [], closed = {}) {
        this.content = [];
        this.indent = 0;
        this.args = args;
        this.closed = closed;
    }
    // the compiler catches a child's throw and keeps writing into this doc, so the indent has to unwind with it
    indented(fn) {
        this.indent += 1;
        try {
            fn(this);
        }
        finally {
            this.indent -= 1;
        }
    }
    write(arg) {
        if (typeof arg === "function") {
            arg(this, { execution: "sync" });
            arg(this, { execution: "async" });
            return;
        }
        const content = arg;
        const lines = content.split("\n").filter((x) => x);
        const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
        const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
        for (const line of dedented) {
            this.content.push(line);
        }
    }
    compile() {
        const F = Function;
        const content = this?.content ?? [``];
        const factory = new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {\n${content.join("\n")}\n};`);
        return factory(...Object.values(this.closed));
    }
}

__webpack_require__.d(__webpack_exports__, {
  J: () => (Doc)
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/errors.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _core_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/core.js");
/* import */ var _util_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js");


/* Computing the message eagerly is expensive (pretty-printed JSON of all
 * issues), so defer it until first read. The accessor functions and
 * descriptors are shared across instances to keep error construction
 * cheap; the computed message is cached on the internals object. The
 * setter preserves plain assignment semantics for consumers that
 * overwrite `message`. */
function _getMessage() {
    const internals = this._zod;
    internals.message ?? (internals.message = JSON.stringify(internals.def, _util_js__rspack_import_0/* .jsonStringifyReplacer */.k8, 2));
    return internals.message;
}
function _setMessage(value) {
    this._zod.message = value;
}
const _messageDesc = {
    get: _getMessage,
    set: _setMessage,
    enumerable: true,
    configurable: true,
};
const _issuesDesc = { value: undefined, enumerable: false };
/* Prototypes that already carry the lazy `toString`. Seeded with the
 * intrinsics so that `init` on a foreign object — it accepts any object —
 * can never install an accessor onto a prototype we do not own. */
const _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
const initializer = (inst, def) => {
    inst.name = "$ZodError";
    // `_zod` is already non-enumerable: $constructor's init defined it with this same descriptor
    _issuesDesc.value = def;
    Object.defineProperty(inst, "issues", _issuesDesc);
    // Clear the shared slot; a retained `value` pins the last error's issues.
    _issuesDesc.value = undefined;
    Object.defineProperty(inst, "message", _messageDesc);
    /* `toString` lives as a non-enumerable lazy getter on the shared
     * prototype; on first access it caches a per-instance closure so
     * detached usage still works. */
    const proto = Object.getPrototypeOf(inst);
    if (!_installedToString.has(proto)) {
        _installedToString.add(proto);
        Object.defineProperty(proto, "toString", {
            configurable: true,
            enumerable: false,
            get() {
                const value = () => this.message;
                Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
                return value;
            },
            set(value) {
                Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
            },
        });
    }
};
const $ZodError = (0,_core_js__rspack_import_1/* .$constructor */.xI)("$ZodError", initializer);
const $ZodRealError = (0,_core_js__rspack_import_1/* .$constructor */.xI)("$ZodError", initializer, undefined, {
    Parent: Error,
});
/** Get-or-create `obj[key]` as an own data property. A path segment naming an inherited member
 * ("toString", "constructor") would otherwise read through to the prototype, and assigning
 * "__proto__" would hit the setter instead of creating a key. */
function node(obj, key, make) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
        if (key === "__proto__") {
            Object.defineProperty(obj, key, { value: make(), writable: true, enumerable: true, configurable: true });
        }
        else {
            obj[key] = make();
        }
    }
    return obj[key];
}
function flattenError(error, mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of error.issues) {
        if (sub.path.length > 0) {
            node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
        }
        else {
            formErrors.push(mapper(sub));
        }
    }
    return { formErrors, fieldErrors };
}
function formatError(error, mapper = (issue) => issue.message) {
    const fieldErrors = { _errors: [] };
    const processError = (error, path = []) => {
        for (const issue of error.issues) {
            if (issue.code === "invalid_union" && issue.errors.length) {
                issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
            }
            else if (issue.code === "invalid_key") {
                processError({ issues: issue.issues }, [...path, ...issue.path]);
            }
            else if (issue.code === "invalid_element") {
                processError({ issues: issue.issues }, [...path, ...issue.path]);
            }
            else {
                const fullpath = [...path, ...issue.path];
                if (fullpath.length === 0) {
                    fieldErrors._errors.push(mapper(issue));
                }
                else {
                    let curr = fieldErrors;
                    let i = 0;
                    while (i < fullpath.length) {
                        const el = fullpath[i];
                        const terminal = i === fullpath.length - 1;
                        // `_errors` is reserved by this legacy format, so merge a matching path segment into the current node instead of treating its array as a child.
                        if (el === "_errors") {
                            if (terminal)
                                curr._errors.push(mapper(issue));
                            i++;
                            continue;
                        }
                        // A path element may collide with an inherited property name such as
                        // "__proto__" or "constructor". Truthiness checks read the prototype
                        // (so no node is created, then ._errors.push throws), and bracket
                        // assignment of "__proto__" hits the setter instead of creating an
                        // own key. Guard the read with hasOwnProperty and create the node
                        // with defineProperty so any path element becomes a real own key.
                        if (!Object.prototype.hasOwnProperty.call(curr, el)) {
                            Object.defineProperty(curr, el, {
                                value: { _errors: [] },
                                enumerable: true,
                                writable: true,
                                configurable: true,
                            });
                        }
                        const node = curr[el];
                        if (terminal) {
                            node._errors.push(mapper(issue));
                        }
                        curr = node;
                        i++;
                    }
                }
            }
        }
    };
    processError(error);
    return fieldErrors;
}
function treeifyError(error, mapper = (issue) => issue.message) {
    const result = { errors: [] };
    const processError = (error, path = []) => {
        var _a;
        for (const issue of error.issues) {
            if (issue.code === "invalid_union" && issue.errors.length) {
                // regular union error
                issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
            }
            else if (issue.code === "invalid_key") {
                processError({ issues: issue.issues }, [...path, ...issue.path]);
            }
            else if (issue.code === "invalid_element") {
                processError({ issues: issue.issues }, [...path, ...issue.path]);
            }
            else {
                const fullpath = [...path, ...issue.path];
                if (fullpath.length === 0) {
                    result.errors.push(mapper(issue));
                    continue;
                }
                let curr = result;
                let i = 0;
                while (i < fullpath.length) {
                    const el = fullpath[i];
                    const terminal = i === fullpath.length - 1;
                    if (typeof el === "string") {
                        curr.properties ?? (curr.properties = {});
                        // el may collide with an inherited property name ("__proto__",
                        // "constructor", ...); ??= reads the prototype so the node is never
                        // created and curr.errors.push throws. Guard with hasOwnProperty and
                        // create the node with defineProperty so "__proto__" becomes a real
                        // own key rather than invoking the prototype setter.
                        if (!Object.prototype.hasOwnProperty.call(curr.properties, el)) {
                            Object.defineProperty(curr.properties, el, {
                                value: { errors: [] },
                                enumerable: true,
                                writable: true,
                                configurable: true,
                            });
                        }
                        curr = curr.properties[el];
                    }
                    else {
                        curr.items ?? (curr.items = []);
                        (_a = curr.items)[el] ?? (_a[el] = { errors: [] });
                        curr = curr.items[el];
                    }
                    if (terminal) {
                        curr.errors.push(mapper(issue));
                    }
                    i++;
                }
            }
        }
    };
    processError(error);
    return result;
}
/** Format a ZodError as a human-readable string in the following form.
 *
 * From
 *
 * ```ts
 * ZodError {
 *   issues: [
 *     {
 *       expected: 'string',
 *       code: 'invalid_type',
 *       path: [ 'username' ],
 *       message: 'Invalid input: expected string'
 *     },
 *     {
 *       expected: 'number',
 *       code: 'invalid_type',
 *       path: [ 'favoriteNumbers', 1 ],
 *       message: 'Invalid input: expected number'
 *     }
 *   ];
 * }
 * ```
 *
 * to
 *
 * ```
 * username
 *   ✖ Expected number, received string at "username
 * favoriteNumbers[0]
 *   ✖ Invalid input: expected number
 * ```
 */
function toDotPath(_path) {
    const segs = [];
    const path = _path.map((seg) => (typeof seg === "object" ? seg.key : seg));
    for (const seg of path) {
        if (typeof seg === "number")
            segs.push(`[${seg}]`);
        else if (typeof seg === "symbol")
            segs.push(`[${JSON.stringify(String(seg))}]`);
        else if (/[^\w$]/.test(seg))
            segs.push(`[${JSON.stringify(seg)}]`);
        else {
            if (segs.length)
                segs.push(".");
            segs.push(seg);
        }
    }
    return segs.join("");
}
function prettifyError(error) {
    const lines = [];
    // sort by path length
    const issues = [...error.issues].sort((a, b) => (a.path ?? []).length - (b.path ?? []).length);
    // Process each issue
    for (const issue of issues) {
        lines.push(`✖ ${issue.message}`);
        if (issue.path?.length)
            lines.push(`  → at ${toDotPath(issue.path)}`);
    }
    // Convert Map to formatted string
    return lines.join("\n");
}

__webpack_require__.d(__webpack_exports__, {
  JM: () => (flattenError),
  Wk: () => (formatError)
}, {
  Kd: $ZodRealError,
  a$: $ZodError
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/json-schema-processors.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _regexes_js__rspack_import_2 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/regexes.js");
/* import */ var _schemas_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/schemas.js");
/* import */ var _to_json_schema_js__rspack_import_3 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/to-json-schema.js");
/* import */ var _util_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js");




const narrowMin = (agg, key, value) => {
    if (agg[key] === undefined || value > agg[key])
        agg[key] = value;
};
const narrowMax = (agg, key, value) => {
    if (agg[key] === undefined || value < agg[key])
        agg[key] = value;
};
const narrowBoth = (agg, value) => {
    narrowMin(agg, "minimum", value);
    narrowMax(agg, "maximum", value);
};
const addDivisor = (agg, value) => {
    agg.multipleOf ?? (agg.multipleOf = []);
    if (!agg.multipleOf.includes(value))
        agg.multipleOf.push(value);
};
const addPattern = (agg, pattern) => {
    agg.patterns ?? (agg.patterns = new Set());
    agg.patterns.add(pattern);
};
const intersectMime = (agg, mime) => {
    agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
};
// last-wins, matching the bag's historical write order; the flag keeps an integer format from being lost to a later float one
const setFormat = (agg, format) => {
    agg.format = format;
    if (format.includes("int"))
        agg.isInt = true;
};
const minContributor = (agg, def) => narrowMin(agg, "minimum", def.minimum);
const maxContributor = (agg, def) => narrowMax(agg, "maximum", def.maximum);
const formatContributor = (ranges) => (agg, def) => {
    setFormat(agg, def.format);
    const [minimum, maximum] = ranges[def.format];
    narrowMin(agg, "minimum", minimum);
    narrowMax(agg, "maximum", maximum);
};
const contributors = {
    greater_than: (agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
    less_than: (agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
    multiple_of: (agg, def) => addDivisor(agg, def.value),
    number_format: formatContributor(_util_js__rspack_import_0/* .NUMBER_FORMAT_RANGES */.zH),
    bigint_format: formatContributor(_util_js__rspack_import_0/* .BIGINT_FORMAT_RANGES */.NR),
    min_length: minContributor,
    max_length: maxContributor,
    length_equals: (agg, def) => narrowBoth(agg, def.length),
    min_size: minContributor,
    max_size: maxContributor,
    size_equals: (agg, def) => narrowBoth(agg, def.size),
    string_format: (agg, def) => {
        setFormat(agg, def.format);
        if (def.pattern)
            addPattern(agg, def.pattern);
        if (def.format === "base64" || def.format === "base64url")
            agg.contentEncoding = def.format;
        if (def.local || def.precision === -1)
            agg.laxFormat = true;
    },
    mime_type: (agg, def) => intersectMime(agg, def.mime),
};
function aggregateChecks(schema) {
    const agg = {};
    const def = schema._zod.def;
    // a format schema is its own first check, same rule as $ZodType init
    const list = schema._zod.traits.has("$ZodCheck")
        ? [schema, ...(def.checks ?? [])]
        : (def.checks ?? []);
    for (const ch of list)
        contributors[ch._zod.def.check]?.(agg, ch._zod.def);
    // reconcile with the bag so third-party onattach contributions still land; first-party residue is never tighter than the fold, so merging it back is idempotent for one and additive for the other
    const bag = schema._zod.bag;
    if (bag.minimum !== undefined)
        narrowMin(agg, "minimum", bag.minimum);
    if (bag.exclusiveMinimum !== undefined)
        narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
    if (bag.maximum !== undefined)
        narrowMax(agg, "maximum", bag.maximum);
    if (bag.exclusiveMaximum !== undefined)
        narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
    if (bag.multipleOf !== undefined)
        addDivisor(agg, bag.multipleOf);
    if (bag.format !== undefined) {
        agg.format ?? (agg.format = bag.format);
        if (bag.format.includes("int"))
            agg.isInt = true;
    }
    if (bag.mime)
        intersectMime(agg, bag.mime);
    for (const pattern of bag.patterns ?? [])
        addPattern(agg, pattern);
    return agg;
}
const formatMap = {
    guid: "uuid",
    url: "uri",
    datetime: "date-time",
    json_string: "json-string",
    regex: "", // do not set
};
// ==================== SIMPLE TYPE PROCESSORS ====================
// the runtime patterns are lax so parse paths never overflow the regex stack; the emitted schema swaps in the exact block forms, which zod itself never executes
const exactPatterns = new Map([
    [_schemas_js__rspack_import_1/* .base64Charset */.cq, _regexes_js__rspack_import_2/* .base64 */.K3],
    [_schemas_js__rspack_import_1/* .base64urlCharset */.xE, _regexes_js__rspack_import_2/* .base64url */.r0],
]);
const exactPattern = (p) => exactPatterns.get(p) ?? p;
const stringProcessor = (schema, ctx, _json, _params) => {
    const json = _json;
    json.type = "string";
    const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
    if (typeof minimum === "number")
        json.minLength = minimum;
    if (typeof maximum === "number")
        json.maxLength = maximum;
    // custom pattern overrides format
    if (format) {
        json.format = formatMap[format] ?? format;
        if (json.format === "")
            delete json.format; // empty format is not valid
        // `z.iso.time()` is never full-time, and `laxFormat` carries the datetime shapes that also accept what their keyword forbids
        if (format === "time" || laxFormat) {
            delete json.format;
        }
    }
    if (contentEncoding)
        json.contentEncoding = contentEncoding;
    if (patterns && patterns.size > 0) {
        const patternList = [...patterns].map(exactPattern);
        if (patternList.length === 1)
            json.pattern = patternList[0].source;
        else if (patternList.length > 1) {
            json.allOf = [
                ...patternList.map((regex) => ({
                    ...(ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0"
                        ? { type: "string" }
                        : {}),
                    pattern: regex.source,
                })),
            ];
        }
    }
};
const numberProcessor = (schema, ctx, _json, params) => {
    const json = _json;
    const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
    json.type = isInt ? "integer" : "number";
    // when both minimum and exclusiveMinimum exist, pick the more restrictive one
    const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
    const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
    const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
    if (exMin) {
        if (legacy) {
            json.minimum = exclusiveMinimum;
            json.exclusiveMinimum = true;
        }
        else {
            json.exclusiveMinimum = exclusiveMinimum;
        }
    }
    else if (typeof minimum === "number") {
        json.minimum = minimum;
    }
    if (exMax) {
        if (legacy) {
            json.maximum = exclusiveMaximum;
            json.exclusiveMaximum = true;
        }
        else {
            json.exclusiveMaximum = exclusiveMaximum;
        }
    }
    else if (typeof maximum === "number") {
        json.maximum = maximum;
    }
    if (multipleOf) {
        // JSON Schema requires a divisor strictly greater than zero, and a non-finite one does not survive JSON at all. A negative divisor accepts exactly what its absolute value accepts, so it still maps; zero, NaN and Infinity have no keyword form.
        const divisors = new Set();
        for (const divisor of multipleOf) {
            if (Number.isFinite(divisor) && divisor !== 0)
                divisors.add(Math.abs(divisor));
            else
                (0,_to_json_schema_js__rspack_import_3/* .handleUnrepresentable */._S)(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
        }
        // chained divisors are a conjunction the keyword cannot carry alone, so extras ride an allOf, same as stacked patterns
        const [first, ...rest] = divisors;
        if (first !== undefined)
            json.multipleOf = first;
        if (rest.length)
            json.allOf = [...(json.allOf ?? []), ...rest.map((m) => ({ multipleOf: m }))];
    }
};
const booleanProcessor = (_schema, _ctx, json, _params) => {
    json.type = "boolean";
};
const bigintProcessor = (schema, ctx, json, params) => {
    handleUnrepresentable(schema, ctx, json, params, "BigInt cannot be represented in JSON Schema");
};
const symbolProcessor = (schema, ctx, json, params) => {
    handleUnrepresentable(schema, ctx, json, params, "Symbols cannot be represented in JSON Schema");
};
const nullProcessor = (_schema, ctx, json, _params) => {
    if (ctx.target === "openapi-3.0") {
        json.type = "string";
        json.nullable = true;
        json.enum = [null];
    }
    else {
        json.type = "null";
    }
};
const undefinedProcessor = (schema, ctx, json, params) => {
    handleUnrepresentable(schema, ctx, json, params, "Undefined cannot be represented in JSON Schema");
};
const voidProcessor = (schema, ctx, json, params) => {
    handleUnrepresentable(schema, ctx, json, params, "Void cannot be represented in JSON Schema");
};
const neverProcessor = (_schema, _ctx, json, _params) => {
    json.not = {};
};
const anyProcessor = (_schema, _ctx, _json, _params) => {
    // empty schema accepts anything
};
const unknownProcessor = (_schema, _ctx, _json, _params) => {
    // empty schema accepts anything
};
const dateProcessor = (schema, ctx, json, params) => {
    handleUnrepresentable(schema, ctx, json, params, "Date cannot be represented in JSON Schema");
};
const enumProcessor = (schema, _ctx, json, _params) => {
    const def = schema._zod.def;
    const values = (0,_util_js__rspack_import_0/* .getEnumValues */.w5)(def.entries);
    // an empty enum accepts nothing, same as z.never()
    if (values.length === 0) {
        json.not = {};
        return;
    }
    // Number enums can have both string and number values
    if (values.every((v) => typeof v === "number"))
        json.type = "number";
    if (values.every((v) => typeof v === "string"))
        json.type = "string";
    json.enum = values;
};
const literalProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    // a literal with no values accepts nothing, same as z.never()
    if (def.values.length === 0) {
        json.not = {};
        return;
    }
    const vals = [];
    for (const val of def.values) {
        if (val === undefined) {
            // a custom schema replaces the whole literal, so there is nothing left to accumulate
            if ((0,_to_json_schema_js__rspack_import_3/* .handleUnrepresentable */._S)(schema, ctx, json, params, "Literal `undefined` cannot be represented in JSON Schema"))
                return;
            // otherwise do not add to vals
        }
        else if (typeof val === "bigint") {
            if ((0,_to_json_schema_js__rspack_import_3/* .handleUnrepresentable */._S)(schema, ctx, json, params, "BigInt literals cannot be represented in JSON Schema"))
                return;
            vals.push(Number(val));
        }
        else {
            vals.push(val);
        }
    }
    if (vals.length === 0) {
        // do nothing (an undefined literal was stripped)
    }
    else if (vals.length === 1) {
        const val = vals[0];
        json.type = val === null ? "null" : typeof val;
        if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
            json.enum = [val];
        }
        else {
            json.const = val;
        }
    }
    else {
        if (vals.every((v) => typeof v === "number"))
            json.type = "number";
        if (vals.every((v) => typeof v === "string"))
            json.type = "string";
        if (vals.every((v) => typeof v === "boolean"))
            json.type = "boolean";
        if (vals.every((v) => v === null))
            json.type = "null";
        json.enum = vals;
    }
};
const nanProcessor = (schema, ctx, json, params) => {
    handleUnrepresentable(schema, ctx, json, params, "NaN cannot be represented in JSON Schema");
};
const templateLiteralProcessor = (schema, _ctx, json, _params) => {
    const _json = json;
    const pattern = schema._zod.pattern;
    if (!pattern)
        throw new Error("Pattern not found in template literal");
    _json.type = "string";
    _json.pattern = pattern.source;
};
const fileProcessor = (schema, _ctx, json, _params) => {
    const _json = json;
    _json.type = "string";
    _json.format = "binary";
    _json.contentEncoding = "binary";
    const { minimum, maximum, mime } = aggregateChecks(schema);
    if (minimum !== undefined)
        _json.minLength = minimum;
    if (maximum !== undefined)
        _json.maxLength = maximum;
    if (!mime)
        return;
    // an empty intersection means the mime checks share no value, so nothing passes at runtime; `anyOf` must be non-empty, so the false schema is `not: {}`
    if (mime.length === 0)
        _json.not = {};
    else if (mime.length === 1)
        _json.contentMediaType = mime[0];
    // only contentMediaType differs, so the shared props stay at the root
    else
        _json.anyOf = mime.map((m) => ({ contentMediaType: m }));
};
const successProcessor = (_schema, _ctx, json, _params) => {
    json.type = "boolean";
};
const customProcessor = (schema, ctx, json, params) => {
    (0,_to_json_schema_js__rspack_import_3/* .handleUnrepresentable */._S)(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
};
const functionProcessor = (schema, ctx, json, params) => {
    handleUnrepresentable(schema, ctx, json, params, "Function types cannot be represented in JSON Schema");
};
const transformProcessor = (schema, ctx, json, params) => {
    (0,_to_json_schema_js__rspack_import_3/* .handleUnrepresentable */._S)(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
};
const mapProcessor = (schema, ctx, json, params) => {
    handleUnrepresentable(schema, ctx, json, params, "Map cannot be represented in JSON Schema");
};
const setProcessor = (schema, ctx, json, params) => {
    handleUnrepresentable(schema, ctx, json, params, "Set cannot be represented in JSON Schema");
};
// ==================== COMPOSITE TYPE PROCESSORS ====================
const arrayProcessor = (schema, ctx, _json, params) => {
    const json = _json;
    const def = schema._zod.def;
    const { minimum, maximum } = aggregateChecks(schema);
    if (typeof minimum === "number")
        json.minItems = minimum;
    if (typeof maximum === "number")
        json.maxItems = maximum;
    json.type = "array";
    json.items = (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(def.element, ctx, {
        ...params,
        path: [...params.path, "items"],
    });
};
// Transform and catch set `optin = "optional"` at runtime so the parser lets them observe an
// absent key, but their declared input type stays required. An input JSON Schema describes the
// declared type, so resolve past them to the schema that actually carries the optionality.
// Used by both `objectProcessor` (for `required`) and `tupleProcessor` (for `minItems`); see
// wiki/optionality.md, "The JSON Schema emitter reads the *static* value".
function inputOptin(schema) {
    const def = schema._zod.def;
    if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) {
        return inputOptin(def.out);
    }
    if (def.type === "catch") {
        return inputOptin(def.innerType);
    }
    return schema._zod.optin;
}
const objectProcessor = (schema, ctx, _json, params) => {
    const json = _json;
    const def = schema._zod.def;
    const shape = def.shape;
    // dropping it while still emitting `additionalProperties: false` would emit a schema that rejects data this one requires
    const symbolKeys = Object.getOwnPropertySymbols(shape);
    if (symbolKeys.length &&
        (0,_to_json_schema_js__rspack_import_3/* .handleUnrepresentable */._S)(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) {
        return;
    }
    json.type = "object";
    json.properties = {};
    for (const key in shape) {
        // assignProp so a __proto__ key becomes an own property instead of hitting the inherited setter on the plain {} we build into
        (0,_util_js__rspack_import_0/* .assignProp */.Vy)(json.properties, key, (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(shape[key], ctx, {
            ...params,
            path: [...params.path, "properties", key],
        }));
    }
    // required keys
    const requiredKeys = [];
    for (const key of Object.keys(shape)) {
        const field = def.shape[key];
        if (ctx.io === "input" ? inputOptin(field) === undefined : field._zod.optout === undefined) {
            requiredKeys.push(key);
        }
    }
    if (requiredKeys.length > 0) {
        json.required = requiredKeys;
    }
    // catchall
    if (def.catchall?._zod.def.type === "never") {
        // strict
        json.additionalProperties = false;
    }
    else if (!def.catchall) {
        // regular
        if (ctx.io === "output")
            json.additionalProperties = false;
    }
    else if (def.catchall) {
        json.additionalProperties = (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(def.catchall, ctx, {
            ...params,
            path: [...params.path, "additionalProperties"],
        });
    }
};
const unionProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    // Exclusive unions (inclusive === false) use oneOf (exactly one match) instead of anyOf (one or more matches). This includes both z.xor() and discriminated unions
    const isExclusive = def.inclusive === false;
    const options = def.options.map((x, i) => (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(x, ctx, {
        ...params,
        path: [...params.path, isExclusive ? "oneOf" : "anyOf", i],
    }));
    if (isExclusive) {
        json.oneOf = options;
    }
    else {
        json.anyOf = options;
    }
};
const intersectionProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    const a = (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(def.left, ctx, {
        ...params,
        path: [...params.path, "allOf", 0],
    });
    const b = (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(def.right, ctx, {
        ...params,
        path: [...params.path, "allOf", 1],
    });
    const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
    const allOf = [
        ...(isSimpleIntersection(a) ? a.allOf : [a]),
        ...(isSimpleIntersection(b) ? b.allOf : [b]),
    ];
    json.allOf = allOf;
    // Recorded innermost first, so a nested intersection has already folded by the time this one is considered. The array is the handle rather than the schema, because a wrapper that inherits this schema shares the same array; `finalize` folds every object holding it. See `foldIntersection`.
    ctx.intersections.push(allOf);
};
const tupleProcessor = (schema, ctx, _json, params) => {
    const json = _json;
    const def = schema._zod.def;
    json.type = "array";
    const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
    const restPath = ctx.target === "draft-2020-12" ? "items" : ctx.target === "openapi-3.0" ? "items" : "additionalItems";
    const prefixItems = def.items.map((x, i) => processSchema(x, ctx, {
        ...params,
        path: [...params.path, prefixPath, i],
    }));
    const rest = def.rest
        ? processSchema(def.rest, ctx, {
            ...params,
            path: [...params.path, restPath, ...(ctx.target === "openapi-3.0" ? [def.items.length] : [])],
        })
        : null;
    let minItems = def.items.length;
    while (minItems > 0) {
        const item = def.items[minItems - 1];
        const optional = ctx.io === "input" ? inputOptin(item) !== undefined : item._zod.optout === "optional";
        if (!optional)
            break;
        minItems--;
    }
    const maxItems = def.items.length;
    const isClosed = !def.rest;
    if (ctx.target === "draft-2020-12") {
        json.prefixItems = prefixItems;
        if (isClosed) {
            json.items = false;
        }
        else if (rest) {
            json.items = rest;
        }
        if (minItems > 0)
            json.minItems = minItems;
        if (isClosed)
            json.maxItems = maxItems;
    }
    else if (ctx.target === "openapi-3.0") {
        json.items = {
            anyOf: prefixItems,
        };
        if (rest) {
            json.items.anyOf.push(rest);
        }
        if (minItems > 0)
            json.minItems = minItems;
        if (isClosed)
            json.maxItems = maxItems;
    }
    else {
        json.items = prefixItems;
        if (isClosed) {
            json.additionalItems = false;
        }
        else if (rest) {
            json.additionalItems = rest;
        }
        if (minItems > 0)
            json.minItems = minItems;
        if (isClosed)
            json.maxItems = maxItems;
    }
    // explicit user-defined length checks take precedence
    const { minimum, maximum } = aggregateChecks(schema);
    if (typeof minimum === "number")
        json.minItems = minimum;
    if (typeof maximum === "number")
        json.maxItems = maximum;
};
/** JSON object keys are always strings, so a numeric record key schema is re-expressed over the
 * numeric-string form the record parser matches. Deferred to `finalize`, after the flatten: a key
 * behind a wrapper only carries its own `type` before then, and a union key only has its branches.
 *
 * A numeric bound cannot apply to a property name, so `minimum` and its siblings are dropped rather
 * than carried over: keeping them beside `type: "string"` reproduces the match-nothing schema this
 * exists to fix. A key that carries one therefore emits wider than the record parses — `z.record(z.number().min(5), V)`
 * accepts `"3"` — which is the deliberate trade, since throwing on it would reject an ordinary schema
 * outright. */
function stringifyKeyNames(bySchema, json, visited) {
    // an extracted key that rewrites cannot go on sharing its definition — the string form a key position needs is not the number form every other reference wants — so it inlines. One that does not rewrite keeps the `$ref`.
    if (json.$ref) {
        // a recursive key holds its own reference inside its definition, so a node already on the path is left alone rather than resolved again
        if (visited.has(json))
            return json;
        visited.add(json);
        const def = bySchema.get(json)?.def;
        if (!def)
            return json;
        const inlined = stringifyKeyNames(bySchema, def, visited);
        return inlined === def ? json : inlined;
    }
    for (const keyword of ["anyOf", "oneOf"]) {
        const branches = json[keyword];
        if (!Array.isArray(branches))
            continue;
        const mapped = branches.map((branch) => stringifyKeyNames(bySchema, branch, visited));
        // rebuilding regardless would detach a key that had nothing to re-express, dropping its `$ref` and leaking the internal `id`
        if (mapped.some((branch, i) => branch !== branches[i]))
            json = { ...json, [keyword]: mapped };
    }
    // a member that already admits a string leaves the key unconstrained, so the node's own type re-expresses only when every member is numeric
    const types = Array.isArray(json.type) ? json.type : [json.type];
    const numericType = !types.includes("string") && types.some((t) => t === "number" || t === "integer");
    // a heterogeneous key carries no type at all, so its numeric members are caught here instead
    const values = json.enum ?? (json.const !== undefined ? [json.const] : undefined);
    if (!numericType && !values?.some((v) => typeof v === "number"))
        return json;
    const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, format, id, ...rest } = json;
    if (rest.enum)
        rest.enum = rest.enum.map((v) => (typeof v === "number" ? String(v) : v));
    else if (typeof rest.const === "number")
        rest.const = String(rest.const);
    // a heterogeneous key keeps its absent type: the stringified members already say what a key may be
    if (!numericType)
        return rest;
    rest.type = "string";
    if (!values)
        rest.pattern = (types.includes("number") ? _regexes_js__rspack_import_2/* .number */.ai : _regexes_js__rspack_import_2/* .integer */.nd).source;
    return rest;
}
/** Every record of one conversion, so the carriers are found in a single pass rather than once per record. */
const pendingRecords = new WeakMap();
function rewriteKeyNames(ctx) {
    // an extracted key is resolved by the object `extractToDef` left in its place, so the map is built once rather than searched per reference. `_zod.toJSONSchema` can hand the same object to two schemas, so the first entry carrying a body wins, as a search would have found it.
    const bySchema = new Map();
    for (const entry of ctx.seen.values()) {
        if (entry.def && !bySchema.has(entry.schema))
            bySchema.set(entry.schema, entry);
    }
    const rewrites = new Map();
    for (const record of pendingRecords.get(ctx) ?? []) {
        const seen = ctx.seen.get(record);
        const names = (seen?.def ?? seen?.schema)?.propertyNames;
        if (!names || names === true || rewrites.has(names))
            continue;
        const rewritten = stringifyKeyNames(bySchema, names, new Set());
        if (rewritten !== names)
            rewrites.set(names, rewritten);
    }
    if (!rewrites.size)
        return;
    // the flatten has already copied each record's own properties onto every wrapper by reference, and an extracted body is another such copy, so every carrier holding a rewritten key is updated together
    for (const entry of ctx.seen.values()) {
        for (const carrier of [entry.schema, entry.def]) {
            const rewritten = carrier && rewrites.get(carrier.propertyNames);
            if (rewritten)
                carrier.propertyNames = rewritten;
        }
    }
}
const recordProcessor = (schema, ctx, _json, params) => {
    const json = _json;
    const def = schema._zod.def;
    json.type = "object";
    // For looseRecord with regex patterns, use patternProperties. This correctly represents "only validate keys matching the pattern" semantics and composes well with allOf (intersections)
    const keyType = def.keyType;
    const patterns = aggregateChecks(keyType).patterns;
    if (def.mode === "loose" && patterns && patterns.size > 0) {
        // Use patternProperties for looseRecord with regex patterns
        const valueSchema = (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(def.valueType, ctx, {
            ...params,
            path: [...params.path, "patternProperties", "*"],
        });
        json.patternProperties = {};
        for (const pattern of patterns) {
            (0,_util_js__rspack_import_0/* .assignProp */.Vy)(json.patternProperties, exactPattern(pattern).source, valueSchema);
        }
    }
    else {
        // Default behavior: use propertyNames + additionalProperties
        if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
            json.propertyNames = (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(def.keyType, ctx, {
                ...params,
                path: [...params.path, "propertyNames"],
            });
            let pending = pendingRecords.get(ctx);
            if (!pending) {
                pending = [];
                pendingRecords.set(ctx, pending);
                ctx.deferred.push(() => rewriteKeyNames(ctx));
            }
            pending.push(schema);
        }
        json.additionalProperties = (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(def.valueType, ctx, {
            ...params,
            path: [...params.path, "additionalProperties"],
        });
    }
    // Add required for keys with discrete values (enum, literal, etc.)
    const keyValues = keyType._zod.values;
    // Every key shares one value schema, so an optional-in value makes the whole key set omittable on input. Output keeps them: the exhaustive branch assigns every key, even one whose value came back undefined.
    const omittableOnInput = ctx.io === "input" && inputOptin(def.valueType) !== undefined;
    if (keyValues && !def.partial && !omittableOnInput) {
        const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
        if (validKeyValues.length > 0) {
            json.required = validKeyValues.map(String);
        }
    }
};
const nullableProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    const inner = (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    if (ctx.target === "openapi-3.0") {
        seen.ref = def.innerType;
        json.nullable = true;
    }
    else {
        json.anyOf = [inner, { type: "null" }];
    }
};
const nonoptionalProcessor = (schema, ctx, _json, params) => {
    const def = schema._zod.def;
    (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
};
/** Round-trips a default value through JSON so the emitted schema is guaranteed to be valid JSON.
 * A BigInt has no reliable encoding, so it goes through `unrepresentable` like any other
 * unrepresentable value. Returns a sentinel when the caller must not write a default of its own. */
const UNREPRESENTABLE_DEFAULT = Symbol();
function serializeDefaultValue(value, schema, ctx, json, params) {
    let unrepresentable = false;
    const serialized = JSON.stringify(value, (_, val) => {
        if (typeof val !== "bigint")
            return val;
        unrepresentable = true;
        return null;
    });
    if (!unrepresentable)
        return JSON.parse(serialized);
    (0,_to_json_schema_js__rspack_import_3/* .handleUnrepresentable */._S)(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
    return UNREPRESENTABLE_DEFAULT;
}
const defaultProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
    if (value !== UNREPRESENTABLE_DEFAULT)
        json.default = value;
};
const prefaultProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    if (ctx.io !== "input")
        return;
    const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
    if (value !== UNREPRESENTABLE_DEFAULT)
        json._prefault = value;
};
const catchProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    let catchValue;
    try {
        catchValue = def.catchValue(undefined);
    }
    catch {
        (0,_to_json_schema_js__rspack_import_3/* .handleUnrepresentable */._S)(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
        return;
    }
    json.default = catchValue;
};
const pipeProcessor = (schema, ctx, _json, params) => {
    const def = schema._zod.def;
    const inIsTransform = def.in._zod.traits.has("$ZodTransform");
    const innerType = ctx.io === "input" ? (inIsTransform ? def.out : def.in) : def.out;
    (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = innerType;
};
const readonlyProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    json.readOnly = true;
};
const promiseProcessor = (schema, ctx, _json, params) => {
    const def = schema._zod.def;
    processSchema(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
};
const optionalProcessor = (schema, ctx, _json, params) => {
    const def = schema._zod.def;
    (0,_to_json_schema_js__rspack_import_3/* .processSchema */.Lp)(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
};
const lazyProcessor = (schema, ctx, _json, params) => {
    const innerType = schema._zod.innerType;
    processSchema(innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = innerType;
};
// ==================== ALL PROCESSORS ====================
const allProcessors = (/* unused pure expression or super */ null && ({
    string: stringProcessor,
    number: numberProcessor,
    boolean: booleanProcessor,
    bigint: bigintProcessor,
    symbol: symbolProcessor,
    null: nullProcessor,
    undefined: undefinedProcessor,
    void: voidProcessor,
    never: neverProcessor,
    any: anyProcessor,
    unknown: unknownProcessor,
    date: dateProcessor,
    enum: enumProcessor,
    literal: literalProcessor,
    nan: nanProcessor,
    template_literal: templateLiteralProcessor,
    file: fileProcessor,
    success: successProcessor,
    custom: customProcessor,
    function: functionProcessor,
    transform: transformProcessor,
    map: mapProcessor,
    set: setProcessor,
    array: arrayProcessor,
    object: objectProcessor,
    union: unionProcessor,
    intersection: intersectionProcessor,
    tuple: tupleProcessor,
    record: recordProcessor,
    nullable: nullableProcessor,
    nonoptional: nonoptionalProcessor,
    default: defaultProcessor,
    prefault: prefaultProcessor,
    catch: catchProcessor,
    pipe: pipeProcessor,
    readonly: readonlyProcessor,
    promise: promiseProcessor,
    optional: optionalProcessor,
    lazy: lazyProcessor,
}));
function toJSONSchema(input, params) {
    if ("_idmap" in input) {
        // Registry case
        const registry = input;
        const ctx = initializeContext({ ...params, processors: allProcessors });
        const defs = {};
        // First pass: process all schemas to build the seen map
        for (const entry of registry._idmap.entries()) {
            const [_, schema] = entry;
            processSchema(schema, ctx);
        }
        const schemas = {};
        const external = {
            registry,
            uri: params?.uri,
            defs,
        };
        // Update the context with external configuration
        ctx.external = external;
        // Second pass: emit each schema
        for (const entry of registry._idmap.entries()) {
            const [key, schema] = entry;
            extractDefs(ctx, schema);
            assignProp(schemas, key, finalize(ctx, schema));
        }
        if (Object.keys(defs).length > 0) {
            const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
            schemas.__shared = {
                [defsSegment]: defs,
            };
        }
        return { schemas };
    }
    // Single schema case
    const ctx = initializeContext({ ...params, processors: allProcessors });
    processSchema(input, ctx);
    extractDefs(ctx, input);
    return finalize(ctx, input);
}

__webpack_require__.d(__webpack_exports__, {
  Fs: () => (aggregateChecks)
}, {
  $X: readonlyProcessor,
  $k: optionalProcessor,
  A: prefaultProcessor,
  A6: customProcessor,
  C0: enumProcessor,
  Ec: objectProcessor,
  GC: recordProcessor,
  NV: unknownProcessor,
  Q9: catchProcessor,
  RH: neverProcessor,
  SW: stringProcessor,
  Wg: numberProcessor,
  Yv: literalProcessor,
  cR: nonoptionalProcessor,
  cY: arrayProcessor,
  dO: booleanProcessor,
  fs: pipeProcessor,
  iC: unionProcessor,
  i_: intersectionProcessor,
  mh: defaultProcessor,
  xi: transformProcessor,
  yq: nullableProcessor
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/memoizer.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _util_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js");

class $ZodCyclicError extends Error {
    constructor() {
        super(`Cannot parse a reference cycle that closes through a transform`);
        this.name = "ZodCyclicError";
    }
}
/** Keyed off the context object every schema in one parse call already shares. */
const STATE = "~memo";
const NO_ISSUES = [];
// a value a cycle can close through
function isRef(value) {
    return value !== null && typeof value === "object";
}
// Receivers prefix paths in place, so the cache and every hand-out need their own copies.
function cloneIssues(issues) {
    return issues.map((iss) => (iss.path ? { ...iss, path: iss.path.slice() } : { ...iss }));
}
const recursive = /*@__PURE__*/ new WeakMap();
/** What the walk established, in order of certainty: ordered so the strongest answer among children wins. */
const NONE = 0;
const ASSUMED = 1;
const PROVEN = 2;
/** Whether this schema's subtree contains a cycle, so one parse can re-enter it. */
function isRecursive(inst, stack, resolve) {
    const cached = recursive.get(inst);
    if (cached !== undefined)
        return cached ? PROVEN : NONE;
    // Relative to the walk in progress, so not cached.
    if (stack.has(inst))
        return PROVEN;
    stack.add(inst);
    let result = NONE;
    const check = (child) => {
        if (result !== PROVEN && child?._zod) {
            const answer = isRecursive(child, stack, resolve);
            if (answer > result)
                result = answer;
        }
    };
    // `Reflect.ownKeys` rather than `Object.keys`, so a cycle through a declared symbol key is still seen
    const shape = (sh, spread) => {
        let answer = NONE;
        for (const key of Reflect.ownKeys(sh)) {
            const desc = Object.getOwnPropertyDescriptor(sh, key);
            // an object resolves its shape by spread, so a key it does not enumerate is never parsed; `z.properties` reads every own key and so keeps them all
            if (spread && !desc.enumerable)
                continue;
            // resolving runs user code, and a factory mints a fresh subtree per read, so an edge the walk can't follow counts as a cycle
            const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
            if (child > answer)
                answer = child;
        }
        return answer;
    };
    const merge = (answer) => {
        if (answer > result)
            result = answer;
    };
    const def = inst._zod.def;
    const kind = def.type;
    switch (kind) {
        case "object": {
            const raw = _util_js__rspack_import_0/* .rawShape */.MO(def);
            // a def with no raw shape answers `shape` from an accessor of its own, and running that can mint a whole fresh subtree
            merge(raw ? shape(raw, true) : ASSUMED);
            check(def.catchall);
            break;
        }
        case "array":
            check(def.element);
            break;
        case "tuple":
            for (const el of def.items)
                check(el);
            check(def.rest);
            break;
        case "record":
        case "map":
            check(def.keyType);
            check(def.valueType);
            break;
        case "set":
            check(def.valueType);
            break;
        case "union":
            for (const el of def.options)
                check(el);
            break;
        case "intersection":
            check(def.left);
            check(def.right);
            break;
        case "optional":
        case "nullable":
        case "default":
        case "prefault":
        case "catch":
        case "readonly":
        case "nonoptional":
        case "promise":
        case "success":
            check(def.innerType);
            break;
        case "pipe":
            check(def.in);
            check(def.out);
            break;
        case "function":
            check(def.input);
            check(def.output);
            break;
        // `$ZodLazy` caches its inner on the def, so a resolved edge is followed exactly
        case "lazy": {
            const inner = def._cachedInner ?? (resolve ? inst._zod.innerType : undefined);
            // walked with resolution off: one hop sees past the deferral, and a lazy that yields only another unresolved lazy is generative, so it stops there
            merge(inner ? isRecursive(inner, stack, false) : ASSUMED);
            break;
        }
        // a leaf by choice: `parts` are regex fragments, not data positions
        case "template_literal":
        // leaves
        case "string":
        case "number":
        case "int":
        case "boolean":
        case "bigint":
        case "symbol":
        case "undefined":
        case "null":
        case "void":
        case "never":
        case "any":
        case "unknown":
        case "date":
        case "nan":
        case "enum":
        case "literal":
        case "file":
        case "transform":
        case "custom":
            break;
        default: {
            // a new built-in kind becomes a compile error here
            kind;
            // a user-defined kind can still hold children, and only its author knows where, so fall back to scanning the def — skipping accessors, since reading one can run user code
            for (const key in def) {
                const desc = Object.getOwnPropertyDescriptor(def, key);
                if (!desc || desc.get)
                    continue;
                const value = desc.value;
                if (!value || typeof value !== "object")
                    continue;
                if (value._zod)
                    check(value);
                else if (Array.isArray(value))
                    for (const el of value)
                        check(el);
            }
        }
    }
    stack.delete(inst);
    return settle(inst, result);
}
/** An assumed answer must not outlive the resolution that settles it, so only a certain one is cached. */
function settle(inst, answer) {
    if (answer !== ASSUMED)
        recursive.set(inst, answer === PROVEN);
    return answer;
}
/**
 * Whether one parse can re-enter this schema, i.e. its subtree contains a cycle.
 * Exported for `z.compile`, which refuses to compile such a schema: cycle
 * breaking is driven from here off state keyed on the parse context, and a
 * generated fast path has no context to key on.
 */
function isRecursiveSchema(inst) {
    // z.compile never parses, so nothing would ever resolve a lazy for it; it runs once and already treats a throw here as recursive
    return isRecursive(inst, new Set(), true) !== NONE;
}
function bucketFor(state, inst) {
    let bucket = state.buckets.get(inst);
    if (!bucket) {
        bucket = new WeakMap();
        state.buckets.set(inst, bucket);
    }
    return bucket;
}
// Set immediately before delegating to core and cleared immediately after, so `alloc` registers only for a visit this module is driving.
let handoff;
// Allocated but unfinished entries. `alloc` and the matching pop both happen in the synchronous part of a parse, so they nest even when children are async, and one stack serves every schema.
const open = [];
const memo = {
    alloc(_inst, payload, empty) {
        const bucket = handoff;
        if (!bucket)
            return empty;
        handoff = undefined;
        const entry = { value: empty, issues: null };
        bucket.set(payload.value, entry);
        open.push(entry);
        return empty;
    },
    guard(inst) {
        var _a;
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        inst._zod.deferred.push(() => {
            const base = inst._zod.parse;
            const wrapped = (payload, ctx) => {
                // The value is a placeholder a back-edge is still waiting on, so the cycle closes through this transform. Its output can't exist in time to bind.
                if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value))
                    throw new $ZodCyclicError();
                return base(payload, ctx);
            };
            inst._zod.parse = wrapped;
            if (inst._zod.run === base)
                inst._zod.run = wrapped;
        });
    },
    attach(inst) {
        var _a;
        let isRecursiveInst;
        let rechecked = false;
        // a recursive schema is re-entered many times per parse and its bucket never changes
        let lastCtx;
        let lastBucket;
        // Wraps `parse` in a deferred so it sees the container's final parse. Core's own deferred copies `parse` into `run` when there are no checks, and it ran first, so `run` is patched to match; with checks, `run` reads `parse` dynamically.
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        inst._zod.deferred.push(() => {
            const base = inst._zod.parse;
            const wrapped = (payload, ctx) => {
                if (isRecursiveInst === undefined) {
                    const walked = isRecursive(inst, new Set(), false);
                    if (walked === NONE) {
                        // Nothing here can ever fire, so take it back out.
                        inst._zod.parse = base;
                        if (inst._zod.run === wrapped)
                            inst._zod.run = base;
                        return base(payload, ctx);
                    }
                    // this parse resolves the deferred edges on its own path, so ask once more before latching
                    if (walked === PROVEN || rechecked)
                        isRecursiveInst = true;
                    else
                        rechecked = true;
                }
                const input = payload.value;
                if (!isRef(input))
                    return base(payload, ctx);
                let state = ctx[STATE];
                if (!state) {
                    state = { buckets: new WeakMap(), backEdges: undefined };
                    ctx[STATE] = state;
                }
                let bucket;
                if (lastCtx === ctx) {
                    bucket = lastBucket;
                }
                else {
                    bucket = bucketFor(state, inst);
                    lastCtx = ctx;
                    lastBucket = bucket;
                }
                const hit = bucket.get(input);
                if (hit) {
                    payload.value = hit.value;
                    if (hit.issues) {
                        if (hit.issues.length)
                            payload.issues.push(...cloneIssues(hit.issues));
                    }
                    else {
                        // Still being parsed: its own checks cover it, so skip them here.
                        payload.memo = true;
                        state.backEdges ?? (state.backEdges = new WeakSet());
                        state.backEdges.add(hit.value);
                    }
                    return payload;
                }
                handoff = bucket;
                const depth = open.length;
                const result = base(payload, ctx);
                handoff = undefined;
                // A container that rejected its input outright allocated nothing.
                const entry = open.length > depth ? open.pop() : undefined;
                // Both paths written out so the sync one allocates no closure. It runs once per node, and capturing here cost more than everything else combined.
                if (result instanceof Promise) {
                    return result.then((r) => {
                        if (entry)
                            entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
                        return r;
                    });
                }
                if (entry)
                    entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
                return result;
            };
            inst._zod.parse = wrapped;
            if (inst._zod.run === base)
                inst._zod.run = wrapped;
        });
    },
};
/** The memoizer that gives containers cycle support. `zod` installs it by default; `zod/mini` opts in with `config({ memoizer: memoizer() })`. */
function memoizer() {
    return memo;
}
/** Whether this value is a node a back-edge resolved to before it finished. */
function isBackEdge(ctx, value) {
    const backEdges = ctx[STATE]?.backEdges;
    return backEdges !== undefined && isRef(value) && backEdges.has(value);
}

__webpack_require__.d(__webpack_exports__, {
  x3: () => (memoizer)
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/parse.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _core_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/core.js");
/* import */ var _errors_js__rspack_import_2 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/errors.js");
/* import */ var _util_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js");



// Always both keys, so the `_params` read site in `_parse` sees one object shape rather than two.
function finalizeParams(callee, params) {
    return { callee: params?.callee ?? callee, Err: params?.Err };
}
const _parse = (_Err) => {
    const fn = (schema, value, _ctx, _params) => {
        const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
        const result = schema._zod.run({ value, issues: [] }, ctx);
        if (result instanceof Promise) {
            throw new _core_js__rspack_import_0/* .$ZodAsyncError */.GT();
        }
        if (result.issues.length) {
            const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => _util_js__rspack_import_1/* .finalizeIssue */.iR(iss, ctx, _core_js__rspack_import_0/* .config */.$W())));
            _util_js__rspack_import_1/* .captureStackTrace */.gx(e, _params?.callee ?? fn);
            throw e;
        }
        return result.value;
    };
    return fn;
};
const parse = /* @__PURE__*/ _parse(_errors_js__rspack_import_2/* .$ZodRealError */.Kd);
const _parseAsync = (_Err) => {
    const fn = async (schema, value, _ctx, params) => {
        const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
        let result = schema._zod.run({ value, issues: [] }, ctx);
        if (result instanceof Promise)
            result = await result;
        if (result.issues.length) {
            const e = new (params?.Err ?? _Err)(result.issues.map((iss) => _util_js__rspack_import_1/* .finalizeIssue */.iR(iss, ctx, _core_js__rspack_import_0/* .config */.$W())));
            _util_js__rspack_import_1/* .captureStackTrace */.gx(e, params?.callee ?? fn);
            throw e;
        }
        return result.value;
    };
    return fn;
};
const parseAsync = /* @__PURE__*/ _parseAsync(_errors_js__rspack_import_2/* .$ZodRealError */.Kd);
const _safeParse = (_Err) => (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
        throw new _core_js__rspack_import_0/* .$ZodAsyncError */.GT();
    }
    return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
const safeParse = /* @__PURE__*/ _safeParse(_errors_js__rspack_import_2/* .$ZodRealError */.Kd);
// the error is built on the first read of `error`: finalizing the issues and constructing the instance is most of a failing parse, and a caller that only branches on `success` never pays it. a getter in the literal keeps this small; the alternative, one shared accessor descriptor plus a hidden state slot, reads ~15% faster but costs ~75 B gzipped in every bundle
function failure(Err, issues, ctx) {
    let error;
    return {
        success: false,
        get error() {
            if (!error) {
                error = new Err(issues.map((iss) => _util_js__rspack_import_1/* .finalizeIssue */.iR(iss, ctx, _core_js__rspack_import_0/* .config */.$W())));
                // finalizeIssue drops `input`, so the built error holds nothing; keeping the raw issues past this point pins the parsed value for the life of the result
                issues = undefined;
                ctx = undefined;
            }
            return error;
        },
        set error(e) {
            error = e;
            // a replacement makes the getter's branch unreachable, so the captures have to go here too
            issues = undefined;
            ctx = undefined;
        },
    };
}
const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
        result = await result;
    return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
const safeParseAsync = /* @__PURE__*/ _safeParseAsync(_errors_js__rspack_import_2/* .$ZodRealError */.Kd);
// registry mirrors of the compiler's sentinels, so this module never imports the compiler
const COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
const COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
// Deliberately tiny, because v8 will not inline a body carrying the fallback's object literals and throw. Everything that is not the compiled happy path lives in validateFallback, and that split is worth ~35% on a compiled schema.
const validate = ((schema, value, _ctx) => {
    const validator = schema._zod.bag.validator;
    if (validator !== undefined) {
        if (validator(value) !== COMPILE_INVALID)
            return true;
        // a definite sentinel means the runtime would reject, so skip the re-parse; a ctx can still change the answer
        if (validator.definite === true && _ctx === undefined)
            return false;
    }
    return validateFallback(schema, value, _ctx);
});
function validateFallback(schema, value, _ctx) {
    const ctx = _ctx
        ? { ..._ctx, async: false, abortEarly: true }
        : { async: false, abortEarly: true };
    const fallbackRun = schema._zod.bag.fallbackRun;
    let result;
    if (fallbackRun) {
        // skip nested fast paths on the fallback, so user callbacks keep the at-most-twice bound
        ctx[COMPILE_FALLBACK] = true;
        result = fallbackRun({ value, issues: [] }, ctx);
    }
    else {
        result = schema._zod.run({ value, issues: [] }, ctx);
    }
    if (result instanceof Promise) {
        throw new _core_js__rspack_import_0/* .$ZodAsyncError */.GT();
    }
    return result.issues.length === 0;
}
// no fast path: the compiler keeps async parses on the runtime, because a promise-returning callback that is not declared async compiles to a throw
const validateAsync = async (schema, value, _ctx) => {
    const ctx = _ctx
        ? { ..._ctx, async: true, abortEarly: true }
        : { async: true, abortEarly: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
        result = await result;
    return result.issues.length === 0;
};
const _encode = (_Err) => {
    const parse = _parse(_Err);
    const fn = (schema, value, _ctx, _params) => {
        const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
        return parse(schema, value, ctx, finalizeParams(fn, _params));
    };
    return fn;
};
const encode = /* @__PURE__*/ _encode(_errors_js__rspack_import_2/* .$ZodRealError */.Kd);
const _decode = (_Err) => {
    const parse = _parse(_Err);
    const fn = (schema, value, _ctx, _params) => {
        return parse(schema, value, _ctx, finalizeParams(fn, _params));
    };
    return fn;
};
const decode = /* @__PURE__*/ _decode(_errors_js__rspack_import_2/* .$ZodRealError */.Kd);
const _encodeAsync = (_Err) => {
    const parseAsync = _parseAsync(_Err);
    const fn = async (schema, value, _ctx, _params) => {
        const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
        return (await parseAsync(schema, value, ctx, finalizeParams(fn, _params)));
    };
    return fn;
};
const encodeAsync = /* @__PURE__*/ _encodeAsync(_errors_js__rspack_import_2/* .$ZodRealError */.Kd);
const _decodeAsync = (_Err) => {
    const parseAsync = _parseAsync(_Err);
    const fn = async (schema, value, _ctx, _params) => {
        return await parseAsync(schema, value, _ctx, finalizeParams(fn, _params));
    };
    return fn;
};
const decodeAsync = /* @__PURE__*/ _decodeAsync(_errors_js__rspack_import_2/* .$ZodRealError */.Kd);
const _safeEncode = (_Err) => (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return _safeParse(_Err)(schema, value, ctx);
};
const safeEncode = /* @__PURE__*/ _safeEncode(_errors_js__rspack_import_2/* .$ZodRealError */.Kd);
const _safeDecode = (_Err) => (schema, value, _ctx) => {
    return _safeParse(_Err)(schema, value, _ctx);
};
const safeDecode = /* @__PURE__*/ _safeDecode(_errors_js__rspack_import_2/* .$ZodRealError */.Kd);
const _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return _safeParseAsync(_Err)(schema, value, ctx);
};
const safeEncodeAsync = /* @__PURE__*/ _safeEncodeAsync(_errors_js__rspack_import_2/* .$ZodRealError */.Kd);
const _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
    return _safeParseAsync(_Err)(schema, value, _ctx);
};
const safeDecodeAsync = /* @__PURE__*/ _safeDecodeAsync(_errors_js__rspack_import_2/* .$ZodRealError */.Kd);

__webpack_require__.d(__webpack_exports__, {
}, {
  F0: validateAsync,
  GW: _encodeAsync,
  Mv: _encode,
  Od: _safeParse,
  R3: _safeDecodeAsync,
  Rb: _parseAsync,
  Tj: _parse,
  VS: _safeDecode,
  e2: _decode,
  or: _decodeAsync,
  rh: _safeEncode,
  tf: validate,
  v_: _safeEncodeAsync,
  wG: _safeParseAsync
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/regexes.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {

/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link cuid2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
const cuid = /^[cC][0-9a-z]{6,}$/;
const cuid2 = /^[0-9a-z]+$/;
const ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
const xid = /^[0-9a-vA-V]{20}$/;
const ksuid = /^[A-Za-z0-9]{27}$/;
const nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
    return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
const duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
/** Implements ISO 8601-2 extensions like explicit +- prefixes, mixing weeks with other units, and fractional/negative components. */
const extendedDuration = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
/** Returns a regex for validating an RFC 9562/4122 UUID.
 *
 * @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
const uuid = (version) => {
    if (!version)
        return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
    return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
const uuid4 = /*@__PURE__*/ (/* unused pure expression or super */ null && (uuid(4)));
const uuid6 = /*@__PURE__*/ (/* unused pure expression or super */ null && (uuid(6)));
const uuid7 = /*@__PURE__*/ (/* unused pure expression or super */ null && (uuid(7)));
/** Practical email validation */
const email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
/** Equivalent to the HTML5 input[type=email] validation implemented by browsers. Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email */
const html5Email = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
/** The classic emailregex.com regex for RFC 5322-compliant emails */
const rfc5322Email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
/** A loose regex that allows Unicode characters, enforces length limits, and that's about it. */
const unicodeEmail = /^[^\s@"]{1,64}@[^\s@]{1,255}$/u;
const idnEmail = (/* unused pure expression or super */ null && (unicodeEmail));
const browserEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
// from https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression
// Single character class, not an alternation: the two properties overlap (U+1F9B0-U+1F9B3), so `(A|B)+` backtracks exponentially on a failed match. The leading lookahead then demands one anchor — a pictograph, a regional indicator, or the enclosing keycap — because `\p{Emoji_Component}` on its own covers ASCII digits, `#`, `*`, ZWJ, variation selectors and skin tone modifiers, none of which is an emoji without a base.
const _emoji = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
function emoji() {
    return new RegExp(_emoji, "u");
}
const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
const mac = (delimiter) => {
    const escapedDelim = util.escapeRegex(delimiter ?? ":");
    return new RegExp(`^(?:[0-9A-F]{2}${escapedDelim}){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}${escapedDelim}){5}[0-9a-f]{2}$`);
};
const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
// https://stackoverflow.com/questions/7860392/determine-if-string-is-in-base64-using-javascript
const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
const base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
// based on https://stackoverflow.com/questions/106179/regular-expression-to-match-dns-hostname-or-ip-address
// export const hostname: RegExp = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/;
const hostname = /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/;
const domain = /^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
const httpProtocol = /^https?$/;
// https://blog.stevenlevithan.com/archives/validate-phone-number#r4-3 (regex sans spaces) E.164: leading digit must be 1-9; total digits (excluding '+') between 7-15
const e164 = /^\+[1-9]\d{6,14}$/;
// Credit card shape: 12–19 digits, optionally separated by single spaces or single hyphens. ISO/IEC 7812 caps the PAN at 19 digits; 12 is the shortest issued length (Maestro).
const creditCard = /^\d(?:[ -]?\d){11,18}$/;
// ISO 4217 alpha codes from the SIX list, regenerated by scripts/update-iso-4217.ts
const currencyCode = /^(?:AED|AFN|ALL|AMD|AOA|ARS|AUD|AWG|AZN|BAM|BBD|BDT|BHD|BIF|BMD|BND|BOB|BOV|BRL|BSD|BTN|BWP|BYN|BZD|CAD|CDF|CHE|CHF|CHW|CLF|CLP|CNY|COP|COU|CRC|CUP|CVE|CZK|DJF|DKK|DOP|DZD|EGP|ERN|ETB|EUR|FJD|FKP|GBP|GEL|GHS|GIP|GMD|GNF|GTQ|GYD|HKD|HNL|HTG|HUF|IDR|ILS|INR|IQD|IRR|ISK|JMD|JOD|JPY|KES|KGS|KHR|KMF|KPW|KRW|KWD|KYD|KZT|LAK|LBP|LKR|LRD|LSL|LYD|MAD|MDL|MGA|MKD|MMK|MNT|MOP|MRU|MUR|MVR|MWK|MXN|MXV|MYR|MZN|NAD|NGN|NIO|NOK|NPR|NZD|OMR|PAB|PEN|PGK|PHP|PKR|PLN|PYG|QAR|RON|RSD|RUB|RWF|SAR|SBD|SCR|SDG|SEK|SGD|SHP|SLE|SOS|SRD|SSP|STN|SVC|SYP|SZL|THB|TJS|TMT|TND|TOP|TRY|TTD|TWD|TZS|UAH|UGX|USD|USN|UYI|UYU|UYW|UZS|VED|VES|VND|VUV|WST|XAD|XAF|XAG|XAU|XBA|XBB|XBC|XBD|XCD|XCG|XDR|XOF|XPD|XPF|XPT|XSU|XTS|XUA|XXX|YER|ZAR|ZMW|ZWG)$/;
// iban electronic format: 2-letter country, check digits 02-98 (the only values `98 - remainder` can produce), 11-30 bban characters
const iban = /^[A-Z]{2}(?!00|01|99)\d{2}[A-Z0-9]{11,30}$/;
const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
/** Anchors a pattern source. The interpolation lives here rather than at the call site because
 * esbuild will not drop a `@__PURE__` call whose own argument interpolates a variable, but it
 * will drop `anchor(dateSource)`. Keeping it inline pinned `date` into every bundle. */
function anchor(source) {
    return new RegExp(`^${source}$`);
}
const date = /*@__PURE__*/ anchor(dateSource);
function timeSource(args) {
    const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
    const regex = typeof args.precision === "number"
        ? args.precision === -1
            ? `${hhmm}`
            : args.precision === 0
                ? `${hhmm}:[0-5]\\d`
                : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}`
        : args.seconds
            ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?`
            : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
    return regex;
}
function time(args) {
    return new RegExp(`^${timeSource(args)}$`);
}
// Adapted from https://stackoverflow.com/a/3143231
function datetime(args) {
    const opts = ["Z"];
    // if (args.offset) opts.push(`([+-]\\d{2}:\\d{2})`);
    if (args.offset)
        opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
    // RFC 3339 mandates seconds wherever the time carries a `Z` or an offset, so only the unqualified form `local` adds may omit them
    const qualified = `${timeSource({ precision: args.precision, seconds: true })}(?:${opts.join("|")})`;
    const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
    return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
// the unbounded form of `string()` as a literal, so every plain string shares one instance instead of building its own
const anyString = /^[\s\S]{0,}$/;
const string = (params) => {
    const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
    return new RegExp(`^${regex}$`);
};
const bigint = /^-?\d+n?$/;
const integer = /^-?\d+$/;
const number = /^-?\d+(?:\.\d+)?$/;
const boolean = /^(?:true|false)$/i;
const _null = /^null$/i;

const _undefined = /^undefined$/i;

// regex for string with no uppercase letters
const lowercase = /^[^A-Z]*$/;
// regex for string with no lowercase letters
const uppercase = /^[^a-z]*$/;
// regex for hexadecimal strings (any length)
const hex = /^[0-9a-fA-F]*$/;
// Hash regexes for different algorithms and encodings
// Helper function to create base64 regex with exact length and padding
function fixedBase64(bodyLength, padding) {
    return new RegExp(`^[A-Za-z0-9+/]{${bodyLength}}${padding}$`);
}
// Helper function to create base64url regex with exact length (no padding)
function fixedBase64url(length) {
    return new RegExp(`^[A-Za-z0-9_-]{${length}}$`);
}
// MD5 (16 bytes): base64 = 24 chars total (22 + "==")
const md5_hex = /^[0-9a-fA-F]{32}$/;
const md5_base64 = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64(22, "==")));
const md5_base64url = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64url(22)));
// SHA1 (20 bytes): base64 = 28 chars total (27 + "=")
const sha1_hex = /^[0-9a-fA-F]{40}$/;
const sha1_base64 = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64(27, "=")));
const sha1_base64url = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64url(27)));
// SHA256 (32 bytes): base64 = 44 chars total (43 + "=")
const sha256_hex = /^[0-9a-fA-F]{64}$/;
const sha256_base64 = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64(43, "=")));
const sha256_base64url = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64url(43)));
// SHA384 (48 bytes): base64 = 64 chars total (no padding)
const sha384_hex = /^[0-9a-fA-F]{96}$/;
const sha384_base64 = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64(64, "")));
const sha384_base64url = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64url(64)));
// SHA512 (64 bytes): base64 = 88 chars total (86 + "==")
const sha512_hex = /^[0-9a-fA-F]{128}$/;
const sha512_base64 = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64(86, "==")));
const sha512_base64url = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64url(86)));

__webpack_require__.d(__webpack_exports__, {
  D2: () => (nanoidOfLength),
  Zg: () => (emoji),
  kB: () => (time),
  w$: () => (datetime)
}, {
  AC: lowercase,
  Ak: nanoid,
  F: httpProtocol,
  Gl: cuid2,
  K3: base64,
  Os: guid,
  Rp: email,
  Z0: ulid,
  Zv: uppercase,
  ai: number,
  fO: ksuid,
  gF: cuid,
  gp: anyString,
  hQ: e164,
  kM: xid,
  l7: cidrv6,
  nd: integer,
  p0: duration,
  p6: date,
  r0: base64url,
  uR: uuid,
  uX: ipv4,
  ug: ipv6,
  zM: boolean,
  zr: cidrv4
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/registries.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
var _a;
const $output = /*@__PURE__*/ (/* unused pure expression or super */ null && (Symbol("ZodOutput")));
const $input = /*@__PURE__*/ (/* unused pure expression or super */ null && (Symbol("ZodInput")));
class $ZodRegistry {
    constructor() {
        this._map = new WeakMap();
        this._idmap = new Map();
    }
    add(schema, ..._meta) {
        const meta = _meta[0];
        this._map.set(schema, meta);
        if (meta && typeof meta === "object" && "id" in meta) {
            this._idmap.set(meta.id, schema);
        }
        return this;
    }
    clear() {
        this._map = new WeakMap();
        this._idmap = new Map();
        return this;
    }
    remove(schema) {
        const meta = this._map.get(schema);
        if (meta && typeof meta === "object" && "id" in meta) {
            this._idmap.delete(meta.id);
        }
        this._map.delete(schema);
        return this;
    }
    get(schema) {
        // return this._map.get(schema) as any;
        // inherit metadata
        const p = schema._zod.parent;
        if (p) {
            const pm = { ...(this.get(p) ?? {}) };
            delete pm.id; // do not inherit id
            const f = { ...pm, ...this._map.get(schema) };
            return Object.keys(f).length ? f : undefined;
        }
        return this._map.get(schema);
    }
    has(schema) {
        return this._map.has(schema);
    }
}
// registries
function registry() {
    return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
const globalRegistry = globalThis.__zod_globalRegistry;

__webpack_require__.d(__webpack_exports__, {
}, {
  fd: globalRegistry
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/schemas.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _checks_js__rspack_import_4 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/checks.js");
/* import */ var _core_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/core.js");
/* import */ var _doc_js__rspack_import_5 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/doc.js");
/* import */ var _regexes_js__rspack_import_3 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/regexes.js");
/* import */ var _util_js__rspack_import_2 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js");
/* import */ var _versions_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/versions.js");







const $ZodType = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodType", (inst, def) => {
    var _a;
    inst ?? (inst = {});
    inst._zod.def = def; // set _def property
    inst._zod.bag = inst._zod.bag || {}; // initialize _bag object
    inst._zod.version = _versions_js__rspack_import_1/* .version */.r;
    const defChecks = inst._zod.def.checks;
    // if inst is itself a checks.$ZodCheck, run it as a check
    const checks = inst._zod.traits.has("$ZodCheck")
        ? [inst, ...(defChecks ?? [])]
        : defChecks?.length
            ? [...defChecks]
            : [];
    for (const ch of checks) {
        for (const fn of ch._zod.onattach) {
            fn(inst);
        }
    }
    if (checks.length === 0) {
        // deferred initializer inst._zod.parse is not yet defined
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        inst._zod.deferred?.push(() => {
            inst._zod.run = inst._zod.parse;
        });
    }
    else {
        const runChecks = (payload, checks, ctx) => {
            if (payload.memo)
                return payload;
            let isAborted = _util_js__rspack_import_2/* .aborted */.QH(payload);
            let asyncResult;
            for (const ch of checks) {
                if (ch._zod.def.when) {
                    if (_util_js__rspack_import_2/* .explicitlyAborted */.rL(payload))
                        continue;
                    const shouldRun = ch._zod.def.when(payload);
                    if (!shouldRun)
                        continue;
                }
                else if (isAborted) {
                    continue;
                }
                const currLen = payload.issues.length;
                const _ = ch._zod.check(payload);
                if (_ instanceof Promise && ctx?.async === false) {
                    throw new _core_js__rspack_import_0/* .$ZodAsyncError */.GT();
                }
                if (asyncResult || _ instanceof Promise) {
                    asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
                        await _;
                        const nextLen = payload.issues.length;
                        if (nextLen === currLen)
                            return;
                        _util_js__rspack_import_2/* .attachSchema */.d3(payload.issues, currLen, inst);
                        if (!isAborted)
                            isAborted = _util_js__rspack_import_2/* .aborted */.QH(payload, currLen);
                    });
                }
                else {
                    const nextLen = payload.issues.length;
                    if (nextLen === currLen)
                        continue;
                    _util_js__rspack_import_2/* .attachSchema */.d3(payload.issues, currLen, inst);
                    if (!isAborted)
                        isAborted = _util_js__rspack_import_2/* .aborted */.QH(payload, currLen);
                }
            }
            if (asyncResult) {
                return asyncResult.then(() => {
                    return payload;
                });
            }
            return payload;
        };
        const handleCanaryResult = (canary, payload, ctx) => {
            // abort if the canary is aborted
            if (_util_js__rspack_import_2/* .aborted */.QH(canary)) {
                canary.aborted = true;
                return canary;
            }
            // run checks first, then
            const checkResult = runChecks(payload, checks, ctx);
            if (checkResult instanceof Promise) {
                if (ctx.async === false)
                    throw new _core_js__rspack_import_0/* .$ZodAsyncError */.GT();
                return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
            }
            return inst._zod.parse(checkResult, ctx);
        };
        inst._zod.run = (payload, ctx) => {
            if (ctx.skipChecks) {
                return inst._zod.parse(payload, ctx);
            }
            if (ctx.direction === "backward") {
                // run canary initial pass (no checks)
                const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
                if (canary instanceof Promise) {
                    return canary.then((canary) => {
                        return handleCanaryResult(canary, payload, ctx);
                    });
                }
                return handleCanaryResult(canary, payload, ctx);
            }
            // forward
            const result = inst._zod.parse(payload, ctx);
            if (result instanceof Promise) {
                if (ctx.async === false)
                    throw new _core_js__rspack_import_0/* .$ZodAsyncError */.GT();
                return result.then((result) => runChecks(result, checks, ctx));
            }
            return runChecks(result, checks, ctx);
        };
    }
}, {
    // Wrappers extend this by installing a richer factory over it; reading it eagerly would defeat the laziness.
    get "~standard"() {
        return _util_js__rspack_import_2/* .hide */.jD(this, "~standard", standardProps(this));
    },
    set "~standard"(value) {
        _util_js__rspack_import_2/* .own */.qh(this, "~standard", value);
    },
});
/** The Standard Schema surface for `inst`. Shared so wrappers can extend it without forcing it. */
// a Standard Schema result only reports issues, so a failure finalizes them straight off the raw payload: no ZodError, and no lazy result to read through
const toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => _util_js__rspack_import_2/* .finalizeIssue */.iR(iss, ctx, _core_js__rspack_import_0/* .config */.$W())) } : { value: r.value };
async function validateAsync(inst, value) {
    const ctx = { async: true };
    return toStandardResult((await inst._zod.run({ value, issues: [] }, ctx)), ctx);
}
function standardProps(inst) {
    return {
        validate: (value) => {
            const ctx = { async: false };
            try {
                const r = inst._zod.run({ value, issues: [] }, ctx);
                if (!(r instanceof Promise))
                    return toStandardResult(r, ctx);
            }
            catch (_) { }
            // async function so a synchronously throwing check rejects instead of escaping validate
            return validateAsync(inst, value);
        },
        vendor: "zod",
        version: 1,
    };
}

const $ZodString = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodString", (inst, def) => {
    $ZodType.init(inst, def);
    // a format's own pattern, else unbounded; a template literal derives the check-aware form itself
    inst._zod.pattern = def.pattern ?? _regexes_js__rspack_import_3/* .anyString */.gp;
    inst._zod.parse = (payload, _) => {
        if (def.coerce)
            try {
                payload.value = String(payload.value);
            }
            catch (_) { }
        if (typeof payload.value === "string")
            return payload;
        payload.issues.push({
            expected: "string",
            code: "invalid_type",
            input: payload.value,
            inst,
        });
        return payload;
    };
});
const $ZodStringFormat = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodStringFormat", (inst, def) => {
    // check initialization must come first
    _checks_js__rspack_import_4/* .$ZodCheckStringFormat.init */.ql.init(inst, def);
    $ZodString.init(inst, def);
});
const $ZodGUID = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodGUID", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .guid */.Os);
    $ZodStringFormat.init(inst, def);
});
const $ZodUUID = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodUUID", (inst, def) => {
    if (def.version) {
        const versionMap = {
            v1: 1,
            v2: 2,
            v3: 3,
            v4: 4,
            v5: 5,
            v6: 6,
            v7: 7,
            v8: 8,
        };
        const v = versionMap[def.version];
        if (v === undefined)
            throw new Error(`Invalid UUID version: "${def.version}"`);
        def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .uuid */.uR(v));
    }
    else
        def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .uuid */.uR());
    $ZodStringFormat.init(inst, def);
});
const $ZodEmail = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodEmail", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .email */.Rp);
    $ZodStringFormat.init(inst, def);
});
/** The `://` guard rejected the input before the URL constructor saw it. */
const URL_BAD_FORMAT = 1;
/** The URL parser rejected the input. */
const URL_UNPARSEABLE = 2;
function canParseURL(input) {
    try {
        if (typeof URL !== "undefined" && typeof URL.canParse === "function")
            return URL.canParse(input);
        new URL(input);
        return true;
    }
    catch {
        return false;
    }
}
function validateURL(trimmed, def) {
    if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) {
        return canParseURL(trimmed) || URL_UNPARSEABLE;
    }
    return parseURLObject(trimmed, def);
}
/** Parses a URL while preserving the non-normalizing HTTP guard. */
function parseURLObject(trimmed, def) {
    // When normalize is off, require :// for http/https URLs. This prevents strings like "http:example.com" or "https:/path" from being silently accepted
    if (!def.normalize && def.protocol?.source === _regexes_js__rspack_import_3/* .httpProtocol.source */.F.source && !/^https?:\/\//i.test(trimmed)) {
        return URL_BAD_FORMAT;
    }
    try {
        if (typeof URL !== "undefined") {
            const URLStatic = URL;
            if (typeof URLStatic.parse === "function")
                return URLStatic.parse(trimmed) ?? URL_UNPARSEABLE;
        }
        // @ts-ignore
        return new URL(trimmed);
    }
    catch {
        return URL_UNPARSEABLE;
    }
}
const asciiTabOrNewline = /[\t\n\r]/g;
/** The URL parser deletes every ASCII tab, LF and CR from its input before it parses, so `new URL("https://exa\nmple.com")` reports on `example.com`. Applying the same deletion to the returned value closes the half of that divergence which can move the host; the parser's other rewrite, stripping C0 controls at the edges, cannot. */
function stripTabAndNewline(value) {
    return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url, hostname) {
    hostname.lastIndex = 0;
    return hostname.test(url.hostname);
}
function urlProtocolOk(url, protocol) {
    protocol.lastIndex = 0;
    return protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol);
}
const $ZodURL = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodURL", (inst, def) => {
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
        try {
            // Trim whitespace from input
            const trimmed = payload.value.trim();
            const url = validateURL(trimmed, def);
            if (url === URL_BAD_FORMAT) {
                payload.issues.push({
                    code: "invalid_format",
                    format: "url",
                    note: "Invalid URL format",
                    input: payload.value,
                    inst,
                    continue: !def.abort,
                });
                return;
            }
            if (url === URL_UNPARSEABLE) {
                payload.issues.push({
                    code: "invalid_format",
                    format: "url",
                    input: payload.value,
                    inst,
                    continue: !def.abort,
                });
                return;
            }
            if (url === true) {
                payload.value = stripTabAndNewline(trimmed);
                return;
            }
            if (def.hostname && !urlHostnameOk(url, def.hostname)) {
                payload.issues.push({
                    code: "invalid_format",
                    format: "url",
                    note: "Invalid hostname",
                    pattern: def.hostname.source,
                    input: payload.value,
                    inst,
                    continue: !def.abort,
                });
            }
            if (def.protocol && !urlProtocolOk(url, def.protocol)) {
                payload.issues.push({
                    code: "invalid_format",
                    format: "url",
                    note: "Invalid protocol",
                    pattern: def.protocol.source,
                    input: payload.value,
                    inst,
                    continue: !def.abort,
                });
            }
            // Set the output value based on normalize flag
            payload.value = def.normalize ? url.href : stripTabAndNewline(trimmed);
            return;
        }
        catch (_) {
            payload.issues.push({
                code: "invalid_format",
                format: "url",
                input: payload.value,
                inst,
                continue: !def.abort,
            });
        }
    };
});
const $ZodEmoji = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodEmoji", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .emoji */.Zg());
    $ZodStringFormat.init(inst, def);
});
const $ZodNanoID = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodNanoID", (inst, def) => {
    if (def.length !== undefined && (!Number.isInteger(def.length) || def.length < 1))
        throw new Error(`Invalid nanoid length: ${def.length}`);
    def.pattern ?? (def.pattern = def.length === undefined ? _regexes_js__rspack_import_3/* .nanoid */.Ak : _regexes_js__rspack_import_3/* .nanoidOfLength */.D2(def.length));
    $ZodStringFormat.init(inst, def);
});
/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link $ZodCUID2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
const $ZodCUID = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCUID", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .cuid */.gF);
    $ZodStringFormat.init(inst, def);
});
const $ZodCUID2 = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCUID2", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .cuid2 */.Gl);
    $ZodStringFormat.init(inst, def);
});
const $ZodULID = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodULID", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .ulid */.Z0);
    $ZodStringFormat.init(inst, def);
});
const $ZodXID = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodXID", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .xid */.kM);
    $ZodStringFormat.init(inst, def);
});
const $ZodKSUID = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodKSUID", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .ksuid */.fO);
    $ZodStringFormat.init(inst, def);
});
const $ZodISODateTime = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodISODateTime", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .datetime */.w$(def));
    $ZodStringFormat.init(inst, def);
});
const $ZodISODate = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodISODate", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .date */.p6);
    $ZodStringFormat.init(inst, def);
});
const $ZodISOTime = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodISOTime", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .time */.kB(def));
    $ZodStringFormat.init(inst, def);
});
const $ZodISODuration = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodISODuration", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .duration */.p0);
    $ZodStringFormat.init(inst, def);
});
const $ZodIPv4 = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodIPv4", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .ipv4 */.uX);
    $ZodStringFormat.init(inst, def);
});
/** An IPv6 address is written with hex digits, colons and dots, and nothing else. The guard is what makes the check below an IPv6 check: `new URL("http://[...]")` parses an authority, not an address, so `@` and `\` re-delimit it and `"::@1\\"` validates against the host `0.0.0.1`. The URL parser also deletes ASCII tab, LF and CR rather than failing, which is how `"::1\n"` validated as `::1`. */
const ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
    if (!ipv6Alphabet.test(value))
        return false;
    return canParseURL(`http://[${value}]`);
}
const $ZodIPv6 = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodIPv6", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .ipv6 */.ug);
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
        if (!isValidIPv6(payload.value)) {
            payload.issues.push({
                code: "invalid_format",
                format: "ipv6",
                input: payload.value,
                inst,
                continue: !def.abort,
            });
        }
    };
});
const $ZodMAC = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodMAC", (inst, def) => {
    def.pattern ?? (def.pattern = regexes.mac(def.delimiter));
    $ZodStringFormat.init(inst, def);
})));
const $ZodCIDRv4 = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCIDRv4", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .cidrv4 */.zr);
    $ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
    const parts = value.split("/");
    if (parts.length !== 2)
        return false;
    const [address, prefix] = parts;
    if (!prefix)
        return false;
    const prefixNum = Number(prefix);
    if (`${prefixNum}` !== prefix)
        return false;
    if (prefixNum < 0 || prefixNum > 128)
        return false;
    return isValidIPv6(address);
}
const $ZodCIDRv6 = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCIDRv6", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .cidrv6 */.l7); // not used for validation
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
        if (!isValidCIDRv6(payload.value)) {
            payload.issues.push({
                code: "invalid_format",
                format: "cidrv6",
                input: payload.value,
                inst,
                continue: !def.abort,
            });
        }
    };
});
//////////////////////////////   ZodBase64   //////////////////////////////
function isValidBase64(data) {
    if (data === "")
        return true;
    // atob ignores whitespace, so reject it up front.
    if (/\s/.test(data))
        return false;
    if (data.length % 4 !== 0)
        return false;
    try {
        // @ts-ignore
        atob(data);
        return true;
    }
    catch {
        return false;
    }
}
// lax on purpose: the quantified regexes.base64 overflows the regex stack on multi-MB input and its leading ^$| alternation leaks through template-literal composition; isValidBase64 enforces length and padding
const base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
const $ZodBase64 = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodBase64", (inst, def) => {
    def.pattern ?? (def.pattern = base64Charset);
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
        if (isValidBase64(payload.value))
            return;
        payload.issues.push({
            code: "invalid_format",
            format: "base64",
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
//////////////////////////////   ZodBase64URL   //////////////////////////////
// lax on purpose: the quantified regexes.base64url overflows the regex stack on multi-MB input; isValidBase64 enforces length on the padded string
const base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
    if (!base64urlCharset.test(data))
        return false;
    const base64 = data.replace(/[-_]/g, (c) => (c === "-" ? "+" : "/"));
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return isValidBase64(padded);
}
const $ZodBase64URL = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodBase64URL", (inst, def) => {
    def.pattern ?? (def.pattern = base64urlCharset);
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
        if (isValidBase64URL(payload.value))
            return;
        payload.issues.push({
            code: "invalid_format",
            format: "base64url",
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodE164 = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodE164", (inst, def) => {
    def.pattern ?? (def.pattern = _regexes_js__rspack_import_3/* .e164 */.hQ);
    $ZodStringFormat.init(inst, def);
});
//////////////////////////////   ZodCreditCard   //////////////////////////////
const CC_SANITIZE = /[- ]/g;
/** Luhn checksum on a digit-only string. Adapted from valibot (MIT). */
function isLuhnAlgo(digits) {
    let length = digits.length;
    let bit = 1;
    let sum = 0;
    while (length) {
        const value = digits.charCodeAt(--length) - 48;
        bit ^= 1;
        sum += bit ? [0, 2, 4, 6, 8, 1, 3, 5, 7, 9][value] : value;
    }
    return sum % 10 === 0;
}
function isValidCreditCard(input) {
    if (!regexes.creditCard.test(input))
        return false;
    return isLuhnAlgo(input.replace(CC_SANITIZE, ""));
}
const $ZodCreditCard = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCreditCard", (inst, def) => {
    // Shape only — the Luhn check below is not expressible as a pattern, so consumers of `pattern` (JSON Schema, template literals) get the length and separator rules alone.
    def.pattern ?? (def.pattern = regexes.creditCard);
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
        if (isValidCreditCard(payload.value))
            return;
        payload.issues.push({
            code: "invalid_format",
            format: "credit_card",
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
})));
//////////////////////////////   ZodIBAN   //////////////////////////////
// iso 7064 mod 97-10 checksum without BigInt
function isIso7064Mod97(iban) {
    let remainder = 0;
    const len = iban.length;
    for (let i = 4; i < len; i++) {
        const code = iban.charCodeAt(i);
        remainder = (code >= 65 ? remainder * 100 + (code - 55) : remainder * 10 + (code - 48)) % 97;
    }
    for (let i = 0; i < 4; i++) {
        const code = iban.charCodeAt(i);
        remainder = (code >= 65 ? remainder * 100 + (code - 55) : remainder * 10 + (code - 48)) % 97;
    }
    return remainder === 1;
}
function isValidIBAN(input) {
    if (!regexes.iban.test(input))
        return false;
    return isIso7064Mod97(input);
}
const $ZodIBAN = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodIBAN", (inst, def) => {
    // shape only — checksum is not expressible as a pattern
    def.pattern ?? (def.pattern = regexes.iban);
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
        if (isValidIBAN(payload.value))
            return;
        payload.issues.push({
            code: "invalid_format",
            format: "iban",
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
})));
//////////////////////////////   ZodJWT   //////////////////////////////
function isValidJWT(token, algorithm = null) {
    try {
        const tokensParts = token.split(".");
        if (tokensParts.length !== 3)
            return false;
        const [header] = tokensParts;
        if (!header)
            return false;
        // @ts-ignore
        const parsedHeader = JSON.parse(atob(header));
        if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
            return false;
        if (!parsedHeader.alg)
            return false;
        if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
            return false;
        return true;
    }
    catch {
        return false;
    }
}
const $ZodJWT = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodJWT", (inst, def) => {
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
        if (isValidJWT(payload.value, def.alg))
            return;
        payload.issues.push({
            code: "invalid_format",
            format: "jwt",
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCustomStringFormat = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCustomStringFormat", (inst, def) => {
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
        if (def.fn(payload.value))
            return;
        payload.issues.push({
            code: "invalid_format",
            format: def.format,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
})));
const $ZodNumber = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodNumber", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.pattern = _regexes_js__rspack_import_3/* .number */.ai;
    inst._zod.parse = (payload, _ctx) => {
        if (def.coerce)
            try {
                payload.value = Number(payload.value);
            }
            catch (_) { }
        const input = payload.value;
        if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
            return payload;
        }
        const received = typeof input === "number"
            ? Number.isNaN(input)
                ? "NaN"
                : !Number.isFinite(input)
                    ? String(input)
                    : undefined
            : undefined;
        payload.issues.push({
            expected: "number",
            code: "invalid_type",
            input,
            inst,
            ...(received ? { received } : {}),
        });
        return payload;
    };
});
const $ZodNumberFormat = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodNumberFormat", (inst, def) => {
    _checks_js__rspack_import_4/* .$ZodCheckNumberFormat.init */.KH.init(inst, def);
    $ZodNumber.init(inst, def); // no format checks
});
const $ZodBoolean = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodBoolean", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.pattern = _regexes_js__rspack_import_3/* .boolean */.zM;
    inst._zod.parse = (payload, _ctx) => {
        if (def.coerce)
            try {
                payload.value = Boolean(payload.value);
            }
            catch (_) { }
        const input = payload.value;
        if (typeof input === "boolean")
            return payload;
        payload.issues.push({
            expected: "boolean",
            code: "invalid_type",
            input,
            inst,
        });
        return payload;
    };
});
const $ZodBigInt = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodBigInt", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.pattern = regexes.bigint;
    inst._zod.parse = (payload, _ctx) => {
        if (def.coerce)
            try {
                payload.value = BigInt(payload.value);
            }
            catch (_) { }
        if (typeof payload.value === "bigint")
            return payload;
        payload.issues.push({
            expected: "bigint",
            code: "invalid_type",
            input: payload.value,
            inst,
        });
        return payload;
    };
})));
const $ZodBigIntFormat = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodBigIntFormat", (inst, def) => {
    checks.$ZodCheckBigIntFormat.init(inst, def);
    $ZodBigInt.init(inst, def); // no format checks
})));
const $ZodSymbol = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodSymbol", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (typeof input === "symbol")
            return payload;
        payload.issues.push({
            expected: "symbol",
            code: "invalid_type",
            input,
            inst,
        });
        return payload;
    };
})));
const $ZodUndefined = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodUndefined", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.pattern = regexes.undefined;
    inst._zod.values = new Set([undefined]);
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (typeof input === "undefined")
            return payload;
        payload.issues.push({
            expected: "undefined",
            code: "invalid_type",
            input,
            inst,
        });
        return payload;
    };
})));
const $ZodNull = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodNull", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.pattern = regexes.null;
    inst._zod.values = new Set([null]);
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (input === null)
            return payload;
        payload.issues.push({
            expected: "null",
            code: "invalid_type",
            input,
            inst,
        });
        return payload;
    };
})));
const $ZodAny = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodAny", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload) => payload;
})));
const $ZodUnknown = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodUnknown", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload) => payload;
});
const $ZodNever = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodNever", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _ctx) => {
        payload.issues.push({
            expected: "never",
            code: "invalid_type",
            input: payload.value,
            inst,
        });
        return payload;
    };
});
const $ZodVoid = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodVoid", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (typeof input === "undefined")
            return payload;
        payload.issues.push({
            expected: "void",
            code: "invalid_type",
            input,
            inst,
        });
        return payload;
    };
})));
const $ZodDate = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodDate", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _ctx) => {
        if (def.coerce) {
            try {
                payload.value = new Date(payload.value);
            }
            catch (_err) { }
        }
        const input = payload.value;
        const isDate = input instanceof Date;
        const isValidDate = isDate && !Number.isNaN(input.getTime());
        if (isValidDate)
            return payload;
        payload.issues.push({
            expected: "date",
            code: "invalid_type",
            input,
            ...(isDate ? { received: "Invalid Date" } : {}),
            inst,
        });
        return payload;
    };
})));
function handleArrayResult(result, final, index) {
    if (result.issues.length) {
        final.issues.push(..._util_js__rspack_import_2/* .prefixIssues */.lQ(index, result.issues));
    }
    final.value[index] = result.value;
}
const $ZodArray = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodArray", (inst, def) => {
    $ZodType.init(inst, def);
    const memo = _core_js__rspack_import_0/* .globalConfig.memoizer */.cr.memoizer;
    memo?.attach(inst);
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!Array.isArray(input)) {
            payload.issues.push({
                expected: "array",
                code: "invalid_type",
                input,
                inst,
            });
            return payload;
        }
        payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
        const proms = [];
        const abortEarly = ctx?.abortEarly;
        for (let i = 0; i < input.length; i++) {
            const item = input[i];
            const result = def.element._zod.run({
                value: item,
                issues: [],
            }, ctx);
            if (result instanceof Promise) {
                proms.push(result.then((result) => handleArrayResult(result, payload, i)));
            }
            else {
                handleArrayResult(result, payload, i);
                // the element's payload is authoritative here, since handleArrayResult forwards every issue; an object's is not, because it drops a failed absent optional
                if (abortEarly && result.issues.length !== 0 && _util_js__rspack_import_2/* .aborted */.QH(result))
                    break;
            }
        }
        if (proms.length) {
            return Promise.all(proms).then(() => payload);
        }
        return payload; //handleArrayResultsAsync(parseResults, final);
    };
});
function handlePropertyResult(result, final, key, input, optin, optout) {
    const isPresent = key in input;
    const isOptionalOut = optout === "optional";
    // The middle rung means "absence permitted, nothing supplied in its place", so an absent key contributes nothing — whatever the schema made of `undefined` is invented, not substituted. Only `optional` reaches this with a value: `defaulted` substitutes, and a schema that isn't optional-out has to keep the key.
    if (!isPresent && isOptionalOut && optin === "optional") {
        return;
    }
    if (result.issues.length) {
        // For optional-in/out schemas, ignore errors on absent keys.
        if (optin !== undefined && isOptionalOut && !isPresent) {
            return;
        }
        final.issues.push(..._util_js__rspack_import_2/* .prefixIssues */.lQ(key, result.issues));
    }
    if (!isPresent && optin === undefined) {
        if (!result.issues.length) {
            final.issues.push({
                code: "invalid_type",
                expected: "nonoptional",
                input: undefined,
                path: [key],
            });
        }
        return;
    }
    if (result.value === undefined) {
        if (isPresent || (optin === "defaulted" && !isOptionalOut)) {
            final.value[key] = undefined;
        }
    }
    else {
        final.value[key] = result.value;
    }
}
// one shared instance; a fresh [] per schema cost 56 bytes retained
const NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
    const keys = Object.keys(def.shape);
    const ownSymbols = Object.getOwnPropertySymbols(def.shape);
    const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
    // aliases `keys` when there are no symbols, so a string-only shape keeps one array
    const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
    for (const k of allKeys) {
        if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
            throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
        }
    }
    const okeys = _util_js__rspack_import_2/* .optionalKeys */.NM(def.shape);
    return {
        ...def,
        allKeys,
        symbolKeys,
        // string-only: handleCatchall matches it against `for...in`, which never yields a symbol
        keySet: new Set(keys),
        numKeys: keys.length,
        optionalKeys: new Set(okeys),
    };
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
    const unrecognized = [];
    const keySet = def.keySet;
    const _catchall = def.catchall._zod;
    const t = _catchall.def.type;
    const optin = _catchall.optin;
    const optout = _catchall.optout;
    // starts at 0, not the current length: the shape phase already ran and may have aborted
    let seen = 0;
    for (const key in input) {
        if (abortEarly && payload.issues.length !== seen) {
            if (_util_js__rspack_import_2/* .aborted */.QH(payload, seen))
                break;
            seen = payload.issues.length;
        }
        // Must precede the __proto__ branch: a declared key is not unrecognized, even though the shape loop deliberately strips __proto__ from the parsed output.
        if (keySet.has(key))
            continue;
        // Don't copy an undeclared __proto__ into the result; assignment to a plain {} would replace the result prototype. But in strict mode it is still an unknown key, so report it before skipping.
        if (key === "__proto__") {
            if (t === "never")
                unrecognized.push(key);
            continue;
        }
        if (t === "never") {
            unrecognized.push(key);
            continue;
        }
        const r = _catchall.run({ value: input[key], issues: [] }, ctx);
        if (r instanceof Promise) {
            proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
        }
        else {
            handlePropertyResult(r, payload, key, input, optin, optout);
        }
    }
    if (unrecognized.length) {
        payload.issues.push({
            code: "unrecognized_keys",
            keys: unrecognized,
            input,
            inst,
            // Describes the shape of the input, not the validity of the parsed value, so it never aborts. The parse still fails; the schema's own checks just get to run first, and an enclosing intersection can reconcile the key against a sibling operand.
            continue: true,
        });
    }
    if (!proms.length)
        return payload;
    return Promise.all(proms).then(() => {
        return payload;
    });
}
const $ZodObject = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodObject", (inst, def) => {
    // requires cast because technically $ZodObject doesn't extend
    $ZodType.init(inst, def);
    const desc = Object.getOwnPropertyDescriptor(def, "shape");
    // a cloned def carries its source's accessor, which knows the shape it answers from; adopting that keeps the clone's keys readable without running it
    const sh = desc?.get ? desc.get.raw : (def.shape ?? {});
    if (sh) {
        // Freezes the shape on first read, so its getters resolve once and every later read sees the same schemas.
        const get = () => {
            const newSh = { ...sh };
            Object.defineProperty(def, "shape", { value: newSh });
            get.raw = newSh;
            return newSh;
        };
        get.raw = sh;
        Object.defineProperty(def, "shape", { get });
    }
    const _normalized = _util_js__rspack_import_2/* .cached */.PO(() => normalizeDef(def));
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "propValues", (zod) => {
        const shape = zod.def.shape;
        const propValues = {};
        for (const key in shape) {
            const field = shape[key]._zod;
            if (field.values) {
                if (!Object.prototype.hasOwnProperty.call(propValues, key)) {
                    _util_js__rspack_import_2/* .assignProp */.Vy(propValues, key, new Set());
                }
                for (const v of field.values)
                    propValues[key].add(v);
                // An omittable slot reads back as undefined at a discriminator lookup, so it has to claim undefined: two options that can both omit the key are not discriminable on it.
                if (field.optin !== undefined)
                    propValues[key].add(undefined);
            }
        }
        return propValues;
    });
    const isObject = _util_js__rspack_import_2/* .isObject */.Gv;
    const catchall = def.catchall;
    let value;
    const memo = _core_js__rspack_import_0/* .globalConfig.memoizer */.cr.memoizer;
    memo?.attach(inst);
    inst._zod.parse = (payload, ctx) => {
        value ?? (value = _normalized.value);
        const input = payload.value;
        if (!isObject(input)) {
            payload.issues.push({
                expected: "object",
                code: "invalid_type",
                input,
                inst,
            });
            return payload;
        }
        payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
        const proms = [];
        const shape = value.shape;
        const abortEarly = ctx?.abortEarly;
        let seen = payload.issues.length;
        for (const key of value.allKeys) {
            if (abortEarly && payload.issues.length !== seen) {
                if (_util_js__rspack_import_2/* .aborted */.QH(payload, seen))
                    break;
                seen = payload.issues.length;
            }
            if (key === "__proto__")
                continue;
            const el = shape[key];
            const optin = el._zod.optin;
            const optout = el._zod.optout;
            const r = el._zod.run({ value: input[key], issues: [] }, ctx);
            if (r instanceof Promise) {
                proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
            }
            else {
                handlePropertyResult(r, payload, key, input, optin, optout);
            }
        }
        if (!catchall) {
            return proms.length ? Promise.all(proms).then(() => payload) : payload;
        }
        return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
    };
});
const $ZodObjectJIT = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodObjectJIT", (inst, def) => {
    // requires cast because technically $ZodObject doesn't extend
    $ZodObject.init(inst, def);
    const superParse = inst._zod.parse;
    const _normalized = _util_js__rspack_import_2/* .cached */.PO(() => normalizeDef(def));
    const memo = _core_js__rspack_import_0/* .globalConfig.memoizer */.cr.memoizer;
    const generateFastpass = (shape) => {
        const normalized = _normalized.value;
        const syms = normalized.symbolKeys;
        // a symbol has no source literal, so it is read as `syms[i]` off the closed-over scope
        const doc = new _doc_js__rspack_import_5/* .Doc */.J(["payload", "ctx"], { shape, inst, memo, syms });
        const parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
        // prefixes in place, like util.prefixIssues. newResult must land before the early return: a catchall runs after this and would otherwise write onto the caller's input
        const prefixStr = (id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
        doc.write(`const input = payload.value;`);
        const ids = Object.create(null);
        let counter = 0;
        for (const key of normalized.allKeys) {
            ids[key] = `key_${counter++}`;
        }
        // A: preserve key order {
        doc.write(memo ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
        for (const key of normalized.allKeys) {
            if (key === "__proto__")
                continue;
            const id = ids[key];
            const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : _util_js__rspack_import_2/* .esc */.UQ(key);
            const isPresent = `${k} in input`;
            const schema = shape[key];
            const optin = schema?._zod?.optin;
            const isOptionalIn = optin !== undefined;
            const isOptionalOut = schema?._zod?.optout === "optional";
            doc.write(`const ${id} = ${parseStr(k)};`);
            if (isOptionalIn && isOptionalOut) {
                // For optional-in/out schemas, ignore errors on absent keys — and, like the interpreted path, drop the value produced alongside them. The middle rung goes further: it permits absence without supplying anything in its place, so an absent key contributes nothing at all.
                const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
                doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
            }
            else if (!isOptionalIn) {
                doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
            }
            else {
                doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
                if (optin === "defaulted") {
                    doc.write(`newResult[${k}] = ${id}.value;`);
                }
                else {
                    doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
                }
            }
        }
        doc.write(`payload.value = newResult;`);
        doc.write(`return payload;`);
        // closing `shape` in is what pays: turbofan specializes the parser against that one shape object, so every `shape[k]._zod.run` folds to a known callee. as a parameter it stays a generic load and measures 13% slower even with the forwarding frame gone
        return doc.compile();
    };
    let fastpass;
    const isObject = _util_js__rspack_import_2/* .isObject */.Gv;
    const jit = !_core_js__rspack_import_0/* .globalConfig.jitless */.cr.jitless;
    const allowsEval = _util_js__rspack_import_2/* .allowsEval */.hI;
    const fastEnabled = jit && allowsEval.value; // && !def.catchall;
    const catchall = def.catchall;
    let value;
    inst._zod.parse = (payload, ctx) => {
        value ?? (value = _normalized.value);
        const input = payload.value;
        if (!isObject(input)) {
            payload.issues.push({
                expected: "object",
                code: "invalid_type",
                input,
                inst,
            });
            return payload;
        }
        if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
            // always synchronous
            if (!fastpass)
                fastpass = generateFastpass(def.shape);
            payload = fastpass(payload, ctx);
            if (!catchall)
                return payload;
            return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
        }
        return superParse(payload, ctx);
    };
});
function handleUnionResults(results, final, inst, ctx) {
    for (const result of results) {
        if (result.issues.length === 0) {
            final.value = result.value;
            return final;
        }
    }
    const nonaborted = results.filter((r) => !_util_js__rspack_import_2/* .aborted */.QH(r));
    if (nonaborted.length === 1) {
        final.value = nonaborted[0].value;
        return nonaborted[0];
    }
    final.issues.push({
        code: "invalid_union",
        input: final.value,
        inst,
        errors: results.map((result) => result.issues.map((iss) => _util_js__rspack_import_2/* .finalizeIssue */.iR(iss, ctx, _core_js__rspack_import_0/* .config */.$W()))),
    });
    return final;
}
const $ZodUnion = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodUnion", (inst, def) => {
    $ZodType.init(inst, def);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted")
        ? "defaulted"
        : zod.def.options.some((o) => o._zod.optin !== undefined)
            ? "optional"
            : undefined);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : undefined);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "values", (zod) => {
        if (zod.def.options.every((o) => o._zod.values)) {
            return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
        }
        return undefined;
    });
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "pattern", (zod) => {
        if (zod.def.options.every((o) => o._zod.pattern)) {
            const patterns = zod.def.options.map((o) => o._zod.pattern);
            return new RegExp(`^(${patterns.map((p) => _util_js__rspack_import_2/* .cleanRegex */.p6(p.source)).join("|")})$`);
        }
        return undefined;
    });
    const first = def.options.length === 1 ? def.options[0]._zod.run : null;
    inst._zod.parse = (payload, ctx) => {
        if (first) {
            return first(payload, ctx);
        }
        let async = false;
        const results = [];
        for (const option of def.options) {
            const result = option._zod.run({
                value: payload.value,
                issues: [],
            }, ctx);
            if (result instanceof Promise) {
                results.push(result);
                async = true;
            }
            else {
                if (result.issues.length === 0)
                    return result;
                results.push(result);
            }
        }
        if (!async)
            return handleUnionResults(results, payload, inst, ctx);
        return Promise.all(results).then((results) => {
            return handleUnionResults(results, payload, inst, ctx);
        });
    };
});
function handleExclusiveUnionResults(results, final, inst, ctx) {
    const matches = [];
    for (let i = 0; i < results.length; i++) {
        if (results[i].issues.length === 0)
            matches.push(i);
    }
    if (matches.length === 1) {
        final.value = results[matches[0]].value;
        return final;
    }
    if (matches.length === 0) {
        // No matches - same as regular union
        final.issues.push({
            code: "invalid_union",
            input: final.value,
            inst,
            errors: results.map((result) => result.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config()))),
        });
    }
    else {
        // Multiple matches - exclusive union failure
        final.issues.push({
            code: "invalid_union",
            input: final.value,
            inst,
            errors: [],
            inclusive: false,
            matches,
        });
    }
    return final;
}
const $ZodXor = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodXor", (inst, def) => {
    $ZodUnion.init(inst, def);
    def.inclusive = false;
    const first = def.options.length === 1 ? def.options[0]._zod.run : null;
    inst._zod.parse = (payload, ctx) => {
        if (first) {
            return first(payload, ctx);
        }
        let async = false;
        const results = [];
        for (const option of def.options) {
            const result = option._zod.run({
                value: payload.value,
                issues: [],
            }, ctx);
            if (result instanceof Promise) {
                results.push(result);
                async = true;
            }
            else {
                results.push(result);
            }
        }
        if (!async)
            return handleExclusiveUnionResults(results, payload, inst, ctx);
        return Promise.all(results).then((results) => {
            return handleExclusiveUnionResults(results, payload, inst, ctx);
        });
    };
})));
/** Returns the option whose discriminator claims `value`, or throws if ambiguous. */
function getDiscriminatedOption(union, value) {
    const internals = union._zod;
    let map = internals.bag.optionsMap;
    if (!map) {
        map = discriminatorMap(internals.def);
        internals.bag.optionsMap = map;
    }
    const option = map.get(value);
    if (option === null)
        throw new Error(`Ambiguous discriminator value "${String(value)}"`);
    return option;
}
function discriminatorMap(def) {
    const map = new Map();
    for (const option of def.options) {
        const values = option._zod.propValues?.[def.discriminator];
        if (!values || values.size === 0)
            throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
        for (const value of values) {
            if (map.has(value)) {
                if (value !== undefined)
                    throw new Error(`Duplicate discriminator value "${String(value)}"`);
                // keep the collision marked so a later member cannot reclaim it
                map.set(value, null);
            }
            else {
                map.set(value, option);
            }
        }
    }
    return map;
}
const $ZodDiscriminatedUnion = 
/*@__PURE__*/
_core_js__rspack_import_0/* .$constructor */.xI("$ZodDiscriminatedUnion", (inst, def) => {
    def.inclusive = false;
    $ZodUnion.init(inst, def);
    const _super = inst._zod.parse;
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "propValues", (zod) => {
        const propValues = {};
        let undefinedCount = 0;
        for (const option of zod.def.options) {
            const pv = option._zod.propValues;
            if (!pv || Object.keys(pv).length === 0)
                throw new Error(`Invalid discriminated union option at index "${zod.def.options.indexOf(option)}"`);
            if (pv[zod.def.discriminator]?.has(undefined))
                undefinedCount++;
            for (const [k, v] of Object.entries(pv)) {
                if (!Object.prototype.hasOwnProperty.call(propValues, k)) {
                    _util_js__rspack_import_2/* .assignProp */.Vy(propValues, k, new Set());
                }
                for (const val of v) {
                    propValues[k].add(val);
                }
            }
        }
        if (!zod.def.unionFallback && undefinedCount > 1)
            propValues[zod.def.discriminator]?.delete(undefined);
        return propValues;
    });
    // Checked now rather than in the lookup map below, so an option that lacks the discriminator fails at the `discriminatedUnion` call instead of on the first object parsed. Options whose shape cannot be enumerated without resolving it — pipes and lazies — are left to the map.
    def.options.forEach((option, i) => {
        const propShape = _util_js__rspack_import_2/* .rawShape */.MO(option._zod.def);
        if (propShape && !Object.prototype.hasOwnProperty.call(propShape, def.discriminator)) {
            throw new Error(`Invalid discriminated union option at index "${i}"`);
        }
    });
    const disc = _util_js__rspack_import_2/* .cached */.PO(() => discriminatorMap(def));
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!_util_js__rspack_import_2/* .isObject */.Gv(input)) {
            payload.issues.push({
                code: "invalid_type",
                expected: "object",
                input,
                inst,
            });
            return payload;
        }
        const value = input?.[def.discriminator];
        const opt = disc.value.get(value);
        // forward metadata cannot choose an encoder for an absent tag
        if (opt && (value !== undefined || ctx.direction !== "backward")) {
            return opt._zod.run(payload, ctx);
        }
        // Fall back to union matching when the fast discriminator path fails:
        // - explicitly enabled via unionFallback, or
        // - during backward direction (encode), since codec-based discriminators have different values in forward vs backward directions
        if (def.unionFallback || ctx.direction === "backward") {
            return _super(payload, ctx);
        }
        // no matching discriminator
        payload.issues.push({
            code: "invalid_union",
            errors: [],
            note: "No matching discriminator",
            discriminator: def.discriminator,
            options: Array.from(disc.value.keys()).filter((value) => disc.value.get(value) !== null),
            input,
            path: [def.discriminator],
            inst,
        });
        return payload;
    };
});
const $ZodIntersection = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodIntersection", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        const left = def.left._zod.run({ value: input, issues: [] }, ctx);
        const right = def.right._zod.run({ value: input, issues: [] }, ctx);
        const async = left instanceof Promise || right instanceof Promise;
        if (async) {
            return Promise.all([left, right]).then(([left, right]) => {
                return handleIntersectionResults(payload, left, right);
            });
        }
        return handleIntersectionResults(payload, left, right);
    };
});
function mergeValues(a, b) {
    // const aType = parse.t(a);
    // const bType = parse.t(b);
    if (a === b) {
        return { valid: true, data: a };
    }
    if (a instanceof Date && b instanceof Date && +a === +b) {
        return { valid: true, data: a };
    }
    if (_util_js__rspack_import_2/* .isPlainObject */.Qd(a) && _util_js__rspack_import_2/* .isPlainObject */.Qd(b)) {
        const bKeys = Object.keys(b);
        const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
        const newObj = { ...a, ...b };
        if (Object.prototype.hasOwnProperty.call(newObj, "__proto__"))
            delete newObj.__proto__;
        for (const key of sharedKeys) {
            if (key === "__proto__")
                continue;
            const sharedValue = mergeValues(a[key], b[key]);
            if (!sharedValue.valid) {
                return {
                    valid: false,
                    mergeErrorPath: [key, ...sharedValue.mergeErrorPath],
                };
            }
            newObj[key] = sharedValue.data;
        }
        return { valid: true, data: newObj };
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return { valid: false, mergeErrorPath: [] };
        }
        const newArray = [];
        for (let index = 0; index < a.length; index++) {
            const itemA = a[index];
            const itemB = b[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) {
                return {
                    valid: false,
                    mergeErrorPath: [index, ...sharedValue.mergeErrorPath],
                };
            }
            newArray.push(sharedValue.data);
        }
        return { valid: true, data: newArray };
    }
    return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
    // Track which side(s) reject each key. A key rejection is reported only when BOTH sides reject it, so a key owned by one branch survives the other's key schema. strictObject reports these as unrecognized_keys; a record with an open key schema reports one invalid_key per key.
    const unrecKeys = new Map();
    let unrecIssue;
    const keyIssues = new Map();
    const collect = (iss, side) => {
        let keys;
        if (iss.code === "unrecognized_keys" && !iss.path?.length) {
            unrecIssue ?? (unrecIssue = iss);
            keys = iss.keys;
        }
        else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
            const k = String(iss.path[0]);
            if (!keyIssues.has(k))
                keyIssues.set(k, iss);
            keys = [k];
        }
        else {
            return false;
        }
        for (const k of keys) {
            if (!unrecKeys.has(k))
                unrecKeys.set(k, {});
            unrecKeys.get(k)[side] = true;
        }
        return true;
    };
    for (const iss of left.issues) {
        if (!collect(iss, "l"))
            result.issues.push(iss);
    }
    for (const iss of right.issues) {
        if (!collect(iss, "r"))
            result.issues.push(iss);
    }
    // Report only keys rejected by BOTH sides
    const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
    if (bothKeys.length) {
        const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
        if (aggregated.length)
            result.issues.push({ ...unrecIssue, keys: aggregated });
        for (const k of bothKeys) {
            if (!aggregated.includes(k) && keyIssues.has(k))
                result.issues.push(keyIssues.get(k));
        }
    }
    const merged = mergeValues(left.value, right.value);
    if (!merged.valid) {
        if (_util_js__rspack_import_2/* .aborted */.QH(result))
            return result;
        throw new Error(`Unmergable intersection. Error path: ` + `${JSON.stringify(merged.mergeErrorPath)}`);
    }
    result.value = merged.data;
    return result;
}
const $ZodTuple = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodTuple", (inst, def) => {
    $ZodType.init(inst, def);
    const items = def.items;
    const memo = core.globalConfig.memoizer;
    memo?.attach(inst);
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!Array.isArray(input)) {
            payload.issues.push({
                input,
                inst,
                expected: "tuple",
                code: "invalid_type",
            });
            return payload;
        }
        payload.value = memo ? memo.alloc(inst, payload, [], ctx) : [];
        const proms = [];
        const optinStart = getTupleOptStart(items, "optin");
        const optoutStart = getTupleOptStart(items, "optout");
        if (!def.rest) {
            if (input.length < optinStart) {
                payload.issues.push({
                    code: "too_small",
                    minimum: optinStart,
                    inclusive: true,
                    input,
                    inst,
                    origin: "array",
                });
                return payload;
            }
            if (input.length > items.length) {
                payload.issues.push({
                    code: "too_big",
                    maximum: items.length,
                    inclusive: true,
                    input,
                    inst,
                    origin: "array",
                });
            }
        }
        // Run every item in parallel, collecting results into an indexed array. The post-processing in `handleTupleResults` walks them in order so it can decide whether an absent optional-output error can truncate the tail or must be reported to preserve required output.
        const itemResults = new Array(items.length);
        // only tracked when there is a rest loop to skip
        const abortEarly = def.rest ? ctx?.abortEarly : undefined;
        let itemAborted = false;
        for (let i = 0; i < items.length; i++) {
            const r = items[i]._zod.run({ value: input[i], issues: [] }, ctx);
            if (r instanceof Promise) {
                proms.push(r.then((rr) => {
                    itemResults[i] = rr;
                }));
            }
            else {
                itemResults[i] = r;
                if (abortEarly && !itemAborted && r.issues.length)
                    itemAborted = util.aborted(r);
            }
        }
        // sound because rest is non-empty exactly when every fixed index is present, the one case handleTupleResults cannot discard an item's issues
        if (def.rest && !itemAborted) {
            let i = items.length - 1;
            const rest = input.slice(items.length);
            let seen = payload.issues.length;
            for (const el of rest) {
                if (abortEarly && payload.issues.length !== seen) {
                    if (util.aborted(payload, seen))
                        break;
                    seen = payload.issues.length;
                }
                i++;
                const result = def.rest._zod.run({ value: el, issues: [] }, ctx);
                if (result instanceof Promise) {
                    proms.push(result.then((r) => handleTupleResult(r, payload, i)));
                }
                else {
                    handleTupleResult(result, payload, i);
                }
            }
        }
        if (proms.length) {
            return Promise.all(proms).then(() => handleTupleResults(itemResults, payload, items, input, optoutStart));
        }
        return handleTupleResults(itemResults, payload, items, input, optoutStart);
    };
})));
function getTupleOptStart(items, key) {
    for (let i = items.length - 1; i >= 0; i--) {
        // optin is a three-rung ladder so any rung above `undefined` permits an absent slot; optout stays two-valued.
        const omittable = key === "optin" ? items[i]._zod.optin !== undefined : items[i]._zod.optout === "optional";
        if (!omittable)
            return i + 1;
    }
    return 0;
}
function handleTupleResult(result, final, index) {
    if (result.issues.length) {
        final.issues.push(...util.prefixIssues(index, result.issues));
    }
    final.value[index] = result.value;
}
function handleTupleResults(itemResults, final, items, input, optoutStart) {
    // Walk results in order. Mirror $ZodObject's swallow-on-absent-optional rule, but only after `optoutStart`: the first index where the output tuple tail can be absent.
    for (let i = 0; i < items.length; i++) {
        const r = itemResults[i];
        const isPresent = i < input.length;
        // The array analog of `handlePropertyResult`'s absent-key early return: the middle rung permits absence without supplying anything in its place, so the tail truncates here instead of materializing whatever the item made of `undefined`.
        if (!isPresent && i >= optoutStart && items[i]._zod.optin === "optional") {
            final.value.length = i;
            break;
        }
        if (r.issues.length) {
            if (!isPresent && i >= optoutStart) {
                final.value.length = i;
                break;
            }
            final.issues.push(...util.prefixIssues(i, r.issues));
        }
        final.value[i] = r.value;
    }
    // Drop trailing slots that produced `undefined` for absent input
    // (the array analog of an absent optional key on an object). The
    // `i >= input.length` floor is critical: an explicit `undefined`
    // *inside* the input must be preserved even when the schema is
    // optional-out (e.g. `z.string().or(z.undefined())` accepting an
    // explicit undefined value).
    for (let i = final.value.length - 1; i >= input.length; i--) {
        if (items[i]._zod.optout === "optional" && final.value[i] === undefined) {
            final.value.length = i;
        }
        else {
            break;
        }
    }
    return final;
}
const $ZodRecord = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodRecord", (inst, def) => {
    $ZodType.init(inst, def);
    const memo = _core_js__rspack_import_0/* .globalConfig.memoizer */.cr.memoizer;
    memo?.attach(inst);
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!_util_js__rspack_import_2/* .isPlainObject */.Qd(input)) {
            payload.issues.push({
                expected: "record",
                code: "invalid_type",
                input,
                inst,
            });
            return payload;
        }
        // no guard in either loop below: a record's invalid_key aborts but an enclosing intersection can reconcile it, so a stopped loop hides keys the sibling does not own and the intersection then rejects nothing
        const proms = [];
        const values = def.keyType._zod.values;
        if (values && !def.partial) {
            payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
            const recordKeys = new Set();
            for (const key of values) {
                if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
                    recordKeys.add(typeof key === "number" ? key.toString() : key);
                    // A declared __proto__ is stripped but is not an unrecognized key.
                    if (key === "__proto__")
                        continue;
                    const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
                    if (keyResult instanceof Promise) {
                        throw new Error("Async schemas not supported in object keys currently");
                    }
                    if (keyResult.issues.length) {
                        payload.issues.push({
                            code: "invalid_key",
                            origin: "record",
                            issues: keyResult.issues.map((iss) => _util_js__rspack_import_2/* .finalizeIssue */.iR(iss, ctx, _core_js__rspack_import_0/* .config */.$W())),
                            input: key,
                            path: [key],
                            inst,
                        });
                        continue;
                    }
                    const outKey = keyResult.value;
                    if (outKey === "__proto__")
                        continue;
                    const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
                    if (result instanceof Promise) {
                        proms.push(result.then((result) => {
                            if (result.issues.length) {
                                payload.issues.push(..._util_js__rspack_import_2/* .prefixIssues */.lQ(key, result.issues));
                            }
                            payload.value[outKey] = result.value;
                        }));
                    }
                    else {
                        if (result.issues.length) {
                            payload.issues.push(..._util_js__rspack_import_2/* .prefixIssues */.lQ(key, result.issues));
                        }
                        payload.value[outKey] = result.value;
                    }
                }
            }
            let unrecognized;
            for (const key in input) {
                if (!recordKeys.has(key)) {
                    if (def.mode === "loose") {
                        // skip __proto__ so it can't replace the result prototype via the assignment setter on the plain {} we build into
                        if (key === "__proto__")
                            continue;
                        payload.value[key] = input[key];
                    }
                    else {
                        unrecognized = unrecognized ?? [];
                        unrecognized.push(key);
                    }
                }
            }
            if (unrecognized && unrecognized.length > 0) {
                payload.issues.push({
                    code: "unrecognized_keys",
                    input,
                    inst,
                    keys: unrecognized,
                    continue: true,
                });
            }
        }
        else {
            payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
            // An enumerable key schema declares which keys the record owns, so a key outside the set is unrecognized. A non-enumerable one (regex, refine) is a constraint every key must satisfy, so a failing key is invalid. Only the former is reconcilable against the other side of an intersection.
            let unrecognized;
            // Reflect.ownKeys for Symbol-key support; filter non-enumerable to match z.object()
            for (const key of Reflect.ownKeys(input)) {
                if (key === "__proto__")
                    continue;
                if (!Object.prototype.propertyIsEnumerable.call(input, key))
                    continue;
                let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
                if (keyResult instanceof Promise) {
                    throw new Error("Async schemas not supported in object keys currently");
                }
                // Numeric string fallback: if key is a numeric string and failed, retry with Number(key). This handles z.number(), z.literal([1, 2, 3]), and unions containing numeric literals
                const checkNumericKey = typeof key === "string" && _regexes_js__rspack_import_3/* .number.test */.ai.test(key) && keyResult.issues.length;
                if (checkNumericKey) {
                    const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
                    if (retryResult instanceof Promise) {
                        throw new Error("Async schemas not supported in object keys currently");
                    }
                    if (retryResult.issues.length === 0) {
                        keyResult = retryResult;
                    }
                }
                if (keyResult.issues.length) {
                    if (def.mode === "loose") {
                        // Pass through unchanged
                        payload.value[key] = input[key];
                    }
                    else if (values) {
                        unrecognized = unrecognized ?? [];
                        unrecognized.push(key);
                    }
                    else {
                        // Default "strict" behavior: error on invalid key
                        payload.issues.push({
                            code: "invalid_key",
                            origin: "record",
                            issues: keyResult.issues.map((iss) => _util_js__rspack_import_2/* .finalizeIssue */.iR(iss, ctx, _core_js__rspack_import_0/* .config */.$W())),
                            input: key,
                            path: [key],
                            inst,
                        });
                    }
                    continue;
                }
                // the guard above tests the raw input key, but the key schema can normalize an ordinary key into __proto__; re-check the key we actually write under
                const outKey = keyResult.value;
                if (outKey === "__proto__")
                    continue;
                const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
                if (result instanceof Promise) {
                    proms.push(result.then((result) => {
                        if (result.issues.length) {
                            payload.issues.push(..._util_js__rspack_import_2/* .prefixIssues */.lQ(key, result.issues));
                        }
                        payload.value[outKey] = result.value;
                    }));
                }
                else {
                    if (result.issues.length) {
                        payload.issues.push(..._util_js__rspack_import_2/* .prefixIssues */.lQ(key, result.issues));
                    }
                    payload.value[outKey] = result.value;
                }
            }
            if (unrecognized && unrecognized.length > 0) {
                payload.issues.push({
                    code: "unrecognized_keys",
                    input,
                    inst,
                    keys: unrecognized,
                    continue: true,
                });
            }
        }
        if (proms.length) {
            return Promise.all(proms).then(() => payload);
        }
        return payload;
    };
});
const $ZodMap = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodMap", (inst, def) => {
    $ZodType.init(inst, def);
    const memo = core.globalConfig.memoizer;
    memo?.attach(inst);
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!(input instanceof Map)) {
            payload.issues.push({
                expected: "map",
                code: "invalid_type",
                input,
                inst,
            });
            return payload;
        }
        const proms = [];
        payload.value = memo ? memo.alloc(inst, payload, new Map(), ctx) : new Map();
        const abortEarly = ctx?.abortEarly;
        let seen = payload.issues.length;
        for (const [key, value] of input) {
            if (abortEarly && payload.issues.length !== seen) {
                if (util.aborted(payload, seen))
                    break;
                seen = payload.issues.length;
            }
            const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
            const valueResult = def.valueType._zod.run({ value: value, issues: [] }, ctx);
            if (keyResult instanceof Promise || valueResult instanceof Promise) {
                proms.push(Promise.all([keyResult, valueResult]).then(([keyResult, valueResult]) => {
                    handleMapResult(keyResult, valueResult, payload, key, input, inst, ctx);
                }));
            }
            else {
                handleMapResult(keyResult, valueResult, payload, key, input, inst, ctx);
            }
        }
        if (proms.length)
            return Promise.all(proms).then(() => payload);
        return payload;
    };
})));
function handleMapResult(keyResult, valueResult, final, key, input, inst, ctx) {
    if (keyResult.issues.length) {
        if (util.propertyKeyTypes.has(typeof key)) {
            final.issues.push(...util.prefixIssues(key, keyResult.issues));
        }
        else {
            final.issues.push({
                code: "invalid_key",
                origin: "map",
                input,
                inst,
                issues: keyResult.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())),
            });
        }
    }
    if (valueResult.issues.length) {
        if (util.propertyKeyTypes.has(typeof key)) {
            final.issues.push(...util.prefixIssues(key, valueResult.issues));
        }
        else {
            final.issues.push({
                origin: "map",
                code: "invalid_element",
                input,
                inst,
                key: key,
                issues: valueResult.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())),
            });
        }
    }
    final.value.set(keyResult.value, valueResult.value);
}
const $ZodSet = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodSet", (inst, def) => {
    $ZodType.init(inst, def);
    const memo = core.globalConfig.memoizer;
    memo?.attach(inst);
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!(input instanceof Set)) {
            payload.issues.push({
                input,
                inst,
                expected: "set",
                code: "invalid_type",
            });
            return payload;
        }
        const proms = [];
        payload.value = memo ? memo.alloc(inst, payload, new Set(), ctx) : new Set();
        const abortEarly = ctx?.abortEarly;
        let seen = payload.issues.length;
        for (const item of input) {
            if (abortEarly && payload.issues.length !== seen) {
                if (util.aborted(payload, seen))
                    break;
                seen = payload.issues.length;
            }
            const result = def.valueType._zod.run({ value: item, issues: [] }, ctx);
            if (result instanceof Promise) {
                proms.push(result.then((result) => handleSetResult(result, payload)));
            }
            else
                handleSetResult(result, payload);
        }
        if (proms.length)
            return Promise.all(proms).then(() => payload);
        return payload;
    };
})));
function handleSetResult(result, final) {
    if (result.issues.length) {
        final.issues.push(...result.issues);
    }
    final.value.add(result.value);
}
const $ZodEnum = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodEnum", (inst, def) => {
    $ZodType.init(inst, def);
    const values = _util_js__rspack_import_2/* .getEnumValues */.w5(def.entries);
    const valuesSet = new Set(values);
    inst._zod.values = valuesSet;
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "pattern", (zod) => {
        const patternValues = _util_js__rspack_import_2/* .getEnumValues */.w5(zod.def.entries).filter((k) => _util_js__rspack_import_2/* .propertyKeyTypes.has */.qQ.has(typeof k));
        // unmatchable fallback, RE2-safe: an empty alternation would compile to /^()$/, which matches ""
        return new RegExp(patternValues.length ? `^(${patternValues.map((o) => _util_js__rspack_import_2/* .escapeRegex */.sD(o.toString())).join("|")})$` : "^[^\\s\\S]$");
    });
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (valuesSet.has(input)) {
            return payload;
        }
        payload.issues.push({
            code: "invalid_value",
            values,
            input,
            inst,
        });
        return payload;
    };
});
const $ZodLiteral = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodLiteral", (inst, def) => {
    $ZodType.init(inst, def);
    const values = new Set(def.values);
    inst._zod.values = values;
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "pattern", (zod) => {
        const vals = zod.def.values;
        // unmatchable fallback, RE2-safe: an empty alternation would compile to /^()$/, which matches ""
        return new RegExp(vals.length
            ? `^(${vals
                .map((o) => typeof o === "string" ? _util_js__rspack_import_2/* .escapeRegex */.sD(o) : o ? _util_js__rspack_import_2/* .escapeRegex */.sD(o.toString()) : String(o))
                .join("|")})$`
            : "^[^\\s\\S]$");
    });
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (values.has(input)) {
            return payload;
        }
        payload.issues.push({
            code: "invalid_value",
            values: def.values,
            input,
            inst,
        });
        return payload;
    };
});
const $ZodFile = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodFile", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        // @ts-ignore
        if (input instanceof File)
            return payload;
        payload.issues.push({
            expected: "file",
            code: "invalid_type",
            input,
            inst,
        });
        return payload;
    };
})));
const $ZodTransform = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodTransform", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.optin = "optional";
    _core_js__rspack_import_0/* .globalConfig.memoizer */.cr.memoizer?.guard(inst);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            throw new _core_js__rspack_import_0/* .$ZodEncodeError */.cV(inst.constructor.name);
        }
        const _out = def.transform(payload.value, payload);
        if (ctx.async) {
            const output = _out instanceof Promise ? _out : Promise.resolve(_out);
            return output.then((output) => {
                payload.value = output;
                return payload;
            });
        }
        if (_out instanceof Promise) {
            throw new _core_js__rspack_import_0/* .$ZodAsyncError */.GT();
        }
        payload.value = _out;
        return payload;
    };
});
function handleOptionalResult(payload, result) {
    // A substituting schema that still failed has no usable answer; yield undefined. Its issues are simply dropped: it ran on a payload of its own, so there is no shared array to truncate and nothing of the caller's to lose with it.
    payload.value = result.issues.length ? undefined : result.value;
    return payload;
}
const $ZodOptional = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodOptional", (inst, def) => {
    $ZodType.init(inst, def);
    // .optional() propagates absence rather than substituting for it, so a defaulted inner keeps its rung.
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
    inst._zod.optout = "optional";
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "values", (zod) => {
        const values = zod.def.innerType._zod.values;
        return values ? new Set([...values, undefined]) : undefined;
    });
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "pattern", (zod) => {
        const pattern = zod.def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${_util_js__rspack_import_2/* .cleanRegex */.p6(pattern.source)})?$`) : undefined;
    });
    inst._zod.parse = (payload, ctx) => {
        if (payload.value === undefined) {
            // Only the top rung substitutes a value for absence; everything else leaves it intact, which is what .optional() means.
            if (def.innerType._zod.optin !== "defaulted")
                return payload;
            // Its own payload, for the same reason $ZodCatch gets one: a pipe forwards an unrecognized key through the caller's issues array, and this must not read that as the substituting schema failing and drop it.
            const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
            if (result instanceof Promise)
                return result.then((result) => handleOptionalResult(payload, result));
            return handleOptionalResult(payload, result);
        }
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodExactOptional = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodExactOptional", (inst, def) => {
    // Call parent init - inherits optin/optout = "optional"
    $ZodOptional.init(inst, def);
    // Override values/pattern to NOT add undefined
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "values", (zod) => zod.def.innerType._zod.values);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
    // Override parse to just delegate (no undefined handling)
    inst._zod.parse = (payload, ctx) => {
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodNullable = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodNullable", (inst, def) => {
    $ZodType.init(inst, def);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "optin", (zod) => zod.def.innerType._zod.optin);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "optout", (zod) => zod.def.innerType._zod.optout);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "pattern", (zod) => {
        const pattern = zod.def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${_util_js__rspack_import_2/* .cleanRegex */.p6(pattern.source)}|null)$`) : undefined;
    });
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "values", (zod) => {
        return zod.def.innerType._zod.values ? new Set([...zod.def.innerType._zod.values, null]) : undefined;
    });
    inst._zod.parse = (payload, ctx) => {
        // Forward direction (decode): allow null to pass through
        if (payload.value === null)
            return payload;
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodDefault = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodDefault", (inst, def) => {
    $ZodType.init(inst, def);
    // inst._zod.qin = "true";
    inst._zod.optin = "defaulted";
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "values", (zod) => zod.def.innerType._zod.values);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        // Forward direction (decode): apply defaults for undefined input
        if (payload.value === undefined) {
            payload.value = def.defaultValue;
            /**
             * $ZodDefault returns the default value immediately in forward direction.
             * It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
            return payload;
        }
        // Forward direction: continue with default handling
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then((result) => handleDefaultResult(result, def));
        }
        return handleDefaultResult(result, def);
    };
});
function handleDefaultResult(payload, def) {
    if (payload.value === undefined) {
        payload.value = def.defaultValue;
    }
    return payload;
}
const $ZodPrefault = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodPrefault", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.optin = "defaulted";
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "values", (zod) => zod.def.innerType._zod.values);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        // Forward direction (decode): apply prefault for undefined input
        if (payload.value === undefined) {
            payload.value = def.defaultValue;
        }
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodNonOptional = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodNonOptional", (inst, def) => {
    $ZodType.init(inst, def);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "values", (zod) => {
        const v = zod.def.innerType._zod.values;
        return v ? new Set([...v].filter((x) => x !== undefined)) : undefined;
    });
    inst._zod.parse = (payload, ctx) => {
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then((result) => handleNonOptionalResult(result, inst));
        }
        return handleNonOptionalResult(result, inst);
    };
});
function handleNonOptionalResult(payload, inst) {
    if (!payload.issues.length && payload.value === undefined) {
        payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: payload.value,
            inst,
        });
    }
    return payload;
}
const $ZodSuccess = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodSuccess", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            throw new core.$ZodEncodeError("ZodSuccess");
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then((result) => {
                payload.value = result.issues.length === 0;
                return payload;
            });
        }
        payload.value = result.issues.length === 0;
        return payload;
    };
})));
function handleCatchResult(payload, result, def, ctx) {
    if (!result.issues.length) {
        payload.value = result.value;
        // The value carries up, so the flag describing it has to carry with it: a back-edge into a node still being parsed must not be frozen by an enclosing readonly, and its checks belong to the node itself. Guarded so the ordinary case adds no own property.
        if (result.memo)
            payload.memo = true;
        return payload;
    }
    // Spread the inner's own payload, not ours: `value` has to stay the input the catch was handed, and the inner ran on a payload of its own so its issues are already private to this call.
    payload.value = def.catchValue({
        ...result,
        value: payload.value,
        error: {
            issues: result.issues.map((iss) => _util_js__rspack_import_2/* .finalizeIssue */.iR(iss, ctx, _core_js__rspack_import_0/* .config */.$W())),
        },
        input: payload.value,
    });
    return payload;
}
const $ZodCatch = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCatch", (inst, def) => {
    $ZodType.init(inst, def);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "optout", (zod) => zod.def.innerType._zod.optout);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "values", (zod) => zod.def.innerType._zod.values);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        // Forward direction (decode): apply catch logic
        const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
        if (result instanceof Promise) {
            return result.then((result) => handleCatchResult(payload, result, def, ctx));
        }
        return handleCatchResult(payload, result, def, ctx);
    };
});
const $ZodNaN = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodNaN", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _ctx) => {
        if (typeof payload.value !== "number" || !Number.isNaN(payload.value)) {
            payload.issues.push({
                input: payload.value,
                inst,
                expected: "nan",
                code: "invalid_type",
            });
            return payload;
        }
        return payload;
    };
})));
const $ZodPipe = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodPipe", (inst, def) => {
    $ZodType.init(inst, def);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "values", (zod) => zod.def.in._zod.values);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "optin", (zod) => zod.def.in._zod.optin);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "optout", (zod) => zod.def.out._zod.optout);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "propValues", (zod) => zod.def.in._zod.propValues);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            const right = def.out._zod.run(payload, ctx);
            if (right instanceof Promise) {
                return right.then((right) => handlePipeResult(right, def.in, ctx));
            }
            return handlePipeResult(right, def.in, ctx);
        }
        const left = def.in._zod.run(payload, ctx);
        if (left instanceof Promise) {
            return left.then((left) => handlePipeResult(left, def.out, ctx));
        }
        return handlePipeResult(left, def.out, ctx);
    };
});
function handlePipeResult(left, next, ctx) {
    // Any issue stops the pipe, so a failing refinement never feeds its transform. An unrecognized key is the exception: it describes the input's extra properties, not the value being piped, and an enclosing intersection may yet reconcile it.
    if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
        // prevent further checks
        left.aborted = true;
        return left;
    }
    return next._zod.run({ value: left.value, issues: left.issues }, ctx);
}
const $ZodCodec = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCodec", (inst, def) => {
    $ZodType.init(inst, def);
    util.defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
    util.defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
    util.defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
    util.defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
    inst._zod.parse = (payload, ctx) => {
        const direction = ctx.direction || "forward";
        if (direction === "forward") {
            const left = def.in._zod.run(payload, ctx);
            if (left instanceof Promise) {
                return left.then((left) => handleCodecAResult(left, def, ctx));
            }
            return handleCodecAResult(left, def, ctx);
        }
        else {
            const right = def.out._zod.run(payload, ctx);
            if (right instanceof Promise) {
                return right.then((right) => handleCodecAResult(right, def, ctx));
            }
            return handleCodecAResult(right, def, ctx);
        }
    };
})));
function handleCodecAResult(result, def, ctx) {
    if (result.issues.length) {
        // prevent further checks
        result.aborted = true;
        return result;
    }
    const direction = ctx.direction || "forward";
    if (direction === "forward") {
        const transformed = def.transform(result.value, result);
        if (transformed instanceof Promise) {
            return transformed.then((value) => handleCodecTxResult(result, value, def.out, ctx));
        }
        return handleCodecTxResult(result, transformed, def.out, ctx);
    }
    else {
        const transformed = def.reverseTransform(result.value, result);
        if (transformed instanceof Promise) {
            return transformed.then((value) => handleCodecTxResult(result, value, def.in, ctx));
        }
        return handleCodecTxResult(result, transformed, def.in, ctx);
    }
}
function handleCodecTxResult(left, value, nextSchema, ctx) {
    // Check if transform added any issues
    if (left.issues.length) {
        left.aborted = true;
        return left;
    }
    return nextSchema._zod.run({ value, issues: left.issues }, ctx);
}
const $ZodPreprocess = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodPreprocess", (inst, def) => {
    $ZodPipe.init(inst, def);
})));
const $ZodReadonly = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodReadonly", (inst, def) => {
    $ZodType.init(inst, def);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "values", (zod) => zod.def.innerType._zod.values);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
    _util_js__rspack_import_2/* .defineLazyInternal */.v5(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then(handleReadonlyResult);
        }
        return handleReadonlyResult(result);
    };
});
function handleReadonlyResult(payload) {
    // A repeat visit hands back a node that is still being built; freezing it here would make the rest of its keys fail to assign.
    if (!payload.memo)
        payload.value = Object.freeze(payload.value);
    return payload;
}
// a leaf's pattern source with its own checks folded in: the last pattern-carrying check wins, else length bounds narrow the catch-all, else an integer format narrows the number form. the fold lives here instead of on `_zod.pattern` so a bundle without template literals never pays for it
function leafPattern(schema) {
    const def = schema._zod.def;
    let pattern = def.pattern;
    let isInt = !!def.format?.includes("int");
    let minimum;
    let maximum;
    for (const ch of def.checks ?? []) {
        const d = ch._zod.def;
        if (d.pattern)
            pattern = d.pattern;
        isInt || (isInt = !!d.format?.includes("int"));
        const lo = d.minimum ?? d.length;
        const hi = d.maximum ?? d.length;
        if (lo !== undefined && (minimum === undefined || lo > minimum))
            minimum = lo;
        if (hi !== undefined && (maximum === undefined || hi < maximum))
            maximum = hi;
    }
    if (pattern)
        return pattern.source;
    // an empty range matches nothing at runtime, and `{8,5}` is not a legal quantifier
    if (minimum !== undefined && maximum !== undefined && minimum > maximum)
        return "(?!)";
    if (minimum !== undefined || maximum !== undefined)
        return regexes.string({ minimum, maximum }).source;
    const own = schema._zod.pattern;
    return (isInt && own === regexes.number ? regexes.integer : own)?.source;
}
// a part's pattern source. a wrapper's pattern embeds its inner pattern's source verbatim, so the folded form is substituted in place without knowing the wrapper's own composition; a union's options are joined the way the union builds its own pattern
function partPattern(schema) {
    const def = schema._zod.def;
    const own = schema._zod.pattern?.source;
    // lazy resolves its inner on the internals, not the def
    const inner = def.innerType ?? schema._zod.innerType;
    if (inner) {
        const before = inner._zod.pattern?.source;
        const after = partPattern(inner);
        if (own && before && after && after !== before) {
            return own.replace(util.cleanRegex(before), () => util.cleanRegex(after));
        }
        return own;
    }
    if (def.options) {
        const sources = def.options.map(partPattern);
        if (sources.every(Boolean))
            return `^(${sources.map((s) => util.cleanRegex(s)).join("|")})$`;
    }
    return leafPattern(schema);
}
const $ZodTemplateLiteral = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodTemplateLiteral", (inst, def) => {
    $ZodType.init(inst, def);
    const regexParts = [];
    for (const part of def.parts) {
        if (typeof part === "object" && part !== null) {
            // is Zod schema
            const source = partPattern(part);
            if (!source) {
                throw new Error(`Invalid template literal part, no pattern found: ${[...part._zod.traits].shift()}`);
            }
            regexParts.push(util.cleanRegex(source));
        }
        else if (part === null || util.primitiveTypes.has(typeof part)) {
            regexParts.push(util.escapeRegex(`${part}`));
        }
        else {
            throw new Error(`Invalid template literal part: ${part}`);
        }
    }
    inst._zod.pattern = new RegExp(`^${regexParts.join("")}$`);
    inst._zod.parse = (payload, _ctx) => {
        if (typeof payload.value !== "string") {
            payload.issues.push({
                input: payload.value,
                inst,
                expected: "string",
                code: "invalid_type",
            });
            return payload;
        }
        inst._zod.pattern.lastIndex = 0;
        if (!inst._zod.pattern.test(payload.value)) {
            payload.issues.push({
                input: payload.value,
                inst,
                code: "invalid_format",
                format: def.format ?? "template_literal",
                pattern: inst._zod.pattern.source,
            });
            return payload;
        }
        return payload;
    };
})));
const $ZodFunction = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodFunction", (inst, def) => {
    $ZodType.init(inst, def);
    // Defined, not assigned: the classic prototype exposes `_def` as a getter with no setter.
    Object.defineProperty(inst, "_def", { value: def });
    inst._zod.def = def;
    inst.implement = (func) => {
        if (typeof func !== "function") {
            throw new Error("implement() must be called with a function");
        }
        // Defined inline so the closure stays anonymous: binding it to a `const` first names it, which costs 256 bytes per implemented function.
        return Object.defineProperty(function (...args) {
            const parsedArgs = inst._def.input ? parse(inst._def.input, args) : args;
            const result = Reflect.apply(func, this, parsedArgs);
            if (inst._def.output) {
                return parse(inst._def.output, result);
            }
            return result;
        }, "_zod", { value: inst._zod, enumerable: false });
    };
    inst.implementAsync = (func) => {
        if (typeof func !== "function") {
            throw new Error("implementAsync() must be called with a function");
        }
        return Object.defineProperty(async function (...args) {
            const parsedArgs = inst._def.input ? await parseAsync(inst._def.input, args) : args;
            const result = await Reflect.apply(func, this, parsedArgs);
            if (inst._def.output) {
                return await parseAsync(inst._def.output, result);
            }
            return result;
        }, "_zod", { value: inst._zod, enumerable: false });
    };
    inst._zod.parse = (payload, _ctx) => {
        if (typeof payload.value !== "function") {
            payload.issues.push({
                code: "invalid_type",
                expected: "function",
                input: payload.value,
                inst,
            });
            return payload;
        }
        // Check if output is a promise type to determine if we should use async implementation
        const hasPromiseOutput = inst._def.output && inst._def.output._zod.def.type === "promise";
        if (hasPromiseOutput) {
            payload.value = inst.implementAsync(payload.value);
        }
        else {
            payload.value = inst.implement(payload.value);
        }
        return payload;
    };
    inst.input = (...args) => {
        const F = inst.constructor;
        if (Array.isArray(args[0])) {
            return new F({
                type: "function",
                input: new $ZodTuple({
                    type: "tuple",
                    items: args[0],
                    rest: args[1],
                }),
                output: inst._def.output,
            });
        }
        return new F({
            type: "function",
            input: args[0],
            output: inst._def.output,
        });
    };
    inst.output = (output) => {
        const F = inst.constructor;
        return new F({
            type: "function",
            input: inst._def.input,
            output,
        });
    };
    return inst;
})));
const $ZodPromise = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodPromise", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
        return Promise.resolve(payload.value).then((inner) => def.innerType._zod.run({ value: inner, issues: [] }, ctx));
    };
})));
const $ZodLazy = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodLazy", (inst, def) => {
    $ZodType.init(inst, def);
    // Cache the resolved inner type on the shared `def` so all clones of this lazy (e.g. via `.describe()`/`.meta()`) share the same inner instance, preserving identity for cycle detection on recursive schemas.
    util.defineLazy(inst._zod, "innerType", () => {
        const d = def;
        if (!d._cachedInner)
            d._cachedInner = def.getter();
        return d._cachedInner;
    });
    util.defineLazyInternal(inst, "pattern", (zod) => zod.innerType?._zod?.pattern);
    util.defineLazyInternal(inst, "propValues", (zod) => zod.innerType?._zod?.propValues);
    util.defineLazyInternal(inst, "optin", (zod) => zod.innerType?._zod?.optin ?? undefined);
    util.defineLazyInternal(inst, "optout", (zod) => zod.innerType?._zod?.optout ?? undefined);
    inst._zod.parse = (payload, ctx) => {
        const inner = inst._zod.innerType;
        return inner._zod.run(payload, ctx);
    };
})));
const $ZodCustom = /*@__PURE__*/ _core_js__rspack_import_0/* .$constructor */.xI("$ZodCustom", (inst, def) => {
    _checks_js__rspack_import_4/* .$ZodCheck.init */.QP.init(inst, def);
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _) => {
        return payload;
    };
    inst._zod.check = (payload) => {
        const input = payload.value;
        const r = def.fn(input);
        if (r instanceof Promise) {
            return r.then((r) => handleRefineResult(r, payload, input, inst));
        }
        handleRefineResult(r, payload, input, inst);
        return;
    };
});
function handleRefineResult(result, payload, input, inst) {
    if (!result) {
        const _iss = {
            code: "custom",
            input,
            inst, // incorporates params.error into issue reporting
            path: [...(inst._zod.def.path ?? [])], // incorporates params.error into issue reporting
            continue: !inst._zod.def.abort,
            // params: inst._zod.def.params,
        };
        if (inst._zod.def.params)
            _iss.params = inst._zod.def.params;
        payload.issues.push(_util_js__rspack_import_2/* .issue */.sn(_iss));
    }
}

__webpack_require__.d(__webpack_exports__, {
  YK: () => (standardProps)
}, {
  $N: $ZodISODuration,
  $p: $ZodArray,
  $v: $ZodString,
  Ax: $ZodISOTime,
  CI: $ZodCIDRv4,
  CQ: $ZodBase64URL,
  Cn: $ZodCIDRv6,
  Dq: $ZodBase64,
  EY: $ZodStringFormat,
  GP: $ZodUnknown,
  GY: $ZodKSUID,
  I: $ZodNumberFormat,
  Ko: $ZodISODateTime,
  LJ: $ZodIntersection,
  Lc: $ZodIPv4,
  N$: $ZodNonOptional,
  Oy: $ZodE164,
  P0: $ZodDiscriminatedUnion,
  Py: $ZodNanoID,
  RL: $ZodExactOptional,
  Sb: $ZodReadonly,
  TF: $ZodXID,
  Um: $ZodNever,
  VF: $ZodPrefault,
  VO: $ZodEnum,
  VY: $ZodURL,
  W4: $ZodType,
  Wc: $ZodTransform,
  Zc: $ZodGUID,
  Zn: $ZodUUID,
  Zu: $ZodCUID2,
  Zy: $ZodIPv6,
  _m: $ZodPipe,
  b0: $ZodCustom,
  bl: $ZodCUID,
  cG: $ZodEmoji,
  cq: base64Charset,
  cu: $ZodUnion,
  g5: $ZodULID,
  h: $ZodRecord,
  h8: $ZodJWT,
  ig: $ZodOptional,
  nu: $ZodLiteral,
  qG: $ZodEmail,
  qc: $ZodNullable,
  rv: $ZodDefault,
  sF: $ZodBoolean,
  t$: $ZodCatch,
  v1: $ZodISODate,
  vz: $ZodNumber,
  w: $ZodObjectJIT,
  xE: base64urlCharset
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/to-json-schema.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _registries_js__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/registries.js");
/* import */ var _util_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js");


function assignProps(target, ...sources) {
    for (const source of sources) {
        for (const key of Reflect.ownKeys(source)) {
            if (Object.prototype.propertyIsEnumerable.call(source, key)) {
                (0,_util_js__rspack_import_0/* .assignProp */.Vy)(target, key, source[key]);
            }
        }
    }
    return target;
}
// function initializeContext<T extends schemas.$ZodType>(inputs: JSONSchemaGeneratorParams<T>): ToJSONSchemaContext<T> {
//   return {
//     processor: inputs.processor,
//     metadataRegistry: inputs.metadata ?? globalRegistry,
//     target: inputs.target ?? "draft-2020-12",
//     unrepresentable: inputs.unrepresentable ?? "throw",
//   };
// }
function initializeContext(params) {
    // Normalize target: convert old non-hyphenated versions to hyphenated versions
    let target = params?.target ?? "draft-2020-12";
    if (target === "draft-4")
        target = "draft-04";
    if (target === "draft-7")
        target = "draft-07";
    return {
        processors: params.processors ?? {},
        metadataRegistry: params?.metadata ?? _registries_js__rspack_import_1/* .globalRegistry */.fd,
        target,
        unrepresentable: params?.unrepresentable ?? "throw",
        override: params?.override ?? (() => { }),
        io: params?.io ?? "output",
        counter: 0,
        seen: new Map(),
        sharedDefsExtractedFor: undefined,
        sharedEmitDoneFor: undefined,
        cycles: params?.cycles ?? "ref",
        reused: params?.reused ?? "inline",
        intersections: [],
        deferred: [],
        external: params?.external ?? undefined,
    };
}
/**
 * Applies the `unrepresentable` setting at a site that has no JSON Schema equivalent. Throws
 * `message` unless the setting (or the handler's return value) says otherwise. Returns `true` if a
 * custom JSON Schema was written into `json`, in which case the caller must not write its own.
 */
function handleUnrepresentable(schema, ctx, json, params, message) {
    const result = typeof ctx.unrepresentable === "function"
        ? ctx.unrepresentable({ zodSchema: schema, path: params.path, message })
        : ctx.unrepresentable;
    if (result === "any")
        return false;
    if (result === undefined || result === "throw")
        throw new Error(message);
    Object.assign(json, result);
    return true;
}
// never rename this back to `process`: bundler polyfills inject a top-level `const process` that a lexical declaration of the same name collides with (#6397)
function processSchema(schema, ctx, _params = { path: [], schemaPath: [] }) {
    var _a;
    const def = schema._zod.def;
    // check for schema in seens
    const seen = ctx.seen.get(schema);
    if (seen) {
        seen.count++;
        // check if cycle
        const isCycle = _params.schemaPath.includes(schema);
        if (isCycle) {
            seen.cycle = _params.path;
        }
        return seen.schema;
    }
    // initialize
    const result = { schema: {}, count: 1, cycle: undefined, path: _params.path };
    ctx.seen.set(schema, result);
    ctx.sharedDefsExtractedFor = undefined;
    ctx.sharedEmitDoneFor = undefined;
    // custom method overrides default behavior
    const overrideSchema = schema._zod.toJSONSchema?.();
    if (overrideSchema) {
        result.schema = overrideSchema;
    }
    else {
        const params = {
            ..._params,
            schemaPath: [..._params.schemaPath, schema],
            path: _params.path,
        };
        if (schema._zod.processJSONSchema) {
            schema._zod.processJSONSchema(ctx, result.schema, params);
        }
        else {
            const _json = result.schema;
            const processor = ctx.processors[def.type];
            if (!processor) {
                throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
            }
            processor(schema, ctx, _json, params);
        }
        const parent = schema._zod.parent;
        if (parent) {
            // Also set ref if processor didn't (for inheritance)
            if (!result.ref)
                result.ref = parent;
            processSchema(parent, ctx, params);
            ctx.seen.get(parent).isParent = true;
        }
    }
    // metadata
    const meta = ctx.metadataRegistry.get(schema);
    if (meta)
        assignProps(result.schema, meta);
    if (ctx.io === "input" && isTransforming(schema)) {
        // examples/defaults only apply to output type of pipe
        delete result.schema.examples;
        delete result.schema.default;
    }
    // set prefault as default
    if (ctx.io === "input" && "_prefault" in result.schema)
        (_a = result.schema).default ?? (_a.default = result.schema._prefault);
    delete result.schema._prefault;
    // pulling fresh from ctx.seen in case it was overwritten
    const _result = ctx.seen.get(schema);
    return _result.schema;
}
/** @deprecated Renamed to `processSchema`. An export alias declares no binding, so it is safe to keep. */

// Escape a reference token for use in a JSON Pointer fragment (RFC 6901): `~` becomes `~0` and `/` becomes `~1`. The `~` replacement must run first.
function encodeJSONPointerSegment(segment) {
    return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function extractDefs(ctx, schema
// params: EmitParams
) {
    // iterate over seen map;
    const root = ctx.seen.get(schema);
    if (!root)
        throw new Error("Unprocessed schema. This is a bug in Zod.");
    // With `external` set, every registered schema resolves through the external branch of `makeURI`, so the root branch below produces the same ref the external branch would — this pass is identical whichever schema it is called with, and only needs to run once.
    if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external)
        return;
    // Track ids to detect duplicates across different schemas
    const idToSchema = new Map();
    for (const entry of ctx.seen.entries()) {
        const id = ctx.metadataRegistry.get(entry[0])?.id;
        if (id) {
            const existing = idToSchema.get(id);
            if (existing && existing !== entry[0]) {
                throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
            }
            idToSchema.set(id, entry[0]);
        }
    }
    // returns a ref to the schema defId will be empty if the ref points to an external schema (or #)
    const makeURI = (entry) => {
        // comparing the seen objects because sometimes multiple schemas map to the same seen object. e.g. lazy
        // external is configured
        const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
        if (ctx.external) {
            const externalId = ctx.external.registry.get(entry[0])?.id; // ?? "__shared";// `__schema${ctx.counter++}`;
            // check if schema is in the external registry
            const uriGenerator = ctx.external.uri ?? ((id) => id);
            if (externalId) {
                return { ref: uriGenerator(externalId) };
            }
            // otherwise, add to __shared
            const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
            entry[1].defId = id; // set defId so it will be reused if needed
            return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}` };
        }
        const uriPrefix = `#`;
        const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
        // an id-less root has nowhere to be extracted to, so it stays inline and self-references as `#`
        if (entry[1] === root && !entry[1].schema.id) {
            return { ref: uriPrefix };
        }
        // self-contained schema
        const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
        return { defId, ref: defUriPrefix + encodeJSONPointerSegment(defId) };
    };
    // stored cached version in `def` property remove all properties, set $ref
    const extractToDef = (entry) => {
        // if the schema is already a reference, do not extract it
        if (entry[1].schema.$ref) {
            return;
        }
        const seen = entry[1];
        const { ref, defId } = makeURI(entry);
        seen.def = { ...seen.schema };
        // defId won't be set if the schema is a reference to an external schema or if the schema is the root schema
        if (defId)
            seen.defId = defId;
        // wipe away all properties except $ref
        const schema = seen.schema;
        for (const key in schema) {
            delete schema[key];
        }
        schema.$ref = ref;
    };
    // throw on cycles
    // break cycles
    if (ctx.cycles === "throw") {
        for (const entry of ctx.seen.entries()) {
            const seen = entry[1];
            if (seen.cycle) {
                throw new Error("Cycle detected: " +
                    `#/${seen.cycle?.join("/")}/<root>` +
                    '\n\nSet the `cycles` parameter to `"ref"` to resolve cyclical schemas with defs.');
            }
        }
    }
    // extract schemas into $defs
    for (const entry of ctx.seen.entries()) {
        const seen = entry[1];
        // convert root schema to # $ref
        if (schema === entry[0]) {
            extractToDef(entry); // this has special handling for the root schema
            continue;
        }
        // extract schemas that are in the external registry
        if (ctx.external) {
            const ext = ctx.external.registry.get(entry[0])?.id;
            if (schema !== entry[0] && ext) {
                extractToDef(entry);
                continue;
            }
        }
        // extract schemas with `id` meta
        const id = ctx.metadataRegistry.get(entry[0])?.id;
        if (id) {
            extractToDef(entry);
            continue;
        }
        // break cycles
        if (seen.cycle) {
            // any
            extractToDef(entry);
            continue;
        }
        // extract reused schemas
        if (seen.count > 1) {
            if (ctx.reused === "ref") {
                extractToDef(entry);
            }
        }
    }
    if (ctx.external)
        ctx.sharedDefsExtractedFor = ctx.external;
}
/** Rewrites `anyOf: [{type: "a"}, {type: "b"}]` to `type: ["a", "b"]`, which every JSON Schema draft treats as equivalent and most consumers render far better for the nullable case. Only branches that are a bare type assertion qualify — anything carrying a constraint, `$ref`, `const` or metadata is left alone. Runs after `flattenRef`, so a branch an override decorated or `$defs` extraction turned into a `$ref` is no longer bare and correctly stays in `anyOf`. `oneOf` is excluded: `integer` and `number` overlap, so "exactly one" and "at least one" are not the same there. OpenAPI 3.0 is excluded: its `type` must be a single string. */
function compactTypeUnion(schema) {
    const options = schema.anyOf;
    if (!Array.isArray(options) || options.length === 0 || schema.type !== undefined)
        return;
    const types = [];
    for (const option of options) {
        if (!option || typeof option !== "object")
            return;
        // A branch that is itself a compactible union folds into this one — nested `anyOf` and a flat `type` array say the same thing. Compacting it first also makes the result independent of the order this pass walks the seen map in.
        compactTypeUnion(option);
        const keys = Object.keys(option);
        if (keys.length !== 1 || keys[0] !== "type")
            return;
        const type = option.type;
        for (const member of Array.isArray(type) ? type : [type]) {
            if (typeof member !== "string")
                return;
            if (!types.includes(member))
                types.push(member);
        }
    }
    delete schema.anyOf;
    // A `type` array must be non-empty and unique (metaschema); a single member is spelled as a bare string.
    schema.type = types.length === 1 ? types[0] : types;
}
/** Keywords `foldIntersection` knows how to combine. Anything else — `$ref`, `patternProperties`,
 * an annotation like `description` — makes a member unfoldable, so a constraint this does not
 * understand leaves the `allOf` alone instead of being silently dropped or misattributed. */
const FOLDABLE_KEYS = new Set(["type", "properties", "required", "additionalProperties"]);
const UNION_KEYS = ["oneOf", "anyOf"];
/** A member's constraint on a key it does not declare itself. A `catchall` states one; `false`, an absent `additionalProperties`, and the empty schema a loose object emits state nothing. */
function undeclaredConstraint(member) {
    const extra = member.additionalProperties;
    if (extra === undefined || extra === false || typeof extra !== "object" || extra === null)
        return null;
    return Object.keys(extra).length ? extra : null;
}
/** Combines object members into the single object they describe together, or returns `null` if any of them carries a keyword outside {@link FOLDABLE_KEYS}. */
function foldObjects(members) {
    const objects = [];
    for (const member of members) {
        // A boolean subschema is legal JSON Schema and carries no keywords to fold.
        if (typeof member !== "object" || member.type !== "object")
            return null;
        for (const key in member) {
            if (!FOLDABLE_KEYS.has(key))
                return null;
        }
        objects.push(member);
    }
    const properties = {};
    const required = new Set();
    for (const object of objects) {
        for (const key in object.properties) {
            // `in` would report a `__proto__` key as already present via the prototype chain and skip it.
            if (Object.prototype.hasOwnProperty.call(properties, key))
                continue;
            // Every member constrains this key: the ones that declare it say how, and a `catchall` member constrains it too even though it does not name it. The key has to satisfy all of them, which is the same intersection one level down.
            const parts = [];
            for (const other of objects) {
                const part = other.properties?.[key] ?? undeclaredConstraint(other);
                if (part === null || part === undefined)
                    continue;
                if (!parts.some((seen) => JSON.stringify(seen) === JSON.stringify(part)))
                    parts.push(part);
            }
            const merged = parts.length === 1
                ? parts[0]
                : (foldObjects(parts) ?? { allOf: parts });
            (0,_util_js__rspack_import_0/* .assignProp */.Vy)(properties, key, merged);
        }
        for (const key of object.required ?? [])
            required.add(key);
    }
    const folded = { type: "object", properties };
    if (required.size)
        folded.required = [...required];
    // A key no member declares is rejected only when every member rejects it, so the fold is closed only when every member is. Otherwise it carries whatever the `catchall` members demand of such a key.
    if (objects.every((object) => object.additionalProperties === false)) {
        folded.additionalProperties = false;
    }
    else {
        const constraints = [];
        for (const object of objects) {
            const constraint = undeclaredConstraint(object);
            if (constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint)))
                constraints.push(constraint);
        }
        if (constraints.length === 1)
            folded.additionalProperties = constraints[0];
        else if (constraints.length > 1)
            folded.additionalProperties = { allOf: constraints };
    }
    return folded;
}
/** `additionalProperties` in an `allOf` member sees only that member's own `properties`, so two
 * closed object members reject each other's keys and the schema validates nothing. Zod's parser
 * pools the key sets instead — `handleIntersectionResults` reports a key as unrecognized only when
 * *every* side rejects it — so the emitted schema has to pool them too, and folding the members
 * into one object is the encoding that says so on every target.
 *
 * This runs from `finalize`, after `extractDefs`, which is what keeps it clear of the `$ref`
 * machinery: a member extracted into `$defs` is already a `$ref` by now and declines to fold, so it
 * keeps its reference and its own closedness rather than being inlined as a stale copy. */
function foldIntersection(json) {
    const allOf = json.allOf;
    if (!Array.isArray(allOf) || allOf.length < 2)
        return;
    // An `override` runs before this pass and may have written object keywords onto the intersection itself. Those are deliberate, so decline rather than overwrite them.
    for (const key of FOLDABLE_KEYS)
        if (key in json)
            return;
    // An intersection distributes over a union: `A & (X | Y)` is `(A & X) | (A & Y)`. Only the first union is distributed over; a second one stays among the members every branch folds against, where it fails the object check and declines the whole intersection rather than multiplying out.
    const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
    let folded = null;
    if (!unions.length) {
        folded = foldObjects(allOf);
    }
    else {
        const union = unions[0];
        const keyword = UNION_KEYS.find((k) => Array.isArray(union[k]));
        if (Object.keys(union).length !== 1)
            return;
        const rest = allOf.filter((m) => m !== union);
        const branches = union[keyword].map((branch) => foldObjects([...rest, branch]));
        if (branches.some((b) => !b))
            return;
        folded = { [keyword]: branches };
    }
    if (!folded)
        return;
    delete json.allOf;
    assignProps(json, folded);
}
function finalize(ctx, schema) {
    const root = ctx.seen.get(schema);
    if (!root)
        throw new Error("Unprocessed schema. This is a bug in Zod.");
    // flatten refs - inherit properties from parent schemas
    const flattenRef = (zodSchema) => {
        const seen = ctx.seen.get(zodSchema);
        // already processed
        if (seen.ref === null)
            return;
        const schema = seen.def ?? seen.schema;
        const _cached = { ...schema };
        const ref = seen.ref;
        seen.ref = null; // prevent infinite recursion
        if (ref) {
            flattenRef(ref);
            const refSeen = ctx.seen.get(ref);
            const refSchema = refSeen.schema;
            // merge referenced schema into current
            if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
                // older drafts can't combine $ref with other properties
                schema.allOf = schema.allOf ?? [];
                schema.allOf.push(refSchema);
            }
            else {
                assignProps(schema, refSchema);
            }
            // restore child's own properties (child wins)
            assignProps(schema, _cached);
            const isParentRef = zodSchema._zod.parent === ref;
            // For parent chain, child is a refinement - remove parent-only properties
            if (isParentRef) {
                for (const key in schema) {
                    if (key === "$ref" || key === "allOf")
                        continue;
                    if (!(key in _cached)) {
                        delete schema[key];
                    }
                }
            }
            // When ref was extracted to $defs, remove properties that match the definition
            if (refSchema.$ref && refSeen.def) {
                for (const key in schema) {
                    if (key === "$ref" || key === "allOf")
                        continue;
                    if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) {
                        delete schema[key];
                    }
                }
            }
        }
        // If parent was extracted (has $ref), propagate $ref to this schema. This handles cases like: readonly().meta({id}).describe() where processor sets ref to innerType but parent should be referenced
        const parent = zodSchema._zod.parent;
        if (parent && parent !== ref) {
            // Ensure parent is processed first so its def has inherited properties
            flattenRef(parent);
            const parentSeen = ctx.seen.get(parent);
            if (parentSeen?.schema.$ref) {
                schema.$ref = parentSeen.schema.$ref;
                // De-duplicate with parent's definition
                if (parentSeen.def) {
                    for (const key in schema) {
                        if (key === "$ref" || key === "allOf")
                            continue;
                        if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) {
                            delete schema[key];
                        }
                    }
                }
            }
        }
        // execute overrides
        ctx.override({
            zodSchema: zodSchema,
            jsonSchema: schema,
            path: seen.path ?? [],
        });
    };
    // Flattening walks the whole map and clears each `ref` as it goes, so a second call over the same map is a no-op scan. Skip it outright once it has run for a registry conversion.
    if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
        for (const entry of [...ctx.seen.entries()].reverse()) {
            flattenRef(entry[0]);
        }
        if (ctx.target !== "openapi-3.0") {
            for (const entry of ctx.seen.entries()) {
                compactTypeUnion(entry[1].def ?? entry[1].schema);
            }
        }
        for (const rewrite of ctx.deferred)
            rewrite();
        // After flattening, every member that was extracted is a `$ref`, so the fold sees the final shape. A schema that inherits an intersection — through `z.lazy`, or any `ref` chain — holds the same `allOf` array, so fold by array identity to catch every copy.
        if (ctx.intersections.length) {
            const carriers = new Map();
            for (const seen of ctx.seen.values()) {
                for (const json of [seen.schema, seen.def]) {
                    const allOf = json?.allOf;
                    if (!Array.isArray(allOf))
                        continue;
                    const existing = carriers.get(allOf);
                    if (existing)
                        existing.push(json);
                    else
                        carriers.set(allOf, [json]);
                }
            }
            for (const allOf of ctx.intersections) {
                for (const json of carriers.get(allOf) ?? [])
                    foldIntersection(json);
            }
        }
    }
    const result = {};
    if (ctx.target === "draft-2020-12") {
        result.$schema = "https://json-schema.org/draft/2020-12/schema";
    }
    else if (ctx.target === "draft-07") {
        result.$schema = "http://json-schema.org/draft-07/schema#";
    }
    else if (ctx.target === "draft-04") {
        result.$schema = "http://json-schema.org/draft-04/schema#";
    }
    else if (ctx.target === "openapi-3.0") {
        // OpenAPI 3.0 schema objects should not include a $schema property
    }
    else {
        // Arbitrary string values are allowed but won't have a $schema property set
    }
    if (ctx.external?.uri) {
        const id = ctx.external.registry.get(schema)?.id;
        if (!id)
            throw new Error("Schema is missing an `id` property");
        result.$id = ctx.external.uri(id);
    }
    // when the root was extracted into $defs, `root.schema` is the `$ref` wrapper and `root.def` is the body that now lives under $defs
    assignProps(result, root.defId ? root.schema : (root.def ?? root.schema));
    // The `id` in `.meta()` is a Zod-specific registration tag used to extract schemas into $defs — it is not user-facing JSON Schema metadata. Strip it from the output body where it would otherwise leak. The id is preserved implicitly via the $defs key (and via $ref paths).
    const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
    if (rootMetaId !== undefined && result.id === rootMetaId)
        delete result.id;
    // build defs object. With `external`, `defs` is the shared object every schema writes into, so the same entries are reassigned on every call. Without it, `defs` is fresh per call and must be rebuilt.
    const defs = ctx.external?.defs ?? {};
    if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
        for (const entry of ctx.seen.entries()) {
            const seen = entry[1];
            if (seen.def && seen.defId) {
                if (seen.def.id === seen.defId)
                    delete seen.def.id;
                (0,_util_js__rspack_import_0/* .assignProp */.Vy)(defs, seen.defId, seen.def);
            }
        }
    }
    if (ctx.external)
        ctx.sharedEmitDoneFor = ctx.external;
    // set definitions in result
    if (ctx.external) {
    }
    else {
        if (Object.keys(defs).length > 0) {
            if (ctx.target === "draft-2020-12") {
                result.$defs = defs;
            }
            else {
                result.definitions = defs;
            }
        }
    }
    try {
        // this "finalizes" this schema and ensures all cycles are removed each call to finalize() is functionally independent though the seen map is shared
        const finalized = JSON.parse(JSON.stringify(result));
        Object.defineProperty(finalized, "~standard", {
            value: {
                ...schema["~standard"],
                jsonSchema: {
                    input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
                    output: createStandardJSONSchemaMethod(schema, "output", ctx.processors),
                },
            },
            enumerable: false,
            writable: false,
        });
        return finalized;
    }
    catch (_err) {
        throw new Error("Error converting schema to JSON.");
    }
}
function isTransforming(_schema, _ctx) {
    const ctx = _ctx ?? { seen: new Set() };
    if (ctx.seen.has(_schema))
        return false;
    ctx.seen.add(_schema);
    const def = _schema._zod.def;
    if (def.type === "transform")
        return true;
    if (def.type === "array")
        return isTransforming(def.element, ctx);
    if (def.type === "set")
        return isTransforming(def.valueType, ctx);
    if (def.type === "lazy")
        return isTransforming(def.getter(), ctx);
    if (def.type === "promise" ||
        def.type === "optional" ||
        def.type === "nonoptional" ||
        def.type === "nullable" ||
        def.type === "readonly" ||
        def.type === "default" ||
        def.type === "prefault" ||
        def.type === "catch") {
        return isTransforming(def.innerType, ctx);
    }
    if (def.type === "intersection") {
        return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
    }
    if (def.type === "record" || def.type === "map") {
        return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    }
    if (def.type === "pipe") {
        if (_schema._zod.traits.has("$ZodCodec"))
            return true;
        return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
    }
    if (def.type === "object") {
        for (const key in def.shape) {
            if (isTransforming(def.shape[key], ctx))
                return true;
        }
        return false;
    }
    if (def.type === "union") {
        for (const option of def.options) {
            if (isTransforming(option, ctx))
                return true;
        }
        return false;
    }
    if (def.type === "tuple") {
        for (const item of def.items) {
            if (isTransforming(item, ctx))
                return true;
        }
        if (def.rest && isTransforming(def.rest, ctx))
            return true;
        return false;
    }
    return false;
}
/**
 * Creates a toJSONSchema method for a schema instance.
 * This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
 */
const createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
    const ctx = initializeContext({ ...params, processors });
    processSchema(schema, ctx);
    extractDefs(ctx, schema);
    return finalize(ctx, schema);
};
const createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
    const { libraryOptions, target } = params ?? {};
    const ctx = initializeContext({ ...(libraryOptions ?? {}), target, io, processors });
    processSchema(schema, ctx);
    extractDefs(ctx, schema);
    return finalize(ctx, schema);
};

__webpack_require__.d(__webpack_exports__, {
  Lp: () => (processSchema),
  _S: () => (handleUnrepresentable)
}, {
  OA: createToJSONSchemaMethod,
  uE: createStandardJSONSchemaMethod
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.d(__webpack_exports__, {
  A2: () => (normalizeParams),
  B7: () => (stringifyPrimitive),
  GW: () => (parsedType),
  Gv: () => (isObject),
  LG: () => (floatSafeRemainder),
  MO: () => (rawShape),
  NM: () => (optionalKeys),
  NR: () => (BIGINT_FORMAT_RANGES),
  O7: () => (codePointLength),
  OH: () => (partial),
  PO: () => (cached),
  QH: () => (aborted),
  Qd: () => (isPlainObject),
  Rc: () => (getLengthableOrigin),
  SS: () => (constantCatch),
  UQ: () => (esc),
  Up: () => (pick),
  Vy: () => (assignProp),
  W0: () => (safeExtend),
  X: () => (installLazyProp),
  X$: () => (extend),
  Yv: () => (slugify),
  cJ: () => (omit),
  cl: () => (nullish),
  d3: () => (attachSchema),
  gx: () => (captureStackTrace),
  h1: () => (merge),
  hI: () => (allowsEval),
  iR: () => (finalizeIssue),
  jD: () => (hide),
  jw: () => (joinValues),
  k8: () => (jsonStringifyReplacer),
  lQ: () => (prefixIssues),
  mw: () => (required),
  o8: () => (clone),
  ol: () => (members),
  p6: () => (cleanRegex),
  qQ: () => (propertyKeyTypes),
  qh: () => (own),
  rL: () => (explicitlyAborted),
  sD: () => (escapeRegex),
  sn: () => (issue),
  un: () => (derived),
  v5: () => (defineLazyInternal),
  w5: () => (getEnumValues),
  yG: () => (shallowClone),
  zH: () => (NUMBER_FORMAT_RANGES),
  zM: () => (mergeDefs)
});
/* import */ var _core_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/core.js");

// functions
function assertEqual(val) {
    return val;
}
function assertNotEqual(val) {
    return val;
}
function toZod() {
    return (schema) => schema;
}
function assertIs(_arg) { }
function assertNever(_x) {
    throw new Error("Unexpected value in exhaustive check");
}
function assert(_) { }
function getEnumValues(entries) {
    const numericValues = Object.values(entries).filter((v) => typeof v === "number");
    const values = Object.entries(entries)
        .filter(([k, _]) => numericValues.indexOf(+k) === -1)
        .map(([_, v]) => v);
    return values;
}
function joinValues(array, separator = "|") {
    return array.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
    if (typeof value === "bigint")
        return value.toString();
    return value;
}
// the accessor lives on a shared prototype: an own accessor makes every box a dictionary-mode object (~360 B and a slow load per read against ~100 B and an inlined getter here)
class Cached {
    constructor(getter) {
        this._getter = getter;
        this._value = undefined;
    }
    get value() {
        const getter = this._getter;
        if (getter !== undefined) {
            this._value = getter();
            this._getter = undefined;
        }
        return this._value;
    }
}
function cached(getter) {
    return new Cached(getter);
}
function nullish(input) {
    return input === null || input === undefined;
}
function cleanRegex(source) {
    const start = source.startsWith("^") ? 1 : 0;
    const end = source.endsWith("$") ? source.length - 1 : source.length;
    return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
    const ratio = val / step;
    const roundedRatio = Math.round(ratio);
    // `val` and `step` each round to a double before the division rounds again, so a true decimal multiple's quotient can sit up to 1.5 of these scaled epsilons from the integer. A 1x tolerance therefore rejected 2.03 as a multiple of 0.07; 4x covers the worst case with margin.
    const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
    if (Math.abs(ratio - roundedRatio) < tolerance)
        return 0;
    return ratio - roundedRatio;
}
const EVALUATING = /* @__PURE__*/ (/* unused pure expression or super */ null && (Symbol("evaluating")));
function defineLazy(object, key, getter) {
    let value = undefined;
    Object.defineProperty(object, key, {
        get() {
            if (value === EVALUATING) {
                // Circular reference detected, return undefined to break the cycle
                return undefined;
            }
            if (value === undefined) {
                value = EVALUATING;
                value = getter();
            }
            return value;
        },
        set(v) {
            Object.defineProperty(object, key, {
                value: v,
                // configurable: true,
            });
            // object[key] = v;
        },
        configurable: true,
    });
}
function objectClone(obj) {
    return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}
function assignProp(target, prop, value) {
    Object.defineProperty(target, prop, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
    });
}
/**
 * Whichever object a def's `shape` currently answers from: the one the caller passed until the first read, the frozen copy after it.
 *
 * Its keys and descriptors read without invoking anything, which is what lets a discriminated union check its discriminator, and the cycle walk read a shape, without resolving a getter that references the schema being constructed. A def that answers `shape` from an accessor of its own has none.
 */
function rawShape(def) {
    const desc = Object.getOwnPropertyDescriptor(def, "shape");
    return desc?.get ? desc.get.raw : desc?.value;
}
// where a builder reads its source's keys and descriptors, resolving only a shape a def answers for itself. A shape resolves by object spread, so only its enumerable keys are ever part of it.
function sourceShape(schema) {
    return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
// a key whose value is not settled yet, self-caching so every read after the first gets the same one
function deferProp(target, key, getter) {
    Object.defineProperty(target, key, {
        get() {
            const value = getter();
            assignProp(this, key, value);
            return value;
        },
        enumerable: true,
        configurable: true,
    });
}
// Writes a settled key. A plain assignment is much cheaper than `defineProperty` and produces the same descriptor, but it runs whatever setter already answers to the key — an accessor this shape deferred, or an inherited one, which `__proto__` has on every object and prototype pollution can add for any name.
function putProp(target, key, value) {
    if (key in target)
        assignProp(target, key, value);
    else
        target[key] = value;
}
/**
 * Copies `keys` of `source`'s shape onto `target`, each value passed through `wrap`.
 *
 * A key the source has resolved is copied through now, so the derived shape states it outright and nothing has to resolve it to learn what it holds. A key the source still defers stays deferred, and reads back through the source's own `shape`, so it resolves once and both shapes get that one schema.
 */
function mirrorShape(target, source, keys, wrap) {
    const raw = sourceShape(source);
    for (const key of keys) {
        const desc = Object.getOwnPropertyDescriptor(raw, key);
        if (!desc.enumerable)
            continue;
        if (desc.get) {
            deferProp(target, key, () => {
                const value = source._zod.def.shape[key];
                return wrap ? wrap(value, key) : value;
            });
        }
        else
            putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
    }
}
// same, for a plain shape a caller passed rather than a schema's
function mirrorProps(target, source) {
    for (const key of Reflect.ownKeys(source)) {
        const desc = Object.getOwnPropertyDescriptor(source, key);
        if (!desc.enumerable)
            continue;
        if (desc.get)
            deferProp(target, key, () => source[key]);
        else
            putProp(target, key, desc.value);
    }
}
function mergeDefs(...defs) {
    const mergedDescriptors = {};
    for (const def of defs) {
        const descriptors = Object.getOwnPropertyDescriptors(def);
        Object.assign(mergedDescriptors, descriptors);
    }
    return Object.defineProperties({}, mergedDescriptors);
}
function cloneDef(schema) {
    return mergeDefs(schema._zod.def);
}
function getElementAtPath(obj, path) {
    if (!path)
        return obj;
    return path.reduce((acc, key) => acc?.[key], obj);
}
function promiseAllObject(promisesObj) {
    const keys = Object.keys(promisesObj);
    const promises = keys.map((key) => promisesObj[key]);
    return Promise.all(promises).then((results) => {
        const resolvedObj = {};
        for (let i = 0; i < keys.length; i++) {
            resolvedObj[keys[i]] = results[i];
        }
        return resolvedObj;
    });
}
function randomString(length = 10) {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    let str = "";
    for (let i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}
function esc(str) {
    return JSON.stringify(str);
}
function slugify(input) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
const captureStackTrace = ("captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => { });
function isObject(data) {
    return typeof data === "object" && data !== null && !Array.isArray(data);
}
const allowsEval = /* @__PURE__*/ cached(() => {
    // Skip the probe under `jitless`: strict CSPs report the caught `new Function` as a `securitypolicyviolation` even though the throw is swallowed.
    if (_core_js__rspack_import_0/* .globalConfig.jitless */.cr.jitless) {
        return false;
    }
    // @ts-ignore
    if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
        return false;
    }
    try {
        const F = Function;
        new F("");
        return true;
    }
    catch (_) {
        return false;
    }
});
function isPlainObject(o) {
    if (isObject(o) === false)
        return false;
    // modified constructor
    const ctor = o.constructor;
    if (ctor === undefined)
        return true;
    if (typeof ctor !== "function")
        return true;
    // modified prototype
    const prot = ctor.prototype;
    if (isObject(prot) === false)
        return false;
    // ctor doesn't have static `isPrototypeOf`
    if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
        return false;
    }
    return true;
}
function shallowClone(o) {
    if (isPlainObject(o))
        return { ...o };
    if (Array.isArray(o))
        return [...o];
    if (o instanceof Map)
        return new Map(o);
    if (o instanceof Set)
        return new Set(o);
    return o;
}
function numKeys(data) {
    let keyCount = 0;
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            keyCount++;
        }
    }
    return keyCount;
}
const getParsedType = (data) => {
    const t = typeof data;
    switch (t) {
        case "undefined":
            return "undefined";
        case "string":
            return "string";
        case "number":
            return Number.isNaN(data) ? "nan" : "number";
        case "boolean":
            return "boolean";
        case "function":
            return "function";
        case "bigint":
            return "bigint";
        case "symbol":
            return "symbol";
        case "object":
            if (Array.isArray(data)) {
                return "array";
            }
            if (data === null) {
                return "null";
            }
            if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
                return "promise";
            }
            if (typeof Map !== "undefined" && data instanceof Map) {
                return "map";
            }
            if (typeof Set !== "undefined" && data instanceof Set) {
                return "set";
            }
            if (typeof Date !== "undefined" && data instanceof Date) {
                return "date";
            }
            // @ts-ignore
            if (typeof File !== "undefined" && data instanceof File) {
                return "file";
            }
            return "object";
        default:
            throw new Error(`Unknown data type: ${t}`);
    }
};
const propertyKeyTypes = /* @__PURE__*/ new Set(["string", "number", "symbol"]);
const primitiveTypes = /* @__PURE__*/ (/* unused pure expression or super */ null && (new Set([
    "string",
    "number",
    "bigint",
    "boolean",
    "symbol",
    "undefined",
])));
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
// zod-specific utils
function clone(inst, def, params) {
    const cl = new inst._zod.constr(def ?? inst._zod.def);
    if (!def || params?.parent)
        cl._zod.parent = inst;
    return cl;
}
function normalizeParams(_params) {
    const params = _params;
    if (!params)
        return {};
    if (typeof params === "string")
        return { error: () => params };
    if (params?.message !== undefined) {
        if (params?.error !== undefined)
            throw new Error("Cannot specify both `message` and `error` params");
        params.error = params.message;
    }
    delete params.message;
    if (typeof params.error === "string")
        return { ...params, error: () => params.error };
    return params;
}
function createTransparentProxy(getter) {
    let target;
    return new Proxy({}, {
        get(_, prop, receiver) {
            target ?? (target = getter());
            return Reflect.get(target, prop, receiver);
        },
        set(_, prop, value, receiver) {
            target ?? (target = getter());
            return Reflect.set(target, prop, value, receiver);
        },
        has(_, prop) {
            target ?? (target = getter());
            return Reflect.has(target, prop);
        },
        deleteProperty(_, prop) {
            target ?? (target = getter());
            return Reflect.deleteProperty(target, prop);
        },
        ownKeys(_) {
            target ?? (target = getter());
            return Reflect.ownKeys(target);
        },
        getOwnPropertyDescriptor(_, prop) {
            target ?? (target = getter());
            return Reflect.getOwnPropertyDescriptor(target, prop);
        },
        defineProperty(_, prop, descriptor) {
            target ?? (target = getter());
            return Reflect.defineProperty(target, prop, descriptor);
        },
    });
}
function stringifyPrimitive(value) {
    if (typeof value === "bigint")
        return value.toString() + "n";
    if (typeof value === "string")
        return `"${value}"`;
    return `${value}`;
}
function optionalKeys(shape) {
    return Object.keys(shape).filter((k) => {
        return shape[k]._zod.optin !== undefined && shape[k]._zod.optout === "optional";
    });
}
// Wrapped in a `@__PURE__` IIFE: esbuild never tree-shakes a top-level initializer that contains a member access on `Number`, so the bare object literal survived into every bundle.
const NUMBER_FORMAT_RANGES = /*@__PURE__*/ (() => ({
    safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
    int32: [-2147483648, 2147483647],
    uint32: [0, 4294967295],
    float32: [-3.4028234663852886e38, 3.4028234663852886e38],
    float64: [-Number.MAX_VALUE, Number.MAX_VALUE],
}))();
const BIGINT_FORMAT_RANGES = {
    int64: [/* @__PURE__*/ BigInt("-9223372036854775808"), /* @__PURE__*/ BigInt("9223372036854775807")],
    uint64: [/* @__PURE__*/ BigInt(0), /* @__PURE__*/ BigInt("18446744073709551615")],
};
function pick(schema, mask) {
    const currDef = schema._zod.def;
    const checks = currDef.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) {
        throw new Error(".pick() cannot be used on object schemas containing refinements");
    }
    const newShape = {};
    mirrorShape(newShape, schema, maskedKeys(schema, mask));
    return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
// the mask keys that select something, checked against the source's shape without resolving it
function maskedKeys(schema, mask) {
    const raw = sourceShape(schema);
    const keys = [];
    // `for...in` skips symbols, so a symbol in the mask would select nothing
    for (const key of Reflect.ownKeys(mask)) {
        if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) {
            throw new Error(`Unrecognized key: "${String(key)}"`);
        }
        if (mask[key])
            keys.push(key);
    }
    return keys;
}
function omit(schema, mask) {
    const currDef = schema._zod.def;
    const checks = currDef.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) {
        throw new Error(".omit() cannot be used on object schemas containing refinements");
    }
    const omitted = new Set(maskedKeys(schema, mask));
    const newShape = {};
    mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key)));
    return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
function extend(schema, shape) {
    if (!isPlainObject(shape)) {
        throw new Error("Invalid input to extend: expected a plain object");
    }
    const checks = schema._zod.def.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) {
        // Only throw if new shape overlaps with existing shape. Use getOwnPropertyDescriptor to check key existence without accessing values
        const existingShape = sourceShape(schema);
        for (const key of Reflect.ownKeys(shape)) {
            if (Object.getOwnPropertyDescriptor(existingShape, key) !== undefined) {
                throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
            }
        }
    }
    return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
// the source's keys, then the caller's overlaid on top
function extended(schema, shape) {
    const newShape = {};
    mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
    mirrorProps(newShape, shape);
    return newShape;
}
function safeExtend(schema, shape) {
    if (!isPlainObject(shape)) {
        throw new Error("Invalid input to safeExtend: expected a plain object");
    }
    return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function merge(a, b) {
    if (!b?._zod?.def) {
        throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
    }
    if (a._zod.def.checks?.length) {
        throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
    }
    const newShape = {};
    mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
    mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
    const def = mergeDefs(a._zod.def, {
        shape: newShape,
        get catchall() {
            return b._zod.def.catchall;
        },
        checks: b._zod.def.checks ?? [],
    });
    return clone(a, def);
}
function partial(Class, schema, mask, name = "partial") {
    const currDef = schema._zod.def;
    const checks = currDef.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) {
        throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
    }
    const selected = mask ? new Set(maskedKeys(schema, mask)) : undefined;
    const newShape = {};
    mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class &&
        ((value, key) => (selected && !selected.has(key) ? value : new Class({ type: "optional", innerType: value }))));
    return clone(schema, mergeDefs(schema._zod.def, { shape: newShape, checks: [] }));
}
function required(Class, schema, mask) {
    const selected = mask ? new Set(maskedKeys(schema, mask)) : undefined;
    const newShape = {};
    mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => 
    // overwrite with non-optional
    selected && !selected.has(key) ? value : new Class({ type: "nonoptional", innerType: value }));
    return clone(schema, mergeDefs(schema._zod.def, { shape: newShape }));
}
// invalid_type | too_big | too_small | invalid_format | not_multiple_of | unrecognized_keys | invalid_union | invalid_key | invalid_element | invalid_value | custom
function aborted(x, startIndex = 0) {
    if (x.aborted === true)
        return true;
    for (let i = startIndex; i < x.issues.length; i++) {
        if (x.issues[i]?.continue !== true) {
            return true;
        }
    }
    return false;
}
// Checks for explicit abort (continue === false), as opposed to implicit abort (continue === undefined). Used to respect `abort: true` in .refine() even for checks that have a `when` function.
function explicitlyAborted(x, startIndex = 0) {
    if (x.aborted === true)
        return true;
    for (let i = startIndex; i < x.issues.length; i++) {
        if (x.issues[i]?.continue === false) {
            return true;
        }
    }
    return false;
}
function prefixIssues(path, issues) {
    return issues.map((iss) => {
        var _a;
        (_a = iss).path ?? (_a.path = []);
        iss.path.unshift(path);
        return iss;
    });
}
function unwrapMessage(message) {
    return typeof message === "string" ? message : message?.message;
}
/* A check holds no link back to the schema it is attached to — the same check instance is shared by every clone of that schema — so the owner is stamped onto the issues a check just raised, at the only point where both are in scope. Runs on the failure path only; `start` is the issue count from before the check ran. */
function attachSchema(issues, start, inst) {
    var _a;
    for (let i = start; i < issues.length; i++) {
        (_a = issues[i]).schema ?? (_a.schema = inst);
    }
}
function finalizeIssue(iss, ctx, config) {
    var _a;
    // A schema that raised an issue itself owns it outright, and outranks any stamp an enclosing check left in `attachSchema`. String formats and z.custom() are schema and check at once, so when they act as a check they defer to that stamp instead.
    const traits = iss.inst?._zod?.traits;
    if (traits?.has("$ZodType")) {
        if (traits.has("$ZodCheck"))
            (_a = iss).schema ?? (_a.schema = iss.inst);
        else
            iss.schema = iss.inst;
    }
    // Decreasing specificity, first map to return a message wins. `inst` is whatever raised the issue, so a check's own map outranks the owning schema's.
    const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : undefined;
    const message = iss.message
        ? iss.message
        : (unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ??
            unwrapMessage(schemaError?.(iss)) ??
            unwrapMessage(ctx?.error?.(iss)) ??
            unwrapMessage(config.customError?.(iss)) ??
            unwrapMessage(config.localeError?.(iss)) ??
            "Invalid input");
    // an explicit own-key copy beats object rest with excluded keys, which v8 routes through a generic runtime call; Object.keys rather than for-in so an issue pushed with a prototype does not leak inherited keys, and an own __proto__ key is dropped rather than assigned through the setter
    const full = {};
    for (const k of Object.keys(iss)) {
        if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__")
            continue;
        full[k] = iss[k];
    }
    full.path ?? (full.path = []);
    full.message = message;
    if (ctx?.reportInput) {
        full.input = iss.input;
    }
    return full;
}
function getSizableOrigin(input) {
    if (input instanceof Set)
        return "set";
    if (input instanceof Map)
        return "map";
    // @ts-ignore
    if (input instanceof File)
        return "file";
    return "unknown";
}
const highSurrogate = /[\uD800-\uDBFF]/;
// Code points in `str`: a surrogate pair counts once, a lone surrogate as itself. Hand-rolled because the string iterator allocates and runs ~250x slower on this path; the regex probe exits ~50x quicker for a string with no astral characters.
function codePointLength(str) {
    const units = str.length;
    if (!highSurrogate.test(str))
        return units;
    let count = units;
    for (let i = 0; i < units - 1; i++) {
        if ((str.charCodeAt(i) & 0xfc00) === 0xd800 && (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
            count--;
            i++;
        }
    }
    return count;
}
function getLengthableOrigin(input) {
    if (Array.isArray(input))
        return "array";
    if (typeof input === "string")
        return "string";
    return "unknown";
}
function parsedType(data) {
    const t = typeof data;
    switch (t) {
        case "number": {
            return Number.isNaN(data) ? "nan" : "number";
        }
        case "object": {
            if (data === null) {
                return "null";
            }
            if (Array.isArray(data)) {
                return "array";
            }
            const obj = data;
            if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) {
                return obj.constructor.name;
            }
        }
    }
    return t;
}
function issue(...args) {
    const [iss, input, inst] = args;
    if (typeof iss === "string") {
        return {
            message: iss,
            code: "custom",
            input,
            inst,
        };
    }
    return { ...iss };
}
function cleanEnum(obj) {
    return Object.entries(obj)
        .filter(([k, _]) => {
        // return true if NaN, meaning it's not a number, thus a string key
        return Number.isNaN(Number.parseInt(k, 10));
    })
        .map((el) => el[1]);
}
// Codec utility functions
function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
function uint8ArrayToBase64(bytes) {
    let binaryString = "";
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }
    return btoa(binaryString);
}
function base64urlToUint8Array(base64url) {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    return base64ToUint8Array(base64 + padding);
}
function uint8ArrayToBase64url(bytes) {
    return uint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function hexToUint8Array(hex) {
    const cleanHex = hex.replace(/^0x/, "");
    if (cleanHex.length % 2 !== 0) {
        throw new Error("Invalid hex string length");
    }
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
    }
    return bytes;
}
function uint8ArrayToHex(bytes) {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}
// instanceof
class Class {
    constructor(..._args) { }
}
//////////    PROTOTYPE INSTALLERS     //////////
//
// Members live on the prototype and materialize per instance on first read, which keeps own-property count under the step where V8 stops using inline slots. Changing anything here means re-measuring runtime, memory and bundle size together — see "The three axes" in AGENTS.md.
/**
 * Installs a trait's members on its prototype. Each value builds that member for the instance on first read; the built value shadows the accessor as an own property, so a detached `const { parse } = schema` keeps working.
 *
 * Call this from a `proto` initializer, which runs once per prototype — never per instance.
 */
function members(proto, table) {
    for (const key in table) {
        const desc = Object.getOwnPropertyDescriptor(table, key);
        // a getter installs as written, so it stays live: `description` reads through to the registry on every access. not enumerable: an object literal's is, and a prototype member never was
        if (desc.get)
            Object.defineProperty(proto, key, { ...desc, enumerable: false });
        // a method materializes bound on first read, which is what keeps a detached member working: `const opt = schema.optional; opt()`
        else
            defineBound(proto, key, desc.value);
    }
}
/** Shadows a prototype member with an own value, so a getter that builds from the instance runs once. */
function own(inst, key, value, enumerable = true) {
    Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value });
    return value;
}
/** Like {@link own}, for a member that was never an own data property and has to stay out of `Object.keys`. */
function hide(inst, key, value) {
    return own(inst, key, value, false);
}
/** Adds members a table derives from the instance: each builds on first read and shadows as own data, and assignment shadows the same way, as when these were own properties. */
function derived(computes, table) {
    for (const key in computes) {
        const compute = computes[key];
        // an object literal's accessor is configurable and enumerable, and `members` copies the descriptor as written
        Object.defineProperty(table, key, {
            configurable: true,
            enumerable: true,
            get() {
                return own(this, key, compute(this));
            },
            set(value) {
                own(this, key, value);
            },
        });
    }
    return table;
}
function defineBound(proto, key, fn) {
    Object.defineProperty(proto, key, {
        configurable: true,
        get() {
            // vitest's spyOn calls a prototype getter bare to find the function it wraps, so a nullish receiver answers the raw method
            return this == null ? fn : own(this, key, fn.bind(this));
        },
        set(value) {
            own(this, key, value);
        },
    });
}
/** Returns the prototype to install on, or `undefined` if this group is already installed on it. */
function claim(inst, sentinel) {
    const proto = Object.getPrototypeOf(inst);
    // Runs on every construction, so `in` rather than the costlier `hasOwnProperty.call`. Sentinels are keys the group itself defines.
    return sentinel in proto ? undefined : proto;
}
// The internals whose init chain is installing. A second call for the same one is a derived constructor overriding its base, so it must not construct another schema in between or the override is dropped.
let installing;
// Set while a getter is running, so a value that resolved through a recursion break is not memoized. One shared descriptor shadows the key for the duration, which costs no per-key allocation.
let broke = false;
const breaker = {
    configurable: true,
    get() {
        broke = true;
        return undefined;
    },
};
/**
 * Installs a lazily-derived internal on the `_zod` prototype of `inst`'s
 * constructor, computed from the internals object itself and cached there on
 * first read. One accessor per constructor rather than one per instance.
 */
function defineLazyInternal(inst, key, compute) {
    const proto = Object.getPrototypeOf(inst._zod);
    if (key in proto && installing !== inst._zod) {
        // A repeat construction: everything is installed already. Cleared here so the reference is not held past the first construction of every type.
        installing = undefined;
        return;
    }
    installing = inst._zod;
    Object.defineProperty(proto, key, {
        configurable: true,
        get() {
            // Shadowed before computing so a re-entrant read from a recursive schema resolves to undefined instead of running the getter again.
            Object.defineProperty(this, key, breaker);
            const outer = broke;
            broke = false;
            try {
                const value = compute(this);
                // A result that resolved through a recursion break is recomputed once the graph is complete; everything else memoizes, undefined included.
                if (broke)
                    delete this[key];
                else
                    Object.defineProperty(this, key, { configurable: true, writable: true, value });
                broke = broke || outer;
                return value;
            }
            catch (err) {
                // A compute that threw memoizes nothing, so a later read runs it again and fails the same way. The shadow goes with it, since leaving it installed would answer undefined for every later read.
                delete this[key];
                broke = broke || outer;
                throw err;
            }
        },
        set(value) {
            Object.defineProperty(this, key, { configurable: true, writable: true, value });
        },
    });
}
/**
 * Installs `key` on `inst`'s prototype, computed by `make` on first read and cached there as an own
 * data property. One accessor per constructor rather than one per instance, because an own accessor
 * puts every instance after the first into v8 dictionary mode. The key doubles as the sentinel.
 */
function installLazyProp(inst, key, make, enumerable) {
    const proto = claim(inst, key);
    if (!proto)
        return;
    Object.defineProperty(proto, key, {
        configurable: true,
        get() {
            // Shadowed before computing, so a re-entrant read from a self-referential shape resolves to undefined instead of running the getter again. A data property rather than an accessor: an own accessor is the dictionary-mode transition this exists to avoid.
            const desc = { configurable: true, writable: true, enumerable, value: undefined };
            Object.defineProperty(this, key, desc);
            // a compute that throws leaves the shadow behind, so later reads answer undefined instead of re-throwing; `defineLazy` did the same, and `defineLazyInternal`'s delete-on-catch would cost bytes in every bundle for a case only a throwing user getter reaches
            desc.value = make(this);
            Object.defineProperty(this, key, desc);
            return desc.value;
        },
        set(value) {
            Object.defineProperty(this, key, { configurable: true, writable: true, enumerable, value });
        },
    });
}
/** Marks the thunk `_catch` synthesises for a constant catch value. `Function.length` cannot tell that thunk from a user callback — rest and defaulted parameters both report arity 0 — and a user callback reads `ctx.error`, whose issues only finalize correctly against the caller's per-parse error map. Provenance can say what arity cannot. A plain string key rather than `Symbol.for`, whose call at module scope no bundler can prove pure — the same shape that anchored `urlCanParse` into every build. */
const CONSTANT_CATCH = "~constantCatch";
/** Wraps a constant catch value in a thunk tagged with {@link CONSTANT_CATCH}. */
function constantCatch(value) {
    const fn = () => value;
    fn[CONSTANT_CATCH] = true;
    return fn;
}


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/versions.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
const version = {
    major: 4,
    minor: 6,
    patch: 5,
};

__webpack_require__.d(__webpack_exports__, {
}, {
  r: version
});


},
"./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/locales/en.js"(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _core_util_js__rspack_import_0 = __webpack_require__("./node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js");

const error = () => {
    const Sizable = {
        string: { unit: "characters", verb: "to have" },
        file: { unit: "bytes", verb: "to have" },
        array: { unit: "items", verb: "to have" },
        set: { unit: "items", verb: "to have" },
        map: { unit: "entries", verb: "to have" },
    };
    function getSizing(origin) {
        return Sizable[origin] ?? null;
    }
    const FormatDictionary = {
        regex: "input",
        email: "email address",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datetime",
        date: "ISO date",
        time: "ISO time",
        duration: "ISO duration",
        ipv4: "IPv4 address",
        ipv6: "IPv6 address",
        mac: "MAC address",
        cidrv4: "IPv4 range",
        cidrv6: "IPv6 range",
        base64: "base64-encoded string",
        base64url: "base64url-encoded string",
        json_string: "JSON string",
        e164: "E.164 number",
        currency_code: "currency code",
        credit_card: "credit card number",
        iban: "IBAN",
        jwt: "JWT",
        template_literal: "input",
    };
    // type names: missing keys = do not translate (use raw value via ?? fallback)
    const TypeDictionary = {
        // Compatibility: "nan" -> "NaN" for display
        nan: "NaN",
        // All other type names omitted - they fall back to raw values via ?? operator
    };
    function getTypeName(type, input) {
        if (type === "number" && typeof input === "number" && !Number.isFinite(input)) {
            return String(input);
        }
        return TypeDictionary[type] ?? type;
    }
    return (issue) => {
        switch (issue.code) {
            case "invalid_type": {
                const expected = getTypeName(issue.expected);
                const receivedType = _core_util_js__rspack_import_0/* .parsedType */.GW(issue.input);
                const received = getTypeName(receivedType, issue.input);
                return `Invalid input: expected ${expected}, received ${received}`;
            }
            case "invalid_value":
                if (issue.values.length === 1)
                    return `Invalid input: expected ${_core_util_js__rspack_import_0/* .stringifyPrimitive */.B7(issue.values[0])}`;
                return `Invalid option: expected one of ${_core_util_js__rspack_import_0/* .joinValues */.jw(issue.values, "|")}`;
            case "too_big": {
                const adj = issue.exact ? "exactly " : issue.inclusive ? "<=" : "<";
                const sizing = getSizing(issue.origin);
                if (sizing)
                    return `Too big: expected ${issue.origin ?? "value"} to have ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
                return `Too big: expected ${issue.origin ?? "value"} to be ${adj}${issue.maximum.toString()}`;
            }
            case "too_small": {
                const adj = issue.exact ? "exactly " : issue.inclusive ? ">=" : ">";
                const sizing = getSizing(issue.origin);
                if (sizing) {
                    return `Too small: expected ${issue.origin} to have ${adj}${issue.minimum.toString()} ${sizing.unit}`;
                }
                return `Too small: expected ${issue.origin} to be ${adj}${issue.minimum.toString()}`;
            }
            case "invalid_format": {
                const _issue = issue;
                if (_issue.format === "starts_with") {
                    return `Invalid string: must start with "${_issue.prefix}"`;
                }
                if (_issue.format === "ends_with")
                    return `Invalid string: must end with "${_issue.suffix}"`;
                if (_issue.format === "includes")
                    return `Invalid string: must include "${_issue.includes}"`;
                if (_issue.format === "regex")
                    return `Invalid string: must match pattern ${_issue.pattern}`;
                return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
            }
            case "not_multiple_of":
                return `Invalid number: must be a multiple of ${issue.divisor}`;
            case "unrecognized_keys":
                return `Unrecognized key${issue.keys.length > 1 ? "s" : ""}: ${_core_util_js__rspack_import_0/* .joinValues */.jw(issue.keys, ", ")}`;
            case "invalid_key":
                return `Invalid key in ${issue.origin}`;
            case "invalid_union":
                if (issue.options && Array.isArray(issue.options) && issue.options.length > 0) {
                    const opts = issue.options.map((o) => `'${o}'`).join(" | ");
                    return `Invalid discriminator value. Expected ${opts}`;
                }
                if (issue.inclusive === false) {
                    return "Invalid input: more than one option matched";
                }
                return "Invalid input";
            case "invalid_element":
                return `Invalid value in ${issue.origin}`;
            default:
                return `Invalid input`;
        }
    };
};
/* export default */ function __rspack_default_export() {
    return {
        localeError: error(),
    };
}

__webpack_require__.d(__webpack_exports__, {
  A: () => (/* export default binding */ __rspack_default_export)
});


},
"./.agent-bundle-virtual/hooks-event-route-tool-before.codex-0.mjs"(__unused_rspack___webpack_module__, __unused_rspack___webpack_exports__, __webpack_require__) {
/* import */ var node_url__rspack_import_0 = __webpack_require__("node:url");
/* import */ var agent_bundle_launch_env__rspack_import_1 = __webpack_require__("./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/launch-env.js");


(0,agent_bundle_launch_env__rspack_import_1/* .applyOperatorEnv */.OJ)({
    pluginRoot: (0,agent_bundle_launch_env__rspack_import_1/* .operatorEnvPluginRoot */.FF)((0,node_url__rspack_import_0.fileURLToPath)(new URL('..', import.meta.url)))
});


},
"./.agent-bundle-virtual/hooks-event-route-tool-before.codex-entry.mjs"(__webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.a(__webpack_module__, async function (__rspack_load_async_deps, __rspack_async_done) { try {
/* import */ var agent_bundle_launch_env_layer__rspack_import_0 = __webpack_require__("./.agent-bundle-virtual/hooks-event-route-tool-before.codex-0.mjs");
/* import */ var node_child_process__rspack_import_1 = __webpack_require__("node:child_process");
/* import */ var node_url__rspack_import_2 = __webpack_require__("node:url");
/* import */ var agent_bundle_event_project__rspack_import_3 = __webpack_require__("./node_modules/.pnpm/agent-bundle@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+agent-bundle@1a7705899f4e5_305fe8f390df053948b85681214b16dc/node_modules/agent-bundle/dist/event-project.js");
/* import */ var _src_events_tool_before_ts__rspack_import_4 = __webpack_require__("./src/events/tool/before.ts");
/* import */ var _agent_bundle_runtime_request__rspack_import_5 = __webpack_require__("./node_modules/.pnpm/@agent-bundle+runtime@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+@agent-bundle+run_8a520d7a3aaeaa0cabb76a1d5a9cc798/node_modules/@agent-bundle/runtime/dist/49.js");
/* import */ var _agent_bundle_runtime_request__rspack_import_6 = __webpack_require__("./node_modules/.pnpm/@agent-bundle+runtime@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+@agent-bundle+run_8a520d7a3aaeaa0cabb76a1d5a9cc798/node_modules/@agent-bundle/runtime/dist/736.js");
/* import */ var _agent_bundle_runtime_lineage__rspack_import_7 = __webpack_require__("./node_modules/.pnpm/@agent-bundle+runtime@https+++pkg.pr.new+ScriptedAlchemy+agent-bundle+@agent-bundle+run_8a520d7a3aaeaa0cabb76a1d5a9cc798/node_modules/@agent-bundle/runtime/dist/40.js");







const pluginRoot = (0,_agent_bundle_runtime_request__rspack_import_5/* .resolvePluginRoot */.E7)({
    fallback: (0,node_url__rspack_import_2.fileURLToPath)(new URL('..', import.meta.url)),
    stateAnchor: 'user-data'
});
const withEventState = (_signal, run)=>run(undefined);
const providers = Object.freeze([
    Object.freeze({
        key: "haulerDaemon",
        load: ()=>Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, "./src/providers/hauler-daemon.ts")),
        source: "src/providers/hauler-daemon.ts"
    })
]);
const processLifetime = {
    hits: 0,
    instanceId: crypto.randomUUID(),
    pid: process.pid
};
const handler = (context)=>(0,_src_events_tool_before_ts__rspack_import_4/* ["default"] */.A)(Object.freeze({
        ...context,
        provider: (0,_agent_bundle_runtime_request__rspack_import_6/* .useAgent */.fJ)().provider,
        process: (0,_agent_bundle_runtime_request__rspack_import_6/* .useAgent */.fJ)().process
    }));
const canonicalEvent = "tool/before";
const capabilityRevision = "0.147.0";
const nativeEvent = "PreToolUse";
const target = "codex";
const runtimeMode = "standalone";
const timeoutMs = 10000;
const executor = (0,node_url__rspack_import_2.fileURLToPath)(new URL(/* webpackIgnore: true */ "./event-route-tool-before.codex.execute.mjs", import.meta.url));
const fail = (message)=>{
    throw new Error(`Agent Bundle event route error: ${message}`);
};
const prepareRouteInvocation = async (nativeInput, signal, observer, receipt)=>{
    const processHit = {
        ...processLifetime,
        hits: ++processLifetime.hits
    };
    const native = (0,agent_bundle_event_project__rspack_import_3/* .validateNativeEventEnvelope */.AN)(nativeInput, {
        canonicalEvent,
        nativeEvent,
        target
    });
    const props = (0,agent_bundle_event_project__rspack_import_3/* .createCanonicalEventProps */.no)(canonicalEvent, native, target, nativeEvent, capabilityRevision, signal);
    const trace = (0,agent_bundle_event_project__rspack_import_3/* .createEventTracer */.wG)({
        execution: (0,agent_bundle_event_project__rspack_import_3/* .eventTraceExecution */.oq)({
            event: canonicalEvent,
            host: target,
            nativeEvent
        }),
        ...observer === undefined ? {} : {
            observer
        }
    });
    if (_src_events_tool_before_ts__rspack_import_4/* ["default"].event */.A.event !== undefined && _src_events_tool_before_ts__rspack_import_4/* ["default"].event */.A.event !== canonicalEvent) throw new TypeError("Event definition disagrees with its conventional path.");
    const sessionId = typeof native.session_id === "string" ? native.session_id : typeof native.conversation_id === "string" ? native.conversation_id : undefined;
    const workspaceRoot = typeof native.cwd === "string" ? native.cwd : Array.isArray(native.workspace_roots) && typeof native.workspace_roots[0] === "string" ? native.workspace_roots[0] : undefined;
    const lineage =  true ? await (0,_agent_bundle_runtime_lineage__rspack_import_7/* .resolveStandaloneLineage */.Bu)(target, native) : 0;
    receipt?.identity(native);
    receipt?.lineage(lineage);
    const providerObservations = [];
    const observeProvider = (event)=>{
        if (event.type === "observed-providers-start") trace.providersStart();
        if (event.type === "observed-providers-finish") trace.providersFinish(event.count);
        if (event.type === "observed-provider") providerObservations.push(event);
    };
    return withEventState(signal, async (bindings)=>{
        const gate = await (0,_agent_bundle_runtime_request__rspack_import_6/* .runAgentRequest */.iC)({
            invocation: {
                artifactEpoch: "ba6129bcdd46de47a8055741a91327520610dabdef4818a0aa8a0ca4cb3245ac",
                hostContractRevision: capabilityRevision,
                kind: "event",
                operationId: `event:${canonicalEvent}`,
                surface: canonicalEvent
            },
            host: (0,_agent_bundle_runtime_request__rspack_import_6/* .available */.qC)({
                name: target
            }, "native"),
            plugin: pluginRoot.identity,
            lineage,
            ...sessionId === undefined ? {} : {
                session: (0,_agent_bundle_runtime_request__rspack_import_6/* .available */.qC)({
                    sessionId
                }, "native")
            },
            ...workspaceRoot === undefined ? {} : {
                workspace: (0,_agent_bundle_runtime_request__rspack_import_6/* .available */.qC)({
                    root: workspaceRoot
                }, "native")
            },
            state: bindings?.state,
            noticeLedger: bindings?.noticeLedger,
            terminal: (0,_agent_bundle_runtime_request__rspack_import_6/* .available */.qC)({
                hostSurface: "hook",
                sharesTarget: false,
                stderr: {
                    color: "none",
                    kind: "none"
                },
                stdout: {
                    color: "none",
                    kind: "none"
                }
            }, "derived"),
            signal,
            process: processHit,
            resolveProvider: async (key, request)=>{
                const provider = providers.find((candidate)=>candidate.key === key);
                if (provider === undefined) throw new TypeError('Unknown provider ' + JSON.stringify(key));
                const providerStartedAt = performance.now();
                if (true) observeProvider({
                    type: 'observed-providers-start'
                });
                try {
                    const module = await provider.load();
                    if (typeof module.default !== 'function') throw new TypeError(`Context provider "${provider.key}" (${provider.source}) must default-export a factory.`);
                    const value = await module.default({
                        ...request,
                        invocation: {
                            kind: "event",
                            props: {
                                event: canonicalEvent,
                                payload: native
                            }
                        }
                    });
                    if (true) observeProvider({
                        durationMs: performance.now() - providerStartedAt,
                        key: provider.key,
                        source: provider.source,
                        status: 'mounted',
                        type: 'observed-provider'
                    });
                    return value;
                } catch (error) {
                    if (true) observeProvider({
                        durationMs: performance.now() - providerStartedAt,
                        key: provider.key,
                        message: error instanceof Error ? error.message : String(error),
                        source: provider.source,
                        status: 'failed',
                        type: 'observed-provider'
                    });
                    throw new Error(`Context provider "${provider.key}" (${provider.source}) failed: ${error instanceof Error ? error.message : String(error)}`, {
                        cause: error
                    });
                } finally{
                    if (true) observeProvider({
                        count: 1,
                        durationMs: performance.now() - providerStartedAt,
                        type: 'observed-providers-finish'
                    });
                }
            }
        }, ()=>(0,agent_bundle_event_project__rspack_import_3/* .executeEventHandler */.kx)(handler, {
                native,
                canonical: props.canonical,
                host: {
                    name: target,
                    nativeEvent
                },
                signal,
                terminal: {
                    hostSurface: "hook",
                    sharesTarget: false,
                    stderr: {
                        color: "none",
                        kind: "none"
                    },
                    stdout: {
                        color: "none",
                        kind: "none"
                    }
                }
            }, trace, "./before.view.js"));
        const projected = gate.outcome === "render" ? undefined : (0,agent_bundle_event_project__rspack_import_3/* .projectEventHandlerResult */.hx)(gate, canonicalEvent, target, nativeEvent, native);
        return Object.freeze({
            gate,
            native,
            projected,
            props,
            providerObservations,
            runtime: runtimeMode,
            trace
        });
    });
};
const runExecutor = (input, signal)=>new Promise((resolve, reject)=>{
        const child = (0,node_child_process__rspack_import_1.spawn)(process.execPath, [
            executor
        ], {
            signal,
            stdio: [
                "pipe",
                "pipe",
                "pipe"
            ]
        });
        const stdout = [];
        const stderr = [];
        child.stdout.on("data", (chunk)=>stdout.push(chunk));
        child.stderr.on("data", (chunk)=>stderr.push(chunk));
        child.once("error", reject);
        child.stdin.once("error", reject);
        child.once("close", (code, childSignal)=>{
            const errorText = Buffer.concat(stderr).toString("utf8");
            if (code !== 0 || childSignal !== null) {
                reject(new Error(errorText.trim() || `Deferred event executor failed (exit ${String(code)}, signal ${String(childSignal)}).`));
                return;
            }
            if (errorText !== "") process.stderr.write(errorText);
            resolve(Buffer.concat(stdout));
        });
        child.stdin.end(input);
    });
const run = async ()=>{
    const chunks = [];
    let bytes = 0;
    for await (const chunk of process.stdin){
        bytes += chunk.length;
        if (bytes > 1024 * 1024) fail("stdin exceeds the 1 MiB native-payload limit");
        chunks.push(chunk);
    }
    const input = Buffer.concat(chunks);
    let parsed;
    try {
        parsed = JSON.parse(input.toString("utf8"));
    } catch  {
        fail("stdin must contain exactly one JSON value");
    }
    const controller = new AbortController();
    const signal = AbortSignal.any([
        controller.signal,
        AbortSignal.timeout(timeoutMs)
    ]);
    const execution = (0,agent_bundle_event_project__rspack_import_3/* .eventTraceExecution */.oq)({
        event: canonicalEvent,
        host: target,
        nativeEvent
    });
    const receipt = await (0,agent_bundle_event_project__rspack_import_3/* .openEventTraceReceipt */.Q$)({
        anchor: import.meta.url,
        env: process.env,
        execution
    });
    try {
        const { gate, native, projected, props, trace } = await prepareRouteInvocation(parsed, signal, receipt?.observer, receipt);
        if (gate.outcome !== "render") {
            if (projected !== undefined) process.stdout.write(JSON.stringify(projected));
            return;
        }
        trace.executeStart(runtimeMode);
        const executionInput = Buffer.from(JSON.stringify({
            native,
            observedAt: props.canonical.observedAt,
            renderInput: gate.data,
            sequence: props.canonical.sequence
        }));
        const terminationSignals = [
            "SIGHUP",
            "SIGINT",
            "SIGTERM"
        ];
        const terminate = ()=>controller.abort();
        for (const terminationSignal of terminationSignals)process.once(terminationSignal, terminate);
        let output;
        try {
            output = await runExecutor(executionInput, signal);
        } catch (error) {
            trace.failure("execute", error);
            throw error;
        } finally{
            for (const terminationSignal of terminationSignals)process.off(terminationSignal, terminate);
        }
        if (output.length > 0) process.stdout.write(output);
    } finally{
        await receipt?.send();
    }
};
if (import.meta.main) {
    await run().catch((error)=>{
        process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
        process.exitCode = 1;
    });
}

__webpack_require__.d(__webpack_exports__, {
}, {
  v: prepareRouteInvocation
});

__rspack_async_done();
} catch(e) { __rspack_async_done(e); } }, 1);

},

});
// The module cache
var __webpack_module_cache__ = {};

// The require function
function __webpack_require__(moduleId) {

// Check if module is in cache
var cachedModule = __webpack_module_cache__[moduleId];
if (cachedModule !== undefined) {
return cachedModule.exports;
}
// Create a new module (and put it into the cache)
var module = (__webpack_module_cache__[moduleId] = {
exports: {}
});
// Execute the module function
__webpack_modules__[moduleId](module, module.exports, __webpack_require__);

// Return the exports of the module
return module.exports;

}

// expose the module cache
__webpack_require__.c = __webpack_module_cache__;

// webpack/runtime/async_module
(() => {
var hasSymbol = typeof Symbol === "function";
var rspackQueues = hasSymbol ? Symbol("rspack queues") : "__rspack_queues";
var rspackExports = __webpack_require__.aE = hasSymbol ? Symbol("rspack exports") : "__webpack_exports__";
var rspackError = hasSymbol ? Symbol("rspack error") : "__rspack_error";
var rspackDone = hasSymbol ? Symbol("rspack done") : "__rspack_done";
var rspackDefer = __webpack_require__.zS = hasSymbol ? Symbol("rspack defer") : "__rspack_defer";
__webpack_require__.zT = (asyncDeps) => {
	var hasUnresolvedAsyncSubgraph = asyncDeps.some((id) => {
		var cache = __webpack_module_cache__[id];
		return !cache || cache[rspackDone] === false;
	});
	if (hasUnresolvedAsyncSubgraph) {
		return ({ then(onFulfilled, onRejected) { return Promise.all(asyncDeps.map(__webpack_require__)).then(onFulfilled, onRejected) } });
	}
}
var resolveQueue = (queue) => {
	if (queue && queue.d < 1) {
		queue.d = 1;
    	queue.forEach((fn) => (fn.r--));
		queue.forEach((fn) => (fn.r-- ? fn.r++ : fn()));
	}
}
var wrapDeps = (deps) => {
	return deps.map((dep) => {
		if (dep !== null && typeof dep === "object") {
			if(!dep[rspackQueues] && dep[rspackDefer]) {
				var asyncDeps = __webpack_require__.zT(dep[rspackDefer]);
				if (asyncDeps) {
					var d = dep;
					dep = {
						then(onFulfilled, onRejected) {
							asyncDeps.then(() => (onFulfilled(d)), onRejected);
						}
					};
				} else return dep;
			}
			if (dep[rspackQueues]) return dep;
			if (dep.then) {
				var queue = [];
				queue.d = 0;
				dep.then((r) => {
					obj[rspackExports] = r;
					resolveQueue(queue);
				},(e) => {
					obj[rspackError] = e;
					resolveQueue(queue);
				});
				var obj = {};
				obj[rspackDefer] = false;
				obj[rspackQueues] = (fn) => (fn(queue));
				return obj;
			}
		}
		var ret = {};
		ret[rspackQueues] = () => {};
		ret[rspackExports] = dep;
		return ret;
	});
};
__webpack_require__.a = (module, body, hasAwait, useModuleExports) => {
	var queue;
	hasAwait && ((queue = []).d = -1);
	var depQueues = new Set();
	var exports = module.exports;
	var currentDeps;
	var outerResolve;
	var reject;
	var promise = new Promise((resolve, rej) => {
		reject = rej;
		outerResolve = resolve;
	});
	promise[rspackExports] = exports;
	promise[rspackQueues] = (fn) => { queue && fn(queue), depQueues.forEach(fn), promise["catch"](() => {}); };
	module.exports = promise;
	var asyncModule = module;
	if (useModuleExports) {
		asyncModule = Object.create(module);
		asyncModule.exports = exports;
	}
	var handle = (deps) => {
		currentDeps = wrapDeps(deps);
		var fn;
		var getResult = () => {
			return currentDeps.map((d) => {
				if(d[rspackDefer]) return d;
				if (d[rspackError]) throw d[rspackError];
				return d[rspackExports];
			});
		}
		var promise = new Promise((resolve) => {
			fn = () => (resolve(getResult));
			fn.r = 0;
			var fnQueue = (q) => (q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn))));
			currentDeps.map((dep) => (dep[rspackDefer] || dep[rspackQueues](fnQueue)));
		});
		return fn.r ? promise : getResult();
	};
	var done = (err) => ((err ? reject(promise[rspackError] = err) : (useModuleExports && (exports = promise[rspackExports] = asyncModule.exports), outerResolve(exports))), resolveQueue(queue), promise[rspackDone] = true);
	body(handle, done, asyncModule);
	queue && queue.d < 0 && (queue.d = 0);
};

})();
// webpack/runtime/define_property_getters
(() => {
__webpack_require__.d = (exports, getters, values) => {
	var define = (defs, kind) => {
		for(var key in defs) {
			if(__webpack_require__.o(defs, key) && !__webpack_require__.o(exports, key)) {
				Object.defineProperty(exports, key, { enumerable: true, [kind]: defs[key] });
			}
		}
	};
	define(getters, "get");
	define(values, "value");
};
})();
// webpack/runtime/has_own_property
(() => {
__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
})();
// webpack/runtime/make_namespace_object
(() => {
// define __esModule on exports
__webpack_require__.r = (exports) => {
	if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
	}
	Object.defineProperty(exports, '__esModule', { value: true });
};
})();
// module cache are used so entry inlining is disabled
// startup
// Load entry module and return exports
var __webpack_exports__ = __webpack_require__("./.agent-bundle-virtual/hooks-event-route-tool-before.codex-entry.mjs");
__webpack_exports__ = await __webpack_exports__;
var __webpack_exports__prepareRouteInvocation = __webpack_exports__.v;
export { __webpack_exports__prepareRouteInvocation as prepareRouteInvocation };
