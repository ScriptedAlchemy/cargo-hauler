import { spawn } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'effect-rstest';

const artifactRoot = fileURLToPath(new URL('../../artifact/', import.meta.url));

// Only the copied artifact is chmodded. Dereferenced copies cannot change
// permissions on files belonging to the original build or dependency store.
const permissions = (root: string, readOnly: boolean): void => {
  chmodSync(root, readOnly ? 0o555 : 0o755);
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) permissions(path, readOnly);
    else chmodSync(path, readOnly ? 0o444 : 0o644);
  }
};

const invoke = (entry: string, cwd: string, env: NodeJS.ProcessEnv, host: 'claude' | 'cursor', command: string) =>
  new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, [entry], { cwd, env, stdio: ['pipe', 'pipe', 'pipe'], timeout: 5_000 });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8'); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf8'); });
    child.on('error', reject);
    child.on('close', (code) => { resolve({ code, stdout, stderr }); });
    child.stdin.end(JSON.stringify({
      cwd, conversation_id: 'root-projection', session_id: 'root-projection',
      hook_event_name: host === 'claude' ? 'PreToolUse' : 'preToolUse',
      tool_name: host === 'claude' ? 'Bash' : 'Shell', tool_input: { command },
      tool_use_id: 'root-projection-call', transcript_path: join(cwd, 'transcript.json'),
    }) + '\n');
  });

describe('relocated read-only semantic hook binding (#168)', () => {
  for (const host of ['claude', 'cursor'] as const) {
    for (const kind of ['valid', 'blank', 'unexpanded'] as const) {
      const filename = `event-route-tool-before.${host}.mjs`;
      it.skipIf(!existsSync(join(artifactRoot, 'hooks', filename)))(`${host}: ${kind} anchor cannot select an unrelated PATH binary`, async () => {
        const root = mkdtempSync(join(tmpdir(), 'h-root-'));
        const moved = join(root, 'relocated plugin with spaces');
        const cwd = join(root, 'workspace');
        const bin = join(root, 'unrelated-bin');
        const marker = join(root, 'wrong-binary-ran');
        try {
          cpSync(artifactRoot, moved, { dereference: true, recursive: true });
          mkdirSync(cwd);
          mkdirSync(bin);
          mkdirSync(join(root, 'home'));
          writeFileSync(join(bin, 'hauler'), '#!/bin/sh\nprintf wrong > "$HAULER_WRONG_BINARY_MARKER"\nexit 97\n', { mode: 0o755 });
          permissions(moved, true);
          const command = "cargo test -- --exact 'literal $HOME'";
          const result = await invoke(join(moved, 'hooks', filename), cwd, {
            ...process.env,
            AGENT_BUNDLE_HOOK_HOST: host,
            AGENT_BUNDLE_PLUGIN_ROOT: kind === 'valid' ? moved : kind === 'blank' ? '' : '${CLAUDE_PLUGIN_ROOT}',
            AGENT_BUNDLE_STATE_ROOT: join(root, 'framework-state'),
            CARGO_HAULER_STATE_DIR: join(root, 'cargo-state'),
            CLAUDE_PLUGIN_ROOT: '/wrong-native-alias', CURSOR_PLUGIN_ROOT: '/wrong-native-alias', PLUGIN_ROOT: '/wrong-native-alias',
            HOME: join(root, 'home'), XDG_STATE_HOME: join(root, 'user-state'),
            PATH: `${bin}${delimiter}${process.env.PATH ?? ''}`, HAULER_WRONG_BINARY_MARKER: marker,
          }, host, command);
          expect(result.code).toBe(0);
          expect(result.stdout.length).toBeGreaterThan(0);
          const output = JSON.parse(result.stdout);
          const native = host === 'claude' ? output.hookSpecificOutput : output;
          const updated = host === 'claude' ? native.updatedInput : native.updated_input;
          expect(host === 'claude' ? native.permissionDecision : native.permission).toBe('allow');
          const expectedRoot = kind === 'valid' ? moved : realpathSync(moved);
          expect(updated.command).toContain(`'${join(expectedRoot, 'scripts/hauler.mjs')}'`);
          expect(updated.command).toContain(`-- ${command}`);
          expect(updated.command).not.toContain('/wrong-native-alias');
          expect(updated.command.startsWith('hauler ')).toBe(false);
          expect(existsSync(marker)).toBe(false);
          expect(existsSync(join(moved, 'state'))).toBe(false);
        } finally {
          if (existsSync(moved)) permissions(moved, false);
          rmSync(root, { force: true, recursive: true });
        }
      });
    }
  }
});
