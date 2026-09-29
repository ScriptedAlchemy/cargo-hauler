const prefix = 'hauler-owner-v1:';
const positive = value => typeof value === 'string' && /^[1-9][0-9]{0,19}$/.test(value);
export function checkOwner(check) {
  const line = check.output?.text?.split('\n').find(line => line.startsWith(prefix));
  if (!line || line.length > 1024) return null;
  try {
    const owner = JSON.parse(line.slice(prefix.length));
    if (!positive(owner.runId) || !positive(owner.jobId) || !Number.isSafeInteger(owner.attempt) || owner.attempt < 1 ||
        !/^[a-z][a-z0-9-]{0,47}$/.test(owner.lane) || !Number.isSafeInteger(owner.ordinal) || owner.ordinal < 1 || owner.ordinal > 100 ||
        !Number.isSafeInteger(owner.remaining) || owner.remaining < 0 || owner.remaining > 100 || typeof owner.finished !== 'boolean' ||
        !Number.isSafeInteger(owner.deadline) || owner.deadline < 1) return null;
    return owner;
  } catch { return null; }
}
export const ownerText = owner => `${prefix}${JSON.stringify(owner)}`;
export const ownerKey = owner => `${owner.runId}:${owner.attempt}:${owner.jobId}`;

export function verifyOwners(client, { repository, workflow = 'hauler-ci.yml', defaultBranch }) {
  if (!/^[\w.-]+\.ya?ml$/.test(workflow)) throw new TypeError('Invalid manager workflow');
  const runs = new Map(), jobs = new Map();
  return async owner => {
    if (owner.deadline <= Date.now()) return false;
    if (!runs.has(owner.runId)) runs.set(owner.runId, client.api(`/actions/runs/${owner.runId}`));
    let run;
    try { run = await runs.get(owner.runId); }
    catch (error) { if (error.message === 'GitHub GET returned 404') return false; throw error; }
    if (String(run.id) !== owner.runId || run.run_attempt !== owner.attempt || !['queued', 'in_progress'].includes(run.status) ||
        !['pull_request_target', 'workflow_run', 'schedule', 'workflow_dispatch', 'push'].includes(run.event) ||
        run.path?.split('@')[0] !== `.github/workflows/${workflow}` || run.head_repository?.full_name !== repository ||
        !defaultBranch || run.head_branch !== defaultBranch) return false;
    const key = `${owner.runId}:${owner.attempt}`;
    if (!jobs.has(key)) jobs.set(key, client.pages(`/actions/runs/${owner.runId}/attempts/${owner.attempt}/jobs`, 'jobs'));
    let listed;
    try { listed = await jobs.get(key); }
    catch (error) { if (error.message === 'GitHub GET returned 404') return false; throw error; }
    const matches = listed.filter(job => job.name === `Hauler pool / ${owner.lane}`);
    return matches.length === 1 && String(matches[0].id) === owner.jobId && ['queued', 'in_progress'].includes(matches[0].status);
  };
}

export async function workerIdentity(client, { runId, attempt, lane, repository, workflow, defaultBranch }) {
  const owner = { runId: String(runId), attempt: Number(attempt), jobId: '1', lane, ordinal: 1, remaining: 0, finished: false, deadline: Date.now() + 60000 };
  if (!checkOwner({ output: { text: ownerText(owner) } })) throw new Error('Invalid worker identity');
  const jobs = await client.pages(`/actions/runs/${owner.runId}/attempts/${owner.attempt}/jobs`, 'jobs');
  const matches = jobs.filter(job => job.name === `Hauler pool / ${lane}`);
  if (matches.length !== 1) throw new Error('Unique Hauler pool lane job required');
  owner.jobId = String(matches[0].id);
  if (!checkOwner({ output: { text: ownerText(owner) } }) || !await verifyOwners(client, { repository, workflow, defaultBranch })(owner)) throw new Error('Could not verify current worker provenance');
  return { runId: owner.runId, attempt: owner.attempt, jobId: owner.jobId };
}
