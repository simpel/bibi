# 0041 – Three primary views: assistant, pipeline, dashboard

- **Date:** 2026-10-17
- **Status:** Accepted
- **Related:** 0035, 0036, 0038, 0040, 0043, 0044, 0077, 0079

## Context
- Staff move between three kinds of work: asking the assistant, moving orders forward, and checking the state of the business.

## Decision
1. The app has three primary views at the top of the sidebar: Assistant at `/`, Pipeline at `/pipeline` and Dashboard at `/dashboard`. Pipeline and dashboard are full-width canvas pages.
2. The pipeline is one kanban board of orders. Its columns are the organization's own phases, with terminal phases in a collapsed lane. Dragging calls `order.changePhase`, and a refused move lists its blockers.
3. Board and dashboard data come from core operations (`pipeline.board`, `dashboard.summary`) on all four surfaces, with generative UI cards.
4. Counts and filters group by phase flag, never by phase name (ADR 0021).

## Rejected
- Showing money on the dashboard at first. Financials (ADR 0077) took it, and the dashboard later got a panel gated by `finance:read` (ADR 0079).

## Consequences
- The sidebar has a `primary` group between the assistant zone and Work.
- Revenue figures are derived on read from invoices, payments and refunds, and nothing is stored (ADR 0077).
