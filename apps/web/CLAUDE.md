# @bibi/web – context for Claude

Next.js 16 (App Router, Turbopack), React 19, next-intl 4, Better Auth client, `@bibi/ui`. The surface for venue staff. See ADR 0003, 0005, 0007, 0009 and 0010.

## Structure
- `src/app/[locale]/`: `(auth)` = sign-in flows, `[org]/(app)` = protected shell under the organization slug (ADR 0062). `/` is the assistant (ADR 0035), `/settings` the settings hub. `page.tsx`/`layout.tsx`/`route.ts` are thin: they read params and render a feature.
- Page width (ADR 0038): `[org]/(app)/(contained)/` pages sit in `PageContainer` (`@bibi/ui`); `(app)/(canvas)/` pages (`/`, `/calendar`) are full width and own their gutter and scrolling. A new page goes into one of the two groups; `AppShell` adds no container.
- `settings/*` is for admins only (ADR 0034): `settings/layout.tsx` shows a forbidden state and the sidebar hides the entry. Pages, navigation, the settings hub and the assistant follow the caller's effective permissions: a feature whose `view` is denied is hidden, not just disabled (`server/caller-abilities.ts`). Detail pages name their breadcrumb crumb with `CrumbName`.
- API routes: `api/auth/[...all]` (Better Auth), `api/graphql`, `api/v1/[...path]` (REST), `api/chat`, `api/assistant/approval`, `api/webhooks/resend` and `api/webhooks/stripe`, plus the `.well-known/oauth-*` discovery routes forwarded to Better Auth. Chat and approval routes set `runtime = "nodejs"`, `dynamic = "force-dynamic"` and `maxDuration`. New HTTP entry points are wrapped in `withRequestLogging`.
- `src/features/<entity>/ui/` = components per entity; `actions.ts` next to `ui/` = server actions. `features/web-surfaces.ts` lists which operations have UI (`UI_EXEMPT` in `ui-exempt.ts` lists operations deliberately without UI, with a reason).
- `src/components/` = app-level (`shell/`, `form/`, `data-table/`, `states/`, `confirm-dialog`). `src/server/` = server code only. `src/lib/` = pure helpers, tested with Vitest.
- `src/proxy.ts` is next-intl routing (Next 16's name for middleware, Node runtime), then it makes the URL's organization active for members (`server/sync-active-organization.ts`). `src/i18n/request.config.ts` is `*.config.ts` to allow a default export.

## Data access (a single path)
- Reads in server components: `runOperation({ operation, input })`. Commands: server action → `runOperation` → `toActionResult`. The caller comes from `resolveExecuteContext({ headers: await headers() })`, the same as GraphQL, REST and MCP.
- Never `@bibi/db`, a custom `ExecuteContext` or `fetch` against `/api/graphql` in the web app. Why: ADR 0010.
- Errors: `Result` → `handleLoadError` (401 → login, 404 → not-found, otherwise `ErrorState`), or `ActionResult` → toast. AppError code → `errors.*` in `lib/error-key.ts`.
- Client components must not import values from `@bibi/core` (the barrel pulls in Prisma). Zod schemas come from `@bibi/core/schemas`; `import type` from `@bibi/core` is free.
- The assistant does **not** go through `runOperation`: `/api/chat` runs the MCP client against `apps/mcp` as the user (ADR 0007).

## Adding a page/feature
1. Core operation first (`packages/core`), then GraphQL, REST and MCP.
2. `src/features/<entity>/actions.ts` and `ui/` (list = server component, form = client). Copy `venue/ui` and `item/ui`.
3. Page: `(contained)/<route>/page.tsx` (thin), nav in the right group of `components/shell/nav-items.ts` (configuration pages go to `settings-items.ts`, ADR 0036).
4. Add the operations to `WEB_SURFACES` (or `UI_EXEMPT`).
5. Text in `packages/i18n/messages/sv.json` and `en.json` (key parity is tested).

## i18n
- All text via `useTranslations` / `getTranslations`; no hardcoded strings or colors. Links, router, `usePathname` and `redirect` from `@/lib/navigation`, never `next/link`, `next/navigation`'s router or `@bibi/i18n/navigation` directly. Why: ADR 0062.
- App routes live under `app/[locale]/[org]/` (the organization slug). The wrapper prefixes scoped paths with the current slug and `usePathname` returns the path without it; server `redirect` needs `org` passed. A new top-level route outside `[org]` goes into `RESERVED_SLUGS` (`@bibi/auth`), or `lib/reserved-slugs.test.ts` fails.
- Query strings are a last resort: a date or period goes in the path (the calendar is `/calendar/{from}/{to}`, inclusive plain dates; the view is derived from the range), only optional filters stay a query. Why: ADR 0064.
- Server components and layouts call `setRequestLocale(locale)`; convert `locale` with `resolveLocale`.
- `sv.json` is the source of truth for typed keys. Dynamic keys must be unions (see `ErrorKey`).

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
- Auto-save (a select that saves on change) uses the same flow; on error the field is reset via `onError`.
- References: `features/venue/ui/venue-form.tsx` and `features/venue/ui/archive-venue-dialog.tsx`.
- Exceptions: sign-in and account forms use `useAuthFormAction` through the Better Auth client (OAuth needs the signed `sig` query and a browser redirect); search and filter forms navigate by URL with no action or toast; the chat composer streams via `useChat`.
- Load errors (not action outcomes): `ErrorState` in server components, `InlineLoadError` in client islands.
- `ErrorBanner`, `useActionSubmit` and `useAuthSubmit` are removed. Do not reintroduce equivalent patterns.

## Tables (ADR 0040)
- Every table is a shadcn TanStack table, rendered with `PersistedDataTable` (`components/data-table/`, on `DataTable` in `@bibi/ui`) with a stable `tableId`. Columns live in a `use-<entity>-columns` hook; the assistant's card has its own hook and `tableId` with the same cells. Never a raw `<table>`, never the `Table*` primitives directly, never another table library. Only exception: the calendar grid.
- All columns are sortable. Default order: multiselect checkbox (only if bulk editing helps), main title, descriptive columns in the organization's order, status, dates and times, numbers and amounts, row actions (far right).
- Users reorder columns by drag and drop (always on); the checkbox and row actions stay pinned. The order is saved per user and per table as a server-side user preference, not in `localStorage`.
- Row actions go in a `DropdownMenu` submenu, each with a text label. Never an icon-only action button.

## `"use client"`
- Set only at the client boundary: components that a server component renders and that themselves have state, context or browser events. Children and hooks inherit the boundary.

## The assistant (ADR 0007, 0008)
- `features/assistant/`: `AssistantProvider` in the shell holds ONE `useChat` for the home page and ⌘K. The assistant exists only on `/` (ADR 0035); `ask` and `prefill` start a conversation and navigate there.
- Generative UI: `resolveToolUi` (`@bibi/ai/ui`) gives `{ component, props }`; `ui/generative/components.ts` is exhaustive at compile time, so a new key in `@bibi/ai` is a type error here until the component exists. Cards are built from `@bibi/ui`.
- Approval cards POST the decision to `/api/assistant/approval`; the client adds nothing to the chat, the server saves a TOOL message and the next turn reads history from the database.
- `WEB_OAUTH_CLIENT_ID` + `x-bibi-actor: ai` are handled by `packages/auth` (only this client may act as AI). `provision:oauth` registers a redirect URI that is never followed (the code is read in-process), so **no callback route exists or is needed**.

## Superadmin (ADR 0015)
- `src/app/[locale]/(admin)/admin/` with its own shell. `server/platform-guard.ts`: anonymous → login, otherwise 404 unless superadmin. Platform data goes through `runPlatformOperation`, never `runOperation`. AI models are chosen only in `/admin/ai-models`.
- Granting: `pnpm --filter @bibi/auth grant-superadmin <email>`.

## Webhooks
- `POST /api/webhooks/resend`: inbound mail, stored as `InboundEmail` on the ticket for `ticket-<id>@<domain>` (ADR 0012, `packages/mail`).
- `POST /api/webhooks/stripe`: signed with `STRIPE_WEBHOOK_SECRET`; runs the SYSTEM-only `payment.applySignal` and `paymentAccount.applySignal` (ADR 0028).

## Commands and environment
- `pnpm --filter @bibi/web dev | build | start | typecheck | test`. First time: `docker compose up -d postgres`, `pnpm db:migrate`, `pnpm --filter @bibi/core seed:skills`, `pnpm --filter @bibi/web provision:oauth` (prints `WEB_OAUTH_CLIENT_ID=...` for `.env`).
- Environment variables are read only via `@bibi/config`. `E2E_MOCK_MODEL` is ignored in production. E2E: see `e2e/README.md`.

## Pitfalls
- `loading.tsx`/`error.tsx`/`not-found.tsx` need `// biome-ignore lint/style/noDefaultExport` (see `[locale]/error.tsx`).
- Auth pages opened by OAuth (`sig` in the query) must not redirect signed-in users.
- A magic link during an ongoing OAuth flow does not return to authorize (not verified). Password and OTP continue the flow.
- The web font for `--font-serif` is not loaded yet; the system serif is used until the Claude Design export exists.
