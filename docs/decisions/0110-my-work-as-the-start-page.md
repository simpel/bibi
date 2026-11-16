# 0110 – My work is the start page; the assistant moves to `/assistant`

- **Date:** 2026-11-14
- **Status:** Accepted (the user's decision, 2026-11-14: a personal "my current situation" start page instead of the chat, built from the reviewed wireframe)
- **Amends:** 0035 (the assistant was the home `/`)
- **Related:** 0007, 0034, 0055, 0071, 0080, 0094, 0097

## Context
- Staff land on the chat after sign-in. A head of kitchen or a guide opens Bibi to see what to prepare, run and set up today; an empty chat answers nothing until asked.
- The organization's dashboard (`/data`, ADR 0080, 0086) answers "how are we doing", not "what do I do today", and it is not personal.
- What a member must do is already in the data: current run sheet versions, assignments and default responsibilities (ADR 0055), staff item links, notifications (ADR 0094).

## Decision
1. `/:org` is **My work**: a timeline from today of every order that concerns the signed-in member, one card per order per day, its state as the card's outline (`/my-work/{from}/{to}`, ADR 0064; amended 2026-11-15 by the user's decision: it replaced the run sheet rows, To do, What changed and the prompt box).
2. The assistant moves to `/:org/assistant`. ⌘K, "Ask about this", "Create chat" and the sidebar's conversations open it there; nothing else about it changes.
3. One view read model, `myWork.view` (`self:read`, ADR 0071), serves the page and the assistant (MCP tool and card). Each part keeps its feature's `read` gate.
4. "Concerns me" is derived on read, never stored: main assignee or follower of the order, assignee or follower of the run sheet's responsibility (chosen or default, minus an unfollow), staffed on the line through a linked staff item, assignee or follower of the line's item, or recipient of the run sheet. To do counts only where the member acts: assignee, responsibility owner, staffed.

## Rejected
- Keep the chat as home and add My work as a page: staff still land on a blank chat every morning.
- Make the Workload dashboard the home: it is the organization's view, gated by feature, and not personal.
- Store a per-member task list: duplicates run sheets and assignments (ADR 0051) and drifts from them.

## Consequences
- Sign-in, the welcome flow and `ROUTES.home` lead to My work; e2e opens the assistant on `/assistant`.
- Prep lead times (bake at 09:00 for a 14:00 serving), verbs per run sheet and ticking rows off are not modelled; rows show at the line's start.

## Amendment 2026-11-16 (Accepted: the user's decision, 2026-11-16)
- **Context:** the timeline answers "what am I part of", not "what must I do". Action flags sit small on cards, spread over two weeks; double bookings, overdue money and orders left open do not show at all.
- **Decision:** My work opens with **Needs you**, derived tasks grouped Blocked, Late, Today, Soon and Waiting on customer, above the timeline; one new view read model `myWork.tasks` (spec: home). Tasks are derived on read, never stored, so decision 4 and the rejected stored task list stand. "Late" is a fixed lead before the order's first line start (24 h for run sheets, 48 h for soft holds), a past `dueDate` on money, or an order whose lines have ended and whose status does not close.
- **Rejected:** flags on cards only (today's page: easy to miss); a stored, tickable task list (drifts from run sheets and holds, ADR 0051); per-organization leads now (no data on what venues need; add when a venue asks).
