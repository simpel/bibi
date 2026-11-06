# 0024 – Order export instead of a partner entity

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- A partner (an external restaurant operator receiving kitchen orders across company boundaries) came from one reference setup. It is a special case.
- The general need is to hand an order or run sheet to someone outside the system: an external chef, AV supplier or carrier.

## Decision
1. Partner is dropped. Sheets go to a responsibility inside the organization (ADR 0021, 0034).
2. `order.export` (`order:read`) and `sheet.export` produce `json` (versioned, stable schema), `pdf` and `csv`.
3. Requirements are exported as counts per list value, never linked to a person. Every export is logged in `AuditLog`.
4. Sheets are versioned, and an export always states which version it is.

## Rejected
- A Partner entity with cross-organization access: it breaks tenancy (ADR 0004) for a single customer's setup.

## Consequences
- Cross-organization access stays disabled; handover is a file.
- The Partner entity is gone from the domain model.
