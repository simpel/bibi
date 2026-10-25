# 0071 – View read models: one query per screen, every field gated by its feature

- **Date:** 2026-10-25
- **Status:** Accepted
- **Amends:** 0050 (the feature scope rule)
- **Ticket:** #484
- **Related:** 0003 (parity), 0007 (AI-first UX), 0044 (holds), 0052 (the line is the booking), 0059 (buffers and allocations), 0064 (time)

## Context
- ADR 0050 decided that an operation returns only its own feature's data. Another feature's record is an id, resolved through that feature's own operation. The goal is that denying `read` hides a feature everywhere.
- The availability calendar (`Calendar/Availability` in Storybook, now `/calendar`) is the first screen designed from what staff need rather than from the tables. Each booking shows:
  - the customer and their contact,
  - the guest count and what the booking is worth,
  - the staff notes,
  - who to call internally and who works it,
  - the state, its hold and its buffers.
- Under ADR 0050 that is seven owner reads per screen: occupancy, line, ticket, customer, contact, assignment and member. Most of those operations have no bulk `ids` filter, so the web app would add one to each, then join the results by hand.
- The assistant is a second client (ADR 0007). Through MCP it would make the same seven calls, and repeat the join in a prompt, to answer "what is on Thursday?". That costs tokens, adds latency and gives the assistant more ways to get it wrong.
- The rule is already bent where it matters: `calendar.range` returns the line's name gated by `program:read` and the state's name and colour gated by `pipeline:read`. The calendar works because of that exception.
- The goal of ADR 0050, "denying `read` hides a feature everywhere", is about **what a caller sees**. "Ids only" is one way to get there, not the goal itself.

## Decision
1. **A view read model is a query operation that answers one screen's question.** It joins whatever the screen needs, across features. Examples: `calendar.range` today; a ticket board and the dashboard later.
2. **Every field from another feature is gated by that feature's `read`.** The field is `null` (or the list is empty) when the caller lacks it, never an error. One helper in core does the gating (`visibleTo({ context, feature, value })`), so the rule lives in one place and a test can cover each field.
3. **Views never write and never become the owner.** Commands, single-entity reads and archiving stay on the owner feature's operations. A view's output is never stored as a snapshot.
4. **The operation's own permission is the screen's** (`ticket:read` for the calendar). Its description lists which fields need which feature, so an LLM can tell "hidden" from "empty".
5. **Parity is unchanged.** A view is an ordinary operation, so GraphQL, REST and MCP expose it like any other. The assistant gets the screen's answer in one tool call, and its generative UI can render the same `@bibi/ui` component as the page.
6. **ADR 0050's feature scope rule now reads:** "An owner operation returns only its own feature's data; a view read model may join others', each field gated by its feature's `read`."

## Consequences
- `calendar.range` grows with gated fields:
  - the customer name and the client contact (`customer:read`),
  - the guest count, the line's value, quantity and notes (`program:read`),
  - our contact for the line and the staff who work it (colleagues' names are shared vocabulary).
- The web loader stays one call per range chunk, and the assistant answers calendar questions in one call.
- The owner list operations do not need bulk `ids` filters added only to serve screens.
- Views duplicate some selection logic (which columns of a ticket a screen shows). That is accepted: a view is shaped by its screen and changes with it.
- Risk: a view that leaks a field without a gate. Mitigation: the gating helper, and a per-view test that runs as a caller without each feature's `read` and expects `null`.
- `packages/core/CLAUDE.md` "Feature scope" is updated to the new wording.

## Rejected
- **Compose in each client from owner operations with new `ids` filters.** This keeps ADR 0050 literally, but costs one call per feature and per range chunk. Every client (web, MCP assistant, API users) would repeat the join, and the assistant would pay for it in tool calls and tokens.
- **Join in GraphQL resolvers.** Only GraphQL would benefit, which breaks 1:1 parity (ADR 0003).
- **Drop feature scope entirely.** That would lose "denying `read` hides a feature everywhere", which is the part staff and admins rely on.
