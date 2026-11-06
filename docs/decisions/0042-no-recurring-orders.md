# 0042 – No recurring orders

- **Date:** 2026-10-17
- **Status:** Superseded by 0069
- **Related:** 0023 (customer pricing)

Bibi's core flow is creating orders fast from predefined order templates for smaller meetings. This ADR decided against a recurrence feature (no series entity, rule or occurrence fields), because it would add an entity, operations on four surfaces and a recurrence engine the core flow did not need. Staff created repeated orders one by one or by copying. ADR 0069 (recurring series) replaced it.
