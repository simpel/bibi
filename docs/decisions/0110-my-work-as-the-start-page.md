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
1. `/:org` is **My work**: the signed-in member's run sheet rows per day, what they must act on and their unread notifications, for today, tomorrow or this week (`/my-work/{from}/{to}`, ADR 0064). It asks the assistant from a prompt box.
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
