import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, appendFile, mkdtemp, realpath, chmod, mkdir, cp } from 'node:fs/promises';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);

export function assertTrustedContext(env, event, checkout) {
  const allowed = new Set(['pull_request_target', 'workflow_run', 'schedule', 'workflow_dispatch', 'push']);
  const branch = event.repository?.default_branch;
  if (!allowed.has(env.GITHUB_EVENT_NAME) || !branch || env.GITHUB_REF !== `refs/heads/${branch}`) {
    throw new Error('Hauler CI must run from the trusted default branch.');
  }
  if (!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA ?? '') || checkout !== env.GITHUB_SHA) {
    throw new Error('Checkout must be the exact trusted workflow commit.');
  }
  if (env.GITHUB_SERVER_URL !== 'https://github.com' || event.repository?.private !== false) {
    throw new Error('This Action currently supports public github.com repositories only.');
  }
  if (event.repository.full_name !== env.GITHUB_REPOSITORY) throw new Error('Repository identity mismatch.');
}

export function positiveInteger(value, maximum, name) {
  if (!/^[1-9][0-9]*$/.test(value ?? '') || Number(value) > maximum) throw new Error(`Invalid ${name}.`);
  return Number(value);
}

export async function within(root, path) {
  const base = await realpath(root);
  const result = await realpath(resolve(base, path));
  const rel = relative(base, result);
  if (rel === '..' || rel.startsWith('../') || isAbsolute(rel)) throw new Error('Path escapes trusted checkout.');
  return result;
}

export function imageLoader({ reference, image, dockerfile, context, env, execute = exec }) {
  let loading;
  return signal => loading ??= execute('docker', reference ? ['pull', reference] : ['build', '--tag', image, '--file', dockerfile, context], {
    env, signal, timeout: 20 * 60_000, maxBuffer: 20 * 1024 * 1024,
  }).catch(error => { loading = undefined; throw error; });
}

export async function main(env = process.env) {
  const event = JSON.parse(await readFile(env.GITHUB_EVENT_PATH, 'utf8'));
  const { loadPolicy, route, enqueue } = await import('./policy.mjs');
  const mode = env.CARGO_HAULER_CI_MODE ?? 'drain';
  const options = { repository: env.GITHUB_REPOSITORY, token: env.CARGO_HAULER_CI_TOKEN,
    managerWorkflow: env.CARGO_HAULER_CI_MANAGER_WORKFLOW ?? 'hauler-ci.yml',
    actionRef: env.CARGO_HAULER_ACTION_REF, recipePath: env.CARGO_HAULER_CI_RECIPE };
  if (mode === 'route') {
    const result = env.GITHUB_EVENT_NAME === 'pull_request' && env.GITHUB_SERVER_URL === 'https://github.com'
      ? await route({ ...options, pr: event.pull_request?.number, head: event.pull_request?.head?.sha })
      : { decision: 'native', policy: 'unavailable' };
    if (env.GITHUB_OUTPUT) await appendFile(env.GITHUB_OUTPUT, `decision=${result.decision}\npolicy=${result.policy}\n`);
    return result;
  }
  if (!['enqueue', 'plan', 'drain'].includes(mode)) throw new Error('Invalid Action mode');
  const root = await realpath(env.GITHUB_WORKSPACE ?? '.');
  const { stdout } = await exec('git', ['rev-parse', 'HEAD'], { cwd: root });
  assertTrustedContext(env, event, stdout.trim());
  const loaded = await loadPolicy({ ...options, ref: stdout.trim() });
  const { recipe, policy: actionIdentity } = loaded;
  const admissionWorkflow = env.CARGO_HAULER_CI_ADMISSION_WORKFLOW ?? 'ci.yml';
  const maxMinutes = positiveInteger(env.CARGO_HAULER_CI_MINUTES, 300, 'max-minutes');
  const maxSnapshots = positiveInteger(env.CARGO_HAULER_CI_SNAPSHOTS, 100, 'max-snapshots');
  const onlyPullRequests = env.CARGO_HAULER_CI_PRS?.trim()
    ? env.CARGO_HAULER_CI_PRS.split(',').map(value => positiveInteger(value.trim(), 2 ** 31 - 1, 'PR number'))
    : undefined;
  if (mode === 'enqueue') return enqueue({ ...loaded, repository: options.repository, onlyPullRequests, admissionWorkflow, managerRunId: env.GITHUB_RUN_ID });
  if (mode === 'plan') {
    const { plan } = await import('./admission.mjs');
    const result = await plan({ recipe, repository: options.repository, token: options.token, policy: actionIdentity, admissionWorkflow, onlyPullRequests,
      managerWorkflow: options.managerWorkflow, defaultBranch: loaded.defaultBranch,
      manualAdmission: env.GITHUB_EVENT_NAME === 'workflow_dispatch' && Boolean(onlyPullRequests?.length) });
    if (env.GITHUB_OUTPUT) await appendFile(env.GITHUB_OUTPUT, `lanes=${JSON.stringify(result.lanes)}\ncount=${result.count}\n`);
    console.log(JSON.stringify(result));
    return result;
  }
  const { drain } = await import('./manager.mjs');
  const { createSandbox } = await import('./sandbox.mjs');
  const dockerfile = await within(root, recipe.image.dockerfile);
  const context = await within(root, recipe.image.context);
  const state = await mkdtemp(join(env.RUNNER_TEMP || tmpdir(), 'hauler-ci-'));
  await chmod(state, 0o700);
  const abort = new AbortController();
  const stop = () => abort.abort(new Error('Workflow cancelled.'));
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
  const { workerIdentity } = await import('./ownership.mjs');
  const worker = await workerIdentity(loaded.client, { runId: env.GITHUB_RUN_ID, attempt: env.GITHUB_RUN_ATTEMPT, lane: env.CARGO_HAULER_CI_LANE,
    repository: options.repository, workflow: options.managerWorkflow, defaultBranch: loaded.defaultBranch });
  const image = recipe.image.reference ?? `hauler-ci:${actionIdentity.slice(0, 16)}`;
  const dockerEnv = { PATH: env.PATH, HOME: state };
  if (env.DOCKER_CONFIG) dockerEnv.DOCKER_CONFIG = await within(env.RUNNER_TEMP || tmpdir(), env.DOCKER_CONFIG);
  const loadImage = imageLoader({ reference: recipe.image.reference, image, dockerfile, context, env: dockerEnv });
  const sandboxFactory = async options => {
    await loadImage(options.preparationSignal ?? abort.signal);
    return createSandbox({ ...options, image, root: state, signal: abort.signal });
  };
  const evidence = join(state, 'evidence'), summary = join(evidence, 'summary.json');
  await mkdir(evidence, { mode: 0o700 });
  if (env.GITHUB_OUTPUT) await appendFile(env.GITHUB_OUTPUT, `summary=${summary}\nevidence=${evidence}\n`);
  const persistSnapshot = async (snapshot, result, reports) => {
    if (reports) await cp(reports, join(evidence, `pr-${snapshot.pr}-${snapshot.merge}`), { recursive: true });
    await writeFile(join(evidence, `pr-${snapshot.pr}-${snapshot.merge}.json`), `${JSON.stringify(snapshot, null, 2)}\n`, { mode: 0o600 });
    await writeFile(summary, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
  };
  try {
    const result = await drain({ recipe, lane: env.CARGO_HAULER_CI_LANE, repository: env.GITHUB_REPOSITORY,
      token: env.CARGO_HAULER_CI_TOKEN, root: state, image, actionIdentity, policy: actionIdentity, admissionWorkflow,
      managerWorkflow: options.managerWorkflow, defaultBranch: loaded.defaultBranch, worker, persistSnapshot,
      manualAdmission: env.GITHUB_EVENT_NAME === 'workflow_dispatch' && Boolean(onlyPullRequests?.length), maxMinutes, maxSnapshots,
      onlyPullRequests, sandboxFactory, signal: abort.signal });
    await writeFile(summary, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
    console.log(JSON.stringify(result));
    if (result.snapshots.some(snapshot => snapshot.infrastructureError)) process.exitCode = 1;
    return result;
  } finally {
    process.removeListener('SIGTERM', stop);
    process.removeListener('SIGINT', stop);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('Hauler CI controller failed. No successful PR verdict is inferred.');
    console.error(error?.stack ?? String(error));
    if (error?.status) console.error(`GitHub ${error.status} on ${error.path}: ${JSON.stringify(error.rateLimit)}`);
    process.exitCode = 1;
  });
}
