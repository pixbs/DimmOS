# Dimm OS — Portfolio Website

Interactive OS-style portfolio built on Next.js + Payload CMS. The UI metaphor is a desktop operating system: a shortcut grid on the "desktop", content that opens in windows (desktop) or bottom-sheet drawers (mobile), routes that are fully server-rendered for SEO but behave like a single-page application.

---

## Stack

| Layer | Package | Version |
|---|---|---|
| Framework | Next.js | 16.2.3 |
| React | react / react-dom | 19.2.4 |
| CMS | Payload CMS | 3.84.1 |
| Database | PostgreSQL via `@payloadcms/db-postgres` | — |
| Rich text | `@payloadcms/richtext-lexical` | — |
| Forms | `@payloadcms/plugin-form-builder` | — |
| Email | `@payloadcms/email-resend` | — |
| Styling | Tailwind CSS | 4.2.4 |
| Icons | Remixicon | 4.9.1 |
| Analytics | `@posthog/next` | — |
| Error tracking | `@sentry/nextjs` + `@payloadcms/plugin-sentry` | — |
| E2E tests | Playwright | 1.58.2 |
| Unit/int tests | Vitest | 4.0.18 |
| Runtime | Bun | — |

---

## Project structure

```
src/
├── app/
│   ├── (frontend)/              # Public-facing routes
│   │   ├── layout.tsx           # Root layout: Header + CookieConsentProvider + CookieBanner + shortcuts grid
│   │   ├── page.tsx             # Homepage shell (shortcuts rendered in layout)
│   │   ├── (pages)/             # Routes that open inside PageDrawer
│   │   │   ├── layout.tsx       # Wraps children in <PageDrawer>
│   │   │   ├── [slug]/          # /[slug] — dynamic: windows → articles → forms (listings are articleList blocks)
│   │   │   └── cookie-preferences/  # /cookie-preferences — consent management
│   │   └── test/                # /test — drawer interaction playground
│   └── (payload)/               # Payload admin + REST/GraphQL API
├── collections/
│   ├── Users.ts                 # Auth collection
│   ├── Media.ts                 # Uploads with alt text
│   ├── Windows.ts               # General content pages (about, contact, welcome) + content blocks
│   ├── Articles.ts              # Portfolio case studies + service descriptions; type: 'case-study' | 'service'
│   ├── CookieServices.ts        # Cookie service catalogue
│   └── CookieConsents.ts        # Consent audit log (write-protected, custom endpoint)
├── fields/
│   ├── contentBlocks.ts         # Shared blocks field: richText, image, gallery, embed, cta, articleList
│   ├── slugField.ts             # createSlugField() factory + validateSlug (shared by all content collections)
│   ├── shortcutFields.ts        # createShortcutFields() factory (Shortcut tab on all content collections)
│   └── windowBehavior.ts        # Window tab fields (chrome + toolbar flags)
├── globals/
│   └── CookieSettings.ts        # Banner copy + consentVersion
├── actions/
│   └── getWindowContent.ts      # 'use server' re-export of fetchWindowContent
├── lib/
│   ├── windowContent.ts         # server-only: unstable_cache fetch; WindowContentResult type; resolveBlocks
│   ├── articleList.ts           # server-only: fetchArticleList — single source for articleList block queries
│   ├── window-promise-cache.ts  # Client promise cache: seeding, rejection eviction, evict-on-close
│   ├── window-positions.ts      # localStorage persistence for panel geometry + parsePx/clamp
│   ├── window-drag.ts           # startPanelDrag — shared desktop drag-to-move
│   ├── window-state.ts          # ManagedWindow type + sessionStorage open-window persistence
│   └── breakpoints.ts           # DESKTOP_BREAKPOINT (1024) + isDesktopViewport()
├── components/
│   ├── drawer/                  # Drawer system (see mechanics below)
│   ├── cookie-banner/           # Consent banner + context
│   ├── header/                  # Logo + Clock
│   ├── preloader/               # Boot preloader progress bar + context
│   ├── shortcut/                # Desktop icon tiles
│   ├── form/                    # Dynamic form renderer (typed from generated Form)
│   ├── taskbar/                 # Desktop taskbar (window list)
│   ├── content-blocks/          # THE block renderer: server switch + pure per-block views (views.tsx)
│   ├── window/
│   │   ├── AdditionalWindow.tsx         # Floating window: owns history stack, content loading, animations
│   │   ├── WindowManagerProvider.tsx    # Mounts pre-rendered + on-demand windows; renders Taskbar
│   │   ├── WindowToolbar.tsx            # Toolbar UI (back/forward, search, grid/table toggle)
│   │   ├── window-toolbar-context.tsx   # WindowToolbarProvider + useWindowToolbar()
│   │   ├── title-context.tsx            # Per-route title + chrome flags + toolbar flags (SetWindowOptions / SetWindowToolbar)
│   │   ├── title-bar.tsx                # Window chrome: traffic-light buttons + drag handle
│   │   ├── manager-context.tsx          # useWindowManagerContext() (open/close/focus/minimize)
│   │   ├── content-view.tsx             # Client renderer: use(promise) + shared block views
│   │   ├── content-error-boundary.tsx   # BSOD-styled fallback + Retry for failed content loads
│   │   └── ResizeHandles.tsx            # E / S / SE resize handles with pointer capture
│   ├── window-content/          # Thin wrapper: WindowContent → content-blocks
│   └── article-content/         # Thin wrapper: ArticleContent (header) → content-blocks
├── hooks/
│   ├── useWindowManager.ts      # Window open/close/focus/minimize state
│   ├── useIsDesktop.ts          # Tri-state (null/false/true) viewport hook
│   ├── revalidateContent.ts     # createRevalidationHooks() — shared afterChange/afterDelete revalidation
│   ├── cookies/captureRequestMetadata.ts
│   └── forms/verifyRecaptcha.ts
└── migrations/                  # Auto-generated Payload migrations
```

---

## Architecture principles

**Server-first.** All data fetching happens in Server Components (`async` functions that call `getPayload()`). Client Components receive already-fetched data as props. No client-side data fetching except for the cookie consent version check and audit log POST.

**Routes as drawers.** Every sub-page lives under the `(pages)` route group and is wrapped by a `PageDrawerShell`. Navigating to a content slug (e.g. `/about`) or `/cookie-preferences` does not do a full page reload — the URL changes and the drawer slides up from the bottom (mobile) or opens as a floating window (desktop). Listing pages are `articleList` blocks inside Windows documents, not dedicated routes.

**Payload schema = source of truth.** TypeScript types are generated from the Payload config (`bun generate:types`). Never hand-write types that mirror the schema. Never hand-write migration SQL — run `bun payload migrate:create` and let Payload diff the schema.

**Consent-first analytics.** Google Consent Mode v2 defaults all signals to `denied` before hydration (`/public/consent-init.js` loaded via `<Script strategy="beforeInteractive">`). Signals are updated when `saveConsent()` is called.

**Type safety workflow.** Run `bun generate:types` after every schema change. The output file `src/payload-types.ts` is the single source of TypeScript truth for all collection and global shapes. Never declare collection-mirroring interfaces by hand. Generated types are imported by both application code and integration tests.

**`req` threading and hook safety.** Always pass `req` in nested Local API calls inside hooks — this keeps all reads and writes within the same Postgres transaction and prevents partial writes on error. See `src/hooks/forms/enforcePreDefinedEmail.ts` as the canonical example: `req.payload.findByID({ ..., req })`. Use `req.context.skipHooks = true` before a Local API call inside an `afterChange` hook when you need to prevent re-entry. Reset to `false` after the call.

**Access control defaults.** All collections default to admin-only access. Public read is explicitly enabled per-collection only when the frontend requires it (`windows`, `articles`, `cookie-services`, `cookie-settings`; `forms` is public-read via the form-builder plugin default). Every application Server Component read passes `overrideAccess: false` so real access control is always enforced. Use `overrideAccess: false` in integration tests to verify real access control; use `overrideAccess: true` only in test setup/teardown and the custom `/record` endpoint. Never use `overrideAccess: true` (or rely on the implicit default bypass) in application Server Components.

---

## Window content fetching

Three layers cooperate to serve window content; each exists for a different reason:

1. **Server cache** — `fetchWindowContent(slug)` in `src/lib/windowContent.ts` is wrapped in `unstable_cache` (tag `window-content`, per-slug keying via the function argument). CMS saves invalidate it through the shared revalidation hooks (`src/hooks/revalidateContent.ts`).
2. **Server action transport** — `src/actions/getWindowContent.ts` re-exports the fetcher as a `'use server'` action so the client can request content for on-demand windows. This is deliberately a POST-for-reads tradeoff: shortcut windows are SSR-preloaded and results are cached on both ends, so only the *first* open of a non-shortcut window pays one POST. Revisit as a GET route handler only if window-open latency becomes a measured problem.
3. **Client promise cache** — `src/lib/window-promise-cache.ts` holds one promise per slug for the session. Reliability rules:
   - A **rejected** promise evicts itself (identity-guarded), so the next open retries instead of replaying the failure all session.
   - **Closing a window evicts its history stack**, so reopening refetches fresh data; preloaded shortcut roots re-seed from SSR data on the next render and stay instant.
   - `ContentErrorBoundary` (BSOD-styled, with Retry) wraps every `ContentView`, so a failed load never leaves a stuck Suspense fallback.

---

## Drawer system

Two drawer variants share the same `DrawerContext` (`{ open, close }`).

### 404 window

When a user navigates to a non-existent route, `notFound()` is called in `[slug]/page.tsx`. Next.js renders `src/app/(frontend)/not-found.tsx`, which queues a deferred window open for the failed slug and immediately redirects to `/`. The HTTP 404 status code is returned by the server before the client redirect, so SEO crawlers see the correct status.

On **desktop**, once the redirect completes the window manager opens the failed slug as a standard `AdditionalWindow` (draggable, resizable, taskbar entry, all built-in behaviors). Payload returns `null` for the unknown slug, so `ContentView` renders the BSOD-styled null-content view inside the window chrome.

On **mobile** (no window system), `not-found.tsx` renders a full-page BSOD overlay while the redirect is in flight.

**Styled as a branded BSOD:** brand-red (`#F22F57`) background, monospace font, uppercase layout, with the failed route path displayed.

**Key files:**
- `src/app/(frontend)/not-found.tsx` — calls `manager.openDeferred(slug)` + `router.replace('/')` on all viewports; renders `lg:hidden` mobile BSOD overlay
- `src/components/window/content-view.tsx` — `data === null` branch renders the BSOD content

**Window manager API:**
- `manager.openDeferred(slug)` — queues `slug` to open as an on-demand window once `realPrimarySlug` clears (after the redirect). Uses a `[pendingOpen, realPrimarySlug]` effect so the window isn't immediately removed by Effect 3's primary-clear logic.

**Taskbar:** windows without a CMS registry entry (including any 404'd slug) appear with `ri-error-warning-fill` and brand-red color. The window's `rootSlug` is the literal failed path segment (e.g. `asdasd`).

---

### DrawerShell — generic bottom sheet
- Used by: `CookieBanner`, the `/test` page demo
- CSS: `translate-y-full` (closed) → `translate-y-0` (open)
- Dismiss: drag > 40% panel height, Escape key, backdrop click
- z-index: dialog at z-50, backdrop at z-40

### PageDrawerShell — route-based full-height drawer
- Used by: all routes under `(pages)/`
- Auto-navigates to `/` on close via `router.push('/')`
- Sets `document.body.dataset.pageDrawer` = `open | closed | dragging`
- Sets `document.body.style.--drawer-open-pct` CSS variable during drag (usable for background color lerp)
- Dismiss threshold: 25% panel height (smaller than generic)

### Testing drawers
Playwright cannot use `toBeVisible()` for drawer closed state because CSS transforms don't remove elements from the accessibility tree. Use class assertions:
```ts
await expect(el).toHaveClass(/translate-y-0/)   // open
await expect(el).toHaveClass(/translate-y-full/) // closed
```

Use `data-testid="page-drawer"` (set on `PageDrawerShell`) rather than `[role="dialog"]` in Playwright selectors — both `PageDrawerShell` (z-30) and `DrawerShell` / cookie banner (z-50) have `role="dialog"`, causing Playwright strict-mode violations if you target by role alone.

---

## Cookie consent system

**Storage:** `localStorage['cookie-consent']` — `{ consentId, categories, timestamp, version }`

**Valid if:** present + not older than 6 months + `version` matches `CookieSettings.consentVersion`

**Flow:**
1. `CookieConsentProvider` mounts → reads localStorage → fetches `/api/globals/cookie-settings?depth=0`
2. If invalid → `needsBanner = true` → `CookieBanner` auto-opens
3. User picks Accept All / Reject / Configure
4. `saveConsent(categories)`:
   - generates new `crypto.randomUUID()` (every consent event is a distinct audit record)
   - writes localStorage
   - POSTs to `/api/cookie-consents/record` (audit log, IP + UA captured server-side)
   - fires `window.gtag('consent', 'update', {...})`
5. To re-ask all visitors: bump `consentVersion` in Payload admin

**Audit endpoint:** `POST /api/cookie-consents/record` — uses `overrideAccess: true` internally; direct `create` access is blocked (`create: () => false`).

---

## Payload collections & globals

| Slug | Type | Access |
|---|---|---|
| `users` | Auth | Admin only |
| `media` | Upload | Read: public; write: admin |
| `windows` | General content pages (about, contact, welcome) + content blocks | Read: public; write: admin |
| `articles` | Portfolio case studies + service descriptions; `type: 'case-study' \| 'service'`; section blocks, `year`, `tags`, `bgImage`/`fgImage` | Read: public; write: admin |
| `tags` | Reusable labels for articles (shown in the Works table) | Read: public; write: admin |
| `forms` | Form-builder plugin collection (contact etc.) | Read: public (plugin default); write: admin |
| `form-submissions` | Form-builder plugin collection | Create: public; read: admin (plugin default) |
| `cookie-services` | Service catalogue | Read: public; write: admin |
| `cookie-consents` | Audit log | Create: endpoint only; read/update/delete: admin |
| `cookie-settings` (global) | Config | Read: public; update: admin |

**Windows and Articles** share a `content` blocks field built by `createContentBlocksField()` in `src/fields/contentBlocks.ts`: `richText`, `articleList` (Works), and the case-study section blocks `summary`, `stats`, `imageSection`, `description`, `sectionTitle`; Articles additionally get the doc-image-backed `hero`. The `articleList` block queries articles by `type` at render time (server-side via `resolveBlocks` in `src/lib/windowContent.ts`), resolving each article's cover images, tags, and year, and passes a resolved `articles` array to the client; it never fetches on the client. Both collections have `afterChange`/`afterDelete` hooks that call `revalidateTag('window-content')` + `revalidatePath` for instant cache busting on save. See [Content section blocks & scroll animations](#content-section-blocks--scroll-animations) for the full set.

**Window toolbar fields** (`windowDisplaySearch`, `windowDisplayViewToggle`, `windowDefaultView`, `windowDisplayHistory`) are on all three collections via `windowBehaviorFields`. See [Phase 2.5](#25-window-toolbar--search-view-toggle-in-window-history) for architecture details.

**Querying conventions:**
- Always pass `select` to limit returned fields in listing queries. Use `as const` so TypeScript infers literal `true` values required by Payload's `select` type.
- Use `depth: 0` for listing queries where only IDs are needed; `depth: 1` when one level of relationship population is required. Set it explicitly — never rely on Payload's default of 1.
- Index all fields used in `where` clauses. `slug` on Windows, Articles, and Forms has `index: true`; `type` on Articles has `index: true`. Follow the same pattern for any `status` or `category` selector fields added in future collections.

---

## Testing

```
bun test:int     # Vitest — tests/int/**/*.int.spec.ts
bun test:e2e     # Playwright — tests/e2e/**/*.e2e.spec.ts
```

**Vitest config:** `environment: 'node'`, `pool: 'forks'`. The `forks` pool is required because Payload config uses `fileURLToPath(import.meta.url)` which breaks under Vite's SSR transform in the default `threads` pool.

**E2E config:** Chromium only; reuses a running dev server (`reuseExistingServer: true`); drawer state tested via class assertions not visibility checks.

| File | What it covers |
|---|---|
| `tests/int/cookie-consents.int.spec.ts` | Hook unit test, consent creation, access control, unique constraint |
| `tests/int/cookie-services.int.spec.ts` | Service creation, public read, admin-only write |
| `tests/int/cookie-manifest.int.spec.ts` | All manifest entries seed correctly and are publicly readable |
| `tests/int/windows.int.spec.ts` | Window creation with each block type, optional content, access control |
| `tests/int/articles.int.spec.ts` | Article creation, type discriminator (`case-study`/`service`), slug uniqueness, access control |
| `tests/int/windows-revalidation.int.spec.ts` | `revalidatePath` called on `afterChange`/`afterDelete`; `skipHooks` re-entry guard |
| `tests/e2e/cookie-banner.e2e.spec.ts` | Full consent flow: first visit, accept, reject, configure, preferences, update |
| `tests/e2e/admin.e2e.spec.ts` | Admin login, dashboard, list view, edit view |
| `tests/e2e/frontend.e2e.spec.ts` | Homepage title + load |
| `tests/e2e/windows.e2e.spec.ts` | Navigating to a window slug opens PageDrawer; richText block renders |
| `tests/e2e/works.e2e.spec.ts` | articleList-block listing window: PageDrawer open, article card visible, clicking card navigates to detail |
| `tests/e2e/analytics.e2e.spec.ts` | PostHog consent gating (opted in/out via `ph_*` localStorage); cookie audit (no undeclared keys); services API |

**Integration test access control pattern.** Always pass `overrideAccess: false` together with a `user` object to exercise real access control. Use `overrideAccess: true` only in test setup/teardown helpers. See `tests/int/cookie-services.int.spec.ts` — setup uses `overrideAccess: true` and assertions use `overrideAccess: false` — as the model to follow.

---

## Local setup

```bash
cp .env.example .env   # fill DATABASE_URL, PAYLOAD_SECRET, RESEND_API_KEY, RECAPTCHA_SECRET_KEY
bun install
bun dev                # starts Next.js dev server + Payload admin at http://localhost:3000
```

First boot: create admin user at `http://localhost:3000/admin`.

---

## Quality Standards

These rules apply to every task in the roadmap. A checklist item is not done until all of them pass.

### Server-first rules

| Scenario | Correct approach |
|---|---|
| Read collection data for rendering | `async` Server Component calling `getPayload()` |
| Read a global for rendering | `async` Server Component calling `payload.findGlobal()` |
| Submit a form / mutation | Client Component POSTing to a custom Payload endpoint |
| Cookie consent version check | Client fetch to `/api/globals/cookie-settings?depth=0` (existing, only permitted case) |
| Any other client-side fetch | Requires explicit justification — default is no |

Never call `getPayload()` inside a Client Component (`'use client'`). Never use SWR, React Query, or `useEffect`-based fetching for content available at request time.

### Type safety workflow

1. Edit collection or global config
2. Run `bun generate:types` — overwrites `src/payload-types.ts`
3. Run `bun generate:importmap` if admin UI imports changed
4. Fix any TypeScript errors before committing
5. Commit `src/payload-types.ts` alongside the config change

Never edit `src/payload-types.ts` by hand.

### Migration workflow

The `postgresAdapter` uses default `push` behavior. Two distinct modes:

**Local dev database** — `bun dev` auto-pushes schema changes via Drizzle push on startup. Never run `bun payload migrate` against your local dev database.

**CI / production (fresh databases)** — `bun payload migrate` applies all pending migration files in sequence before starting the server.

Steps when changing any collection, global, or field:
1. Edit the config
2. Run `bun payload migrate:create` — Payload diffs the DB schema and emits a migration file under `src/migrations/`
3. Review the generated SQL before committing
4. Start `bun dev` — the local DB is updated automatically on startup
5. In CI/production: run `bun payload migrate` against a fresh database **before** starting the server

Never write migration SQL by hand.

### Hook safety rules

| Hook timing | Purpose | Key constraint |
|---|---|---|
| `beforeValidate` | Normalise / format incoming data | Do not call Local API here |
| `beforeChange` | Business logic, lookups, guards | Thread `req`; throw to abort the operation |
| `afterChange` | Side effects: cache revalidation, notifications | Pass `req`; use `req.context.skipHooks` guard |
| `afterDelete` | Side effects on deletion | Same as `afterChange` |

Always pass `req` to nested Local API calls inside hooks:

```ts
// Correct — shares the active Postgres transaction
await req.payload.findByID({ collection: 'forms', id, req })

// Wrong — opens a new connection outside the transaction
const p = await getPayload({ config })
await p.findByID({ collection: 'forms', id })
```

Prevent infinite `afterChange` loops with the context pattern:

```ts
afterChange: [async ({ req, doc }) => {
  if (req.context.skipHooks) return
  req.context.skipHooks = true
  await req.payload.update({ collection: 'windows', id: doc.id, data: {}, req })
  req.context.skipHooks = false
}]
```

### Access control defaults

- New collections: all operations default to `() => !!user` (admin only)
- Selectively open `read` to `() => true` only when the frontend requires unauthenticated read
- Custom endpoints that bypass access control must enforce their own input validation — never skip validation entirely

### Performance defaults

For every `payload.find()` call:
- Set `select` to include only fields the caller uses
- Set `depth` explicitly (not relying on Payload's default)
- Add `limit` when the collection can have unbounded documents
- Index all fields used in `where` clauses (`index: true` on the field definition)

### TDD definition of done

Each feature is not done until:

- [ ] Integration test covers: happy path, access control rejection, any unique constraint, any hook side effect
- [ ] `bun test:int` passes with zero skipped tests
- [ ] E2E test covers: the primary user flow end-to-end, drawer/window open state (via class assertion), and at least one error/empty state
- [ ] `bun test:e2e` passes against a running dev server
- [ ] `bun run build` passes (no TypeScript errors)
- [ ] `bun generate:types` has been run and `src/payload-types.ts` is committed

### Quality gate between phases

Before starting the next phase:
- `bun test:int && bun test:e2e && bun run build` all green
- No `TODO` or `as any` cast introduced without a tracking issue
- `src/payload-types.ts` is committed and up to date

---

---

# Roadmap

Each task follows TDD order: write integration test → implement schema/hook → write E2E test → implement UI. The Quality Standards section above defines when a task is done. Phases are ordered by dependency.

---

## Phase 0 — CI and developer tooling

Must be completed before merging any Phase 1 work to main.

### 0.1 GitHub Actions CI pipeline

- [x] Create `.github/workflows/ci.yml` with steps in order:
  1. `bun install --frozen-lockfile`
  2. `bun run build` — fails the workflow if TypeScript or Next.js compilation errors exist
  3. Start a PostgreSQL service container (`postgres:16`; set `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`)
  4. Run `bun payload migrate` against the CI database
  5. `bun test:int`
  6. Start `bun start` as a background step; wait for port 3000
  7. `bun test:e2e`
- [x] Fix `playwright.config.ts` `webServer` for CI:
  ```ts
  webServer: {
    command: process.env.CI ? 'bun start' : 'bun run dev',
    reuseExistingServer: !process.env.CI,
    url: 'http://localhost:3000',
  }
  ```
  (`forbidOnly: !!process.env.CI` and `retries: process.env.CI ? 2 : 0` are already set.)
- [x] Add required CI secrets: `DATABASE_URL`, `PAYLOAD_SECRET`, `RECAPTCHA_SECRET_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

**Tests required:** the CI workflow itself; it must exit 0 on a clean main branch.

**Quality gate:** main branch stays green; PRs blocked on failure.

---

## Phase 1 — Content architecture

Windows and Works have slugs and shortcut metadata but no content. This phase adds content blocks and wires up cache revalidation immediately so production never serves stale data.

### 1.1 Decide collection structure

- [x] **Decision: Option B — Merged into `Articles`.** Single collection with `type: 'case-study' | 'service'`. `Works` collection removed; existing Works data dropped via Payload migration (no production data at decision time). See `src/collections/Articles.ts`.

### 1.2 Content blocks field

- [x] Write `tests/int/windows.int.spec.ts` — Window creation with each block type, optional content, access control
- [x] Create `src/fields/contentBlocks.ts` — content blocks shared by Windows and Articles
- [x] Add the blocks field to `Windows.ts` and `Articles.ts`
- [x] Run `bun generate:types` → `bun payload migrate:create` → `bun payload migrate`
- [x] `bun test:int` — new tests pass

> **Superseded (article-sections branch):** the original `image`/`gallery`/`embed`/`cta`
> blocks were removed and replaced by the case-study section blocks, and
> `contentBlocksField` became the `createContentBlocksField({ article })` factory
> (so Articles also get the Hero block). See
> [Content section blocks & scroll animations](#content-section-blocks--scroll-animations)
> for the current block set, fields, and seeds.

### 1.3 On-demand cache revalidation

Revalidation lands here alongside content blocks so that admin saves immediately invalidate the Next.js cache in production without a redeploy.

- [x] Write `tests/int/windows-revalidation.int.spec.ts` — `revalidatePath` called on `afterChange`/`afterDelete`; `skipHooks` re-entry guard verified
- [x] Add `afterChange` + `afterDelete` hooks to `Windows.ts` and `Articles.ts`:
  - `revalidatePath` wrapped in `try/catch` so test-runner seed calls (outside Next.js context) don't throw "static generation store missing"
  - `Articles.ts` also revalidates `/works` and `/services`
- [x] `bun test:int` — revalidation tests pass

### 1.4 Welcome Window

- [x] Extend `tests/int/windows.int.spec.ts` — seed a Window with a `RichTextBlock`; assert `content[0].blockType === 'richText'`
- [x] Create `src/components/window-content/index.tsx` — Server Component; renders blocks via the shared `ContentBlocks` renderer (`src/components/content-blocks/`), which switches on `block.blockType` and emits `data-block-type` attributes for test targeting
- [x] Create `src/components/article-content/index.tsx` — same pattern typed with `Article`
- [x] Write `tests/e2e/windows.e2e.spec.ts`:
  - Navigate to seeded window slug; assert `[data-testid="page-drawer"]` has class `translate-y-0`
  - Assert `[data-block-type="richText"]` is visible
  - Uses `page.addInitScript()` to seed cookie consent in localStorage before navigation (prevents cookie banner overlay)

### 1.5 Works listing page (`/works`)

- [x] Write `tests/e2e/works.e2e.spec.ts`:
  - Navigate to `/works`; assert PageDrawer open (`translate-y-0`)
  - Assert ≥ 1 article card is visible (seeded `type: 'case-study'` article in `beforeAll`)
  - Assert clicking a card navigates to `/{slug}` and detail drawer opens
- [x] Replace placeholder copy in `src/app/(frontend)/(pages)/works/page.tsx`:
  - `payload.find({ collection: 'articles', where: { type: { equals: 'case-study' } }, select: { title: true, slug: true, shortcutIcon: true } as const, depth: 0, limit: 24 })`
  - Renders a grid of article cards (Server Components, no `'use client'`)
- [x] Update `generateStaticParams` in `src/app/(frontend)/(pages)/[slug]/page.tsx` — covers windows + articles + forms:
  ```ts
  const [windows, articles, forms] = await Promise.all([
    payload.find({ collection: 'windows',  select: { slug: true } as const, limit: 200, depth: 0 }),
    payload.find({ collection: 'articles', select: { slug: true } as const, limit: 200, depth: 0 }),
    payload.find({ collection: 'forms',    select: { slug: true } as const, limit: 200, depth: 0 }),
  ])
  ```

### 1.6 Services page

- [x] Filter Articles by `type: 'service'` — no separate collection needed; `Articles.ts` is the single source
- [x] Create `src/app/(frontend)/(pages)/services/page.tsx` mirroring works/page.tsx with `where: { type: { equals: 'service' } }`
- [x] Integration test coverage: `tests/int/articles.int.spec.ts` covers `type: 'service'` creation and access control
- [ ] Write `tests/e2e/services.e2e.spec.ts` mirroring `works.e2e.spec.ts`

**Tests required for Phase 1:**
- `tests/int/windows.int.spec.ts` ✓
- `tests/int/articles.int.spec.ts` ✓ (replaces `works.int.spec.ts`; Articles collection replaced Works)
- `tests/int/windows-revalidation.int.spec.ts` ✓
- `tests/e2e/windows.e2e.spec.ts` ✓
- `tests/e2e/works.e2e.spec.ts` ✓

**Quality gate:** `bun test:int && bun test:e2e && bun run build` pass; `src/payload-types.ts` committed. ✓ **All gates green.**

---

## Phase 2 — Desktop window system

Currently all routes open as bottom-sheet drawers on all screen sizes. On desktop (≥ 1024 px) content should open as draggable, resizable floating windows.

### 2.0 Window behavior configuration fields

Every content collection (`windows`, `articles`, `forms`) now has a **Window** tab with checkboxes controlling how content renders in the desktop floating-window system.

**Chrome behavior fields**

| Field | Type | Default | Effect |
|-------|------|---------|--------|
| `windowCollapsible` | checkbox | `true` | Shows minimize button in title bar |
| `windowExpandable` | checkbox | `false` | Shows full-screen expand button (green traffic light) |
| `windowResizable` | checkbox | `true` | Renders E / S / SE resize handles on desktop |

**Toolbar behavior fields**

| Field | Type | Default | Effect |
|-------|------|---------|--------|
| `windowDisplaySearch` | checkbox | `false` | Renders a search input in the window toolbar (desktop); sections that receive the context (`articleList`) filter content client-side |
| `windowDisplayViewToggle` | checkbox | `false` | Renders grid / table toggle buttons (`ri-layout-grid-line` / `ri-table-view`) |
| `windowDefaultView` | select (`grid`/`table`) | `grid` | Initial view mode when `windowDisplayViewToggle` is true |
| `windowDisplayHistory` | checkbox | `false` | Renders back / forward buttons; article links navigate in-window instead of opening new windows |

**Adding to a new collection:**

```ts
import { windowBehaviorFields } from '@/fields/windowBehavior'

// Inside the tabs array:
{ label: 'Window', fields: windowBehaviorFields },
```

**Reading in the page route (`[slug]/page.tsx`):**

```tsx
<SetWindowOptions
  disableMinimize={doc.windowCollapsible === false}
  expandable={doc.windowExpandable === true}
  resizable={doc.windowResizable !== false}
/>
<SetWindowToolbar
  displaySearch={behavior.displaySearch}
  displayViewToggle={behavior.displayViewToggle}
  defaultView={behavior.defaultView}
  displayHistory={behavior.displayHistory}
/>
```

Secondary windows opened via `useWindowManager.open(slug)` get behavior automatically from `getWindowContent` which returns `behavior: WindowBehaviorConfig` alongside the content.

**Resize implementation** uses pointer capture on each handle (`role="separator"`, keyboard arrow keys, `data-resizing` attribute suppresses CSS transitions during drag). Size is persisted to `localStorage['window-positions'][slug]` as `{ x, y, w, h }`.

- [x] `src/fields/windowBehavior.ts` — shared field definitions (chrome + toolbar)
- [x] `src/components/window/ResizeHandles.tsx` — E / S / SE handles with ARIA + keyboard
- [x] `src/components/window/title-context.tsx` — holds chrome + toolbar flags; exposes `SetWindowOptions` and `SetWindowToolbar` setter components
- [x] `src/components/window/title-bar.tsx` — green button activates when `expandable: true`
- [x] `tests/int/window-behavior.int.spec.ts` — round-trip for all three fields on Windows + Articles
- [x] `tests/int/window-toolbar-fields.int.spec.ts` — round-trip for all four toolbar fields + `extractBehavior` defaults

### 2.1 Window state management

- [ ] Write unit tests for the URL state parsing util:
  - `parseOpenWindows('?open=works,welcome')` → `['works', 'welcome']`
  - Invalid or unknown slugs are filtered out
- [ ] Implement state:
  - URL search param `?open=slug1,slug2` drives which windows are rendered (SSR-readable; server sets correct OG tags)
  - `localStorage['window-positions']` stores `{ [slug]: { x, y, w, h } }` — restored client-side only
  - `useWindowManager` hook (`src/hooks/useWindowManager.ts`) manages open list, positions, zIndex stack

### 2.2 WindowShell component

- [ ] Write E2E tests **first** (TDD):
  - At viewport 1280×800: clicking a shortcut opens a `[role="dialog"]` that does **not** have class `translate-y-0`
  - Dragging the title bar repositions the window (assert `style.transform` changes)
  - Minimize → window not visible, taskbar entry present
  - Close → window removed, `?open` URL param updated
  - At viewport 375×812: same route opens a bottom-sheet drawer (existing PageDrawerShell behaviour unchanged)
- [ ] Create `src/components/window/WindowShell.tsx` (`'use client'`):
  - Drag via `onPointerDown` / `onPointerMove` / `onPointerUp`
  - zIndex management on focus via `useWindowManager`
  - Snap to screen edges
- [ ] Modify `src/app/(frontend)/(pages)/layout.tsx`:
  - Client Component wrapper reads `useMediaQuery('(min-width: 1024px)')`
  - Desktop → `WindowShell` with position from localStorage
  - Mobile → `PageDrawerShell` (current behaviour, unchanged)

### 2.3 Taskbar

- [ ] Write E2E test: minimized window entries appear in the taskbar; clicking an entry restores the window
- [ ] Create `src/components/taskbar/index.tsx` — Client Component, desktop only (≥ 1024 px), subscribed to `useWindowManager`

### 2.4 Open Graph per window (foundation for Phase 3)

- [ ] Add `generateMetadata` stub to `src/app/(frontend)/(pages)/[slug]/page.tsx` — flesh out fully in Phase 3.3 with SEO fields

### 2.5 Window toolbar — search, view toggle, in-window history

Per-window toolbar rendered between the title bar and content. Toolbar state is isolated per window via React Context — search params were explicitly rejected because they collide across multiple open windows.

**Architecture:**

```
Payload fields (windowDisplaySearch / windowDisplayViewToggle / windowDefaultView / windowDisplayHistory)
        ↓ extractBehavior() → WindowBehaviorConfig
AdditionalWindow (owns history stack: { stack: string[]; index: number })
        ↓ canGoBack / canGoForward / navigate / back / forward (memoised with useCallback)
WindowToolbarProvider (owns searchQuery, viewMode; forwards nav callbacks to context)
        ↓
WindowToolbar (renders back/forward, search input, grid/table buttons based on behavior flags)
        ↓
ArticleListBlock (consumes context: filters by searchQuery, renders in viewMode, calls navigate() instead of open() when displayHistory is true)
```

**History lifecycle rules:**
- History stack lives in `AdditionalWindow`, not in the context provider — this is the single source of truth.
- `displaySlug` is derived from `historyStack[historyIndex]`; there is no separate `displaySlug` state.
- On back navigation to the initial slug of a pre-rendered window, `preloadedData` is explicitly restored (the content effect must NOT early-return without setting `data`).
- Pre-rendered shortcut windows are always-mounted. When `isVisible` transitions to `false` (window closed), the history resets to `{ stack: [slug], index: 0 }` so the window is pristine on next open.
- For the primary route (`PageDrawerShell`), `canGoBack=true` always and `onBack = router.back()` — browser history is used instead of an in-window stack.

**View mode:**
- `viewMode` in the context uses `userViewMode ?? behavior.defaultView`. `null` means "follow the CMS default"; an explicit value means the user has toggled it.
- This ensures a non-preloaded window with `windowDefaultView: 'table'` shows the correct mode as soon as data loads, without resetting a user's explicit choice.

**Mobile:** back button always visible when `displayHistory` is true. Search input, forward button, and view toggle buttons are `hidden lg:flex` (desktop-only).

**Data freshness note:** `preloadedData` is frozen at SSR time. Enabling a toolbar flag in Payload admin invalidates `unstable_cache` via `revalidateTag('window-content')`, but the already-rendered `preloadedContents` prop in the client tree reflects the change only after a full page reload.

- [x] `src/lib/windowContent.ts` — `fetchWindowContent` (server-only, `unstable_cache`); `WindowContentResult` type includes `behavior: WindowBehaviorConfig`
- [x] `src/actions/getWindowContent.ts` — thin `'use server'` re-export of `fetchWindowContent`
- [x] `src/components/window/window-toolbar-context.tsx` — `WindowToolbarProvider` + `useWindowToolbar()`
- [x] `src/components/window/WindowToolbar.tsx` — toolbar UI (`data-window-toolbar`, `data-view-mode` attributes for E2E targeting)
- [x] `src/components/window/AdditionalWindow.tsx` — owns history state; resets on close; `ArticleListBlock` sub-component consumes toolbar context
- [x] `src/components/drawer/page-shell.tsx` — wraps primary route content with `WindowToolbarProvider` using browser navigation callbacks
- [x] `tests/int/window-toolbar-fields.int.spec.ts` — 13 integration tests for field defaults, mapping, and all three collections
- [x] `tests/e2e/window-toolbar.e2e.spec.ts` — E2E tests: toolbar visibility, view toggle, articleList search, in-window history, mobile

### 2.6 Window pre-rendering and boot preloader

Shortcut windows (those with `showShortcut: true`) are pre-fetched on the server, always mounted in the DOM, and CSS-hidden until opened. This eliminates the "Loading…" flash every time a window is opened.

**Server-side caching (`src/lib/windowContent.ts`)**

`fetchWindowContent(slug)` is wrapped in Next.js `unstable_cache` keyed to the `['window-content']` tag with `revalidate: false`. It is server-only (imported via `'server-only'`). `src/actions/getWindowContent.ts` is a thin `'use server'` re-export for use from Server Components.

Cache invalidation: `Windows.ts` and `Articles.ts` `afterChange`/`afterDelete` hooks call `revalidateTag('window-content')` alongside the existing `revalidatePath` calls. A CMS save immediately invalidates the cache for all window content.

`src/app/(frontend)/layout.tsx` calls `fetchAllShortcutContents(shortcutSlugs)` — a `Promise.all` over each slug — and passes the result as `preloadedContents` to `WindowManagerProvider`.

**Always-mounted DOM (`WindowManagerProvider.tsx` + `AdditionalWindow.tsx`)**

`WindowManagerInner` renders one `AdditionalWindow` per shortcut slug inside a `<div style={{ display: 'none' }}>` wrapper when not visible. The window is never unmounted — `isVisible` (derived from `manager.windows`) controls the Framer Motion animation instead of mount/unmount. Closing a preloaded window calls `manager.close(slug)` AND adds the slug to a `closedSlugs` Set in the provider.

On-demand windows (opened via `useWindowManager.open(slug)` for slugs not in `shortcutSlugs`) still use traditional mount/unmount. `AdditionalWindow` has a module-level `contentCache` Map for these — it persists across mounts within the same page session.

**Boot preloader (`src/components/preloader/`)**

`PreloaderProvider` tracks progress toward a `total` target using a `readyCount` counter. Each pre-rendered `AdditionalWindow` calls `onReady()` once on mount, incrementing the counter. `PagePreloader` shows a full-screen overlay with a `{percentage}%` counter; `AnimatePresence` fades it out when `isComplete` becomes true.

`total` is `number | null`:
- `null` — viewport not yet checked; preloader shows at 0% (SSR/hydration initial state)
- `0` — mobile viewport confirmed; `isComplete = true` immediately (nothing to pre-render)
- `N` — desktop viewport confirmed; waits for N `reportReady()` calls

**Mobile / desktop split**

`isDesktop` (`window.innerWidth >= 1024`) is determined in `WindowManagerProvider` (outer component) via `useEffect`, initialised as `null`. This runs before `PreloaderProvider` receives its `total`, so mobile correctly gets `total = 0` and never blocks on windows that will not be rendered. `WindowManagerInner` receives `isDesktop` as a prop.

```
null  → total = null  → isComplete = false  (SSR / first render)
false → total = 0     → isComplete = true   (mobile: exit immediately)
true  → total = N     → waits for N ready   (desktop: count up to 100%)
```

Pre-rendered windows and the Taskbar only render when `isDesktop === true`. On mobile, all content is served via the `PageDrawerShell` route system as before.

**Key files:**
- `src/lib/windowContent.ts` — server-only `unstable_cache` fetch + `WindowContentResult` type
- `src/actions/getWindowContent.ts` — `'use server'` re-export
- `src/app/(frontend)/layout.tsx` — calls `fetchAllShortcutContents`, passes `preloadedContents` + `shortcutSlugs`
- `src/components/preloader/preloader-context.tsx` — `PreloaderProvider` + `usePreloader()`
- `src/components/preloader/PagePreloader.tsx` — full-screen overlay with `AnimatePresence` exit
- `src/components/window/WindowManagerProvider.tsx` — owns `isDesktop` state; computes `total`; renders pre-rendered + on-demand windows

- [x] `src/lib/windowContent.ts` — server-only cached fetcher
- [x] `src/components/preloader/` — `PreloaderProvider` + `PagePreloader`
- [x] `src/components/window/WindowManagerProvider.tsx` — `isDesktop`-aware `total` computation; always-mounted shortcut windows
- [x] `src/components/window/AdditionalWindow.tsx` — `preloadedData`, `isVisible`, `onReady` props; module-level `contentCache`
- [x] `tests/e2e/preloader.e2e.spec.ts` — 6 tests: preloader visible on load, counts to 100%, exits on completion, skipped on mobile

**Tests required for Phase 2:**
- `tests/int/window-state.int.spec.ts`
- `tests/int/window-toolbar-fields.int.spec.ts` ✓
- `tests/e2e/windows.e2e.spec.ts` (extend with desktop viewport assertions)
- `tests/e2e/taskbar.e2e.spec.ts`
- `tests/e2e/window-toolbar.e2e.spec.ts` ✓
- `tests/e2e/preloader.e2e.spec.ts` ✓

**Quality gate:** Phase 1 tests still pass; no mobile regression; `bun run build` clean.

---

## Phase 3 — SEO

SEO precedes analytics: `generateMetadata` provides canonical URLs and Open Graph tags that PostHog and GTM depend on.

### 3.1 SeoSettings global

- [x] ~~Custom `SeoSettings` global~~ — **replaced by `@payloadcms/plugin-seo`**. Per-document SEO is fully managed by the plugin. Site-level canonical base URL is read from `NEXT_PUBLIC_SITE_URL` env var; site title is a hardcoded constant `"Dimm's OS"` in `src/utilities/generateMeta.ts`.

### 3.2 Per-document SEO fields

- [x] Register `seoPlugin` in `payload.config.ts`:
  - `collections: ['windows', 'articles']`, `uploadsCollection: 'media'`, `tabbedUI: true`
  - Plugin injects a `meta` group (`title`, `description`, `image`) and appends an **SEO tab** to the existing Content / Shortcut tabs — giving `Content / Shortcut / SEO`.
  - Extended with a `noIndex` checkbox via the plugin's `fields` option; stored as `meta_no_index` (schema-compatible with existing DB columns — no data migration needed).
  - `generateTitle` and `generateURL` config functions power the admin's auto-generate buttons.
- [x] `tests/int/seo-fields.int.spec.ts` — tests `meta.title`, `meta.description`, `meta.noIndex` round-trip on the Windows collection.

### 3.3 `generateMetadata` in routes

- [x] `src/utilities/generateMeta.ts` — thin utility reading from `doc.meta` (plugin schema); no DB global dependency.
- [x] `src/app/(frontend)/(pages)/[slug]/page.tsx` — `generateMetadata` fetches document by slug (windows then articles); calls `generateMeta(doc)` (one argument; no global fetch).
- [x] `src/app/(frontend)/layout.tsx` — static `metadata` export with site title and description constants.

### 3.4 Sitemap and robots.txt

- [x] `src/app/sitemap.ts` — fetches windows and articles where `meta.noIndex` is not true; canonical base from `process.env.NEXT_PUBLIC_SITE_URL`.
- [x] `src/app/robots.ts` — synchronous; reads `NEXT_PUBLIC_SITE_URL` for sitemap URL.
- [x] `tests/e2e/seo.e2e.spec.ts` — covers sitemap XML, robots.txt, `og:title`, and `meta.noIndex` → `robots: noindex`.

**Tests required for Phase 3:**
- `tests/int/seo-fields.int.spec.ts` ✓
- `tests/e2e/seo.e2e.spec.ts` ✓

**Quality gate:** sitemap generated at build; no public-facing page has `robots: noindex` by default; `bun run build` clean. ✓ **All gates green.**

---

## Phase 4 — Analytics and error tracking

All services integrate with the existing cookie consent system. No service fires events or writes storage before the user's consent categories are confirmed.

**Note on GTM:** A separate GTM container was not added. `public/consent-init.js` already initialises `window.dataLayer` and `window.gtag` for Google Consent Mode v2 signals, which is all that's needed. PostHog handles analytics directly.

### 4.0 Cookie manifest and audit automation

Every cookie/storage item the site writes is declared in a canonical manifest. An E2E audit test catches any undeclared key that appears after a library update.

- [x] Create `src/data/cookieManifest.ts` — single source of truth for all `CookieService` entries (essential, functional, analytics)
- [x] Create `tests/helpers/seedCookieServices.ts` — delete-first idempotent seeder (matches project pattern from `seedContent.ts`)
- [x] `bun run seed:cookies` script populates a fresh local DB from the manifest
- [x] `tests/int/cookie-manifest.int.spec.ts` — verifies all manifest entries seed and are publicly readable
- [x] Cookie audit test in `tests/e2e/analytics.e2e.spec.ts` — accept all consent → collect every `document.cookie` name + localStorage + sessionStorage key → assert each matches a declared manifest entry (prefix patterns like `ph_*` and `__ph_*` supported)

### 4.1 PostHog

- [x] Install `@posthog/next` (official unified package — handles client + server, provides `PostHogProvider` and `PostHogPageView`)
- [x] `src/components/analytics/PostHogConsentGate.tsx` (`'use client'`) — bridges `useCookieConsent()` to `posthog.opt_in_capturing()` / `posthog.opt_out_capturing()`; initialised with `opt_out_capturing_by_default: true`
- [x] `PostHogProvider` + `PostHogPageView` wired into root layout; `PostHogConsentGate` sits inside both providers
- [x] `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` added to `.env.example`

### 4.2 Google Tag Manager

**Replaced by PostHog.** The existing `public/consent-init.js` covers all Google Consent Mode v2 signal updates (`analytics_storage`, `ad_storage`, etc.) via `window.gtag`. No GTM container script is needed.

### 4.3 Sentry

- [x] Install `@sentry/nextjs` (Next.js SDK) + `@payloadcms/plugin-sentry@3.84.1` (Payload admin instrumentation)
- [x] Manual setup (no wizard): `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts` (registers server/edge, exports `onRequestError`)
- [x] `src/app/global-error.tsx` — React error boundary calling `Sentry.captureException`
- [x] `src/components/analytics/SentryReplayProvider.tsx` — dynamically loads `@sentry/browser`'s `replayIntegration` only when `functional` consent is granted
- [x] `sentryPlugin({ Sentry })` added to `payload.config.ts` plugins array
- [x] `withSentryConfig` wrapping `next.config.ts`
- [x] `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` added to `.env.example`

**Tests required for Phase 4:**
- `tests/int/cookie-manifest.int.spec.ts` ✓
- `tests/e2e/analytics.e2e.spec.ts` ✓ (PostHog consent gating via `ph_*` localStorage side-effects; cookie audit; services API)

**Quality gate:** no analytics tool writes storage or fires events when the user rejects all optional categories; cookie audit test fails if a library update introduces an undeclared key. ✓ **All gates green.**

---

## Phase 5 — Animations

### 5.1 Loading / boot screen

- [ ] Write `tests/e2e/boot.e2e.spec.ts` **first**:
  - On first load (no `sessionStorage['booted']`): boot overlay is visible
  - After animation completes: `sessionStorage['booted']` is set and the overlay is not in the DOM
  - Second load: overlay is skipped entirely
- [ ] Implement as a Client Component rendered in the root layout:
  - Check `sessionStorage['booted']` on mount; if set, render nothing
  - Play CSS keyframe animation; set `sessionStorage['booted'] = '1'` in `onAnimationEnd`
  - Use `AnimatePresence` (Framer Motion) for the exit fade if desired

### 5.2 Wallpaper

- [ ] Write E2E test: wallpaper element has a non-transparent background; when `data-page-drawer="open"`, the wallpaper has a visually distinct state (use `toHaveCSS` or `toHaveScreenshot()`)
- [ ] Implement a wallpaper that reacts to `--drawer-open-pct` CSS variable (already set by `PageDrawerShell`) — e.g., blur or darken as a drawer opens

### 5.3 Content animations

- [ ] Write E2E screenshot test (`toHaveScreenshot()`) for the final rendered state of a content window
- [ ] Intersection Observer + CSS `@keyframes` for scroll-triggered animations inside window/drawer content
- [ ] Framer Motion `motion.div` with staggered `transition.delay` for sequenced list animations

### 5.4 Shortcut icon animations

- [ ] Write E2E test: shortcut icon has a `transition` CSS property; hovering changes its scale (use `toHaveCSS`)
- [ ] Add `hover:scale-105 active:scale-95 transition-transform` to `src/components/shortcut/index.tsx`

**Tests required for Phase 5:**
- `tests/e2e/boot.e2e.spec.ts`
- `tests/e2e/animations.e2e.spec.ts` (screenshot snapshots for key visual states)

**Quality gate:** `bun run build` passes; no animation library added unless Framer Motion is already present.

---

## Phase 6 — Shortcut grid polish and context menu

### 6.1 Shortcut ordering and fetch optimisation

- [ ] Write `tests/int/shortcuts.int.spec.ts`: two shortcuts with the same `shortcutOrder` are sorted stably by `id` as a tiebreaker
- [x] Fix `fetchShortcuts` in `src/app/(frontend)/layout.tsx` — `select`, `depth: 0`, `limit: 100` added to all calls (windows, articles, forms); `works` entry removed; done as part of Phase 1 when wiring up Articles shortcuts:
  ```ts
  payload.find({
    collection: 'windows',
    where: { showShortcut: { equals: true } },
    select: { title: true, slug: true, shortcutName: true, shortcutIcon: true, shortcutOrder: true } as const,
    depth: 0,
    limit: 100,
  })
  ```

### 6.2 Context menu

- [ ] Write `tests/e2e/context-menu.e2e.spec.ts` **first**:
  - Right-clicking a shortcut shows a context menu with at least "Open" and "Get Info" items
  - Clicking outside the menu dismisses it
  - Pressing Escape dismisses it
  - At ≥ 1024 px: "Open in new window" item is present and updates the `?open` URL param
- [ ] Create `src/components/shortcut/ContextMenu.tsx` (`'use client'`):
  - Positioned absolutely at click coordinates
  - Mobile: Open, Get Info; Desktop: adds "Open in new window"

### 6.3 Image optimisation

- [ ] Audit all `<img>` tags; replace with Next.js `<Image>` + `sizes` where applicable
- [ ] Add `imageSizes` to `payload.config.ts` for thumbnail resize variants
- [ ] Add `format: ['webp', 'avif']` to the Sharp config if not set

**Tests required for Phase 6:**
- `tests/int/shortcuts.int.spec.ts`
- `tests/e2e/context-menu.e2e.spec.ts`

**Quality gate:** Lighthouse performance score does not regress from Phase 5 baseline.

---

## Phase 7 — Production hardening

- [ ] Ensure `.env.example` lists every variable with an inline comment (purpose + where to obtain the value)
- [x] Environment Variables table updated — `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` added; `NEXT_PUBLIC_GTM_ID` not needed (GTM replaced by PostHog)
- [ ] Audit all `payload.find()` and `payload.findByID()` calls in the codebase for missing `select`, `depth`, and `limit`; open a tracking issue per instance; fix before quality gate
- [ ] Confirm all migration files are committed and `bun payload migrate` runs clean from a fresh database

**Overall project completion quality gate:**
- All phase 0–7 checklists checked
- `bun test:int && bun test:e2e` pass clean in CI
- `bun run build` zero TypeScript errors
- No `overrideAccess: true` in Server Components
- No `getPayload()` calls inside Client Components (`'use client'`)
- `src/payload-types.ts` committed and up to date
- Every `payload.find()` in RSCs has explicit `select`, `depth`, and `limit`

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PAYLOAD_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `RESEND_API_KEY` | Yes | Resend API key for form submission emails |
| `RESEND_DEFAULT_FROM_ADDRESS` | No | Sender address for form submission emails (defaults to `noreply@dimm.co`) |
| `RECAPTCHA_SECRET_KEY` | Yes | reCAPTCHA v3 server-side secret |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Yes | reCAPTCHA v3 public site key |
| `NEXT_PUBLIC_SITE_URL` | Phase 3 | Canonical base URL for sitemap and robots.txt (no trailing slash) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Phase 4 | PostHog project API key (`phc_…`) |
| `NEXT_PUBLIC_POSTHOG_HOST` | Phase 4 | PostHog ingest host (e.g. `https://eu.i.posthog.com`) |
| `NEXT_PUBLIC_SENTRY_DSN` | Phase 4 | Sentry project DSN |
| `SENTRY_ORG` | Phase 4 | Sentry organisation slug (for source map uploads in CI) |
| `SENTRY_PROJECT` | Phase 4 | Sentry project slug |

---

## Content section blocks & scroll animations

Articles and Windows share a `content` blocks field built by
`createContentBlocksField()` in `src/fields/contentBlocks.ts`. Windows get the
shared set; Articles also get the doc-image-backed **Hero**.

| Block | `blockType` | Notes |
|---|---|---|
| Rich Text | `richText` | Lexical rich text |
| Works / Article List | `articleList` | Grid + table views (toggle via window toolbar); table rows show tags + year with a mouse-following hover preview |
| Summary | `summary` | 1/3 + 2/3 columns with a draw-on-scroll divider |
| Stats | `stats` | Up to three count-up figures (value + suffix + label) |
| Image | `imageSection` | Full-width image with the de-pixelation reveal |
| Description | `description` | 1/3 animated title + 2/3 rich text |
| Title | `sectionTitle` | Letter-by-letter animated title |
| Hero | `hero` | **Articles only** — animated title + 2/3 parallax image from the article's `bgImage`/`fgImage` |

Article-only fields (Content tab): `year`, `tags` (relationship → **Tags**
collection; pick existing or create new), `bgImage`, `fgImage` (16:9 upload
pair used by the Hero parallax and Works cards).

### Scroll-animation toolkit

`src/components/animation/` — Framer Motion primitives that trigger on *true*
visibility inside the window's `.win-scroll` container (via `ScrollRoot` /
`useScrollRoot`), not the viewport: `AnimatedText` (word/letter reveal with an
accessible full-text copy), `PixelatedImage` (canvas de-pixelation → real
`next/image`), `ParallaxImagePair`, `AnimatedDivider`, `CountUp`. Shared easing:
`EASE_OUT_QUAD` (`src/lib/easing.ts`).

### Seeds & block previews

- `bun run seed:case-study [slug]` — seeds a full case study using every section
  block plus sibling case studies for the Works list (generates its own images
  via sharp). Defaults to `/case-study-demo`.
- `bun run seed:block-previews` — with the dev server running, screenshots each
  rendered section into `public/block-previews/<blockType>.png`; these are the
  images shown in Payload's block-selection drawer (each block's `imageURL`).

### Tests

- `bun run test:int` — Payload integration (collections, blocks, resolver)
- `bun run test:dom` — jsdom unit + component tests (`tests/unit`, `tests/component`)
- `bun run test:e2e` — Playwright (includes `article-sections.e2e.spec.ts`)
