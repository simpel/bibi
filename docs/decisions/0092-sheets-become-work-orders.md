# 0092 – Sheets become work orders

- **Date:** 2026-11-02
- **Status:** Accepted
- **Amends:** 0021, 0050 (the `sheet` feature)
- **Related:** 0003, 0009, 0055, 0060, 0051

## Context
- A sheet is what one responsibility (kitchen, coordinator, guide) delivers for one order: its lines, fields and counted needs, versioned with changes marked.
- "Sheet" reads as a spreadsheet or printout, not a job. Staff say kitchen order.
- The UI also has drawers called sheets, so the word meant two things in code.

## Decision
1. The concept is called work order. Swedish UI says "Order".
2. The rename goes all the way down: Prisma models, columns, operations (`workOrder.*`, `workOrderDefinition.*`), the permission feature `workOrder`, GraphQL, REST, MCP, routes and generative UI keys.
3. Data survives. One migration renames in place and rewrites stored permission overrides.
4. Drawers stay "sheet". Those are UI, not this concept.
5. Old names are not kept as aliases. The API change is breaking (ADR 0060). Past log rows keep the old names.
6. A work order follows its order. After a command that changes what it shows, core generates the next version of every active work order for the order, as the system. Sending stays a person's step.
7. Each version has its own page inside the app shell.
8. Work orders get their own list, showing only the latest version. "Current" is the projection `WorkOrder.current` (ADR 0051), written only by `createVersion` and reconciled by a check.
9. "Send" becomes publish (`workOrder.publish`) and a team marks completion with fulfill. A work order's status (draft, blocked, pending, revision pending, fulfilled) is derived.

## Rejected
- "Order" in English as well. It collides with order lines and a customer's order.
- "Job sheet". It keeps the confusing word.
- Version only on send, with a live draft. It changes what a version means.
- Regenerate in a background job. The work order would lag the order.
- Derive "current" on read. A newest-per-group query cannot be paged cheaply in Prisma.
- Mine means recipients of a sent version. Unsent work orders, the ones staff most need to see, would never show.
- Rename the UI text only. Code, API and UI would name one thing three ways.

## Consequences
- Breaking change on every surface and in stored permission overrides.
- Item, field and definition changes do not regenerate work orders, since they would touch every order that uses them.
