import { describe, expect, it } from 'effect-rstest';
import { z } from 'zod';

import * as daemon from '../../src/cli/daemon.js';
import * as haulerAwait from '../../src/mcp/hauler/tools/hauler_await.js';
import * as haulerKill from '../../src/mcp/hauler/tools/hauler_kill.js';
import * as haulerLast from '../../src/mcp/hauler/tools/hauler_last.js';
import * as haulerLog from '../../src/mcp/hauler/tools/hauler_log.js';
import * as haulerRequest from '../../src/mcp/hauler/tools/hauler_request.js';
import * as haulerResult from '../../src/mcp/hauler/tools/hauler_result.js';
import * as haulerStatus from '../../src/mcp/hauler/tools/hauler_status.js';

/**
 * `config.inputJsonSchema` is the static, data-only copy of a route's zod
 * `inputSchema` that the framework projects into CLI flags and host forms
 * (AB4814/AB4845). The compiler reads it as a literal and never evaluates the
 * zod schema, so the two can drift. This test derives the literal the
 * framework grammar admits (object, `additionalProperties: false`, scalar /
 * enum / array-of-scalar properties, `required`, `description`) from the zod
 * schema and pins each route's declared copy to it. When a schema changes,
 * paste the printed literal into the route's `config`.
 */
type Property =
  | { readonly type: 'boolean' | 'number'; readonly description?: string }
  | { readonly type: 'string'; readonly enum?: readonly string[]; readonly description?: string }
  | { readonly type: 'array'; readonly items: { readonly type: 'boolean' | 'number' | 'string'; readonly enum?: readonly string[] }; readonly description?: string };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const scalar = (node: Record<string, unknown>): { readonly type: 'boolean' | 'number' | 'string'; readonly enum?: readonly string[] } => {
  const declared = node.type === 'integer' ? 'number' : node.type;
  if (declared !== 'boolean' && declared !== 'number' && declared !== 'string') {
    throw new TypeError(`unsupported scalar ${JSON.stringify(node)}`);
  }
  return Array.isArray(node.enum) ? { type: declared, enum: node.enum as readonly string[] } : { type: declared };
};

const property = (node: unknown): Property => {
  if (!isRecord(node)) throw new TypeError(`unsupported property ${JSON.stringify(node)}`);
  const description = typeof node.description === 'string' ? { description: node.description } : {};
  if (node.type === 'array') {
    return { type: 'array', items: scalar(isRecord(node.items) ? node.items : {}), ...description };
  }
  return { ...scalar(node), ...description };
};

export const deriveInputJsonSchema = (schema: z.ZodType) => {
  const json = z.toJSONSchema(schema, { io: 'input' });
  if (!isRecord(json.properties)) throw new TypeError('input schema must be an object');
  const properties = Object.fromEntries(Object.entries(json.properties).map(([key, node]) => [key, property(node)]));
  const required = Array.isArray(json.required) && json.required.length > 0 ? { required: json.required } : {};
  return { type: 'object', additionalProperties: false, properties, ...required };
};

const routes = [
  ['src/cli/daemon.ts', daemon],
  ['src/mcp/hauler/tools/hauler_await.tsx', haulerAwait],
  ['src/mcp/hauler/tools/hauler_kill.tsx', haulerKill],
  ['src/mcp/hauler/tools/hauler_last.tsx', haulerLast],
  ['src/mcp/hauler/tools/hauler_log.tsx', haulerLog],
  ['src/mcp/hauler/tools/hauler_request.tsx', haulerRequest],
  ['src/mcp/hauler/tools/hauler_result.tsx', haulerResult],
  ['src/mcp/hauler/tools/hauler_status.tsx', haulerStatus],
] as const;

describe('inputJsonSchema mirrors the zod inputSchema', () => {
  for (const [path, route] of routes) {
    it(path, () => {
      const expected = deriveInputJsonSchema(route.inputSchema);
      expect(route.config.inputJsonSchema, `paste into ${path}: ${JSON.stringify(expected)}`).toEqual(expected);
    });
  }
});
