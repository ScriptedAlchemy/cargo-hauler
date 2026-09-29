import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, lstat, utimes, open, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sha = /^[a-f0-9]{40}$/;
const limit = 8 * 1024 * 1024;

export function validateSnapshot(snapshot) {
  if (!Number.isSafeInteger(snapshot.pr) || snapshot.pr < 1 ||
      ![snapshot.head, snapshot.base, snapshot.merge].every(value => typeof value === 'string' && sha.test(value))) {
    throw new Error('Invalid pull request snapshot');
  }
}

export function volumeNames(repository, compatibilityKey, snapshot, sharedBuilds) {
  const key = createHash('sha256').update(JSON.stringify([repository, compatibilityKey, sharedBuilds ? 'trusted-cohort' : snapshot.pr])).digest('hex').slice(0, 32);
  return ['target', 'cargo', 'pnpm'].map(kind => `hauler-${key}-${kind}`);
}

export async function preserveSourceMtimes(staging, tree, previous) {
  const current = new Map();
  for (const entry of tree.split('\0')) {
    if (!entry) continue;
    const tab = entry.indexOf('\t');
    const [mode, , blob] = entry.slice(0, tab).split(' ');
    if (mode !== '100644' && mode !== '100755' && mode !== '040000') continue;
    const relative = entry.slice(tab + 1);
    const file = path.join(staging, relative);
    const stat = await lstat(file);
    if (mode === '040000' ? !stat.isDirectory() : !stat.isFile()) throw new Error('Invalid staging entry');
    const prior = previous.get(relative);
    const timestamp = prior?.blob === blob && prior.mode === mode ? prior.timestamp : stat.mtime;
    if (mode !== '040000') await utimes(file, timestamp, timestamp);
    current.set(relative, { blob, mode, timestamp });
  }
  for (const [relative, { mode, timestamp }] of current) {
    if (mode === '040000') await utimes(path.join(staging, relative), timestamp, timestamp);
  }
  return current;
}

export async function createSandbox({ repository, image, root, sharedBuilds = false, compatibilityKey, signal }) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || !/^[A-Za-z0-9][A-Za-z0-9_.:/@-]*$/.test(image) ||
      typeof compatibilityKey !== 'string' || !compatibilityKey || typeof sharedBuilds !== 'boolean') throw new Error('Invalid sandbox configuration');
  await mkdir(root, { recursive: true, mode: 0o700 });
  const directory = await mkdtemp(path.join(path.resolve(root), 'sandbox-'));
  const env = { PATH: '/usr/local/bin:/usr/bin:/bin', HOME: directory, LANG: 'C.UTF-8', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_TERMINAL_PROMPT: '0' };
  const mirror = path.join(directory, 'mirror.git');
  let container;
  let pendingStop;
  let abortListener;
  let staging;
  let cacheMounts;
  const ownedVolumes = new Set();
  let initialized = false;
  let closed = false;
  let running = false;
  let mtimes = new Map();
  let snapshotSignal = signal;

  async function execute(program, args, { abortSignal = snapshotSignal, timeoutSeconds = 300, logPath } = {}) {
    abortSignal?.throwIfAborted();
    const handle = logPath ? await open(logPath, 'wx', 0o600) : undefined;
    let bytes = 0;
    const chunks = [];
    const started = Date.now();
    try {
      return await new Promise((resolve, reject) => {
        const child = spawn(program, args, { env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
        let failure;
        let writes = Promise.resolve();
        const stop = reason => { failure = reason; try { process.kill(-child.pid, 'SIGKILL'); } catch {} };
        const abort = () => stop(new Error('Sandbox operation aborted'));
        const timer = setTimeout(() => stop(new Error('Sandbox operation timed out')), timeoutSeconds * 1000);
        abortSignal?.addEventListener('abort', abort, { once: true });
        if (abortSignal?.aborted) abort();
        const collect = chunk => {
          if (!handle && bytes + chunk.length > limit) stop(new Error('Sandbox control output exceeded limit'));
          const kept = chunk.subarray(0, Math.max(0, limit - bytes));
          bytes += kept.length;
          if (handle) writes = writes.then(() => handle.write(kept)).catch(error => stop(error));
          else chunks.push(kept);
        };
        child.stdout.on('data', collect);
        child.stderr.on('data', collect);
        child.on('error', error => { failure = error; });
        child.on('close', async code => {
          clearTimeout(timer);
          abortSignal?.removeEventListener('abort', abort);
          await writes;
          if (failure) reject(failure);
          else resolve({ exitCode: code ?? 1, seconds: (Date.now() - started) / 1000, output: Buffer.concat(chunks).toString('utf8'), logPath });
        });
      });
    } finally { await handle?.close(); }
  }
  async function checked(program, args, options) {
    const result = await execute(program, args, options);
    if (result.exitCode !== 0) throw new Error(`${program} sandbox operation failed (${result.exitCode})`);
    return result.output.trim();
  }
  const git = args => checked('git', ['-c', 'credential.helper=', '-c', 'core.hooksPath=/dev/null', ...args]);
  async function stopContainer() {
    if (pendingStop) return pendingStop;
    if (!container) return;
    const name = container;
    pendingStop = checked('docker', ['rm', '--force', name], { abortSignal: null, timeoutSeconds: 60 }).then(() => { container = undefined; });
    try { await pendingStop; } finally { pendingStop = undefined; }
  }
  async function removeStaging() {
    if (!staging) return;
    await checked('docker', ['run', '--rm', '--network=none', '--read-only', '--cap-drop=ALL', '--cap-add=DAC_OVERRIDE', '--security-opt=no-new-privileges', '--user=0:0', '--mount', `type=bind,src=${staging},dst=/workspace`, '--entrypoint=/bin/sh', image, '-c', 'find /workspace -mindepth 1 -delete'], { abortSignal: null });
    await rm(staging, { recursive: true, force: true });
    staging = undefined;
  }
  async function prepare(snapshot) {
    if (closed || running) throw new Error('Sandbox is unavailable');
    validateSnapshot(snapshot);
    snapshotSignal?.removeEventListener('abort', abortListener);
    const signals = [signal, snapshot.signal].filter(Boolean);
    snapshotSignal = signals.length ? AbortSignal.any(signals) : undefined;
    await stopContainer();
    await removeStaging();
    if (!initialized) {
      await git(['init', '--bare', mirror]);
      initialized = true;
    }
    await git(['--git-dir', mirror, 'fetch', '--no-tags', `https://github.com/${repository}.git`, snapshot.merge]);
    const revision = await git(['--git-dir', mirror, 'rev-parse', 'FETCH_HEAD']);
    const parents = await git(['--git-dir', mirror, 'show', '-s', '--format=%P', revision]);
    if (revision !== snapshot.merge || parents !== `${snapshot.base} ${snapshot.head}`) throw new Error('Admitted pull request snapshot did not match fetched commit');
    staging = await mkdtemp(path.join(directory, 'source-'));
    await git(['clone', '--no-hardlinks', '--no-checkout', mirror, staging]);
    await git(['-C', staging, 'checkout', '--detach', snapshot.merge]);
    const tree = await git(['--git-dir', mirror, 'ls-tree', '-r', '-t', '-z', '--full-tree', snapshot.merge]);
    mtimes = await preserveSourceMtimes(staging, tree, mtimes);
    const volumes = volumeNames(repository, `${compatibilityKey}:${directory}`, snapshot, sharedBuilds);
    for (const volume of volumes) {
      await checked('docker', ['volume', 'create', volume]);
      ownedVolumes.add(volume);
    }
    const mounts = volumes.flatMap((volume, index) => ['--mount', `type=volume,src=${volume},dst=${['/workspace/target', '/cache/cargo', '/cache/pnpm'][index]}`]);
    cacheMounts = mounts;
    await checked('docker', ['run', '--rm', '--network=none', '--read-only', '--cap-drop=ALL', '--cap-add=CHOWN', '--cap-add=DAC_OVERRIDE', '--security-opt=no-new-privileges', '--user=0:0', '--mount', `type=bind,src=${staging},dst=/workspace`, ...mounts, '--entrypoint=/bin/sh', image, '-c', 'chown -hR 10001:10001 /workspace /cache/cargo /cache/pnpm']);
    container = `hauler-${randomUUID()}`;
    try {
      await checked('docker', ['run', '--detach', '--name', container, '--init', '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--user=10001:10001', '--pids-limit=1024', '--tmpfs=/tmp:rw,exec,nosuid,nodev,mode=1777', '--tmpfs=/home/hauler:rw,nosuid,nodev,uid=10001,gid=10001', '--mount', `type=bind,src=${staging},dst=/workspace`, ...mounts, '--workdir=/workspace', '--env=HOME=/home/hauler', '--env=CARGO_HOME=/cache/cargo', '--env=RUSTUP_HOME=/opt/rustup', '--env=CARGO_TARGET_DIR=/workspace/target', '--env=CARGO_INCREMENTAL=0', '--env=PNPM_STORE_DIR=/cache/pnpm', '--env=PATH=/opt/cargo/bin:/usr/local/bin:/usr/bin:/bin', '--env=CI=true', '--entrypoint=/bin/sh', image, '-c', 'exec sleep infinity']);
    } catch (error) { await stopContainer(); throw error; }
    abortListener = () => { void stopContainer().catch(() => {}); };
    snapshotSignal?.addEventListener('abort', abortListener, { once: true });
    if (snapshotSignal?.aborted) { await stopContainer(); snapshotSignal.throwIfAborted(); }
  }
  async function run(command, { timeoutSeconds = 3600, signal: taskSignal } = {}) {
    if (!container || closed || running) throw new Error('Sandbox is not ready');
    if (typeof command !== 'string' || !command || !Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) throw new Error('Invalid sandbox command');
    running = true;
    const logPath = path.join(directory, `${randomUUID()}.log`);
    const signals = [snapshotSignal, taskSignal].filter(Boolean);
    try {
      const result = await execute('docker', ['exec', container, '/bin/sh', '-c', command], { logPath, timeoutSeconds, abortSignal: signals.length ? AbortSignal.any(signals) : undefined });
      return { exitCode: result.exitCode, seconds: result.seconds, logPath };
    } catch (error) { await stopContainer(); throw error; }
    finally { running = false; }
  }
  async function exportReports(paths) {
    if (running || !staging || !cacheMounts) throw new Error('Sandbox reports are unavailable');
    if (!Array.isArray(paths) || paths.length > 32 || paths.some(value => typeof value !== 'string' || !value || value.startsWith('/') || value.split('/').some(part => !part || part === '.' || part === '..'))) throw new Error('Invalid report paths');
    await stopContainer();
    const script = `
      const fs = require('node:fs');
      const results = [], seen = new Set(); let bytes = 0, visited = 0;
      function read(relative) {
        const components = relative.split('/');
        if (++visited > 10000 || components.length > 64) throw Error('Report traversal limit exceeded');
        for (let i = 1; i <= components.length; i++) {
          let stat; try { stat = fs.lstatSync('/workspace/' + components.slice(0, i).join('/')); }
          catch (error) { if (error.code === 'ENOENT') return; throw error; }
          if (stat.isSymbolicLink()) throw Error('Symlink report rejected');
        }
        const file = '/workspace/' + relative, stat = fs.lstatSync(file);
        if (stat.isDirectory()) { for (const name of fs.readdirSync(file)) read(relative + '/' + name); return; }
        if (!stat.isFile() || !/\\.(xml|json)$/.test(relative) || seen.has(relative)) return;
        bytes += stat.size; if (results.length >= 100 || bytes > 4 * 1024 * 1024) throw Error('Report limit exceeded');
        seen.add(relative); results.push({path: relative, data: fs.readFileSync(file).toString('base64')});
      }
      for (const relative of JSON.parse(process.argv[1])) read(relative);
      process.stdout.write(JSON.stringify(results));
    `;
    const mounts = cacheMounts.map((value, index) => index % 2 ? value + ',readonly' : value);
    const output = await checked('docker', ['run', '--rm', '--network=none', '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--user=10001:10001', '--mount', `type=bind,src=${staging},dst=/workspace,readonly`, ...mounts, '--workdir=/', '--entrypoint=/usr/local/bin/node', image, '-e', script, JSON.stringify(paths)]);
    const records = JSON.parse(output);
    if (!Array.isArray(records) || records.length > 100) throw new Error('Invalid reports');
    const destination = await mkdtemp(path.join(directory, 'reports-'));
    let bytes = 0;
    for (const record of records) {
      if (typeof record.path !== 'string' || !/\.(xml|json)$/.test(record.path) || record.path.startsWith('/') || record.path.split('/').some(part => !part || part === '.' || part === '..') || typeof record.data !== 'string') throw new Error('Invalid report');
      const data = Buffer.from(record.data, 'base64');
      bytes += data.length;
      if (bytes > 4 * 1024 * 1024) throw new Error('Report limit exceeded');
      const file = path.join(destination, record.path);
      await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
      await writeFile(file, data, { flag: 'wx', mode: 0o600 });
    }
    return destination;
  }
  async function close() {
    snapshotSignal?.removeEventListener('abort', abortListener);
    await stopContainer();
    closed = true;
    // Logs stay private for the controller to summarize after cleanup.
    await removeStaging();
    await rm(mirror, { recursive: true, force: true });
    for (const volume of ownedVolumes) {
      await checked('docker', ['volume', 'rm', volume], { abortSignal: null });
      ownedVolumes.delete(volume);
    }
  }
  return { prepare, run, exportReports, close };
}
