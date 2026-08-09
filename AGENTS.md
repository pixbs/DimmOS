# Codex

## File naming

Component files mix PascalCase (`AdditionalWindow.tsx`) and kebab-case (`title-bar.tsx`) for historical reasons. Existing files keep their names — case-only renames churn git blame and misbehave on case-insensitive filesystems. New files use kebab-case.

## Skills installed

| Skill                  | Trigger                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| `payload`              | Payload CMS collections, fields, hooks, access control, queries          |
| `next-best-practices`  | Writing/reviewing Next.js code — RSC, routing, data fetching, hydration  |
| `react-best-practices` | React performance — re-renders, bundle size, Server Components, Suspense |
| `react-testing`        | Testing React components with Vitest Browser Mode + vitest-browser-react |
| `front-end-testing`    | UI query patterns, userEvent, async assertions, MSW, idempotent tests    |

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

## Testing standards — CRITICAL

Read `docs/testing.md` before adding or changing tests. These rules are mandatory:

1. **Production behavior is the source of truth.** Test valid user and system contracts. Never add a test-only production branch, weaken an optimal implementation, expose internals, or regress behavior just to satisfy a test. If a test and valid production behavior disagree, correct the test. Report a genuine product defect separately before changing production code.
2. **Use the lowest sufficient layer.** Pure deterministic logic belongs in unit tests; rendered UI behavior belongs in Vitest Browser Mode; Payload/database behavior belongs in integration tests; only critical cross-system journeys belong in Playwright E2E. Do not duplicate the same assertions at every layer.
3. **Use the repository harness.** Naming is `*.unit.test.ts`, `*.component.test.tsx`, `*.integration.test.ts`, and `*.desktop|mobile.e2e.test.ts`. Extend the existing fixture, setup, and journey files before creating parallel infrastructure.
4. **Keep tests isolated and repeatable.** No fixed sleeps, automatic retries, skipped CI cases, shared mutable records, order dependence, broad cleanup queries, swallowed waits, or live third-party calls. Use fake clocks for time contracts, MSW/network routes for controlled responses, unique records, and registered ID-specific cleanup.
5. **Test through public behavior.** Prefer accessible roles, labels, names, visible results, URLs, and documented storage/network contracts. Do not use CSS-class selectors or assert React internals. Use a test ID only when semantics cannot uniquely identify the containing surface, then scope accessible queries within it.
6. **Protect database safety.** Integration and E2E commands must run through the Docker harness and disposable PostgreSQL. Never point them at developer data. Permission assertions use `overrideAccess: false`; `overrideAccess: true` is restricted to explicit fixture setup/cleanup.
7. **Preserve the gates.** Do not lower coverage thresholds or add exclusions to make a change pass. `bun run test` and `bun run test:ci` are the same full containerized gate used by GitHub. Every test change must pass its affected suite and the accumulated gate before commit.
