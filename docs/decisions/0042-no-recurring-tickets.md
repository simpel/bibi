# 0042 – No recurring tickets

- **Date:** 2026-10-17
- **Status:** Accepted
- **Related:** 0023 (customer pricing)

## Context
- Okazi's focus is creating tickets fast from predefined ticket templates for smaller meetings. Recurrence rules, occurrence editing and series cancellation would add an entity, operations on four surfaces, a recurrence engine and calendar markers that the core flow does not need.

## Decision
- There is no recurrence feature: no series entity, no recurrence rule and no occurrence fields on `Ticket`.
- The date helpers `plain-date` and `zoned-time` live in core; the demo seed uses them.

## Consequences
- Staff create repeated tickets one by one, from a ticket template, or by copying a ticket.
