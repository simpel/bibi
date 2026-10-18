# 0041 – Three primary views: assistant, pipeline, dashboard

- **Date:** 2026-10-17
- **Status:** Accepted
- **Related:** 0035 (chat-first navigation), 0036 (sidebar information architecture), 0038 (page width tiers), 0040 (data tables)

## Context
- Staff move between three kinds of work: asking the assistant, moving inquiries and bookings forward, and checking the current state of the business.
- Only the first has a home today. The rest is reached through flat entity lists.

## Decision
- The app has three primary views, linked at the top of the sidebar:
  1. **Assistant** at `/` (unchanged, ADR 0035).
  2. **Pipeline** at `/pipeline`: one kanban board for inquiries and bookings. Inquiry columns come first (NEW, QUALIFIED, QUOTED), then the organization's booking statuses ordered by phase and position. A won inquiry becomes a booking and continues on the same board. Cancelled and lost items sit in a collapsed Closed lane.
  3. **Dashboard** at `/dashboard`: the current state (counts by stage and phase, upcoming bookings, items that need attention). Revenue is deferred until bookings have a price source; the panel is reserved.
- Both new pages are full width (`(canvas)`, ADR 0038).
- Dragging a card calls the existing commands: `booking.changeStatus` for bookings, `inquiry.qualify` and `inquiry.markLost` for inquiries. Moves into QUOTED and WON are not draggable because they belong to `quote.send` and `quote.accept`.
- Board and dashboard data come from new core operations (`pipeline.board`, `dashboard.summary`) exposed on web, GraphQL, REST and MCP (ADR 0003), with generative UI cards for the assistant.
- Bookings are grouped by `BookingStatus.phase`, never by status name (ADR 0021).

## Consequences
- The sidebar gets a `primary` group in `nav-items.ts`, between the assistant zone and Work (refines ADR 0036).
- `@okazi/ui` gets a kanban component (on the `@dnd-kit` packages already used by data tables) and a chart component.
- Revenue reporting needs its own decision (payments, accepted quotes or booking totals) before the dashboard shows money.

## Addendum 2026-10-18 – columns are organization phases (ADR 0043)
- Board columns are the organization's own ticket phases, in position order, with terminal phases in the collapsed Closed lane. Cards are tickets. There are no fixed inquiry columns.
- A drag calls `ticket.changePhase`. A refused move lists its blocking lines (ADR 0044). Phases with an event or a reason flag open the matching dialog instead of dropping directly.
- Dashboard counts group by phase flag, not phase name.
