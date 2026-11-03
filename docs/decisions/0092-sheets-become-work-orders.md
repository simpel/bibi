# 0092 – Sheets become work orders

- **Date:** 2026-11-02
- **Status:** Accepted (approved by the user on 2026-11-02)
- **Amends:** 0021 (the sheet as a compilation for a responsibility), 0050 (the `sheet` feature)
- **Related:** 0003 (parity), 0009 (language in code and UI), 0055 (recipients), 0060 (versioning)

## Context
- A sheet is what one responsibility (the kitchen, the coordinator, a guide) has to deliver for one ticket: the lines it covers, their fields and the counted needs, versioned with the changes marked since the last send.
- "Sheet" (Swedish "Blad") reads as a spreadsheet or a printout, not as a job to do. Staff do not recognise "kitchen sheet"; they say kitchen order ("köksorder").
- The UI also has drawers called sheets (shadcn `Sheet`, the ticket drawer), so the word means two things in the code.

## Decision
1. **The concept is called work order.** English UI "Work order", Swedish UI "Order". A sheet definition is a work order definition ("Orderdefinition").
2. **The rename goes all the way down.** Prisma models `WorkOrder`, `WorkOrderDefinition` (and its join tables), `WorkOrderRecipient`; columns `workOrderDefinitionId`, `workOrderId`, `ItemState.inWorkOrders`; operations `workOrder.*` and `workOrderDefinition.*`; the permission feature `workOrder`; GraphQL, REST (`/work-orders`, `/work-order-definitions`), MCP tools, web routes (`/settings/work-orders`, `/new/work-order`) and the generative UI keys follow.
3. **Data survives.** One migration renames tables, columns, the enum, keys and indexes in place and rewrites stored `PermissionOverride.feature` values from `sheet` to `workOrder`. Nothing is dropped.
4. **The drawers stay "sheet".** The shadcn `Sheet` component and the ticket, log, slot and booking drawers are UI, not this concept, and keep their names.
5. **Old names are not kept as aliases.** The API change is breaking (`feat!`, ADR 0060). `AuditLog` and system log rows written before the rename keep the old operation names; domain history never comes from them.

6. **A work order follows its ticket (added 2026-11-02, approved by the user).** After a command that changes what a work order shows (ticket, line and need commands) commits, core generates the next version of every active work order that applies to the ticket, as the system, through a new `followUp` step on the operation. An unchanged work order keeps its latest version; sending stays a person's step. Item, field and definition changes do not regenerate, because they would touch every ticket that uses them.
7. **Each version has its own page,** `/work-orders/{id}`: the ticket and time, then what to deliver and the counted needs as tables, ★ on what changed since the last sent version. *(Amended 2026-11-03, approved by the user: the page sits inside the app shell, not outside it, so it belongs to the Work orders section of decision 8.)*
8. **Work orders get their own section (added 2026-11-03, approved by the user).** The sidebar's Work group has **Work orders**, which expands to **Today** (the default) and **All**.
   - *Mine* means the assignee or a follower of the work order's responsibility on its ticket, stored or by default (ADR 0055), the same rule as the tickets' `assignee:`/`follower:`; unsent versions count. `workOrder.list` gets `involves:` (either), `assignee:`, `follower:` on that slot, `definition:`, `responsibility:`, `is:current|sent|unsent|blocked`, the ticket's own qualifiers, a ticket window and numbered pages.
   - **Today** shows each of my current work orders for tickets that take place today (the organization's zone) in full; **All** is a table searched like tickets, default `involves:me is:current`.
   - Today and the version page render **one shared view**. It says plainly whether the version is the current one (a green "Current version" or an amber "Not the current version" badge, with a link to the current one) and lists every version of the work order.
   - "Current" is the projection `WorkOrder.current` (ADR 0051), written only by `createVersion` and checked by a reconciliation check, so lists can filter and page on it.

## Rejected
- **"Order" in English as well.** It collides with the order lines (`OrderLine`) that quotes and invoices snapshot, and with a customer's order in general.
- **"Job sheet".** It keeps the word that caused the confusion.
- **A live draft that is versioned only on send** (for decision 6). Fewer stored versions, but it changes what a version means; the user chose a version per change.
- **Regenerating in a background job** (for decision 6). The work order would lag behind the ticket and need a queue.
- **Deriving "current" on read** (for decision 8). A "newest per ticket and definition" query cannot be paged and counted cheaply in Prisma; the projection keeps the list on one indexed column.
- **Mine = the recipients of a sent version** (for decision 8). Unsent work orders, the ones staff most need to see coming, would never show.
- **Renaming the UI text only.** Code, API and UI would name the same thing differently, and every new reader would have to learn the mapping.
