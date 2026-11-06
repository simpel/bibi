# 0043 – The order: one record through organization-defined phases

- **Date:** 2026-10-18
- **Status:** Superseded by 0067
- **Related:** 0021, 0022, 0034, 0041, 0044, 0054
- **Spec:** `docs/specs/orders-statuses-and-states.md`

This ADR decided that a customer request is one record, the order, from first contact to the delivered event. It never turns into another record. Phases are organization data and behave only through generic flags (`entry`, `terminal`, `requiresReason`, `requiresAssignee`, `invoiceable`, `event`). Transitions are data too. One command, `order.changePhase`, moves an order atomically and lists every blocker. Quote events may move an order, while payments and invoices never do. Predefined orders create an order and its lines in one step. Not decided: a pipeline per order type and automation on phase entry. ADR 0067 replaced it, renaming phases to statuses.
