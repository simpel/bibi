# 0076 – Free status movement by default and an admin-only flow

- **Date:** 2026-11-01
- **Status:** Accepted
- **Related:** 0067 (amends §4 to §6), 0050 (permissions), 0034, 0003 (parity)
- **Spec:** `docs/specs/orders-statuses-and-states.md`, `docs/specs/boards.md`

## Context
- ADR 0067 copied Jira: every status lists the statuses it may move to, and gates sit on those moves. A new organization must wire the whole graph before a card can move.
- Boards and the flow shared one permission, so any member who could edit a board could change the pipeline for everyone.
- HubSpot is the model: an admin sets up the pipeline once, any stage can move to any stage, required fields are set per stage, and boards are views.

## Decision
1. Movement is free by default. A status can opt in to a restriction (`OrderStatus.restrictsNext`, default false) and then lists its allowed targets. Closing statuses keep ADR 0067 §2. A status with a quote event is entered only by that event.
2. Gates attach to the target status with an optional source (`OrderStatusGate`: target, source status or null for any, and a key). The gates of a move are those into the target from any status plus those from the specific source. All failing gates are reported (ADR 0067 §6).
3. The flow is admin-only. `pipeline:write` and `pipeline:delete` stay admin-preset-only and cover statuses, flags, Allowed next, gates, item states and the status grid. Boards and phases move to a new permission feature `board`.
4. Boards stay open to anyone with `board:write`. They choose which statuses show, group them into phases and set filters. They never edit movement rules.
5. Dropping on a phase with several statuses opens a picker listing the allowed targets and their requirements. A refused move names every blocker.

## Rejected
- Pure HubSpot with no restrictions. Venues need to block moves such as leaving Completed.
- Keep the explicit graph as the default. Every new organization must wire it first.
- One organization-wide free/explicit switch. One strict status would force the whole graph.
- Hard-code the admin role. It breaks per-member overrides (ADR 0034, 0050).
- A new `pipeline:configure` permission. The existing admin-only `pipeline:write` already fits; the new permission goes to boards.
- Gates on the destination only. "Needs a reason only from Quote sent" is a real case.

## Consequences
- `orderStatus.setTransitions` and `orderStatus.setGates` need `pipeline:write` and exist on every surface (ADR 0003).
- A migration turns existing from-to gates into gates into the target, and makes a status free when it already lists every other active status.
- ADR 0067 §4 to §6 are amended here; its closing-status rule stays.
