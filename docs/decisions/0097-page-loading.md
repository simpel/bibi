# 0097 – Page loading: one pass for light pages, streaming for heavy ones, budgets for both

- **Date:** 2026-11-05
- **Status:** Accepted (approved by the user on 2026-11-05)
- **Related:** 0003 (parity), 0007 (AI-first UX), 0010 (web data access), 0014 (system logging), 0050 (feature scope), 0071 (view read models)

## Context
- A survey of every page under `[org]/(app)` (2026-11-05) found:
  - The `(app)` layout runs 7 operations, in three sequential stages, on every full render.
  - The heaviest pages run 17–38 operations: `/orders/[id]`, `/new/order` and `/calendar`.
  - There are no `loading.tsx` files, so every navigation waits for the whole tree before anything paints.
  - Detail pages read their record twice, once in `generateMetadata` and once in the page.
  - `listEntityTypes` runs up to six times in one request, once per base.
  - Many independent reads are awaited one after another.
- Per request:
  - `getSession` runs twice, in `getSessionState` and in `resolveExecuteContext`.
  - `ensureOperations()` rebuilds the operation registry on every `runOperation`.
- The assistant has no read that answers "what is the state of order #72" in one call. It makes 5–8 MCP calls and joins them in the prompt, which is the cost ADR 0071 was written to remove.
- Each process (web, MCP, worker) opens its own `pg` pool. Nothing says how large the pools may be.

## Decision
1. **Two kinds of page.**
   - A **light page** (at most five operations) renders in one pass, with no `Suspense`.
   - A **heavy page** renders its header and key facts in the first pass. Every section that loads its own data goes in `DeferredSection` (`apps/web/src/components/states/deferred-section.tsx`), which shows `SectionSkeleton` from `@bibi/ui`. Content that is usually empty (issue alerts) streams with `fallback={null}`, so a placeholder never flashes and vanishes.
2. **Every route group has a `loading.tsx`** rendering `RouteLoading` (the `Loading` wordmark from `@bibi/ui`, centred), so a navigation gives feedback at once. Next.js shows it only when the page is not ready yet.
3. **One read per request.**
   - A record that both `generateMetadata` and the page need is read through a `cache()` loader (`features/<x>/load-<x>.ts`).
   - Organization configuration (entity types, statuses, vocabularies, items for pickers) is read once through shared cached loaders and filtered in memory.
   - Session resolution runs once per request.
4. **Independent reads go in one `Promise.all`.** An `await` chain is allowed only when a read needs the previous one's result.
5. **A screen whose first paint needs several features gets a view read model** (ADR 0071). The first is `order.view`: the order with its status, customer, contact, assignees, line totals, balance and issue count, each field gated by its feature's `read`. Because views are ordinary operations, the assistant gets the same answer in one tool call. `venue.hoursList` replaces one `getVenueHours` call per venue on the calendar.
6. **Budget:**
   - At most five operations before first paint.
   - In development, a request that runs more than 25 operations logs `web.request.op_budget` with its count and path.
7. **Pool policy:**
   - `DATABASE_POOL_MAX` (default 10) sizes each process's pool.
   - The sum over processes (web, MCP, worker, plus the notification `LISTEN` connection) stays below Postgres `max_connections`.
   - Production runs behind PgBouncer in transaction mode.

## Rejected
- **A cross-request config cache** (`unstable_cache` with tag invalidation). It would bypass `execute`, so permission checks and the operation log would be skipped for cached reads, and invalidation would have to follow every config command. A per-request cache gives most of the gain with none of that risk. This can be revisited with measurements.
- **Better Auth `cookieCache`.** It saves the session query, but a revoked session or a removed member stays valid until the cookie expires. Passing the already-resolved session through the request instead saves the same query.
- **A skeleton on every section, or `Suspense` on light pages.** Placeholders that resolve within a frame make the page flicker and look slower than a single paint.
- **Raising the pool size as the fix.** It hides the query count rather than lowering it, and multiplies across processes.

## Consequences
- `apps/web/CLAUDE.md` gets a "Page loading" section with these rules. Its earlier "no `loading.tsx` needed" note goes.
- `packages/core/CLAUDE.md` "Feature scope" says a heavy screen gets a view read model.
- A view duplicates some selection logic of the owner operations. That is accepted per ADR 0071.
- A view must not pull work the first paint does not show. `order.view` computes line totals, issues and the balance, so it answers the assistant and its card in one call; the order page's first paint reads only the order, the statuses and its own customer and contact by id (`load-order-names.ts`), and the sections that need the form data stream it in through one cached `loadOrderData`.
- The op-budget log makes regressions visible in development without a CI check. A CI check can follow once the numbers are stable.
