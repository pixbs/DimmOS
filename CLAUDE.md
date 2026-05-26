# Claude Code

## Skills installed

| Skill | Trigger |
|-------|---------|
| `payload` | Payload CMS collections, fields, hooks, access control, queries |
| `next-best-practices` | Writing/reviewing Next.js code — RSC, routing, data fetching, hydration |
| `react-best-practices` | React performance — re-renders, bundle size, Server Components, Suspense |
| `react-testing` | Testing React components with Vitest + vitest-browser-react / @testing-library |
| `front-end-testing` | UI query patterns, userEvent, async assertions, MSW, idempotent tests |

## Schema and migrations — CRITICAL

The `postgresAdapter` in this project uses the default `push` behavior (not set to `false`).

- **Local dev database**: `bun dev` auto-pushes schema changes via Drizzle push. **Never run `bun payload migrate` against the local dev database.** The local DB is always up to date as long as you start `bun dev` after any schema change.
- **CI / production (fresh databases)**: `bun payload migrate` applies all pending migration files in order. This is the ONLY context where `bun payload migrate` should be run.

When adding a new collection, field, or block:
1. Edit the schema (collection/field/block definition)
2. Run `bun generate:types` — regenerates `src/payload-types.ts`
3. Run `bun payload migrate:create` — creates the migration file for CI/production
4. Start `bun dev` — auto-pushes the change to the local DB automatically
