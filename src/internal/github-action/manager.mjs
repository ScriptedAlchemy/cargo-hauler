import { createHash } from 'node:crypto';
import { githubClient } from './github.mjs';
import { checkIdentity, checkMetadata, cancelConflictedChecks } from './policy.mjs';
import { readSnapshot, scanAdmission } from './admission.mjs';
import { parseRecipe } from './recipe.mjs';
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);

export async function drain({ recipe: input, lane: laneId, repository, token, root, actionIdentity, policy, admissionWorkflow = 'ci.yml', manualAdmission = false, image, maxMinutes = 45, maxSnapshots = 8, onlyPullRequests, sandboxFactory, fetchImpl = fetch, signal, pollMilliseconds = 60000 }) {
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
    const scan = await scanAdmission(client, { recipe, repository, policy: identity, lanes: [lane], admissionWorkflow, manualAdmission, onlyPullRequests, attempted, deadline, signal });
    for (const item of scan.maintenance) {
      if (item.kind === 'conflict') await cancelConflictedChecks(client, { pr: item.pr, recipe, repository, policy: identity, lanes: [lane], checks: item.checks });
      else await api(`/check-runs/${item.queued.id}`, 'PATCH', { status: 'completed', conclusion: 'cancelled', completed_at: new Date().toISOString(), output: { title: 'Native CI owns this head', summary: 'Native CI fallback declined Hauler delegation.' } });
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
      attempted.add(s.head);
      const runId = checkMetadata(s.queued?.external_id ?? s.retry?.external_id)?.runId;
      const provenanceIdentity = `${external(s)}${runId ? `:run:${runId}` : ''}`;
      const started = Date.now(), controller = new AbortController();
      const abort = () => controller.abort();
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) controller.abort();
      const timer = setTimeout(() => controller.abort(), Math.max(1, deadline - Date.now()));
      const record = { pr: s.pr, head: s.head, base: s.base, merge: s.merge, conclusion: 'cancelled', readyAt: new Date(s.readyAt).toISOString(), admittedAt: new Date(started).toISOString(), queueSeconds: Math.max(0, (started - s.readyAt) / 1000), durationSeconds: 0, tasks: [] };
      let check, failed = false, stale = false, polling = false;
      const poll = setInterval(async () => {
        if (polling || controller.signal.aborted) return;
        polling = true;
        try { if (!await currentHead(s)) { stale = true; controller.abort(); } }
        catch { stale = true; controller.abort(); }
        finally { polling = false; }
      }, pollMilliseconds);
      async function progress(stage) {
        record.stage = stage;
        await api(`/check-runs/${check.id}`, 'PATCH', { output: { title: `Hauler ${lane.id}: ${stage}`, summary: `${record.tasks.length}/${lane.tasks.length} tasks finished. Stage ${stage}. Failed tasks: ${record.tasks.filter(t => t.conclusion === 'failure').map(t => `${t.id} (exit ${t.exitCode})`).join(', ') || 'none'}. Pinned base ${s.base}, merge ${s.merge}.` } });
      }
      async function report(conclusion) {
        if (!await currentHead(s)) { stale = true; controller.abort(); conclusion = 'cancelled'; }
        await api(`/check-runs/${check.id}`, 'PATCH', { external_id: record.infrastructureError ? `${provenanceIdentity}:infrastructure` : provenanceIdentity, status: 'completed', conclusion, completed_at: new Date().toISOString(), output: { title: `Hauler ${lane.id}: ${conclusion}`, summary: `${record.tasks.length}/${lane.tasks.length} tasks finished. Stage ${record.stage}. Tested head ${s.head} against pinned base ${s.base}, merge ${s.merge}. Later base changes are not revalidated. Failed tasks: ${record.tasks.filter(t => t.conclusion === 'failure').map(t => `${t.id} (exit ${t.exitCode})`).join(', ') || 'none'}.` } });
        record.conclusion = conclusion;
      }
      try {
        if (s.queued) {
          check = s.queued;
          await api(`/check-runs/${check.id}`, 'PATCH', { status: 'in_progress', started_at: new Date().toISOString() });
        } else check = await api('/check-runs', 'POST', { name: lane.checkName, head_sha: s.head, external_id: provenanceIdentity, ...(s.retry?.details_url ? { details_url: s.retry.details_url } : {}), status: 'in_progress', started_at: new Date().toISOString() });
        await progress('image');
        const key = await compatibility(s);
        if (!sandbox || key !== sandboxKey) {
          if (sandbox) await sandbox.close();
          sandbox = undefined;
          sandbox = await sandboxFactory({ repository, image, root, sharedBuilds: recipe.sharedBuilds, compatibilityKey: key, signal, preparationSignal: controller.signal });
          sandboxKey = key;
        }
        await progress('checkout');
        await sandbox.prepare({ pr: s.pr, head: s.head, base: s.base, merge: s.merge, signal: controller.signal });
        for (const [index, command] of recipe.prepare.entries()) {
          await progress(`prepare-${index + 1}`);
          const result = await sandbox.run(command, { timeoutSeconds: Math.min(1800, Math.max(1, Math.ceil((deadline - Date.now()) / 1000))), signal: controller.signal });
          if (result.exitCode !== 0) throw new Error('Snapshot preparation failed');
        }
        for (const task of lane.tasks) {
          if (controller.signal.aborted) break;
          await progress(`task-${task.id}`);
          const taskStart = Date.now();
          const result = await sandbox.run(task.run, { timeoutSeconds: task.timeoutSeconds, signal: controller.signal });
          const conclusion = result.exitCode === 0 ? 'success' : 'failure';
          record.tasks.push({ id: task.id, conclusion, exitCode: Number.isInteger(result.exitCode) ? result.exitCode : null, durationSeconds: (Date.now() - taskStart) / 1000 });
          if (conclusion === 'failure' && !failed) { failed = true; await report('failure'); }
        }
        if (!controller.signal.aborted && recipe.reports.length) {
          await progress('reports');
          record.reportsPath = await sandbox.exportReports(recipe.reports);
        }
        await report(controller.signal.aborted || stale ? 'cancelled' : failed || record.tasks.length !== lane.tasks.length ? 'failure' : 'success');
      } catch {
        record.infrastructureError = !controller.signal.aborted && !stale;
        if (sandbox) { await sandbox.close(); sandbox = undefined; }
        if (check) await report(controller.signal.aborted || stale ? 'cancelled' : 'failure');
        else throw new Error('Could not create Hauler check');
      } finally {
        clearTimeout(timer); clearInterval(poll);
        signal?.removeEventListener('abort', abort);
        if (controller.signal.aborted && sandbox) { await sandbox.close(); sandbox = undefined; }
        record.completedAt = new Date().toISOString();
        record.durationSeconds = (Date.now() - started) / 1000;
        summary.snapshots.push(record);
      }
    }
  } finally { if (sandbox) await sandbox.close(); }
  return summary;
}
