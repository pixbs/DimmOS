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
│   │   │   ├── works/           # /works — portfolio listing
│   │   │   ├── [slug]/          # /[slug] — dynamic forms / windows / works
│   │   │   └── cookie-preferences/  # /cookie-preferences — consent management
│   │   └── test/                # /test — drawer interaction playground
│   └── (payload)/               # Payload admin + REST/GraphQL API
├── collections/
│   ├── Users.ts                 # Auth collection
│   ├── Media.ts                 # Uploads with alt text
│   ├── Windows.ts               # Content windows (title, slug, shortcut fields)
│   ├── Works.ts                 # Portfolio works (title, slug, shortcut fields)
│   ├── CookieServices.ts        # Cookie service catalogue
│   └── CookieConsents.ts        # Consent audit log (write-protected, custom endpoint)
├── globals/
│   └── CookieSettings.ts        # Banner copy + consentVersion
├── components/
│   ├── drawer/                  # Drawer system (see mechanics below)
│   ├── cookie-banner/           # Consent banner + context
│   ├── header/                  # Logo + Clock
│   ├── shortcut/                # Desktop icon tiles
│   └── form/                    # Dynamic form renderer
├── hooks/
│   ├── cookies/captureRequestMetadata.ts
│   └── forms/verifyRecaptcha.ts
└── migrations/                  # Auto-generated Payload migrations
```

---

## Architecture principles

**Server-first.** All data fetching happens in Server Components (`async` functions that call `getPayload()`). Client Components receive already-fetched data as props. No client-side data fetching except for the cookie consent version check and audit log POST.

**Routes as drawers.** Every sub-page lives under the `(pages)` route group and is wrapped by a `PageDrawerShell`. Navigating to `/works` or `/cookie-preferences` does not do a full page reload — the URL changes and the drawer slides up from the bottom. On desktop this will eventually switch to floating windows (see roadmap).

**Payload schema = source of truth.** TypeScript types are generated from the Payload config (`bun generate:types`). Never hand-write types that mirror the schema. Never hand-write migration SQL — run `bun payload migrate:create` and let Payload diff the schema.

**Consent-first analytics.** Google Consent Mode v2 defaults all signals to `denied` before hydration (`/public/consent-init.js` loaded via `<Script strategy="beforeInteractive">`). Signals are updated when `saveConsent()` is called.

**Type safety workflow.** Run `bun generate:types` after every schema change. The output file `src/payload-types.ts` is the single source of TypeScript truth for all collection and global shapes. Never declare collection-mirroring interfaces by hand. Generated types are imported by both application code and integration tests.

**`req` threading and hook safety.** Always pass `req` in nested Local API calls inside hooks — this keeps all reads and writes within the same Postgres transaction and prevents partial writes on error. See `src/hooks/forms/enforcePreDefinedEmail.ts` as the canonical example: `req.payload.findByID({ ..., req })`. Use `req.context.skipHooks = true` before a Local API call inside an `afterChange` hook when you need to prevent re-entry. Reset to `false` after the call.

**Access control defaults.** All collections default to admin-only access. Public read is explicitly enabled per-collection only when the frontend requires it (e.g. `cookie-services`, `cookie-settings`). Use `overrideAccess: false` in integration tests to verify real access control; use `overrideAccess: true` only in test setup/teardown and the custom `/record` endpoint. Never use `overrideAccess: true` in application Server Components.

---

## Drawer system

Two drawer variants share the same `DrawerContext` (`{ open, close }`).

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
| `windows` | Content | Admin only |
| `works` | Content | Admin only |
| `cookie-services` | Service catalogue | Read: public; write: admin |
| `cookie-consents` | Audit log | Create: endpoint only; read/update/delete: admin |
| `cookie-settings` (global) | Config | Read: public; update: admin |

**Windows & Works** currently have only `title`, `slug`, and shortcut tab fields (`showShortcut`, `shortcutName`, `shortcutIcon`, `shortcutOrder`). No content blocks yet.

**Querying conventions:**
- Always pass `select` to limit returned fields in listing queries. The `fetchShortcuts` function in `(frontend)/layout.tsx` is the current counter-example to fix (calls `payload.find()` with no `select`, `depth`, or `limit`).
- Use `depth: 0` for listing queries where only IDs are needed; `depth: 1` when one level of relationship population is required. Set it explicitly — never rely on Payload's default of 1.
- Index all fields used in `where` clauses. `slug` on Windows, Works, and Forms already has `index: true`. Follow the same pattern for any `type`, `status`, or `category` selector fields added in future collections.

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
| `tests/e2e/cookie-banner.e2e.spec.ts` | Full consent flow: first visit, accept, reject, configure, preferences, update |
| `tests/e2e/admin.e2e.spec.ts` | Admin login, dashboard, list view, edit view |
| `tests/e2e/frontend.e2e.spec.ts` | Homepage title + load |

**Integration test access control pattern.** Always pass `overrideAccess: false` together with a `user` object to exercise real access control. Use `overrideAccess: true` only in test setup/teardown helpers. See `tests/int/cookie-services.int.spec.ts` — setup uses `overrideAccess: true` and assertions use `overrideAccess: false` — as the model to follow.

---

## Local setup

```bash
cp .env.example .env   # fill DATABASE_URI, PAYLOAD_SECRET, RESEND_DEFAULT_FROM_ADDRESS, RECAPTCHA_SECRET_KEY
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

1. Edit collection or global config
2. Run `bun payload migrate:create` — Payload diffs the live DB schema and emits a migration file under `src/migrations/`
3. Review the generated SQL before committing
4. Run `bun payload migrate` in development to apply
5. Run `bun payload migrate` in CI and production **before** starting the server

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

- [ ] Create `.github/workflows/ci.yml` with steps in order:
  1. `bun install --frozen-lockfile`
  2. `bun run build` — fails the workflow if TypeScript or Next.js compilation errors exist
  3. Start a PostgreSQL service container (`postgres:16`; set `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`)
  4. Run `bun payload migrate` against the CI database
  5. `bun test:int`
  6. Start `bun start` as a background step; wait for port 3000
  7. `bun test:e2e`
- [ ] Fix `playwright.config.ts` `webServer` for CI:
  ```ts
  webServer: {
    command: process.env.CI ? 'bun start' : 'bun run dev',
    reuseExistingServer: !process.env.CI,
    url: 'http://localhost:3000',
  }
  ```
  (`forbidOnly: !!process.env.CI` and `retries: process.env.CI ? 2 : 0` are already set.)
- [ ] Add required CI secrets: `DATABASE_URL`, `PAYLOAD_SECRET`, `RECAPTCHA_SECRET_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

**Tests required:** the CI workflow itself; it must exit 0 on a clean main branch.

**Quality gate:** main branch stays green; PRs blocked on failure.

---

## Phase 1 — Content architecture

Windows and Works have slugs and shortcut metadata but no content. This phase adds content blocks and wires up cache revalidation immediately so production never serves stale data.

### 1.1 Decide collection structure

- [ ] Make one of the following decisions and document it as a comment at the top of the relevant collection file(s):
  - **Option A — Keep separate.** `Windows` = general content pages (about, contact, welcome). `Works` = portfolio pieces. Both use the same block schema via a shared field definition exported from `src/fields/contentBlocks.ts`.
  - **Option B — Merge into `Articles`.** Single collection with a `type` field (`window | work`). Existing Windows and Works documents migrated via a Payload migration.
  - This decision affects collection slugs in `generateStaticParams`, `revalidatePath` calls, and the `[slug]` route. Resolve before writing any tests for 1.2.

### 1.2 Content blocks field

- [ ] Write `tests/int/windows.int.spec.ts` **first** (TDD):
  - Create a Window document with each block type present; assert `content[0].blockType` matches
  - Create a Window with no `content`; assert it is valid (field is optional)
  - Fetch by slug with `overrideAccess: false`; assert the document is returned (or correctly denied per 1.1 access decision)
- [ ] Create `src/fields/contentBlocks.ts` — exports a `blocks` field and individual block exports (kept separate for reuse across collections):
  - `RichTextBlock` — `blockType: 'richText'`, field: `content` (lexical richText)
  - `ImageBlock` — `blockType: 'image'`, field: `image` (upload rel to `media`, required)
  - `GalleryBlock` — `blockType: 'gallery'`, field: `images` (array of upload rels to `media`)
  - `EmbedBlock` — `blockType: 'embed'`, field: `url` (text, required, validate rejects non-URL strings)
  - `CTABlock` — `blockType: 'cta'`, fields: `heading` (text, required), `body` (textarea), `link` group (`label`, `href`, `openInNewTab` checkbox)
- [ ] Add `content: contentBlocksField` to `Windows.ts` (and Works / Articles per 1.1 decision)
- [ ] Run `bun generate:types` → `bun payload migrate:create` → `bun payload migrate`
- [ ] `bun test:int` — new tests must pass

### 1.3 On-demand cache revalidation

Revalidation lands here alongside content blocks so that admin saves immediately invalidate the Next.js cache in production without a redeploy.

- [ ] Write `tests/int/windows-revalidation.int.spec.ts`:
  - Spy on `next/cache.revalidatePath`; assert it is called with `/${doc.slug}` and `/` after `afterChange` fires
  - Assert the `skipHooks` guard prevents re-entry when the hook triggers itself
- [ ] Add `afterChange` + `afterDelete` hooks to `Windows.ts` (mirror for Works / Articles):
  ```ts
  import { revalidatePath } from 'next/cache'

  afterChange: [async ({ doc, req }) => {
    if (req.context.skipHooks) return
    req.context.skipHooks = true
    revalidatePath(`/${doc.slug}`)
    revalidatePath('/') // shortcut grid on homepage
    req.context.skipHooks = false
  }]
  ```
  Consider `revalidateTag` instead of `revalidatePath` if multiple routes share a cache tag (e.g. `'shortcuts'` for the homepage grid).
- [ ] `bun test:int` — revalidation tests pass

### 1.4 Welcome Window

- [ ] Extend `tests/int/windows.int.spec.ts`:
  - Seed a Window with `slug: 'welcome'` and at least one `RichTextBlock`
  - Fetch by slug with `overrideAccess: false`; assert document returned; assert `content[0].blockType === 'richText'`
- [ ] Create `src/components/window-content/index.tsx` (Server Component, no `'use client'`):
  - Accepts `blocks: ContentBlock[]` (type from `payload-types.ts`)
  - Switches on `block.blockType`; renders sub-components: `RichTextRenderer` (uses `@payloadcms/richtext-lexical/react`), `ImageRenderer`, `GalleryRenderer`, `EmbedRenderer`, `CTARenderer`
- [ ] Write `tests/e2e/windows.e2e.spec.ts`:
  - Navigate to the welcome window URL
  - Assert PageDrawer opens: `expect(el).toHaveClass(/translate-y-0/)`
  - Assert at least one block renders: `locator('[data-block-type="richText"]').toBeVisible()`

### 1.5 Works listing page (`/works`)

- [ ] Write `tests/e2e/works.e2e.spec.ts` **first** (TDD):
  - Navigate to `/works`; assert PageDrawer open (`translate-y-0`)
  - Assert ≥ 1 work card is visible (requires a seeded document in the test DB)
  - Assert clicking a work card navigates to `/[slug]` and a detail drawer opens
- [ ] Replace placeholder copy in `src/app/(frontend)/(pages)/works/page.tsx`:
  - `payload.find({ collection: 'works', select: { title: true, slug: true, shortcutIcon: true }, depth: 0, limit: 24 })`
  - Render a grid of `WorkCard` server components (no `'use client'`)
- [ ] Add `generateStaticParams` to `src/app/(frontend)/(pages)/[slug]/page.tsx` covering windows + works + forms (currently covers forms only):
  ```ts
  const [windows, works, forms] = await Promise.all([
    payload.find({ collection: 'windows', select: { slug: true }, limit: 200 }),
    payload.find({ collection: 'works',   select: { slug: true }, limit: 200 }),
    payload.find({ collection: 'forms',   select: { slug: true }, limit: 200 }),
  ])
  return [
    ...windows.docs.map(d => ({ slug: d.slug })),
    ...works.docs.map(d   => ({ slug: d.slug })),
    ...forms.docs.map(d   => ({ slug: d.slug })),
  ]
  ```

### 1.6 Services page

- [ ] Per 1.1 decision: new `Services` collection OR filter Articles by `type: 'service'`
  - If new collection: mirror Works structure — slug with `index: true`, contentBlocks field, same `afterChange` revalidation hook
- [ ] Write integration test: access control + slug uniqueness + hook side effects
- [ ] Write E2E test mirroring the works tests; add `/services` route under `(pages)/`

**Tests required for Phase 1:**
- `tests/int/windows.int.spec.ts`
- `tests/int/windows-revalidation.int.spec.ts`
- `tests/int/works.int.spec.ts`
- `tests/e2e/windows.e2e.spec.ts`
- `tests/e2e/works.e2e.spec.ts`

**Quality gate:** `bun test:int && bun test:e2e && bun run build` pass; `src/payload-types.ts` committed.

---

## Phase 2 — Desktop window system

Currently all routes open as bottom-sheet drawers on all screen sizes. On desktop (≥ 1024 px) content should open as draggable, resizable floating windows.

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

**Tests required for Phase 2:**
- `tests/int/window-state.int.spec.ts`
- `tests/e2e/windows.e2e.spec.ts` (extend with desktop viewport assertions)
- `tests/e2e/taskbar.e2e.spec.ts`

**Quality gate:** Phase 1 tests still pass; no mobile regression; `bun run build` clean.

---

## Phase 3 — SEO

SEO precedes analytics: `generateMetadata` provides canonical URLs and Open Graph tags that PostHog and GTM depend on.

### 3.1 SeoSettings global

- [ ] Write `tests/int/seo-global.int.spec.ts` **first**:
  - Create the global document; read it back with `overrideAccess: false`; confirm public read works
- [ ] Create `src/globals/SeoSettings.ts`:
  - Fields: `siteTitle` (text, required), `siteDescription` (textarea), `defaultOgImage` (upload rel to `media`, depth 1), `twitterHandle` (text), `canonicalBase` (text — validate no trailing slash)
  - Access: `read: () => true`, `update: () => !!user`
  - `afterChange` hook: `revalidatePath('/', 'layout')` to bust root layout cache
  - Register in `payload.config.ts`; run `bun generate:types` + `bun payload migrate:create`

### 3.2 Per-document SEO fields

- [ ] Write `tests/int/seo-fields.int.spec.ts`: create a Windows document with `seo.noIndex: true`; confirm field persisted and returned
- [ ] Create `src/fields/seoFields.ts` — a `group` field named `seo`:
  - `metaTitle` (text, max 60 chars — add `validate`)
  - `metaDescription` (textarea, max 160 chars — add `validate`)
  - `ogImage` (upload rel to `media`)
  - `noIndex` (checkbox, default `false`)
- [ ] Add `seoFields` to `Windows.ts`, `Works.ts`, and Services; run `bun generate:types` + `bun payload migrate:create`

### 3.3 `generateMetadata` in routes

- [ ] Update `src/app/(frontend)/(pages)/[slug]/page.tsx`:
  - Export `generateMetadata` that fetches the document by slug using `select` for SEO fields only (do not re-fetch full content blocks)
  - Falls back to `SeoSettings` global values when per-document fields are blank
  - Returns `robots: { index: !seo?.noIndex }` based on the `noIndex` field
- [ ] Update root layout to read `SeoSettings` global server-side via `payload.findGlobal()`

### 3.4 Sitemap and robots.txt

- [ ] Write `tests/e2e/seo.e2e.spec.ts` **first**:
  - `GET /sitemap.xml` returns 200 with `Content-Type: application/xml`; body contains the root URL
  - A page with `seo.noIndex: true` has `<meta name="robots" content="noindex">` in its HTML
  - Open Graph tags are present on the homepage
- [ ] Create `src/app/sitemap.ts` — fetches all published slugs from windows, works, services; excludes `noIndex: true` documents
- [ ] Create `src/app/robots.ts` — reads `canonicalBase` from `SeoSettings`

**Tests required for Phase 3:**
- `tests/int/seo-global.int.spec.ts`
- `tests/int/seo-fields.int.spec.ts`
- `tests/e2e/seo.e2e.spec.ts`

**Quality gate:** sitemap generated at build; no public-facing page has `robots: noindex` by default; `bun run build` clean.

---

## Phase 4 — Analytics and error tracking

All three services integrate with the existing cookie consent system. No service may fire events or set cookies before the user's consent categories are confirmed.

### 4.1 PostHog

- [ ] Write `tests/e2e/analytics.e2e.spec.ts` **first**:
  - After accepting `analytics` category: `window.posthog` is defined and not opted out
  - After rejecting: PostHog is opted out or not loaded
- [ ] Install `posthog-js`; create `src/components/analytics/PostHogProvider.tsx` (`'use client'`):
  - Initialise inside a `useEffect` gated on `consent.categories.includes('analytics')`
  - On consent change: call `posthog.opt_in_capturing()` or `posthog.opt_out_capturing()`
  - Track route changes via `usePathname()` + `useEffect`
  - Add `NEXT_PUBLIC_POSTHOG_KEY` to `.env.example`

### 4.2 Google Tag Manager

- [ ] Write E2E test: after accepting analytics, `window.dataLayer` contains a `consent_update` event with `analytics_storage: 'granted'`
- [ ] Load GTM via `<Script strategy="afterInteractive">` only after consent (not `beforeInteractive`)
  - Push `{ event: 'consent_update', ...signals }` to `dataLayer` inside `saveConsent()`
  - `consent-init.js` remains unchanged — it is the Consent Mode v2 default setter, not GTM
  - Add `NEXT_PUBLIC_GTM_ID` to `.env.example`

### 4.3 Sentry

- [ ] Write E2E test: basic navigation after accepting `functional` cookies throws no unhandled errors; session replay is not active when functional consent is denied
- [ ] Install `@sentry/nextjs`; run the Sentry wizard to generate `sentry.client.config.ts` and `sentry.server.config.ts`
  - Wrap session replay init with `consent.categories.includes('functional')` check before enabling replays
  - Add `SENTRY_DSN` to `.env.example`

**Tests required for Phase 4:**
- `tests/e2e/analytics.e2e.spec.ts`

**Quality gate:** no analytics tool sets cookies or fires events when the user rejects all optional categories.

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
- [ ] Fix `fetchShortcuts` in `src/app/(frontend)/layout.tsx` — add `select`, `depth`, and `limit` to all three `payload.find()` calls:
  ```ts
  payload.find({
    collection: 'windows',
    where: { showShortcut: { equals: true } },
    select: { title: true, slug: true, shortcutName: true, shortcutIcon: true, shortcutOrder: true },
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
- [ ] Verify the Environment Variables table below matches `.env.example` exactly — add `SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_GTM_ID` rows if not yet present
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
| `DATABASE_URI` | Yes | PostgreSQL connection string |
| `PAYLOAD_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `RESEND_DEFAULT_FROM_ADDRESS` | Yes | Sender address for form submission emails |
| `RECAPTCHA_SECRET_KEY` | Yes | reCAPTCHA v3 server-side secret |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Yes | reCAPTCHA v3 public site key |
| `SENTRY_DSN` | Phase 4 | Sentry project DSN |
| `NEXT_PUBLIC_POSTHOG_KEY` | Phase 4 | PostHog project API key |
| `NEXT_PUBLIC_GTM_ID` | Phase 4 | Google Tag Manager container ID |
