# 0041 – Three primary views: assistant, pipeline, dashboard

- **Date:** 2026-10-17
- **Status:** Accepted
- **Related:** 0035 (chat-first navigation), 0036 (sidebar information architecture), 0038 (page width tiers), 0040 (data tables), 0043 (ticket and phases), 0044 (line states)

## Context
- Staff move between three kinds of work: asking the assistant, moving tickets forward, and checking the current state of the business.

## Decision
- The app has three primary views, linked at the top of the sidebar:
  1. **Assistant** at `/` (ADR 0035).
  2. **Pipeline** at `/pipeline`: one kanban board of tickets. The columns are the organization's own ticket phases in position order (ADR 0043), with terminal phases in a collapsed Closed lane. A card shows the ticket's customer, type, period, headcount, assignee, time in phase and how many lines are held, booked or blocked.
  3. **Dashboard** at `/dashboard`: the current state (counts by phase flag, upcoming tickets, items that need attention). Revenue is deferred until tickets have a price source; the panel is reserved.
- Both new pages are full width (`(canvas)`, ADR 0038).
- Dragging a card calls `ticket.changePhase`. A refused move opens a dialog listing its blocking lines (ADR 0044). Phases with a quote event or a required reason are not dropped directly: the matching command or reason dialog opens instead.
- Board and dashboard data come from core operations (`pipeline.board`, `dashboard.summary`) exposed on web, GraphQL, REST and MCP (ADR 0003), with generative UI cards for the assistant.
- Counts and filters group by phase flag, never by phase name (ADR 0021).

## Consequences
- The sidebar gets a `primary` group in `nav-items.ts`, between the assistant zone and Work (ADR 0036).
- `@bibi/ui` has a kanban component (on the `@dnd-kit` packages already used by data tables) and a chart component.
- Revenue reporting needs its own decision (payments, accepted quotes or ticket totals) before the dashboard shows money.
