# Bibi – context for Claude

## Product
- SaaS booking system for conferences + food & drink at venues without a hotel PMS: experience centres, museums, conference estates, manor houses, restaurants with private rooms.
- Reference customer in mind: World of Volvo (Gothenburg).
- Main competitor: Lega Online (Multinet Interactive AB). See `docs/market/`.

## Differentiators (drive prioritisation)
- Predefined orders for smaller meetings: staff create a order with its lines in one step without a quote, and the customer pays via a Swish or card link or by invoice. Bibi is an internal tool for staff. Guests and customers never use the app; they only see the payment page.
- Needs as counts against the organization's own lists (e.g. the EU's 14 allergens as an importable template), matched against items and compiled into run sheets. No personal data about guests.
- Versioned run sheets (e.g. kitchen order) sent to a responsibility (e.g. head of kitchen), plus export (json, pdf, csv) for handover outside the system.
- Configurable domain: each organization sets up its own types, fields, lists, statuses and responsibilities (ADR 0021, 0034). Access uses three fixed roles as presets (member, manager, admin) of `<feature>:<action>` permissions, which admins fine-tune per member or API key with allow/deny overrides (ADR 0034, 0050).
- A order moves through the organization's own statuses, and each line (room, food, activity) has a state per status set in a grid: soft holds with a held-since date and one expiry date per order, hard holds that block (ADR 0043, 0044). A order may move to any status unless a status restricts its next move; gates sit on the target status, and the flow is admin-only (`pipeline:write`) while boards use `board:*` (ADR 0076).
- Swedish integrations: Swish (Swish Handel) and Visma eEkonomi are built as providers beside Stripe and Fortnox (ADR 0100): a venue connects its own accounts, routes card, Swish and invoices to them and Bibi starts refunds, voids and credit notes. Fortnox and Visma raise and book invoices (SIE skips them); Fortnox payments are mirrored, Visma's are polled. Accounting systems without a connection are reached through the SIE 4I export (ADR 0077). Decided, not built (ADR 0106): every order is business or private, money needs a connected Fortnox or Visma, which issues every invoice (deposits as prepayment invoices) and sends it, Peppol included; Bibi numbers nothing and the SIE export and Bibi-only invoices go. The buyer's reference sits on the order, inherited from the contact (ADR 0105). BankID is deferred (ADR 0029).
- Bibi's own prices are published and venues can sign up without talking to sales: 9 990 SEK a month excl. VAT (yearly 10 % off), 10 seats included, extra seats 49 SEK a month, 14 days free, then the app waits for payment (ADR 0095).

## Domain model
- Source: `docs/domain-model.md`. Update it and `docs/artifacts/domain-model.html` together.

## Language
- **English everywhere.** Code, comments, test names, log and error messages, docs, ADRs, CLAUDE.md/AGENTS.md, skills, AI prompts, commit messages, issues and PRs are written in English.
- **Swedish only in translations:** `packages/i18n/messages/sv/*.json`. The only other exception is test input that specifically exercises Swedish text (e.g. handling of Swedish characters).
- UI text always goes through next-intl, in both sv and en.
- File and directory names are in English.
- **Action verb taxonomy (controlled vocabulary).** For anything that creates an entity or resource, always use the active verb **Create** (Swedish: *Skapa*), never *New* (Swedish: *Ny*) or *Make*. Follow `[Action Verb] + [Noun]` (e.g. `Create order`, `Create venue`, `Create chat`).
  - **Create** (*Skapa*): Bringing a new entity into existence (not New, Add, Make, Generate).
  - **Add** (*Lägg till*): Attaching an existing entity or child record to a list/container (e.g. `Add member`, `Add line`).
  - **Edit** (*Redigera*/*Ändra*): Modifying an existing record (not Change, Modify, Update).
  - **Delete** (*Ta bort*/*Radera*): Permanently destroying a record (not Remove, Trash).
  - **Remove** (*Ta bort*/*Koppla bort*): Detaching without destroying the underlying record.
  - **Save** (*Spara*): Confirming/persisting form changes (not Submit, Done, Apply).
- See `docs/decisions/0009-language-in-code-and-ui.md`.

## Conventions
- **Rules live in the nearest `CLAUDE.md`** (root only for what crosses packages), written as short imperatives, never as catalogs the code already shows. **ADRs** (`docs/decisions/NNNN-title.md`) record why, and only for a decision that is costly to reverse (schema, auth, money, tenancy, parity, infrastructure) and had a real rejected alternative. Everything else is a spec in `docs/specs/` (entities in `docs/domain-model.md`) or nothing, when the code shows it. An ADR fits on one page: Context, Decision, Rejected, Consequences; no UI copy, step flows, field lists or file catalogs. A small change edits the spec, not a new ADR. A rule links its reason in one line (`Why: ADR NNNN`).
- **Versioning (ADR 0060).** Every app and package has its own semver, from Conventional Commits by path (`feat:` minor, `fix:` patch, `!` major). Commit titles are `<type>: <summary>`. release-please opens a release PR that bumps each changed `package.json` and its `CHANGELOG.md`; merging it creates the `@bibi/<name>-vX.Y.Z` tags and GitHub releases. Never edit versions or changelogs by hand.

## Tech stack
- Monorepo: pnpm workspaces + Turborepo, TypeScript (strict).
- Web: Next.js (App Router), React.
- Data: Prisma on Postgres with pgvector (Docker image `pgvector/pgvector`).
- Auth: Better Auth with the organization plugin (multi-tenancy), API key plugin (REST, keys belong to the organization, ADR 0050) and OAuth plugin (MCP).
- APIs: GraphQL via Pothos (Zod-derived types, no Prisma plugin), REST `/api/v1` with OpenAPI generated from operations, MCP (`apps/mcp`, served by the web app at `/mcp`, ADR 0104).
- AI: Vercel AI SDK via AI Gateway, provider-agnostic, Claude by default.
- UI: Tailwind v4 (CSS-first tokens), cva, shadcn primitives and shadcn AI Elements (chat, message, prompt input, suggestion, confirmation, questionnaire), React Flow for the onboarding path (ADR 0045), Storybook for `packages/ui`.
- i18n: next-intl, Swedish and English.
- Tooling: Biome (lint + format), Vitest (unit/service layer against real Postgres), Playwright (e2e).
- Email (`packages/mail`), file storage (`packages/storage`), Stripe webhook (`apps/web`), jobs (`apps/worker`, pg-boss), logging (`packages/logger`, pino): see each folder's `CLAUDE.md`.
- Ops: Docker (compose with Postgres and Mailpit, `--profile app` for web + mcp), GitHub Actions for CI.
- Decisions: `docs/decisions/0002-tech-stack-and-monorepo.md` and others.

## Architecture principles
- **Harmonisation and patterns first.** Look for existing patterns and reuse them before introducing anything new. Propose harmonisation rather than a new pattern. Extract shared code at the second duplicate, not the third.
- **1:1 parity.** Every command exists in web, GraphQL, REST and MCP. Every entity can be read via graph, REST and MCP. A parity test in CI verifies this. See `docs/decisions/0003-parity-architecture.md`. The only exception is platform operations (`packages/core/src/platform/`, ADR 0015): they exist only in the web app's `/admin`, for superadmins.
- **New capability = new core operation first.** The operation is defined once in `packages/core` (Zod in/out, permission, handler). The adapters then expose it in the same change.
- **AI-first.**
  - The assistant uses the app's own MCP server as the signed-in user. It gets no special path into the service layer.
  - Mutations require human approval. AI proposes, the user confirms. Audit logs `actor=ai|user` and the conversation id.
  - Every result type has a generative UI component in `@bibi/ui`.
  - Searchable entities implement `Embeddable`.
  - Reusable AI behaviour lives as skills (System / Organization / Personal), not as ad hoc prompts.
  - See `docs/decisions/0007-ai-first-ux.md` and `docs/decisions/0008-semantic-search-and-skills.md`.
- **Configurable domain.** No domain words in code. The organization defines types, fields, lists, order statuses, item states and responsibilities as data. Every order and item has one assignee plus followers (ADR 0034). Code owns only generic capabilities (`PRICED`, `BUNDLE`, `CUSTOMISATIONS`, `BOOKABLE`, `SETUPS`) and flags on statuses and states (ADR 0043, 0044). Templates are optional data. See `docs/decisions/0021-configurable-items.md`.
- **Capabilities, demands, buffers and database triggers** (ADR 0059, 0053): `packages/core/CLAUDE.md`, `packages/db/CLAUDE.md`.
- **Permissions and feature scope** (ADR 0050, 0071): `<feature>:<action>` with fixed role presets and per-member overrides; an owner operation returns only its own feature's data, a view read model joins others' with each field gated by that feature's `read`. Details in `packages/core/CLAUDE.md`.
- **Single source of truth.** Every column is owned, derived, a projection or a snapshot (ADR 0051). A fact lives in one place; defaults are inherited (`null` = inherit), never copied; references are foreign keys, never id lists or ids in JSON (ADR 0056). Projections are written only by the database or one named function and have a reconciliation check. Triggers that write projections are listed in `packages/db/CLAUDE.md`. The line is the booking and quotes and invoices are snapshots of lines (ADR 0052). Balances are derived (ADR 0057). Domain history never comes from `AuditLog`.
- **Time (ADR 0064, accepted, partly built).** Every stored time is an instant; a plain date is only a code-level key, never a column. A zone is read only through `effectiveTimeZone` (`packages/core/src/time/time-zone.ts`: venue, else `OrganizationProfile.timeZone`), never from a constant or the browser; the web app gets it from `server/time-zones.ts` (next-intl's request config carries the organization's). Convert at the edges (forms, display). Hours are advisory: scheduling outside them is allowed and warns. Show relative time only with `RelativeTime` (always with an exact-time tooltip).
- **Fast pages (ADR 0097).** Light pages render in one pass; heavy pages paint the header first and stream sections; one read per request, independent reads in parallel, a view read model per heavy screen. Rules in `apps/web/CLAUDE.md` "Page loading".
- **Everything is logged.** Core `execute` writes one system log row per operation (succeeded, rejected or failed). Every entry point opens a request context with `requestId` and `surface`, which also end up on `AuditLog`. See `docs/decisions/0014-system-logging.md`.

## Code rules
- Aim for ~150 lines per file and ~40 lines per function as a guideline (not a hard CI check). Keep one cohesive idea per file; do not split a cohesive component or table column definition into tiny helper hooks just to hit a line count.
- Named exports only. `default` is used only for Next.js page, layout and route.
- No barrel files except the package's `src/index.ts`.
- Functions take ONE typed object parameter, e.g. `fn({ a, b }: FnInput)`. No positional parameters.
- Strict TypeScript. No `any`.
- Zod at every boundary: HTTP, GraphQL arguments, MCP tool input, env and AI output.
- Environment variables are read only via `@bibi/config`.
- Errors are typed `AppError` and returned as `Result`. No thrown strings.
- Log only via `getLogger()` from `@bibi/logger`, with a stable `event` (`<area>.<event>`). Never `console.*` (Biome `noConsole`). Never log input or output, passwords, tokens or full email addresses (`maskEmail`).
- A new HTTP entry point is wrapped in `withRequestLogging({ surface, handler })`. Other entry points (CLI, jobs) run in `runWithLogContext`.
- Feature folders have fixed file names: `schema.ts`, `operations.ts`, `graphql.ts`, `rest.ts`, `mcp.ts` and `ui/`.
- UI is built only from `@bibi/ui`. Variants use cva. Tokens live in one file.
- UI rules (forms, tables, `"use client"`, i18n): `apps/web/CLAUDE.md`.
- Verified with `pnpm check:structure`.

## Package layout
- `apps/web`: the Next.js app (UI, server actions, `/api/chat`).
- `apps/mcp`: MCP server. Its streamable HTTP handler is mounted by the web app (`/mcp`, ADR 0104); alone it runs only over stdio.
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
- `packages/mail`: `MailProvider` with SMTP and Resend adapters.
- `packages/storage`: `StorageProvider` with disk and S3 adapters (ADR 0063).
- `packages/logger`: the system log (pino) and request context.

## Working with subagents
- Baseline: Sonnet.
- Opus for architecture and security: auth, tenancy scoping, the parity core (`packages/core`), MCP auth and the approval flow.
- Haiku for mechanical work: boilerplate, i18n strings and doc sync.
- Start parallel subagents per independent package.
- The main agent owns integration and the parity test. Subagents must not change each other's packages until the main agent has integrated.

## Work flow
- Not all work needs an issue. Build it with the `implement` skill. Never push to `main` (it is protected): ship with `pnpm ship`, which opens a pull request that auto-merges once CI is green. Don't wait for it. Why: ADR 0098.
- **Build from the spec; ADRs only gate costly-to-reverse moves.** A feature needs no ADR. A decision that meets the ADR bar gets a one-page ADR first (Proposed, accepted by the user before building).
- Work that adds or changes data or behaviour updates the demo seed and is not done until `seed:demo` runs from an empty database with green checks. Run `seed:demo` once at the end of a batch, not after each small change, and skip it when nothing touches data or behaviour.
- **No browser checks.** Do not open the browser, take screenshots or start a preview to verify UI changes; the user checks visually. Verify with `node tools/ci/verify.mjs` (scoped to changed files), typecheck, lint and tests. Use the browser only when asked, or to debug a runtime error you cannot find from code (console and network reads, not screenshots).
- Batch UI changes: make several edits, let the user review them in one pass, then fix from their notes.
- **Document user-facing features on `/support`.** A change that adds or changes something users see adds or edits its question under `support.topics` in `packages/i18n/messages/{sv,en}/support.json` in the same change (the page reads topics and questions in file order, no code needed); a bigger flow also updates its step-by-step guide under `support.guides`. API, GraphQL and MCP changes go to `/developers` (`docs.json`). Write it like customer service: the question as a user would ask it, a friendly answer of two to four short sentences that says where to click, `\n` between paragraphs. No internal words (ADRs, permission keys, code names, "operation"), and only what is built, never what is planned.

## Commands
- `docker compose up -d`: starts Postgres and Mailpit (mail at http://localhost:8025).
- `pnpm install`: installs dependencies.
- `pnpm db:migrate`: runs database migrations.
- `pnpm --filter @bibi/core seed:skills`: seeds system skills.
- `pnpm --filter @bibi/core seed:demo`: creates two demo organizations via core operations (spec: `docs/demo-seed.md`, built in slices per ADR 0025).
- `pnpm --filter @bibi/web provision:oauth`: creates the assistant's OAuth client and prints `WEB_OAUTH_CLIENT_ID=...` (put it in `.env`, read by web and MCP).
- `pnpm dev`: starts the web app with MCP at `/mcp` (:3330) and Storybook (:3332) via Turborepo.
- `pnpm wt:new <name> [--base <ref>] [--branch <branch>]`: a git worktree in `../bibi-worktrees/<name>` with its own database (`bibi_<name>`), ports (a block of ten from 3340 up) and `.env`. `pnpm wt:rm <name> [--force] [--delete-branch]` drops it, `pnpm wt:list` lists them. Scripts in `tools/worktree/` (Superset's `.superset/*.sh` just call them).
- Tests load the root `.env` via `loadTestEnv()` (`@bibi/config/load-test-env`) in every `vitest.config.ts`, with `AI_GATEWAY_API_KEY` blanked: tests never call paid AI. `DATABASE_URL` is replaced by the test database: `TEST_DATABASE_URL` if set, else `<db>_test` (`bibi_test` in the main checkout, `bibi_<name>_test` in a worktree), so tests never write into the dev database.
- `pnpm test:db`: creates the test database if missing and applies migrations (pgvector included). `pnpm test` runs it first (Turbo `@bibi/db#migrate:test`); run it yourself before `vitest` in a single package after a new migration.
- `pnpm --filter @bibi/core cleanup:test-orgs`: opt-in dry run listing organizations left by old test runs in the dev database; `-- --yes` deletes them. Organizations with a real member are kept.
- `pnpm lint`: Biome check.
- `node tools/ci/verify.mjs [--all | --light | --only <id>]`: the checks CI runs (lint, structure, typecheck, migrate, test, build), defined once in `tools/ci/checks.json`; by default scoped to the files you changed (`build` only when apps or shared packages changed).
- `pnpm ship [--footer <text>]`: ships the commits `origin/main` lacks as a pull request with auto-merge (ADR 0098).
- `pnpm check:structure`: checks exports, barrel files, parameter objects, time/number rules, server render boundaries and feature files.
- `pnpm typecheck`: TypeScript for all packages.
- `pnpm test`: Vitest and the parity test.
- `pnpm --filter @bibi/web test:e2e`: Playwright with a scripted model (`E2E_MOCK_MODEL`), see `apps/web/CLAUDE.md`.

## Open questions
- Claude Design export (tokens) for `packages/ui` not delivered. Placeholder tokens are used until then.
- Staging: production only until the first paying venue (ADR 0031). Hosting per `docs/decisions/0013-hosting-and-deploy.md` (Hetzner + Coolify, accepted; runbook `docs/runbooks/deploy.md`).
- Payments and invoicing run through providers behind ports (`docs/decisions/0100-payment-providers-as-ports.md`, amending 0028, 0029, 0087 and 0090): Stripe, Swish, Fortnox and Visma. Peppol is sent by Fortnox or Visma, never by Bibi (ADR 0106).
