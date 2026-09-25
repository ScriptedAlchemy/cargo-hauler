import { describe, expect, it } from 'effect-rstest';
import { z } from 'zod';

import * as daemon from '../../src/cli/daemon.js';
import * as haulerAwait from '../../src/mcp/hauler/tools/hauler_await.js';
import * as haulerDashboard from '../../src/mcp/hauler/tools/hauler_dashboard.js';
import * as haulerKill from '../../src/mcp/hauler/tools/hauler_kill.js';
import * as haulerLast from '../../src/mcp/hauler/tools/hauler_last.js';
import * as haulerLog from '../../src/mcp/hauler/tools/hauler_log.js';
import * as haulerRequest from '../../src/mcp/hauler/tools/hauler_request.js';
import * as haulerResult from '../../src/mcp/hauler/tools/hauler_result.js';
import * as haulerStatus from '../../src/mcp/hauler/tools/hauler_status.js';

/**
 * `inputJsonSchema` is the static, data-only copy of a route's zod
 * `inputSchema` that the framework projects into CLI flags and host forms
 * (AB4814/AB4845). The compiler reads it as a literal and never evaluates the
 * zod schema, so the two can drift. This test derives the literal the
 * framework grammar admits (object, `additionalProperties: false`, scalar /
 * enum / array-of-scalar properties, `required`, `description`, `default`) from the zod
 * schema and pins each route's declared copy to it. When a schema changes,
 * paste the printed literal into the route's `defineTool` config (or `config`
 * for the daemon command).
 */
type Scalar = boolean | number | string;
type Metadata = { readonly default?: Scalar | readonly Scalar[]; readonly description?: string };
type Property = Metadata &
  (
    | { readonly type: 'boolean' | 'number' }
    | { readonly type: 'string'; readonly enum?: readonly string[] }
    | { readonly type: 'array'; readonly items: { readonly type: 'boolean' | 'number' | 'string'; readonly enum?: readonly string[] } }
  );

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isScalar = (value: unknown): value is Scalar => ['boolean', 'number', 'string'].includes(typeof value);

const metadata = (node: Record<string, unknown>): Metadata => ({
  ...(typeof node.description === 'string' ? { description: node.description } : {}),
  ...(isScalar(node.default) || (Array.isArray(node.default) && node.default.every(isScalar)) ? { default: node.default } : {}),
});

const scalar = (node: Record<string, unknown>): { readonly type: 'boolean' | 'number' | 'string'; readonly enum?: readonly string[] } => {
  const declared = node.type === 'integer' ? 'number' : node.type;
  if (declared !== 'boolean' && declared !== 'number' && declared !== 'string') {
    throw new TypeError(`unsupported scalar ${JSON.stringify(node)}`);
  }
  return Array.isArray(node.enum) ? { type: declared, enum: node.enum as readonly string[] } : { type: declared };
};

const property = (node: unknown): Property => {
  if (!isRecord(node)) throw new TypeError(`unsupported property ${JSON.stringify(node)}`);
  if (node.type === 'array') {
    return { type: 'array', items: scalar(isRecord(node.items) ? node.items : {}), ...metadata(node) };
  }
  return { ...scalar(node), ...metadata(node) };
};

export const deriveInputJsonSchema = (schema: z.ZodType) => {
  const json = z.toJSONSchema(schema, { io: 'input' });
  if (!isRecord(json.properties)) throw new TypeError('input schema must be an object');
  const properties = Object.fromEntries(Object.entries(json.properties).map(([key, node]) => [key, property(node)]));
  const required = Array.isArray(json.required) && json.required.length > 0 ? { required: json.required } : {};
  return { type: 'object', additionalProperties: false, properties, ...required };
};

const routes = [
  ['src/cli/daemon.ts', daemon.inputSchema, daemon.config.inputJsonSchema],
  ['src/mcp/hauler/tools/hauler_await.tsx', haulerAwait.inputSchema, haulerAwait.default.inputJsonSchema],
  ['src/mcp/hauler/tools/hauler_dashboard.tsx', haulerDashboard.inputSchema, haulerDashboard.default.inputJsonSchema],
  ['src/mcp/hauler/tools/hauler_kill.tsx', haulerKill.inputSchema, haulerKill.default.inputJsonSchema],
  ['src/mcp/hauler/tools/hauler_last.tsx', haulerLast.inputSchema, haulerLast.default.inputJsonSchema],
  ['src/mcp/hauler/tools/hauler_log.tsx', haulerLog.inputSchema, haulerLog.default.inputJsonSchema],
  ['src/mcp/hauler/tools/hauler_request.tsx', haulerRequest.inputSchema, haulerRequest.default.inputJsonSchema],
  ['src/mcp/hauler/tools/hauler_result.tsx', haulerResult.inputSchema, haulerResult.default.inputJsonSchema],
  ['src/mcp/hauler/tools/hauler_status.tsx', haulerStatus.inputSchema, haulerStatus.default.inputJsonSchema],
] as const;

describe('inputJsonSchema mirrors the zod inputSchema', () => {
  for (const [path, inputSchema, inputJsonSchema] of routes) {
    it(path, () => {
      const expected = deriveInputJsonSchema(inputSchema);
      expect(inputJsonSchema, `paste into ${path}: ${JSON.stringify(expected)}`).toEqual(expected);
    });
  }

  it('defaults omitted hauler_log arguments', () => {
    expect(haulerLog.inputSchema.parse(undefined)).toEqual({});
  });
});
