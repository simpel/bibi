# 0097 – Page loading: one pass for light pages, streaming for heavy ones, budgets for both

- **Date:** 2026-11-05
- **Status:** Accepted
- **Related:** 0003, 0007, 0010, 0014, 0050, 0071

## Context
- A survey found the app layout runs seven operations in three sequential stages on every render, and the heaviest pages run 17 to 38.
- There were no loading states, detail pages read their record twice, and many independent reads were awaited one after another.
- The assistant had no single read for "the state of order #72". It made 5 to 8 MCP calls, the cost ADR 0071 exists to remove.
- Each process opens its own database pool and nothing bounded their total.

## Decision
1. Two kinds of page. A light page (at most five operations) renders in one pass. A heavy page renders its header and key facts first and streams each section that loads its own data.
2. Every route group has a loading state, so a navigation gives feedback at once.
3. One read per request. A record needed by both metadata and the page goes through a `cache()` loader. Organization configuration is read once through shared cached loaders. Session resolution runs once.
4. Independent reads go in one `Promise.all`. A chain is allowed only when a read needs the previous result.
5. A screen whose first paint needs several features gets a view read model (ADR 0071). The first is `order.view`, with each field gated by its feature's `read`, so the assistant gets the same answer in one call.
6. Budget: at most five operations before first paint. In development, a request over 25 operations logs `web.request.op_budget`.
7. Pool policy: `DATABASE_POOL_MAX` sizes each process's pool, and the sum over processes stays below Postgres `max_connections`. Production runs behind PgBouncer in transaction mode.

## Rejected
- A cross-request config cache with tag invalidation. It would bypass `execute`, skipping permission checks and the operation log, and invalidation would follow every config command.
- Better Auth `cookieCache`. A revoked session or removed member stays valid until the cookie expires.
- A skeleton on every section or `Suspense` on light pages. Placeholders that resolve within a frame make the page flicker.
- Raise the pool size as the fix. It hides the query count and multiplies across processes.

## Consequences
- A view duplicates some selection logic of the owner operations, accepted per ADR 0071.
- A view must not compute what the first paint does not show.
- The budget log makes regressions visible in development. A CI check can follow once numbers are stable.
