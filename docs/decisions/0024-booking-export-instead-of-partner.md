# 0024 – Booking export instead of a partner entity

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- Partner (an external restaurant operator who receives kitchen orders across company boundaries) came from World of Volvo's setup. It is a special case and not a general need.
- The general need is to hand over a booking or a sheet (ADR 0021) to someone outside the system: an external chef, AV supplier, shipping company or carrier.

## Decision
- Partner is dropped from the MVP. Sheets go to a role in the organization (ADR 0020, 0021).
- The operation `booking.export` (`booking:read`) provides a booking in the formats:
  - `json`: versioned, stable schema for integrations. The organization's fields are included with their definitions.
  - `pdf`: program, setups, items with the choices made, and requirements.
  - `csv`: program and order lines.
- `sheet.export` provides a single sheet in the same formats, for example the kitchen order for an external chef.
- Requirements are exported as counts per vocabulary value, never linked to a person. Every export is logged in `AuditLog`.
- Sheets are versioned with change marking (★). The export always includes the latest version and which version it is.

## Consequences
- ADR 0004 gets an addendum: partner access across company boundaries is no longer planned.
- The Partner entity is removed from the domain model.
- CLAUDE.md is updated: sheets go to the organization's own roles, and export exists for handover.
