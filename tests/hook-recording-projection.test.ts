import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'effect-rstest';

const artifactRoot = fileURLToPath(new URL('../artifact/', import.meta.url));

// The native wrapper only projects the pending call; it never executes cargo.
const invoke = (entry: string, cwd: string, host: 'claude' | 'cursor', command: string) =>
  new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const statePath = join(cwd, 'not-a-directory');
    writeFileSync(statePath, 'force hook recording to fail');
    const child = spawn(process.execPath, [entry], {
      cwd,
      env: { ...process.env, AGENT_BUNDLE_HOOK_HOST: host, AGENT_BUNDLE_PLUGIN_ROOT: artifactRoot,
        AGENT_BUNDLE_STATE_ROOT: join(cwd, 'framework-state'), CARGO_HAULER_STATE_DIR: statePath },
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5_000,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8'); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf8'); });
    child.on('error', reject);
    child.on('close', (code) => { resolve({ code, stdout, stderr }); });
    child.stdin.end(JSON.stringify({
      cwd, conversation_id: 'record-projection', session_id: 'record-projection',
      hook_event_name: host === 'claude' ? 'PreToolUse' : 'preToolUse',
      tool_name: host === 'claude' ? 'Bash' : 'Shell', tool_input: { command },
      tool_use_id: 'record-projection-call', transcript_path: join(cwd, 'transcript.json'),
    }) + '\n');
  });

describe('native shell projection survives recording failure', () => {
  for (const host of ['claude', 'cursor'] as const) {
    const entry = join(artifactRoot, 'hooks', `event-route-tool-before.${host}.mjs`);
    for (const mixed of [false, true]) {
      it.skipIf(!existsSync(entry))(`${host}: preserves ${mixed ? 'continue + rewrite' : 'allow + rewrite'}`, async () => {
        const cwd = mkdtempSync(join(tmpdir(), 'hauler-record-projection-'));
        try {
          const command = `cargo test -p DO_NOT_LOG_SECRET${mixed ? ' && echo outside' : ''}`;
          const result = await invoke(entry, cwd, host, command);
          expect(result.code).toBe(0);
          expect(result.stderr).toContain('[cargo-hauler] beforeTool record-failed');
          expect(result.stderr).not.toContain('DO_NOT_LOG_SECRET');
          expect(result.stdout.length).toBeGreaterThan(0);
          const output = JSON.parse(result.stdout);
          const native = host === 'claude' ? output.hookSpecificOutput : output;
          // Cursor's native rewrite contract requires permission: allow even
          // for canonical continue. Claude keeps the no-decision distinction.
          expect(host === 'claude' ? native.permissionDecision : native.permission)
            .toBe(host === 'claude' && mixed ? undefined : 'allow');
          const updated = host === 'claude' ? native.updatedInput : native.updated_input;
          expect(updated.command).toContain('-- cargo test -p DO_NOT_LOG_SECRET');
          expect(updated.command.endsWith(' && echo outside')).toBe(mixed);
        } finally {
          rmSync(cwd, { force: true, recursive: true });
        }
      });
    }
  }
});
