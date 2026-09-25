import { afterEach, expect, it } from '@rstest/core';
import {
  mountBrowserApp,
  type MountedBrowserApp,
  type MountBrowserAppOptions,
} from 'agent-bundle/test/browser';

type BindingOperations = MountBrowserAppOptions['operations'];
type ToolCallResult = Awaited<ReturnType<BindingOperations['callTool']>>;

const dashboardTool = {
  _meta: {
    hauler: { route: 'tool:hauler/hauler_dashboard' },
    ui: { resourceUri: 'ui://cargo-hauler/dashboard.html' },
  },
  description: 'Open the cargo-hauler dashboard.',
  inputSchema: { properties: {}, type: 'object' },
  name: 'hauler_dashboard',
};

const openingHostContext = {
  availableDisplayModes: ['inline'],
  displayMode: 'inline',
  platform: 'desktop',
  toolInfo: { tool: dashboardTool },
};

const status = {
  active: [],
  daemon: 'stopped',
  lanes: [],
  maxConcurrent: null,
  operation: 'status',
  pid: null,
  recent: [],
  socketPath: '/tmp/cargo-hauler.sock',
  startedAtMs: null,
  stateRoot: '/tmp/cargo-hauler',
  summary: 'Nothing queued or running.',
};

const toolResult = {
  content: [{ text: status.summary, type: 'text' }],
  structuredContent: status,
} as const satisfies ToolCallResult;

const operations = (
  callTool: BindingOperations['callTool'] = async () => toolResult,
): BindingOperations => ({
  callTool,
  closeBinding: async () => true,
  readResource: async (_bindingId, request) => ({
    contents: [{ mimeType: 'text/plain', text: '', uri: request.uri }],
  }),
});

const mounted: MountedBrowserApp[] = [];

afterEach(async () => {
  await Promise.all(mounted.splice(0).map((app) => app.dispose()));
});

const waitFor = async (predicate: () => boolean, timeoutMs = 2_000): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error('Timed out waiting for the dashboard.');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

const mountDashboard = async (
  openingResult: MountBrowserAppOptions['toolResult'],
  callTool?: BindingOperations['callTool'],
): Promise<MountedBrowserApp> => {
  const app = await mountBrowserApp('dashboard', {
    host: { context: openingHostContext },
    operations: operations(callTool),
    serverName: 'hauler',
    toolDefinition: dashboardTool,
    toolInput: { limit: 40 },
    toolName: dashboardTool.name,
    toolResult: openingResult,
  });
  mounted.push(app);
  return app;
};

it('renders the canonical opening status result', async () => {
  const app = await mountDashboard(toolResult);
  await waitFor(() => app.document.querySelector('#status')?.textContent?.includes(status.summary) === true);

  expect(app.document.querySelector('h1')?.textContent).toBe('cargo-hauler');
  expect(app.document.querySelector('.error-line')).toBeNull();
  expect(app.provenance).toMatchObject({ name: 'dashboard', proofLevel: 'browser-app' });
  expect([...app.document.querySelectorAll('.grid > section > h2')].map((heading) => heading.textContent)).toEqual([
    'Contention',
    'In flight (0)',
    'Queue (0)',
    'Metrics (no daemon metrics)',
    'Lanes (0)',
    'History (0)',
  ]);
});

it('lists hook-denied, fail-open passthrough, and orphaned rows as finished work', async () => {
  const row = (id: number, rowStatus: string) => ({
    after: [],
    argv: ['cargo', 'check'],
    attachMode: null,
    attachedTo: null,
    background: false,
    createdAtMs: 1_000,
    cwd: '/repo',
    diagnostics: null,
    error: null,
    errorCount: null,
    estimateMs: null,
    execArgv: null,
    exitCode: null,
    finishedAtMs: null,
    holdStop: false,
    host: 'cli',
    id,
    intentJson: null,
    intentKey: 'k',
    laneKey: '/repo::/repo/target',
    outputPath: null,
    outputPreview: null,
    queuedAtMs: null,
    runMs: null,
    savedComputeMs: null,
    savedComputeSource: null,
    savedLatencyMs: null,
    session: null,
    signal: null,
    startedAtMs: null,
    status: rowStatus,
    targetDir: '/repo/target',
    ticket: `cc-${id}`,
    waitMs: null,
    warningCount: null,
    workspaceRoot: '/repo',
  });
  const withHistory = {
    ...status,
    recent: [row(1, 'denied'), row(2, 'passthrough'), row(3, 'orphaned'), row(4, 'running')],
  };
  const app = await mountDashboard({ content: toolResult.content, structuredContent: withHistory });
  await waitFor(() => app.document.querySelector('.pill.orphaned') !== null || app.document.querySelector('.error-line') !== null);
  expect(app.document.querySelector('.error-line')?.textContent ?? null).toBeNull();

  const history = [...app.document.querySelectorAll('.grid > section')].find((section) =>
    section.querySelector('h2')?.textContent?.startsWith('History'),
  );
  expect(history?.querySelector('h2')?.textContent).toBe('History (3)');
  expect([...(history?.querySelectorAll('.pill') ?? [])].map((pill) => pill.className)).toEqual([
    'pill denied',
    'pill passthrough',
    'pill orphaned',
  ]);
});

it('reports an invalid untrusted opening status payload', async () => {
  const pendingCall: BindingOperations['callTool'] = async () => new Promise<ToolCallResult>(() => {});
  const app = await mountDashboard(
    {
      content: [{ text: 'forged', type: 'text' }],
      structuredContent: { summary: 'forged' },
    },
    pendingCall,
  );
  await waitFor(() => app.document.querySelector('.error-line') !== null);

  expect(app.document.querySelector('.error-line')?.textContent).toContain(
    'Opening status payload rejected',
  );
  expect(app.document.querySelector('#status')?.textContent).not.toContain('forged');
});
