# Okazi – context for Claude

## Product
- SaaS booking system for conferences + food & drink at venues without a hotel PMS: experience centres, museums, conference estates, manor houses, restaurants with private rooms.
- Reference customer in mind: World of Volvo (Gothenburg).
- Main competitor: Lega Online (Multinet Interactive AB). See `docs/market/`.

## Differentiators (drive prioritisation)
- Predefined tickets for smaller meetings: staff create a ticket with its lines in one step without a quote, and the customer pays via a Swish or card link or by invoice. Okazi is an internal tool for staff. Guests and customers never use the app; they only see the payment page.
- Needs as counts against the organization's own lists (e.g. the EU's 14 allergens as an importable template), matched against items and compiled into sheets. No personal data about guests.
- Versioned sheets (e.g. kitchen order) sent to a responsibility (e.g. head of kitchen), plus export (json, pdf, csv) for handover outside the system.
- Configurable domain: each organization sets up its own types, fields, lists, statuses and responsibilities (ADR 0021, 0034). Access uses fixed roles: owner, admin, member, viewer.
- A ticket moves through the organization's own phases, and each line (room, food, activity) has a state per phase set in a grid: soft holds with a held-since date and one expiry date per ticket, hard holds that block (ADR 0043, 0044).
- Swedish integrations: Fortnox, Visma, Swish, BankID, Peppol/e-invoicing (Swish, Fortnox, Visma and Peppol deferred, ADR 0028 and 0029).
- Okazi's own prices are published and venues can sign up without talking to sales.

## Domain model
- Source: `docs/domain-model.md`. Update it and `docs/artifacts/domain-model.html` together.

## Language
- **English everywhere.** Code, comments, test names, log and error messages, docs, ADRs, CLAUDE.md/AGENTS.md, skills, AI prompts, commit messages, issues and PRs are written in English.
- **Swedish only in translations:** `packages/i18n/messages/sv.json`. The only other exception is test input that specifically exercises Swedish text (e.g. handling of Swedish characters).
- UI text always goes through next-intl, in both sv and en.
- File and directory names are in English.
- See `docs/decisions/0009-language-in-code-and-ui.md`.

## Conventions
- Decisions are logged as ADRs in `docs/decisions/NNNN-title.md`.

## Tech stack
- Monorepo: pnpm workspaces + Turborepo, TypeScript (strict).
- Web: Next.js (App Router), React.
- Data: Prisma on Postgres with pgvector (Docker image `pgvector/pgvector`).
- Auth: Better Auth with the organization plugin (multi-tenancy), API key plugin (REST) and OAuth plugin (MCP).
- APIs: GraphQL via Pothos (Zod-derived types, no Prisma plugin), REST `/api/v1` with OpenAPI generated from operations, MCP server (`apps/mcp`).
- AI: Vercel AI SDK via AI Gateway, provider-agnostic, Claude by default.
- UI: Tailwind v4 (CSS-first tokens), cva, shadcn primitives, Storybook for `packages/ui`.
- i18n: next-intl, Swedish and English.
- Tooling: Biome (lint + format), Vitest (unit/service layer against real Postgres), Playwright (e2e).
- Email: `@okazi/mail` with a `MailProvider` interface (`send`, `parseInbound`, `fetchInbound`). Adapters: Resend (production, outbound and inbound) and SMTP (Mailpit in dev), selected by `MAIL_PROVIDER` (`smtp` default, `resend` needs `RESEND_API_KEY`; inbound needs `RESEND_WEBHOOK_SECRET` and `MAIL_INBOUND_DOMAIN`). Inbound replies arrive at `POST /api/webhooks/resend` and are stored as `InboundEmail` on the ticket whose address (`ticket-<id>@<domain>`) they were sent to. See `docs/decisions/0012-email-provider.md`.
- Stripe webhook: `POST /api/webhooks/stripe`, signed with `STRIPE_WEBHOOK_SECRET`, runs SYSTEM-only `payment.applySignal` and `paymentAccount.applySignal`. See `docs/decisions/0028-payments-with-stripe.md`.
- Jobs: pg-boss in `apps/worker` (queue and cron in Postgres). Jobs call core operations as SYSTEM. See `docs/decisions/0027-job-scheduler.md`.
- Logging: pino via `@okazi/logger`, JSON to stdout and the `SystemLog` table, request context with `AsyncLocalStorage`. See `docs/decisions/0014-system-logging.md`.
- Ops: Docker (compose with Postgres and Mailpit, `--profile app` for web + mcp), GitHub Actions for CI.
- Decisions: `docs/decisions/0002-tech-stack-and-monorepo.md` and others.

## Architecture principles
- **Harmonisation and patterns first.** Look for existing patterns and reuse them before introducing anything new. Propose harmonisation rather than a new pattern. Extract shared code at the second duplicate, not the third.
- **1:1 parity.** Every command exists in web, GraphQL, REST and MCP. Every entity can be read via graph, REST and MCP. A parity test in CI verifies this. See `docs/decisions/0003-parity-architecture.md`. The only exception is platform operations (`packages/core/src/platform/`, ADR 0015): they exist only in the web app's `/admin`, for platform admins.
- **New capability = new core operation first.** The operation is defined once in `packages/core` (Zod in/out, permission, handler). The adapters then expose it in the same change.
- **AI-first.**
  - The assistant uses the app's own MCP server as the signed-in user. It gets no special path into the service layer.
  - Mutations require human approval. AI proposes, the user confirms. Audit logs `actor=ai|user` and the conversation id.
  - Every result type has a generative UI component in `@okazi/ui`.
  - Searchable entities implement `Embeddable`.
  - Reusable AI behaviour lives as skills (System / Organization / Personal), not as ad hoc prompts.
  - See `docs/decisions/0007-ai-first-ux.md` and `docs/decisions/0008-semantic-search-and-skills.md`.
- **Configurable domain.** No domain words in code. The organization defines types, fields, lists, ticket phases, item states and responsibilities as data. Every ticket and item has one assignee plus followers (ADR 0034). Code owns only generic behaviours (`PRICED`, `COMPOSABLE`, `CHOICES`, `BOOKABLE`, `SETUPS`) and flags on phases and states (ADR 0043, 0044). Templates are optional data. See `docs/decisions/0021-configurable-items.md`.
- **Multi-tenant.** Everything is scoped by `organizationId`. Every mutation is logged in `AuditLog`. See `docs/decisions/0004-multi-tenancy.md` and `docs/decisions/0006-database-conventions.md`.
- **Everything is logged.** Core `execute` writes one system log row per operation (succeeded, rejected or failed). Every entry point opens a request context with `requestId` and `surface`, which also end up on `AuditLog`. See `docs/decisions/0014-system-logging.md`.

## Code rules
- Max 150 lines per file and max 40 lines per function. One idea per file.
- Named exports only. `default` is used only for Next.js page, layout and route.
- No barrel files except the package's `src/index.ts`.
- Functions take ONE typed object parameter, e.g. `fn({ a, b }: FnInput)`. No positional parameters.
- Strict TypeScript. No `any`.
- Zod at every boundary: HTTP, GraphQL arguments, MCP tool input, env and AI output.
- Environment variables are read only via `@okazi/config`.
- Errors are typed `AppError` and returned as `Result`. No thrown strings.
- Log only via `getLogger()` from `@okazi/logger`, with a stable `event` (`<area>.<event>`). Never `console.*` (Biome `noConsole`). Never log input or output, passwords, tokens or full email addresses (`maskEmail`).
- A new HTTP entry point is wrapped in `withRequestLogging({ surface, handler })`. Other entry points (CLI, jobs) run in `runWithLogContext`.
- Feature folders have fixed file names: `schema.ts`, `operations.ts`, `graphql.ts`, `rest.ts`, `mcp.ts` and `ui/`.
- UI is built only from `@okazi/ui`. Variants use cva. Tokens live in one file.
- **Every table is a shadcn TanStack table** (shadcn's data-table pattern on `@tanstack/react-table`). Never a raw `<table>`, never another table library or a hand-rolled list pretending to be a table. In the web app a table is always rendered with `PersistedDataTable` (`apps/web/src/components/data-table/`, on `DataTable` in `@okazi/ui`) with a stable `tableId`; columns live in a `use-<entity>-columns` hook; the assistant's card has its own hook and `tableId` with the same cells. Never use the `Table*` primitives directly. The only exception is the calendar grid (a keyboard-navigated time grid, not a table of records). See `docs/decisions/0040-data-tables.md`.
  - **All columns are sortable.**
  - **Column order**, left to right:
    1. Multiselect checkbox, only if bulk editing benefits the list.
    2. Main title, name or identifier.
    3. Descriptive columns (the organization's own fields), in the order the organization defines them.
    4. Status.
    5. Dates and times, then numbers and amounts.
    6. Row actions, always the far-right column.
  - **Users reorder columns by drag and drop.** This is always on and not a setting. The checkbox and row actions stay pinned at the edges. All other columns, including the title, can be moved. The order above is the default.
  - **The order is saved per user and per table** as a user preference on the server, not in `localStorage`, so it follows her across devices. It is restored on every visit, so she always sees the same order.
  - **Row actions** go in a `DropdownMenu` submenu. Every action in it has a text label. Never an icon-only action button.
- `"use client"` is set only at the client boundary: components that a server component renders and that themselves have state, context or browser events. Children and hooks inherit the boundary and get no directive of their own.
- Verified with `pnpm check:structure`.

## Forms (applies to all input in the UI)
- Every form is a shadcn form: `Form`, `FormController` (shadcn's `FormField`), `FormItem`, `FormLabel`, `FormControl` and `FormMessage` from `@okazi/ui`, with react-hook-form and `zodResolver` with localised messages (`useZodMessages`). The schema comes from core (`@okazi/core/schemas`, via `formSchema({ schema, toInput })` when needed), never a hand-written duplicate schema.
- Fields: `TextField` and `CheckField` (`apps/web/src/components/form/`) are shadcn fields and require `<Form {...form}>` around the form. Other controls (select etc.) are built with `FormController` directly.
- Validation is shown the shadcn way: field errors in `FormMessage` under the field. Server field errors (`AppError.issues`, `path` = field name) are set on the fields with `form.setError`.
- **Forms that change data** are **always** submitted via a server action (`features/<entity>/actions.ts` → `runOperation`/`runPlatformOperation` → `toActionResult`). No `fetch` calls from forms.
- The toast flow is owned by the helpers, never by the component:
  - Forms: `useFormAction({ form, action, messages, onSuccess?, onError? })` (`lib/use-form-action.ts`).
  - Actions without fields (archive, publish, share, …): `useToastAction().run({ action, messages, onSuccess? })` (`lib/use-toast-action.ts`). `ConfirmDialog` has no error box: the outcome is a toast and the caller closes the dialog on success.
  - Each process has **one** toast id: `toast.loading(pending)` is replaced by `toast.success(success, { id })`.
  - Errors become a **persistent** toast with a close button (`duration: Infinity, closeButton: true`). Network errors become `errors.network`.
  - `messages` come from i18n: `common.saving`/`archiving`/`sending` for pending, the entity's own key for the outcome (e.g. `venue.created`).
- Auto-save (e.g. a select that saves on change) uses the same flow. On error the field is reset via `onError`.
- References: `features/venue/ui/venue-form.tsx` (form) and `features/venue/ui/archive-venue-dialog.tsx` (action without fields).
- Exceptions, with reasons:
  - **Sign-in and account** (`features/auth/ui`): shadcn `Form` and the same toast flow via `useAuthFormAction`, but the call goes through the Better Auth client, not a server action. Better Auth's OAuth provider plugin carries the signed authorize query (`sig`) and performs the redirect to the next OAuth step in the browser, which the MCP sign-in requires.
  - **Search and filter forms** (URL navigation only): shadcn `Form`, but no server action and no toast.
  - **The chat composer** streams via `useChat` to `/api/chat`, which a server action cannot do.
- Load errors (not the outcome of an action): `ErrorState` in server components, `InlineLoadError` in client islands (e.g. the history list, live search). A toast on every search would be noise.
- `ErrorBanner`, `useActionSubmit` and `useAuthSubmit` have been removed. Do not reintroduce equivalent patterns.

## Package layout
- `apps/web`: the Next.js app (UI, server actions, `/api/chat`).
- `apps/mcp`: MCP server, stdio and streamable HTTP.
- `apps/worker`: pg-boss job scheduler and queue worker (ADR 0027). Jobs run core operations as SYSTEM.
- `packages/core`: operations, Zod schemas, permissions and `AppError`/`Result`. The single source of truth for logic.
- `packages/db`: Prisma schema, migrations and org-scoped client.
- `packages/auth`: Better Auth configuration and shared session and permission resolution.
- `packages/graphql`: Pothos schema, generated from core operations and entities.
- `packages/api`: REST `/api/v1` and OpenAPI.
- `packages/ui`: components, tokens and Storybook.
- `packages/i18n`: messages, sv and en.
- `packages/ai`: AI SDK setup, MCP client, the generative UI registry and system skills.
- `packages/config`: environment variables (typed and validated) plus shared tsconfig and Biome config.
- `packages/mail`: `MailProvider` with SMTP and Resend adapters, `sendMail` (logs `mail.sent`/`mail.failed`) and `createMemoryMailProvider` for tests.
- `packages/logger`: the system log (pino), request context, `withRequestLogging` and the test helper `captureLogs`.

## Platform admin
- `/admin` in the web app: system log and AI model per feature. Only for `user.role = admin`, granted with `pnpm --filter @okazi/auth grant-admin <email>`. See `docs/decisions/0015-platform-admin.md`.
- AI models (chat and embedding) are controlled **only** in `/admin/ai-models`, never via env. No model selected = the feature returns `UNAVAILABLE` and logs an error.
- New AI feature: an entry in `AI_FEATURES` (core), `resolveAiModel({ feature })` where it runs, and texts in `admin.aiModels.features`.

## Working with subagents
- Baseline: Sonnet.
- Opus for architecture and security: auth, tenancy scoping, the parity core (`packages/core`), MCP auth and the approval flow.
- Haiku for mechanical work: boilerplate, i18n strings and doc sync.
- Start parallel subagents per independent package.
- The main agent owns integration and the parity test. Subagents must not change each other's packages until the main agent has integrated.

## Issues and project board
- All work is tracked on https://github.com/users/simpel/projects/8 (kanban). Not project 7.
- Every piece of work has an issue on the board. If none exists, create it (`gh issue create`, then `gh project item-add 8 --owner simpel --url <issue>`) and set Status, Priority (P0–P2) and Size (XS–XL).
- Move the card when the work changes state: `Backlog` → `Todo` → `In progress` when work starts → `Done` when merged. `Parked` = the `work-backlog` run could not land the work and pushed it to a `parked/<issues>` branch (linked in the issue comment); fix it there or move the card back to `Todo`. Update with `gh project item-edit` (field ids via `gh project field-list 8 --owner simpel`).
- PRs link the issue with `Closes #NN`. Comment on the issue with what was done if the work is split up or abandoned.
- Every ticket that adds or changes data or behaviour has a **Seed data** section: which files in `packages/core/src/seed/demo/` (data, `seed-*.ts`, `checks.ts`, `reset.ts`) and `docs/demo-seed.md` change, or an explicit "No seed change" with the reason. A ticket is not done until `seed:demo` runs from an empty database with green checks.
- `gh` needs the `project` scope (`gh auth refresh -s project`).
- Autonomous ticket work: the `work-backlog` workflow (`.claude/workflows/work-backlog.js`) picks unblocked `Todo` tickets (not `type:decision`), up to 3 at a time. Each ticket gets its own worktree (`pnpm wt:new t-<N>`, branch `ticket/<N>`, own database), is implemented and fully verified there, then lands on `main` one ticket at a time: one commit with `Closes #N`, rebased on `origin/main`, re-verified if `main` moved, pushed. The main checkout is never touched, so you can keep working in it. A ticket that stays red, fails tenancy review, conflicts or is blocked is pushed to `parked/<N>`, commented on and moved to `Parked`; the others still land. Out-of-scope problems the agents notice are not fixed in place: after each batch they are deduplicated against open issues and filed with the label `source:agent` in `Backlog` (filter the board with `-label:source:agent` to hide them). The run never picks a `source:agent` ticket until a human moves it to `Todo`. It loops until no unblocked ticket is left (safety cap 50 batches). Model per ticket from labels: Opus (core features, auth, db, size L), Sonnet otherwise; Everything deterministic is a script in `tools/backlog/` (`select.mjs`, `prep.sh`, `checks.sh`, `land.sh`, `park.sh`, `release.sh`; `land.sh` skips the re-check when `main` has not moved) and Haiku only runs them as a one-command runner; Sonnet or Opus work only where judgment is needed (implement, fix rounds, rebase conflicts, tenancy review). Never Fable.

## Commands
- `docker compose up -d`: starts Postgres and Mailpit (mail at http://localhost:8025).
- `pnpm install`: installs dependencies.
- `pnpm db:migrate`: runs database migrations.
- `pnpm --filter @okazi/core seed:skills`: seeds system skills.
- `pnpm --filter @okazi/core seed:demo`: creates two demo organizations via core operations (spec: `docs/demo-seed.md`, built in slices per ADR 0025).
- `pnpm --filter @okazi/web provision:oauth`: creates the assistant's OAuth client and prints `WEB_OAUTH_CLIENT_ID=...` (put it in `.env`, read by web and MCP).
- `pnpm dev`: starts the web app (:3000) and the MCP server (:3001) via Turborepo.
- `pnpm wt:new <name> [--base <ref>] [--branch <branch>]`: a git worktree in `../okazi-worktrees/<name>` with its own database (`okazi_<name>`), ports (3100+/3200+) and `.env`. `pnpm wt:rm <name> [--force] [--delete-branch]` drops it, `pnpm wt:list` lists them. Scripts in `tools/worktree/` (Superset's `.superset/*.sh` just call them).
- Tests load the root `.env` via `loadTestEnv()` (`@okazi/config/load-test-env`) in every `vitest.config.ts`, with `AI_GATEWAY_API_KEY` blanked: tests never call paid AI.
- `pnpm lint`: Biome check.
- `pnpm check:structure`: checks file size, function size, exports, barrel files and feature files.
- `pnpm typecheck`: TypeScript for all packages.
- `pnpm test`: Vitest and the parity test.
- `pnpm --filter @okazi/web test:e2e`: Playwright with a scripted model (`E2E_MOCK_MODEL`), see `apps/web/CLAUDE.md`.

## Open questions
- Pricing model (per venue, per room, per ticket) not decided.
- Claude Design export (tokens) for `packages/ui` not delivered. Placeholder tokens are used until then.
- Staging: production only until the first paying venue (ADR 0031). Hosting per `docs/decisions/0013-hosting-and-deploy.md` (Hetzner + Coolify, accepted; runbook `docs/runbooks/deploy.md`).
- Payments (Stripe) and invoicing (Stripe) decided in `docs/decisions/0028-payments-with-stripe.md` and `0029-invoicing-via-stripe.md`. Swish, Fortnox, Visma and Peppol are deferred.
