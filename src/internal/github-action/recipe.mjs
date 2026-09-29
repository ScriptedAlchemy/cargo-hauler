const ID = /^[a-z][a-z0-9-]{0,47}$/;
const IMAGE_REFERENCE = /^ghcr\.io\/[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)+@sha256:[a-f0-9]{64}$/;
const LOGIN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;
function fail(message) { throw new TypeError(`Invalid Hauler recipe: ${message}`); }
function strings(value, label, max = 100) {
  if (!Array.isArray(value) || value.length > max || value.some(v => typeof v !== 'string' || !v.trim() || v.length > 16384 || v.includes('\0'))) fail(label);
  return [...value];
}
function path(value, label, directory = false) {
  if (typeof value !== 'string' || !value || value.length > 1024 || value.includes('\\') || /[\x00-\x1f]/.test(value) || value.startsWith('/') || value.split('/').some(p => p === '..' || p === '.') || value.includes('//') || (!directory && value.endsWith('/'))) fail(label);
  return value;
}
export function parseRecipe(value) {
  if (!value || value.version !== 1) fail('version must be 1');
  const trustedAuthors = strings(value.trustedAuthors, 'trustedAuthors');
  if (!trustedAuthors.length || trustedAuthors.some(v => !LOGIN.test(v))) fail('trustedAuthors');
  if (value.sharedBuilds !== undefined && typeof value.sharedBuilds !== 'boolean') fail('sharedBuilds');
  const requiredChecks = strings(value.requiredChecks, 'requiredChecks');
  const prepare = strings(value.prepare, 'prepare');
  const reports = strings(value.reports ?? [], 'reports', 32).map(v => path(v, 'reports', true).replace(/\/$/, ''));
  const compatibilityPaths = strings(value.compatibilityPaths, 'compatibilityPaths').map(v => path(v, 'compatibilityPaths', true));
  if (!value.image || typeof value.image !== 'object') fail('image');
  const image = { dockerfile: path(value.image.dockerfile, 'image.dockerfile'), context: value.image.context === '.' ? '.' : path(value.image.context, 'image.context', true) };
  if (value.image.reference !== undefined) {
    if (typeof value.image.reference !== 'string' || value.image.reference.length > 1024 || IMAGE_REFERENCE.exec(value.image.reference)?.[0] !== value.image.reference) fail('image.reference must be a ghcr.io sha256 digest');
    image.reference = value.image.reference;
  }
  if (!Array.isArray(value.lanes) || !value.lanes.length || value.lanes.length > 32) fail('lanes');
  const ids = new Set(), checks = new Set(), taskIds = new Set();
  const lanes = value.lanes.map(lane => {
    if (!lane || typeof lane.id !== 'string' || !ID.test(lane.id) || ids.has(lane.id)) fail('unique lane id');
    ids.add(lane.id);
    if (typeof lane.checkName !== 'string' || !lane.checkName.trim() || lane.checkName.length > 100 || /[\x00-\x1f]/.test(lane.checkName) || checks.has(lane.checkName) || requiredChecks.includes(lane.checkName)) fail('unique independent checkName');
    checks.add(lane.checkName);
    if (!Array.isArray(lane.tasks) || !lane.tasks.length || lane.tasks.length > 100) fail('tasks');
    const tasks = lane.tasks.map(task => {
      if (!task || typeof task.id !== 'string' || !ID.test(task.id) || taskIds.has(task.id)) fail('unique task id');
      taskIds.add(task.id);
      const [run] = strings([task.run], 'task.run');
      if (!Number.isInteger(task.timeoutSeconds) || task.timeoutSeconds < 1 || task.timeoutSeconds > 21600) fail('task.timeoutSeconds');
      return { id: task.id, run, timeoutSeconds: task.timeoutSeconds };
    });
    return { id: lane.id, checkName: lane.checkName, tasks };
  });
  return { version: 1, trustedAuthors, sharedBuilds: value.sharedBuilds ?? false, requiredChecks, image, prepare, reports, compatibilityPaths, lanes };
}
