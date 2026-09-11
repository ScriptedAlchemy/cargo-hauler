import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'effect-rstest';

/**
 * The ownership boundaries `docs/architecture.md` promises, checked on the
 * value imports of the source tree. Type-only imports are ignored: they cost
 * nothing at run time and the remaining ones are listed as follow-ups there.
 */
const root = fileURLToPath(new URL('../../', import.meta.url));
const src = join(root, 'src');

const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.tsx?$/u.test(entry) && !entry.endsWith('.d.ts')) out.push(path);
  }
  return out;
};

/** Value-import specifiers of one module, relative ones resolved to `src/`-relative extensionless paths. */
const valueImports = (file: string): readonly string[] => {
  const text = readFileSync(file, 'utf8');
  const specifiers: string[] = [];
  for (const match of text.matchAll(/^(?:import|export)\s+(type\s+)?[^'"]*?from\s+['"]([^'"]+)['"]/gmu)) {
    if (match[1] === undefined) specifiers.push(match[2] ?? '');
  }
  for (const match of text.matchAll(/^import\s+['"]([^'"]+)['"]/gmu)) specifiers.push(match[1] ?? '');
  return specifiers.map((spec) =>
    spec.startsWith('.')
      ? posix.normalize(relative(src, join(dirname(file), spec))).replace(/\.js$/u, '')
      : spec,
  );
};

const under = (prefix: string) => (spec: string) => spec.startsWith(prefix);
const bare = (spec: string) => !spec.startsWith('internal/') && !spec.startsWith('.');

const offenders = (files: readonly string[], forbidden: (spec: string) => boolean) =>
  files.flatMap((file) =>
    valueImports(file)
      .filter(forbidden)
      .map((spec) => `${relative(root, file)} -> ${spec}`),
  );

describe('ownership boundaries', () => {
  const internal = walk(join(src, 'internal'));
  const filesUnder = (prefix: string) =>
    internal.filter((file) => relative(src, file).startsWith(prefix));

  it('contracts import only contracts, ndjson, and util', () => {
    const allowed = [under('internal/contracts/'), under('internal/platform/ndjson'), under('internal/util/'), bare];
    expect(
      offenders(filesUnder('internal/contracts/'), (spec) => !allowed.some((ok) => ok(spec))),
    ).toEqual([]);
  });

  it('browser-side code imports no node: module and no daemon, storage, client, or operations code', () => {
    const files = [
      ...filesUnder('internal/ui/dashboard/'),
      ...filesUnder('internal/ui/shared/'),
      join(src, 'internal/integrations/kache/pressure-model.ts'),
    ];
    const forbidden = [
      under('node:'),
      under('internal/daemon/'),
      under('internal/storage/'),
      under('internal/client/'),
      under('internal/operations/'),
      under('internal/host-hooks/'),
      under('internal/ui/documents/'),
    ];
    expect(offenders(files, (spec) => forbidden.some((bad) => bad(spec)))).toEqual([]);
  });

  it('the hook preflights reach neither React nor Effect nor the daemon', () => {
    const seen = new Set<string>();
    const queue = ['events/tool/before.preflight', 'events/tool/after.preflight'];
    while (queue.length > 0) {
      const module = queue.pop() ?? '';
      if (seen.has(module)) continue;
      seen.add(module);
      const file = ['.ts', '.tsx'].map((ext) => join(src, module + ext)).find((candidate) => {
        try {
          return statSync(candidate).isFile();
        } catch {
          return false;
        }
      });
      if (file !== undefined) queue.push(...valueImports(file).filter((spec) => !bare(spec)));
    }
    const heavy = [...seen].filter(
      (module) =>
        module.startsWith('internal/daemon/') ||
        module.startsWith('internal/storage/') ||
        module.startsWith('internal/client/') ||
        module.startsWith('internal/ui/documents/'),
    );
    expect(heavy).toEqual([]);
    const closure = [...seen].flatMap((module) => {
      const file = ['.ts', '.tsx'].map((ext) => join(src, module + ext)).find((candidate) => {
        try {
          return statSync(candidate).isFile();
        } catch {
          return false;
        }
      });
      return file === undefined ? [] : valueImports(file).filter(bare).map((spec) => `${module} -> ${spec}`);
    });
    expect(closure.filter((edge) => /-> (react|effect|@effect\/|agent-bundle$|@agent-bundle\/runtime)/u.test(edge))).toEqual([]);
  });
});
