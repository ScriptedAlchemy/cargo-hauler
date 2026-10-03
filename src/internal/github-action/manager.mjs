import { createHash } from 'node:crypto';
import { githubClient } from './github.mjs';
import { checkIdentity, checkMetadata, cancelConflictedChecks, cancelNativeCheck } from './policy.mjs';
import { readSnapshot, scanAdmission } from './admission.mjs';
import { parseRecipe } from './recipe.mjs';
import { checkOwner, ownerKey, ownerText, verifyOwners } from './ownership.mjs';
import { aggregateJUnit, failingTestsSummary, snapshotEvidence } from './evidence.mjs';
import { performance } from 'node:perf_hooks';
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);

export async function drain({ recipe: input, lane: laneId, repository, token, root, actionIdentity, policy, admissionWorkflow = 'ci.yml', managerWorkflow = 'hauler-ci.yml', defaultBranch, worker, persistSnapshot, manualAdmission = false, image, maxMinutes = 45, maxSnapshots = 8, onlyPullRequests, sandboxFactory, fetchImpl = fetch, signal, pollMilliseconds = 60000 }) {
  const recipe = parseRecipe(input), lane = recipe.lanes.find(l => l.id === laneId);
  if (!lane || !/^[\w.-]+\/[\w.-]+$/.test(repository) || !token || !actionIdentity || !Number.isFinite(maxMinutes) || maxMinutes <= 0 || maxMinutes > 350 || !Number.isInteger(maxSnapshots) || maxSnapshots < 1 || maxSnapshots > 100) throw new TypeError('Invalid Hauler drain options');
  if (onlyPullRequests && (!Array.isArray(onlyPullRequests) || onlyPullRequests.some(n => !Number.isSafeInteger(n) || n < 1))) throw new TypeError('Invalid pull request selection');
  const deadline = Date.now() + maxMinutes * 60000, identity = policy ?? digest({ recipe, actionIdentity });
  const summary = { lane: lane.id, snapshots: [] }, attempted = new Set();
  let sandbox, sandboxKey;
  const client = githubClient({ repository, token, fetchImpl });
  const { api } = client;
  async function currentPull(number) {
    const pr = await api(`/pulls/${number}`);
    if (pr.state !== 'open' || pr.draft || pr.head?.repo?.full_name !== repository || !recipe.trustedAuthors.some(a => a.toLowerCase() === pr.user?.login?.toLowerCase()) || !sha(pr.head?.sha)) return null;
    return pr;
  }
  async function snapshot(number) { return readSnapshot(client, await currentPull(number)); }
  const same = (a, b) => b && a.head === b.head && a.base === b.base && a.merge === b.merge;
  const currentHead = async s => (await currentPull(s.pr))?.head.sha === s.head;
  const external = s => checkIdentity(s.head, lane.id, identity);
  async function eligible() {
    const scan = await scanAdmission(client, { recipe, repository, policy: identity, lanes: [lane], admissionWorkflow, managerWorkflow, defaultBranch, worker, manualAdmission, onlyPullRequests, attempted, deadline, signal });
    for (const item of scan.maintenance) {
      if (item.kind === 'conflict') await cancelConflictedChecks(client, { pr: item.pr, recipe, repository, policy: identity, lanes: [lane], checks: item.checks });
      else await cancelNativeCheck(client, { ...item, recipe, repository, policy: identity, admissionWorkflow });
    }
    return scan.candidates[0]?.snapshot;
  }
  async function compatibility(s) {
    const tree = await api(`/git/trees/${s.tree}?recursive=1`);
    if (tree.truncated || !Array.isArray(tree.tree)) throw new Error('Cannot establish complete build compatibility');
    const entries = tree.tree.filter(e => e.path === 'Cargo.toml' || e.path.endsWith('/Cargo.toml') || recipe.compatibilityPaths.some(p => p.endsWith('/') ? e.path.startsWith(p) : e.path === p)).map(e => [e.path, e.mode, e.sha]).sort((a, b) => a[0].localeCompare(b[0]));
    return digest({ identity, entries, ...(!recipe.sharedBuilds ? { merge: s.merge } : {}) });
  }
  try {
    while (summary.snapshots.length < maxSnapshots && Date.now() < deadline && !signal?.aborted) {
      const s = await eligible();
      if (!s) break;
      if (!same(s, await snapshot(s.pr)) || signal?.aborted || Date.now() >= deadline) continue;
      if (s.queued || s.retry) {
        const selected = s.queued ?? s.retry, latest = await api(`/check-runs/${selected.id}`), owner = checkOwner(latest);
        if (latest.external_id !== selected.external_id || latest.status !== selected.status || latest.head_sha !== s.head) continue;
        if (owner && (!worker || ownerKey(owner) !== ownerKey(worker)) && await verifyOwners(client, { repository, workflow: managerWorkflow, defaultBranch })(owner) && !owner.finished) continue;
        if (latest.status === 'completed' && ['success', 'failure'].includes(latest.conclusion) && !checkMetadata(latest.external_id)?.infrastructure && owner?.finished !== false) continue;
      }
      attempted.add(s.head);
      const runId = checkMetadata(s.queued?.external_id ?? s.retry?.external_id)?.runId;
      const provenanceIdentity = `${external(s)}${runId ? `:run:${runId}` : ''}`;
      const started = Date.now(), monotonicStart = performance.now(), controller = new AbortController();
      const abort = () => controller.abort();
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) controller.abort();
      const timer = setTimeout(() => controller.abort(), Math.max(1, deadline - Date.now()));
      const record = { pr: s.pr, head: s.head, base: s.base, merge: s.merge, imageReference: image, conclusion: 'cancelled', readyAt: new Date(s.readyAt).toISOString(), admittedAt: new Date(started).toISOString(), queueSeconds: Math.max(0, (started - s.readyAt) / 1000), durationSeconds: 0, compatibleSandboxReuse: false, stages: [], tasks: [] };
      const ownership = worker && { ...worker, lane: lane.id, ordinal: summary.snapshots.length + 1, remaining: onlyPullRequests ? 0 : maxSnapshots - summary.snapshots.length - 1, finished: false, deadline };
      const outputText = () => [ownership && ownerText(ownership), `hauler-evidence-v1:${JSON.stringify(snapshotEvidence(record))}`].filter(Boolean).join('\n');
      let check, reports, failed = false, stale = false, polling = false;
      const poll = setInterval(async () => {
        if (polling || controller.signal.aborted) return;
        polling = true;
        try { if (!await currentHead(s)) { stale = true; controller.abort(); } }
        catch { record.infrastructureError = true; controller.abort(); }
        finally { polling = false; }
      }, pollMilliseconds);
      async function progress(stage) {
        record.stage = stage;
        await api(`/check-runs/${check.id}`, 'PATCH', { output: { title: `Hauler ${lane.id}: ${stage}`, text: outputText(), summary: `${record.tasks.length}/${lane.tasks.length} tasks finished. Stage ${stage}. Failed tasks: ${record.tasks.filter(t => t.conclusion === 'failure').map(t => `${t.id} (exit ${t.exitCode})`).join(', ') || 'none'}. Pinned base ${s.base}, merge ${s.merge}.` } });
      }
      async function stage(name, operation) {
        await progress(name);
        const start = performance.now();
        let conclusion = 'failure';
        try { const value = await operation(); conclusion = controller.signal.aborted ? 'cancelled' : 'success'; return value; }
        finally { record.stages.push({ id: name, conclusion: controller.signal.aborted ? 'cancelled' : conclusion, durationSeconds: (performance.now() - start) / 1000 }); }
      }
      async function report(conclusion, finished = false) {
        if (!await currentHead(s)) { stale = true; controller.abort(); conclusion = 'cancelled'; }
        record.conclusion = conclusion;
        if (finished) { record.completedAt = new Date().toISOString(); record.durationSeconds = (performance.now() - monotonicStart) / 1000; if (ownership) ownership.finished = true; }
        await api(`/check-runs/${check.id}`, 'PATCH', { external_id: record.infrastructureError ? `${provenanceIdentity}:infrastructure` : provenanceIdentity, status: 'completed', conclusion, completed_at: new Date().toISOString(), output: { title: `Hauler ${lane.id}: ${conclusion}`, text: outputText(), summary: `${record.tasks.length}/${lane.tasks.length} tasks finished. Stage ${record.stage}. Tested head ${s.head} against pinned base ${s.base}, merge ${s.merge}. Later base changes are not revalidated. Failed tasks: ${record.tasks.filter(t => t.conclusion === 'failure').map(t => `${t.id} (exit ${t.exitCode})`).join(', ') || 'none'}.${failingTestsSummary(record.junit)}` } });
      }
      try {
        if (s.queued) {
          check = s.queued;
          await api(`/check-runs/${check.id}`, 'PATCH', { status: 'in_progress', started_at: new Date().toISOString(), ...(worker ? { details_url: `https://github.com/${repository}/actions/runs/${worker.runId}/job/${worker.jobId}` } : {}), output: { title: `Hauler ${lane.id}: claimed`, summary: 'Worker owns this snapshot.', text: outputText() } });
        } else check = await api('/check-runs', 'POST', { name: lane.checkName, head_sha: s.head, external_id: provenanceIdentity, ...(worker ? { details_url: `https://github.com/${repository}/actions/runs/${worker.runId}/job/${worker.jobId}` } : s.retry?.details_url ? { details_url: s.retry.details_url } : {}), status: 'in_progress', started_at: new Date().toISOString(), output: { title: `Hauler ${lane.id}: claimed`, summary: 'Worker owns this snapshot.', text: outputText() } });
        const key = await stage('compatibility', () => compatibility(s));
        record.compatibilityKey = key;
        await stage('image', async () => {
          record.compatibleSandboxReuse = Boolean(sandbox && key === sandboxKey);
          if (!record.compatibleSandboxReuse) {
            if (sandbox) await sandbox.close();
            sandbox = undefined;
            sandbox = await sandboxFactory({ repository, image, root, sharedBuilds: recipe.sharedBuilds, compatibilityKey: key, signal, preparationSignal: controller.signal });
            sandboxKey = key;
          }
        });
        await stage('checkout', () => sandbox.prepare({ pr: s.pr, head: s.head, base: s.base, merge: s.merge, signal: controller.signal }));
        for (const [index, command] of recipe.prepare.entries()) {
          await stage(`prepare-${index + 1}`, async () => {
            const result = await sandbox.run(command, { timeoutSeconds: Math.min(1800, Math.max(1, Math.ceil((deadline - Date.now()) / 1000))), signal: controller.signal });
            if (result.exitCode !== 0) throw new Error('Snapshot preparation failed');
          });
        }
        for (const task of lane.tasks) {
          if (controller.signal.aborted) break;
          let result;
          try { result = await stage(`task-${task.id}`, () => sandbox.run(task.run, { timeoutSeconds: task.timeoutSeconds, signal: controller.signal })); }
          finally {
            const timing = record.stages.at(-1);
            if (timing?.id === `task-${task.id}`) record.tasks.push({ id: task.id, conclusion: controller.signal.aborted ? 'cancelled' : result?.exitCode === 0 ? 'success' : 'failure', exitCode: Number.isInteger(result?.exitCode) ? result.exitCode : null, durationSeconds: timing.durationSeconds });
          }
          const conclusion = record.tasks.at(-1).conclusion;
          if (conclusion === 'failure') record.stages.at(-1).conclusion = 'failure';
          if (conclusion === 'failure' && !failed) { failed = true; await report('failure'); }
        }
        if (!controller.signal.aborted && recipe.reports.length) {
          await stage('reports', async () => { reports = await sandbox.exportReports(recipe.reports); record.junit = await aggregateJUnit(reports); });
        }
        await report(controller.signal.aborted || stale ? 'cancelled' : failed || record.tasks.length !== lane.tasks.length ? 'failure' : 'success', true);
      } catch {
        record.infrastructureError ||= !controller.signal.aborted && !stale;
        if (sandbox) { await sandbox.close(); sandbox = undefined; }
        if (check) await report(controller.signal.aborted || stale ? 'cancelled' : 'failure', true);
        else throw new Error('Could not create Hauler check');
      } finally {
        clearTimeout(timer); clearInterval(poll);
        signal?.removeEventListener('abort', abort);
        if (controller.signal.aborted && sandbox) { await sandbox.close(); sandbox = undefined; }
        record.completedAt = new Date().toISOString();
        record.durationSeconds = (performance.now() - monotonicStart) / 1000;
        summary.snapshots.push(record);
        // The exported report files go to the evidence artifact; the record
        // and check run carry only their counts.
        if (persistSnapshot) await persistSnapshot(snapshotEvidence(record), summary, reports);
      }
    }
  } finally { if (sandbox) await sandbox.close(); }
  return summary;
}
