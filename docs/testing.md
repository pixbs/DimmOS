# Repository testing standards

The test suite exists to protect valid production behavior. It must stay deterministic, fast enough for normal development, and identical at the local and GitHub acceptance boundary. Tests must never become a reason to add test-only behavior or replace a better production design with a worse one.

## Choose the lowest sufficient layer

| Layer       | Use it for                                                                                                                                 | Do not use it for                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Unit        | Pure transformations, validation, state transitions, formatting, and deterministic utilities                                               | Rendering, browser APIs, Payload, or PostgreSQL                           |
| Component   | Rendering, focus, keyboard/pointer behavior, browser layout/canvas behavior, error states, and UI requests                                 | Recreating Next.js navigation or Payload internals                        |
| Integration | Payload collections/globals, defaults, validation, access, relationships, hooks, endpoints, content resolution, and PostgreSQL constraints | Pixel/layout assertions or long user journeys                             |
| E2E         | Critical journeys that cross the production Next.js build, browser, API, and database                                                      | Every validation branch or a separate page setup for each small assertion |

Put a behavior in one primary layer. Add coverage at a higher layer only when that layer introduces a distinct risk. E2E tests consolidate related assertions into user journeys to keep setup cost and runtime bounded.

## Files and naming

| Layer       | Pattern                                          |
| ----------- | ------------------------------------------------ |
| Unit        | `tests/unit/<subject>.unit.test.ts`              |
| Component   | `tests/component/<surface>.component.test.tsx`   |
| Integration | `tests/integration/<domain>.integration.test.ts` |
| Desktop E2E | `tests/e2e/<journey>.desktop.e2e.test.ts`        |
| Mobile E2E  | `tests/e2e/<journey>.mobile.e2e.test.ts`         |

Reuse the existing setup, fixtures, stubs, MSW server, and E2E guardrail fixture. Extend a current journey when it shares the same setup and user goal. Create a new file only for a genuinely separate domain or journey.

## Prerequisites and pinned environment

- Bun 1.2.15 for host commands and lockfile verification.
- Docker Desktop installed and its daemon running.
- No local development server or developer database is required for the containerized commands.
- No GitHub secrets, vendor credentials, or third-party availability is required.

The test image pins Playwright 1.58.2 on its Noble image. The disposable database pins PostgreSQL 16.9 on Bookworm. Test-only environment values are safe placeholders. External analytics, email, CAPTCHA, AI, error tracking, and storage behavior is controlled at the network or module boundary.

## Commands

| Command                         | Purpose                                                                   |
| ------------------------------- | ------------------------------------------------------------------------- |
| `bun run test`                  | Exact full containerized local/GitHub gate                                |
| `bun run test:ci`               | Alias of the exact same full gate                                         |
| `bun run test:unit`             | Unit project in Node                                                      |
| `bun run test:component`        | Component project in headless Chromium Browser Mode                       |
| `bun run test:integration`      | Integration project with disposable PostgreSQL                            |
| `bun run test:e2e`              | Seed, production build, Chromium desktop/mobile journeys                  |
| `bun run test:e2e:all-browsers` | Component and E2E matrix on Chromium, Firefox, and WebKit, repeated twice |
| `bun run test:coverage`         | Combined unit/component/integration V8 coverage gate                      |
| `bun run test:watch`            | Unit and component projects in watch mode                                 |
| `bun run typecheck`             | TypeScript without emitting files                                         |

`bun run test` and `bun run test:ci` intentionally execute the same script. The full gate:

1. Creates a unique Docker Compose project and disposable PostgreSQL database.
2. Verifies the database host and test-only name before applying migrations.
3. Runs lint and typecheck.
4. Runs unit and component suites twice with zero retries.
5. Runs Payload integration tests and combined coverage.
6. Seeds deterministic E2E content, creates a production Next.js build, and starts `next start` itself.
7. Runs Chromium desktop and mobile journeys with one worker and zero retries.
8. Removes test containers, networks, and volumes after success, failure, or interruption.

GitHub runs this full gate for every push and pull request. At 03:00 UTC, the nightly workflow runs component and E2E coverage on Chromium, Firefox, and WebKit with repeat execution and zero retries. Reports under `artifacts/` are uploaded even when a job fails.

## Determinism and isolation

- Use fake clocks when time is part of the contract. Restore real time after the test.
- Use unique values for every record. Integration helpers provide `uniqueValue()` for this purpose.
- Register cleanup as soon as a fixture is created. Delete only the recorded ID; never issue an unscoped or broad cleanup query.
- Do not share mutable records between tests or depend on file/test execution order.
- A test must pass alone, in the accumulated suite, in a different order, and on repeat execution.
- Do not use fixed sleeps. Wait for an observable state with framework auto-waiting, `expect.poll`, or a specific request/response.
- Do not swallow a rejected wait or catch an assertion merely to continue.
- Do not add retries, CI-only skips, conditional assertions, or larger timeouts to hide nondeterminism.
- Keep worker counts and parallelism explicit where shared framework state makes concurrency unsafe.

## Component tests

Component tests use Vitest Browser Mode with `vitest-browser-react`, a real Playwright browser, and `vitest/browser` user interactions. jsdom and React Testing Library are not part of this repository.

- Render the production component and interact as a user would.
- Prefer roles, accessible names, labels, and focus assertions.
- Use MSW to control browser requests at the network boundary, including success and failure responses.
- Assert the visible result of an interaction, not handler invocation or React state.
- Use the shared browser setup for cleanup, observers, storage, and deterministic platform APIs.
- Keep layout/canvas fixtures portable across Chromium, Firefox, and WebKit.

## Payload and database safety

Integration tests use one shared Payload fixture per process and real PostgreSQL behavior. The Docker entrypoint refuses to proceed unless all of these are true:

- `DIMMOS_TEST_RUN` is exactly `true`.
- `DATABASE_URL` points to `postgres`, `127.0.0.1`, or `localhost`.
- The connected database name contains a distinct `test` segment.
- PostgreSQL confirms the expected current database.

Use `getTestPayload()` rather than creating parallel Payload instances. Use `trackDocument()` or `registerCleanup()` immediately after fixture creation. Cleanup runs in reverse registration order so relationships can be removed safely.

Permission assertions must pass `overrideAccess: false` and the appropriate user or anonymous request. `overrideAccess: true` is restricted to deliberate fixture setup and ID-specific teardown; it is not evidence that access control works.

The local development database uses Payload/Drizzle push through `bun dev`. Never run `bun payload migrate` against it. The test harness and CI apply migrations only to a fresh disposable database, matching the production migration path without risking developer data.

## E2E contracts and network guardrails

E2E tests import `test` and `expect` from `tests/e2e/test.ts`, never directly from `@playwright/test`. The automatic fixture fails a test after any unexpected external request, uncaught page error, or unapproved browser warning/error. Add an allowed browser message only when the message is an intentional product contract and explain why locally in the test.

- Navigate through the production build started by Playwright; never reuse an already-running development server.
- Use roles, names, labels, and user-visible text. A test ID may identify a semantically ambiguous container, after which queries must be scoped to accessible elements within it.
- Assert URLs, documented `data-state` attributes, storage contracts, network payloads, and user-visible outcomes.
- Do not select by CSS class, depend on Tailwind output, inspect React internals, or use implementation-only event hooks.
- Mock controlled vendor behavior with Playwright routes. Never send email, analytics, CAPTCHA, AI, Sentry, or other third-party traffic.
- Seed deterministic application data once for the journey database and use unique records for mutations performed by tests.
- Keep desktop and mobile behavior in their matching project files. Cross-browser projects reuse the same journeys; browser-specific skips are not permitted.

## Coverage policy

V8 coverage is generated from the accumulated unit, component, and integration suites. The enforced global thresholds are:

| Metric     | Global | Per file |
| ---------- | -----: | -------: |
| Lines      |    90% |      70% |
| Statements |    90% |      70% |
| Functions  |    90% |      70% |
| Branches   |    85% |      60% |

The explicit scope in `vitest.config.ts` covers applicable application-owned logic. Numeric coverage excludes generated Payload types/schema, migrations, operational scripts, tests, and framework bootstrap wrappers. Those exclusions are about measurement quality, not untested behavior: migrations, bootstrap, and complete application journeys are validated through integration, build, or E2E execution.

Do not lower a threshold, remove an application module from scope, or add an exclusion to make a change pass. If a module cannot produce meaningful V8 instrumentation, document the reason and cover its behavior at the appropriate integration or E2E boundary. Coverage percentage is a floor, not a substitute for meaningful assertions.

## Locators and assertions

Preferred order:

1. `getByRole()` with a stable accessible name.
2. `getByLabel()` or `getByPlaceholder()` for authored form controls.
3. Stable user-visible text within an already scoped surface.
4. A documented test ID only to disambiguate a container with no unique semantic identity.

Assert behavior: focus moved, a control became enabled, content rendered, a URL changed, a database constraint rejected invalid input, an audit record was created, or a public state contract changed. Avoid snapshots of large DOM trees, CSS-class assertions, private function spies, and assertions that merely restate the implementation.

## Debugging failures and flakiness

Generated reports are kept under:

- `artifacts/coverage/` — V8 HTML, JSON, and LCOV.
- `artifacts/vitest/` — JUnit and Browser Mode screenshots.
- `artifacts/playwright/html/` — Playwright HTML report.
- `artifacts/playwright/results/` — retained failure traces, screenshots, and video.
- `artifacts/playwright/junit.xml` — E2E JUnit output.

Start with the smallest affected public command, then run `bun run test` before committing. For browser-only inconsistencies, run `bun run test:e2e:all-browsers`; it repeats every supported engine and exposes timing or capability assumptions without retries.

When a test fails intermittently:

1. Identify the missing observable state or leaked shared state.
2. Inspect the trace, browser console guardrail output, and network log.
3. Replace timing assumptions with a specific state transition or response.
4. Make fixture ownership and cleanup explicit.
5. Repeat the affected suite and then the full gate.

Never “fix” flakiness by adding a sleep, retry, skip, broad timeout increase, or test-only production condition.

## Review checklist

- The assertion represents valid production behavior and would catch a meaningful regression.
- The selected layer is the lowest one that proves the contract.
- Existing fixtures and journeys were extended instead of duplicated.
- Success, failure, permissions, and edge behavior are covered where they matter.
- Records and storage are unique and cleanup is ID-specific.
- Requests are controlled and no third party can be reached.
- Locators are accessible and assertions avoid implementation details.
- The test passes alone, repeatedly, and as part of the accumulated gate.
- Coverage thresholds and scope remain intact.
- No production behavior was weakened to make the test pass.
