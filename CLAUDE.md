# Claude Code

## Skills installed

| Skill | Trigger |
|-------|---------|
| `payload` | Payload CMS collections, fields, hooks, access control, queries |
| `next-best-practices` | Writing/reviewing Next.js code — RSC, routing, data fetching, hydration |
| `react-best-practices` | React performance — re-renders, bundle size, Server Components, Suspense |
| `react-testing` | Testing React components with Vitest + vitest-browser-react / @testing-library |
| `front-end-testing` | UI query patterns, userEvent, async assertions, MSW, idempotent tests |

## Implementation approach — CRITICAL

Before writing any code:

1. **Find an existing pattern first.** Look for a component or flow that already does something similar. If one exists, reuse or extend it — do not invent a parallel solution.
2. **Do not create new components, hooks, or state until existing ones are ruled out.** If you think you need something new, explicitly state why the existing infrastructure can't handle it.
3. **Flag re-implementations.** If you find yourself duplicating logic that already exists (drag, resize, animation, navigation, close behavior), stop — you're in the wrong place.
4. **Validate placement before implementation.** State exactly where in the file/folder tree the new code will live and what layout or context wraps it. Wrong placement causes cascading complexity.
5. **If your solution touches more than ~3 files or adds more than 1 new component, justify it.** The simpler path is almost always correct — explain why it doesn't work before taking the complex one.

## Schema and migrations — CRITICAL

The `postgresAdapter` in this project uses the default `push` behavior (not set to `false`).

- **Local dev database**: `bun dev` auto-pushes schema changes via Drizzle push. **Never run `bun payload migrate` against the local dev database.** The local DB is always up to date as long as you start `bun dev` after any schema change.
- **CI / production (fresh databases)**: `bun payload migrate` applies all pending migration files in order. This is the ONLY context where `bun payload migrate` should be run.

When adding a new collection, field, or block:
1. Edit the schema (collection/field/block definition)
2. Run `bun generate:types` — regenerates `src/payload-types.ts`
3. Run `bun payload migrate:create` — creates the migration file for CI/production
4. Start `bun dev` — auto-pushes the change to the local DB automatically
