# 0042 – No recurring orders

- **Date:** 2026-10-17
- **Status:** Superseded by 0069
- **Related:** 0023 (customer pricing)

## Context
- Bibi's focus is creating orders fast from predefined order templates for smaller meetings. Recurrence rules, occurrence editing and series cancellation would add an entity, operations on four surfaces, a recurrence engine and calendar markers that the core flow does not need.

## Decision
- There is no recurrence feature: no series entity, no recurrence rule and no occurrence fields on `Order`.
- The date helpers `plain-date` and `zoned-time` live in core; the demo seed uses them.

## Consequences
- Staff create repeated orders one by one, from an order template, or by copying an order.
