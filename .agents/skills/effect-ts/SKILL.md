---
name: effect-ts
description: Write or review Effect (v4) code in this repo. Use when changing Effect programs, layers, schema, or tests — not for unrelated TypeScript.
---

# Learning more about Effect

This repository uses the Effect Typescript library. `effect@4.0.0-rc.112` is
already installed as a dependency — do not reinstall or bump it — so the
package source is available at `node_modules/effect/src`.

When writing Effect, read `node_modules/effect/AGENTS.md` for the APIs you need and follow its links when they apply.

If you need to learn more about particular Effect apis and concepts that the
guide doesn't cover, search through the source code in `node_modules/effect/src`.

When the published package is not enough — you need runnable examples, the
`LLMS.md` agent guide, migration docs, or other packages from the Effect
monorepo — use the vendored subtree at `repos/effect`, pinned to the same
`effect@4.0.0-rc.112` tag. It is read-only reference material: never edit it
and never import from it in application code.
