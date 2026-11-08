# @bibi/web – context for Claude

Next.js 16 (App Router, Turbopack), React 19, next-intl 4, Better Auth client, `@bibi/ui`. The surface for venue staff. See ADR 0003, 0005, 0007, 0009 and 0010.

## Structure
- `src/app/[locale]/`: `(auth)` = sign-in flows, `[org]/(app)` = protected shell under the organization slug (ADR 0062). `/:locale` is the public front page for everyone, never a redirect (ADR 0073); `(docs)` holds the public help: `/support` (common questions and staff guides, `support.json`, `features/support/`) and `/developers` (API, GraphQL, MCP, `docs.json`, `features/docs/`), both in `components/help-shell/`; old `/docs` links redirect in `next.config.ts`; the assistant is the organization home `/:org` (ADR 0035), `/admin` the administration area. `page.tsx`/`layout.tsx`/`route.ts` are thin: they read params and render a feature.
- Page width (ADR 0038): `[org]/(app)/(contained)/` pages are `SimplePage` or several `PageSection`s, each with a `PageContainer` as first child (`@bibi/ui`; the layout adds none); `(app)/(canvas)/` pages (`/`, `/calendar`) are full width and own their gutter and scrolling. A new page goes into one of the two groups; `AppShell` adds no container.
- `admin/*` is the administration area (ADR 0034, 0036): `admin/layout.tsx` shows a forbidden state for callers who may view none of its pages, and `/admin` redirects to the first one they may. Inside it the sidebar swaps to the area's own groups (`components/shell/admin-items.ts`, `SidebarMode`). Every sidebar entry is one page of sections, no tabs: the route page wraps them in `AdminSections` and asks `loadAdminPage` which sections the caller may view; each section is an `AdminSection section="<id>"` (edge-to-edge band, alternating background, content in the page container, title row with the section's actions on the right) that takes its anchor and title from the same entry as its sidebar sub-link. A section with nothing to show renders nothing unless the caller may create something in it (then the empty state with its Create button); the open page's sub-links list the sections actually on the page (`useRenderedAnchors`). A new section adds itself to `ADMIN_SECTIONS` (`components/shell/admin-sections.ts`) and its page in `ADMIN_GROUPS`, with texts under `adminArea.search.entries`: the open page's sidebar sub-links and the command bar's Settings group (`AdminCommandGroup`, ⌘K) are built from that list. Every list is a data table under the Tables rules. Old `/settings/*` links and the former tab routes redirect. Pages, navigation and the assistant follow the caller's effective permissions: a feature whose `view` is denied is hidden, not just disabled (`server/caller-abilities.ts`). Detail pages name their breadcrumb crumb with `CrumbName`.
- API routes: `api/auth/[...all]` (Better Auth), `api/graphql`, `api/v1/[...path]` (REST), `api/chat`, `api/assistant/approval`, `api/webhooks/resend`, `api/webhooks/stripe` and `api/webhooks/stripe-billing`, plus the `.well-known/oauth-*` discovery routes forwarded to Better Auth. Chat and approval routes set `runtime = "nodejs"`, `dynamic = "force-dynamic"` and `maxDuration`. New HTTP entry points are wrapped in `withRequestLogging`.
- `/pipeline` shows one board (`?board=<id>`, default the first, ADR 0067). A card dropped on a column with several statuses opens a picker of the statuses it may move to there (one allowed status moves at once, none refuses; ADR 0076). `?mode=customize` (only with `board:write`) flips the columns to their settings (`features/board/`); every change there saves at once. Creating, editing or archiving a status shows there only with `pipeline:write`/`pipeline:delete`; movement rules (Allowed next, gates) are edited only in the admin flow editor on `/admin/pipeline` (`features/order-status/ui/flow-*`), never on a board.
- `src/features/<entity>/ui/` = components per entity; `actions.ts` next to `ui/` = server actions. `features/web-surfaces.ts` lists which operations have UI (`UI_EXEMPT` in `ui-exempt.ts` lists operations deliberately without UI, with a reason).
- `src/components/` = app-level (`shell/`, `form/`, `data-table/`, `states/`, `confirm-dialog`). `src/server/` = server code only. `src/lib/` = pure helpers, tested with Vitest.
- `src/proxy.ts` first applies host routing (ADR 0073: the apex serves the public site under `(site)/site`, other hosts redirect; no-op without `PUBLIC_URL`), then next-intl routing (Next 16's name for middleware, Node runtime), then it makes the URL's organization active for members (`server/sync-active-organization.ts`). It also sets `x-bibi-path` (the path below `/:org`) so the `(app)` layout can send an unpaid organization to `/:org/billing/pay?returnTo=…` (ADR 0095). `src/i18n/request.config.ts` is `*.config.ts` to allow a default export.

## Data access (a single path)
- Reads in server components: `runOperation({ operation, input })`. Commands: server action → `runOperation` → `toActionResult`. The caller comes from `resolveExecuteContext({ headers: await headers() })`, the same as GraphQL, REST and MCP.
- Never `@bibi/db`, a custom `ExecuteContext` or `fetch` against `/api/graphql` in the web app. Why: ADR 0010.
- Errors: `Result` → `handleLoadError` (401 → login, 404 → not-found, otherwise `ErrorState`), or `ActionResult` → toast. AppError code → `errors.*` in `lib/error-key.ts`.
- Client components must not import values from `@bibi/core` (the barrel pulls in Prisma). Zod schemas come from `@bibi/core/schemas`; `import type` from `@bibi/core` is free.
- The assistant does **not** go through `runOperation`: `/api/chat` runs the MCP client against `apps/mcp` as the user (ADR 0007).

## Adding a page/feature
1. Core operation first (`packages/core`), then GraphQL, REST and MCP.
2. `src/features/<entity>/actions.ts` and `ui/` (list = server component, form = client). Copy `venue/ui` and `item/ui`.
3. Page: `(contained)/<route>/page.tsx` (thin), nav in the right group of `components/shell/nav-items.ts` (administration pages go to `admin-items.ts`, ADR 0036).
4. Add the operations to `WEB_SURFACES` (or `UI_EXEMPT`).
5. Text in `packages/i18n/messages/sv/<bundle>.json` and `en/<bundle>.json` (key parity is tested).

## i18n
- All text via `useTranslations` / `getTranslations`; no hardcoded strings or colors. Links, router, `usePathname` and `redirect` from `@/lib/navigation`, never `next/link`, `next/navigation`'s router or `@bibi/i18n/navigation` directly. Why: ADR 0062.
- App routes live under `app/[locale]/[org]/` (the organization slug). The wrapper prefixes scoped paths with the current slug and `usePathname` returns the path without it; server `redirect` needs `org` passed. A new top-level route outside `[org]` goes into `RESERVED_SLUGS` (`@bibi/auth`), or `lib/reserved-slugs.test.ts` fails.
- Query strings are a last resort: a date or period goes in the path (the calendar is `/calendar/{from}/{to}`, inclusive plain dates; the view is derived from the range), only optional filters stay a query. Why: ADR 0064.
- Server components and layouts call `setRequestLocale(locale)`; convert `locale` with `resolveLocale`.
- `sv` (`packages/i18n/messages/sv/*.json`) is the source of truth for typed keys. Dynamic keys must be unions (see `ErrorKey`). Client messages are scoped per route surface (`src/i18n/surface-messages.ts`).
- **UI Copy & Action Verb Taxonomy:**
  - Action-first pattern: `[Action Verb] + [Noun]` (e.g. `Create order`, `Delete venue`). Never use adjective shorthand (`New order`).
  - **Create over New:** For anything that creates an entity or resource, always use **Create** (sv: *Skapa*) and never *New* (sv: *Ny*). Applies to button labels, tooltips, action menus, page titles, empty-state CTAs, and breadcrumbs.
  - Controlled vocabulary: `Create` (not New/Add/Make), `Add` (attaching existing records or line items), `Edit` (not Change/Modify/Update), `Delete` (permanent destruction), `Remove` (detaching without destroying), `Save` (persisting forms, not Submit/Done).
  - Modal confirm buttons repeat the action verb (`Create venue`, `Delete role`), never generic `OK` or `Submit`. Cancel action is always `Cancel` (sv: `Avbryt`). Empty state CTA is always `Create [entity]`.

## Forms (all input in the UI)
- Every form is a shadcn form: `Form`, `FormController` (shadcn's `FormField`), `FormItem`, `FormLabel`, `FormControl` and `FormMessage` from `@bibi/ui`, with react-hook-form and `zodResolver` with localised messages (`useZodMessages`). The schema comes from core (`@bibi/core/schemas`, via `formSchema({ schema, toInput })` when needed), never a hand-written duplicate.
- Fields: `TextField` and `CheckField` (`components/form/`) require `<Form {...form}>` around the form. Other controls are built with `FormController` directly.
- Field errors show in `FormMessage` under the field. Server field errors (`AppError.issues`, `path` = field name) are set with `form.setError`.
- **Create and update are pages, not dialogs** (except tiny actions: archive, rename, assign, confirm). Create lives at `/new/<thing>`, update at `/<things>/<id>/update`. Multi-step creates use `components/wizard/`; add the thing to `NEW_PARENTS` in `breadcrumb-model.ts`.
- **Forms that change data** are always submitted via a server action (`features/<entity>/actions.ts` → `runOperation` → `toActionResult`). No `fetch` from forms.
- The toast flow is owned by the helpers, never by the component:
  - Forms: `useFormAction({ form, action, messages, onSuccess?, onError? })` (`lib/use-form-action.ts`).
  - Actions without fields: `useToastAction().run({ action, messages, onSuccess? })` (`lib/use-toast-action.ts`). `ConfirmDialog` has no error box: the outcome is a toast and the caller closes the dialog on success.
  - One toast id per process: `toast.loading(pending)` is replaced by `toast.success(success, { id })`.
  - Errors are a **persistent** toast with a close button (`duration: Infinity, closeButton: true`). Network errors become `errors.network`.
  - `messages` come from i18n: `common.saving`/`archiving`/`sending` for pending, the entity's own key for the outcome (e.g. `venue.created`).
- Dates are never `<input type="date">`. A date field is `DateField` (a time too: `DateTimeField`), a span is `PeriodRangeButton` (`components/date-picker/`): a button that writes the date in the user's date format and opens the shadcn Calendar (a span adds presets and closes on the second day). Plain days (`YYYY-MM-DD`) stay strings in forms and paths.
- A dialog confirms destructive actions only (archive, delete, remove, revoke, disconnect). Every other change saves without asking, through the pending → outcome toast, the same on the settings pages and in the assistant's settings card.
- Text inputs always save with a **Save** button, never on change or blur. Selects and switches save on change (auto-save) through the same flow; on error the field is reset via `onError`.
- References: `features/venue/ui/venue-form.tsx` and `features/venue/ui/archive-venue-dialog.tsx`.
- Exceptions: sign-in and account forms use `useAuthFormAction` through the Better Auth client (OAuth needs the signed `sig` query and a browser redirect); search and filter forms navigate by URL with no action or toast; the chat composer streams via `useChat`.
- Load errors (not action outcomes): `ErrorState` in server components, `InlineLoadError` in client islands.
- `ErrorBanner`, `useActionSubmit` and `useAuthSubmit` are removed. Do not reintroduce equivalent patterns.

## Tables (ADR 0040)
- Every table is a shadcn TanStack table, rendered with `ClientDataTable` (for client-filtered/paginated tables) or `PersistedDataTable` (`components/data-table/`, on `DataTable` in `@bibi/ui`) with a stable `tableId`. Build column arrays with `createTableColumns` (`@bibi/ui`) so the 7 zones are concatenated in canonical order automatically, and use `statusColumn`, `dateColumn`, `numberColumn` and `actionsColumn` from `@bibi/ui`. Extract a `use-<entity>-columns` hook only when columns are shared between a page table and an assistant card; otherwise keep columns in the table file. Never a raw `<table>`, never the `Table*` primitives directly, never another table library. Only exception: the calendar grid.
- All columns are sortable. Standard left-to-right order (enforced by `createTableColumns({ select, primary, relations, status, dates, numbers, actions })`):
  1. `select`: Optional multiselect checkbox (`selectable`, pinned left).
  2. `primary`: Main title, name or identifier (semi-bold, accessible `<Link>`).
  3. `relations`: Descriptive columns & relations in the organization's order (type, venue, customer, category, assignee).
  4. `status`: Operational status or state (built with `statusColumn` or `<StatusBadge label={...} color={...} />` from `@bibi/ui`, which renders `<Badge variant="secondary" className="gap-1.5"><ColorSwatch color={...} />{label}</Badge>`; never a lone dot without text, never a competing outline or solid badge variant, and always placed before dates/times and numbers).
  5. `dates`: Dates and times (`dateColumn`; when, receivedAt, publishedAt, createdAt; left-aligned under the column header).
  6. `numbers`: Numbers, headcount and amounts (`numberColumn`).
  7. `actions`: Row actions (`actionsColumn`, pinned right).
- Users reorder columns by drag and drop (always on); the checkbox and row actions stay pinned. The order is saved per user and per table as a server-side user preference, not in `localStorage`.
- Search & filter: every list page provides search and filtering via `QuerySearch` (`components/query-search/query-search.tsx`) or `TableFilterBar` + `useClientTableView` (`components/data-table/`), with autocomplete qualifier suggestions (`key:value`, e.g. `status:...`, `assignee:...`, `type:...`, `role:...`, `channel:...`, `city:...`). Query state syncs to URL `?q=...`; a second table on a page passes `scope` for its own keys.
- Quick filter pills (left of `QuerySearch`) are rare: only a lifecycle state with two to four values that staff switch between every day (read/unread, open/closed). Never for types, roles, groups or anything in the administration area; those are qualifiers typed in the search.
- Row click & navigation: `onRowClick` on `PersistedDataTable` navigates to the record's primary detail page (or opens its slide-over sheet for activity rows). Title cells keep a `<Link>` for new-tab and keyboard accessibility. Interactive sub-elements (checkboxes, tags, sub-links, action buttons) stop event propagation.
- Row actions & context menu: row actions are the last column (`actionsColumn`), always sticky to the right edge. Handled by `DataTableRowActions`: primary actions as buttons on wide tables, folding into an overflow menu below `@2xl`. Every action in `actionsColumn` must also be mirrored in the right-click menu (`rowMenu` on `PersistedDataTable`).
- Multiselect & bulk actions: enable `selectable={true}` whenever batch actions exist. Selected rows activate `DataTableToolbar` above the table with selection count and `bulkActions` buttons. Changing pages or search clears selection.
- Pagination & sorting: all list pages use `PersistedDataTable`'s integrated `DataTablePagination` with standard page sizes (`[25, 50, 100]`), page counts, and server-side sorting (`manualSorting` syncing `sort` and `dir` to the URL). External pagination controls (e.g. `CursorPagination`) are retired.
- Activity tables (notifications, the inbox) keep read and unread in one table so marks never move rows: unread white with a dot, read grey (`rowClassName`), a small context line over the title, and a quick action in place of the time on hover. Opening an item that changes state (read on open) shows the title as `Shimmer` while the server action runs. Why: ADR 0040.

## `"use client"`
- Set only at the client boundary: components that a server component renders and that themselves have state, context or browser events. Children and hooks inherit the boundary.
- Never add `"use client"` to make a hook work. What a page renders on the server is prepared on the server: dates and amounts come from `getDateTimeFormat()` / `getNumberFormat()` and go down as props (`dates`, `numbers`); a component shared with an assistant card takes them as props and the card passes its hook's. `pnpm check:structure` flags client-only hooks reachable from a page through server files (`tools/lib/server-render-rules.mjs`).
- A table inside a card runs edge to edge: `flush` on the table (`FinanceSection flush` for the card), the card's heading and text keep their padding. Never a bordered table in a card (no box in a box). Why: ADR 0086.

## Page loading (ADR 0097)
- A light page (at most five operations) renders in one pass, with no `Suspense`.
- A heavy page renders its header and key facts first. Wrap every section that loads its own data in `DeferredSection` (`components/states/deferred-section.tsx`); a section fed by props stays unwrapped. Content that is usually empty (issue alerts) uses `<Suspense fallback={null}>`. One boundary per section, never per row, never a one-off skeleton.
- Whole-page states sit in the middle of the viewport, whatever the page: `RouteLoading` and a page-level `ErrorState` render through `ViewportCenter` (`components/states/viewport-center.tsx`). An error inside a section, card or tab passes `inline` and stays in place.
- Every route group has a `loading.tsx` that renders only `RouteLoading` (`components/states/route-loading.tsx`: the `Loading` wordmark from `@bibi/ui`, centred). Never a page-shaped skeleton or another spinner in a `loading.tsx`.
- A record read by both `generateMetadata` and the page goes through a `cache()` loader (`features/<x>/load-<x>.ts`, like `load-order.ts`). Never run the same read twice in one request.
- Organization config is read once per request through shared cached loaders (`server/load-entity-types.ts`) and filtered in memory. No cross-request cache: it would skip `execute`'s permission check and log.
- Independent reads go in one `Promise.all`; await in sequence only when a read needs the previous result.
- A screen whose first paint needs several features reads a view read model (ADR 0071) instead of joining owner operations in the page, unless the view computes more than the first paint shows: then read just what the header needs (the order page reads its own customer and contact by id; `order.view` serves the assistant).
- Budget: at most five operations before first paint. In development, a request over 25 operations logs `web.request.op_budget` (`server/operation-budget.ts`); fix the page, never raise the budget.

## Effects
- Data a page needs is read on the server (`runOperation` in the server component) and passed down as props. When an input needs new data, change the URL (path or filter) so the server renders again. Never fetch in `useEffect`.
- A client island that needs server data later gets a promise from its server parent and unwraps it with `use()` inside `Suspense` (see "Page loading").
- Input the user is still changing (a typeahead, a live check, a preview) is answered by `useLiveQuery` (`lib/use-live-query.ts`), the one effect that fetches. Never write another.
- Values derived from props or state are computed during render, never copied into state by an effect. Reset state on a prop change with `key`.
- A reaction to a user action goes in the event handler or the server action, not in an effect that watches state.
- `useEffect` is only for syncing with something outside React: subscriptions (SSE), timers, browser APIs (shortcuts, focus, measuring, animation). Each effect gets a one-line comment naming that system.

## Cards and stat figures (ADR 0086)
- A headline figure is a `StatCard` (`@bibi/ui`) in `StatCards`: its line, tooltip texts and trend are prepared on the server (`features/dashboard/lib/stat-trend.ts`, `use-stat-texts.ts`) from a core `Trend`; never compute a trend in the client.
- A row holds cards of one kind: charts with charts, tables full width. Charts and tables never share a row.
- A date range is the one range picker (`PeriodRange`); no previous or next buttons.
- Switching between whole views of one page (the dashboards) is a `ViewSwitcher` (`@bibi/ui`) in the header, not `Tabs`; `Tabs` are for parts of a view.
- A page whose tabs or range are in the path keeps its header (title, picker, tabs) in a layout above those segments, reading them with `useParams`. Switching tabs or ranges navigates directly between URLs with standard Next.js navigation (`Link`, `router.push`), with no custom transition provider. See `features/dashboard/ui/dashboards-shell.tsx`.

## The assistant (ADR 0007, 0008)
- `features/assistant/`: `AssistantProvider` in the shell holds ONE `useChat` for the home page and ⌘K. The assistant exists only on `/` (ADR 0035); `ask` and `prefill` start a conversation and navigate there.
- Generative UI: `resolveToolUi` (`@bibi/ai/ui`) gives `{ component, props }`; `ui/generative/components.ts` is exhaustive at compile time, so a new key in `@bibi/ai` is a type error here until the component exists. Cards are built from `@bibi/ui`.
- Settings in chat: `settings.view({ keys })` (core, a view read model) answers the settings asked about, and owner reads and changes of settings map to the same `setting-cards` component: one card, one row per key. `SETTING_ROWS` (`features/settings/ui/setting-rows.ts`) has one row per `SettingKey`; a key is its administration section's id, so the row takes the section's title and links to it. Each row renders that section's own editor (an editor takes its value, `canEdit` and `onSaved`; without `onSaved` it refreshes the page). A setting that saves on change is an `AutoSaveSelect` (`components/form/`). An edit in a row saves like on its administration page (Forms rule below): the editor's server action with its pending → outcome toast, then `onSaved` puts the saved group back into the card's shared view. The chat does not react. When the user asks the assistant to change a setting, it shows the card (`settings.view`), not an update proposal. Editability comes from `useCan` (`components/shell/permissions-context.tsx`); the operation checks again. A new setting adds a key in core, its group in `load-settings-view.ts`, an editor used by both its section and its row, and an entry in `SETTING_ROWS`.
- Approval cards POST the decision to `/api/assistant/approval`; the client adds nothing to the chat, the server saves a TOOL message and the next turn reads history from the database.
- `WEB_OAUTH_CLIENT_ID` + `x-bibi-actor: ai` are handled by `packages/auth` (only this client may act as AI). `provision:oauth` registers a redirect URI that is never followed (the code is read in-process), so **no callback route exists or is needed**.

## Superadmin (ADR 0015)
- `src/app/[locale]/(admin)/admin/` with its own shell. `server/platform-guard.ts`: anonymous → login, otherwise 404 unless superadmin. Platform data goes through `runPlatformOperation`, never `runOperation`. AI models are chosen only in `/admin/ai-models`.
- Granting: `pnpm --filter @bibi/auth grant-superadmin <email>`.

## Webhooks
- `POST /api/webhooks/resend`: inbound mail, stored as an EMAIL `InboundMessage` via `inboundMessage.receive`: on the order for `order-<id>@<domain>`, in the organization's inbox for its address (ADR 0012, 0085, `packages/mail`).
- `POST /api/webhooks/stripe`: signed with `STRIPE_WEBHOOK_SECRET`; runs the SYSTEM-only `payment.applySignal` and `paymentAccount.applySignal` (ADR 0028).
- `POST /api/webhooks/stripe-billing`: Bibi's own subscription, signed with the secret stored in `/mothership/billing` (never env); runs the SYSTEM-only `billing.applySignal` (ADR 0095).

## Commands and environment
- `pnpm --filter @bibi/web dev | build | start | typecheck | test`. First time: `docker compose up -d postgres`, `pnpm db:migrate`, `pnpm --filter @bibi/core seed:skills`, `pnpm --filter @bibi/web provision:oauth` (prints `WEB_OAUTH_CLIENT_ID=...` for `.env`).
- Environment variables are read only via `@bibi/config`. `E2E_MOCK_MODEL` is ignored in production. E2E: see `e2e/README.md`.

## Pitfalls
- `loading.tsx`/`error.tsx`/`not-found.tsx` need `// biome-ignore lint/style/noDefaultExport` (see `[locale]/error.tsx`).
- Auth pages opened by OAuth (`sig` in the query) must not redirect signed-in users.
- Sign-in is magic link only (ADR 0005). Inside an OAuth flow the link returns to `/login?<signed query>`, which renders `OAuthResume` (`oauth2.continue({ postLogin: true })`) instead of the form.
- The web font for `--font-serif` is not loaded yet; the system serif is used until the Claude Design export exists.
