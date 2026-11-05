# 0076 – Free status movement by default, an admin-only flow, and a status picker on boards

- **Date:** 2026-11-01
- **Status:** Accepted
- **Related:** 0067 (amends §4 to §6, addendum 2026-10-30), 0050 (permissions), 0034, 0003 (parity)
- **Spec:** `docs/specs/orders-statuses-and-states.md`, `docs/specs/boards.md`

## Context
- ADR 0067 copied Jira: every status lists the statuses it may move to (`OrderStatusTransition`), and gates sit on those moves. A new organization must wire the whole graph before a card can move.
- The graph is edited in an "Edit transitions" dialog opened from the board. It lists every target with three gate checkboxes ("A reason", "A main assignee", "An accepted quote") and no sentence saying what the gate does. Staff cannot tell what it changes or that it changes the pipeline for everyone.
- Any member with `pipeline:write` can open it, because boards and flow share one permission.
- HubSpot is the model we want: the pipeline is set up once by an admin, any stage can move to any stage, required fields are set per stage, and boards are views.

## Decision
1. **Movement is free by default.** An order may move from any status to any other. A status can opt in to a restriction: **Allowed next: Any / Only these** (`OrderStatus.restrictsNext`, default false). With "Only these" the admin picks the allowed targets (`OrderStatusTransition` rows). A free status keeps no transition rows. Closing statuses keep ADR 0067 §2 (no move leaves one). A status with a quote `event` is entered only by that event, never by hand.
2. **Gates attach to the target status, with an optional source.** A gate (`OrderStatusGate`) has a target status (`toStatusId`), a source that is a specific status or null for **any status** (`fromStatusId`), and a key (`REASON`, `ASSIGNEE`, `ACCEPTED_QUOTE`). The gates of a move from A to B are the gates into B with source null plus the gates into B with source A. All failing gates are reported (ADR 0067 §6). "Any status to Lost needs a reason" is one rule, not one per source. `OrderStatusTransitionGate` is dropped.
3. **The flow is admin-only.** `pipeline:write` and `pipeline:delete` stay admin-preset-only by default and now cover the flow: statuses, flags, order, Allowed next, gates, item states, the status grid and pipeline setup. Admins can still grant them per member or key (ADR 0050). Boards and phases move to a new permission feature `board` (`board:read|write|delete`). **Deviation:** the first draft proposed `pipeline:configure`. Only admins held `pipeline:write` by default, so "anyone sets up views" needs its own permission, and the flow stays on the existing admin-only one.
4. **Boards stay open to anyone with `board:write`.** The manager preset has `board` in full, the member preset has `read`. They choose which statuses show, group them into named phases (columns), set the filter and the order. They never edit movement rules. The board UI has no transition editor. Customize mode (`?mode=customize`) needs `board:write`; creating, editing or archiving a status inside it needs `pipeline:write`.
5. **Dropping on a phase with several statuses opens a picker.** The dialog lists the statuses of that phase the order may move to, each with its requirements in words. A phase with one allowed status moves at once; none shows a message. A refused move names every blocker. A column is one drop target (no per-status drop zones).
6. **The flow editor lives on `/settings/pipeline`**, a section under the status table, shown only with `pipeline:write`. Per status a sentence switch ("can move to any status / only to...") with a checklist. Per target, sentence checkboxes ("Moving to X requires a reason / a main assignee / an accepted quote"), each with "From any status" or "Only from specific statuses". No bare checkbox grid.
7. **Migration** `20261205000000_free_status_movement`. A gate on from-to becomes a gate into `to` from `from`. A status whose transitions already list every other active status becomes free; the others become restricted with their list. The demo seed is updated (ADR 0043).

## Consequences
- Core: `orderStatus.setTransitions({ id, allowedNext: "ANY" | "ONLY_THESE", toStatusIds })`; new `orderStatus.setGates({ id, gates: [{ fromStatusId | null, gates }] })` replaces all gates into a status (REST `PUT /order-statuses/{id}/gates`, GraphQL, MCP `orderStatus_setGates`). Both need `pipeline:write`. `importTemplate` returns `gatesAdded`; template `gatesIn` become from-any gates. Board and phase operations use `board:*`. Parity in web, GraphQL, REST and MCP.
- Web: remove the transition dialog from the board; add the flow editor on `/settings/pipeline` and the status picker on drop. Strings in sv and en.
- Docs: ADR 0067 gets an addendum pointing here; `docs/specs/orders-statuses-and-states.md`, `docs/specs/boards.md`, `docs/specs/permissions.md`, `docs/domain-model.md` and `docs/artifacts/domain-model.html` together; `packages/core/CLAUDE.md`.
- Demo seed: statuses are free, `gatesIn` become from-any gates, and one restricted status (Lindholmen "Final count locked").

## Alternatives rejected
- **Pure HubSpot, no restrictions.** Simplest. Rejected: venues need to block moves such as leaving Completed or skipping Confirmed.
- **Keep the explicit graph as the default.** Rejected: every new organization must wire it first and the result is hard to read.
- **One org-wide free/explicit switch.** Rejected: a single strict status would force the whole graph.
- **Hard-code the admin role.** Rejected: breaks per-member overrides (ADR 0034, 0050).
- **A new `pipeline:configure` permission.** Rejected: the flow stays on the existing admin-only `pipeline:write`; the new permission goes to boards instead (`board`).
- **Gates on the destination only, with no source.** Rejected: "needs a reason only from Quote sent" is a real case; the optional source covers it.
