import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, appendFile, mkdtemp, realpath, chmod, mkdir, cp } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const directory = dirname(fileURLToPath(import.meta.url));

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

export async function main(env = process.env) {
  const root = await realpath(env.GITHUB_WORKSPACE ?? '.');
  const event = JSON.parse(await readFile(env.GITHUB_EVENT_PATH, 'utf8'));
  const { stdout } = await exec('git', ['rev-parse', 'HEAD'], { cwd: root });
  assertTrustedContext(env, event, stdout.trim());
  if (!env.CARGO_HAULER_CI_TOKEN) throw new Error('A scoped job token is required.');
  const { parseRecipe } = await import('./recipe.mjs');
  const { drain } = await import('./manager.mjs');
  const { createSandbox } = await import('./sandbox.mjs');
  const recipePath = await within(root, env.CARGO_HAULER_CI_RECIPE);
  const recipe = parseRecipe(JSON.parse(await readFile(recipePath, 'utf8')));
  const dockerfile = await within(root, recipe.image.dockerfile);
  const context = await within(root, recipe.image.context);
  const hash = createHash('sha256');
  for (const name of ['main.mjs', 'manager.mjs', 'recipe.mjs', 'sandbox.mjs']) hash.update(await readFile(join(directory, name)));
  hash.update(await readFile(dockerfile));
  const contextRelative = relative(root, context) || '.';
  const { stdout: imageTree } = await exec('git', ['ls-tree', '-rz', 'HEAD', '--', contextRelative], { cwd: root });
  hash.update(imageTree);
  const actionIdentity = hash.digest('hex');
  const maxMinutes = positiveInteger(env.CARGO_HAULER_CI_MINUTES, 300, 'max-minutes');
  const maxSnapshots = positiveInteger(env.CARGO_HAULER_CI_SNAPSHOTS, 100, 'max-snapshots');
  const onlyPullRequests = env.CARGO_HAULER_CI_PRS?.trim()
    ? env.CARGO_HAULER_CI_PRS.split(',').map(value => positiveInteger(value.trim(), 2 ** 31 - 1, 'PR number'))
    : undefined;
  const state = await mkdtemp(join(env.RUNNER_TEMP || tmpdir(), 'hauler-ci-'));
  await chmod(state, 0o700);
  const abort = new AbortController();
  const stop = () => abort.abort(new Error('Workflow cancelled.'));
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
  const image = `hauler-ci:${actionIdentity.slice(0, 16)}`;
  let build;
  const sandboxFactory = async options => {
    build ??= exec('docker', ['build', '--tag', image, '--file', dockerfile, context], {
      env: { PATH: env.PATH, HOME: state }, signal: options.preparationSignal ?? abort.signal, timeout: 20 * 60_000, maxBuffer: 20 * 1024 * 1024,
    });
    try { await build; }
    catch (error) { build = undefined; throw error; }
    return createSandbox({ ...options, image, root: state, signal: abort.signal });
  };
  try {
    const result = await drain({ recipe, lane: env.CARGO_HAULER_CI_LANE, repository: env.GITHUB_REPOSITORY,
      token: env.CARGO_HAULER_CI_TOKEN, root: state, image, actionIdentity, maxMinutes, maxSnapshots,
      onlyPullRequests, sandboxFactory, signal: abort.signal });
    const evidence = join(state, 'evidence');
    await mkdir(evidence, { mode: 0o700 });
    for (const snapshot of result.snapshots) {
      if (snapshot.reportsPath) {
        const destination = `pr-${snapshot.pr}-${snapshot.merge}`;
        await cp(snapshot.reportsPath, join(evidence, destination), { recursive: true });
        snapshot.reportsPath = destination;
      }
    }
    const summary = join(evidence, 'summary.json');
    await writeFile(summary, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
    if (env.GITHUB_OUTPUT) await appendFile(env.GITHUB_OUTPUT, `summary=${summary}\nevidence=${evidence}\n`);
    console.log(JSON.stringify(result));
    if (result.snapshots.some(snapshot => snapshot.infrastructureError)) process.exitCode = 1;
    return result;
  } finally {
    process.removeListener('SIGTERM', stop);
    process.removeListener('SIGINT', stop);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    console.error('Hauler CI controller failed. No successful PR verdict is inferred.');
    process.exitCode = 1;
  });
}
