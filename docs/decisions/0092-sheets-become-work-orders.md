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

## Rejected
- **"Order" in English as well.** It collides with the order lines (`OrderLine`) that quotes and invoices snapshot, and with a customer's order in general.
- **"Job sheet".** It keeps the word that caused the confusion.
- **Renaming the UI text only.** Code, API and UI would name the same thing differently, and every new reader would have to learn the mapping.
