import { isRecord } from '../util/guards.js';

/**
 * `tool_input.command` as the host sent it; `undefined` when the tool input
 * is not a shell call (Read, Edit, an MCP tool, Codex's non-object input).
 * It has no dependencies because the cheap hook handlers read it before
 * anything heavier loads.
 */
export const extractShellCommand = (toolInput: unknown): string | undefined => {
  if (!isRecord(toolInput) || typeof toolInput.command !== 'string') {
    return undefined;
  }
  return toolInput.command;
};

const outputKeys = ['stdout', 'stderr', 'output', 'content', 'result'] as const;

/**
 * The text a finished shell call produced, as the host reports it in Claude's
 * `{stdout, stderr}`, a bare string, or an `output`, `content`, or `result`
 * field. `undefined` when the response carries no text, and the hook then has
 * nothing to look at and fails open.
 */
export const extractShellOutput = (toolResponse: unknown): string | undefined => {
  if (typeof toolResponse === 'string') {
    return toolResponse;
  }
  if (!isRecord(toolResponse)) {
    return undefined;
  }
  const parts = outputKeys.map((key) => toolResponse[key]).filter((value): value is string => typeof value === 'string');
  return parts.length === 0 ? undefined : parts.join('\n');
};
