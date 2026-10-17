# 0034 – Fixed access roles and configurable responsibilities

- **Date:** 2026-10-17
- **Status:** Accepted
- **Supersedes:** 0020
- **Amends:** 0022 (owners), 0021 (sheets go to a responsibility, not a role)

## Context
- ADR 0020 mixes two things in one concept: what a member may do (permissions) and what a member is responsible for (sales, coordinator, kitchen). Every venue has to build custom permission roles before it can model who does what.
- ADR 0022 hardcodes the owner slots `Inquiry.salesOwnerId`, `Booking.salesOwnerId`, `Booking.coordinatorId` and `ProgramItem.responsibleId`, which breaks the configurable-domain rule (ADR 0021). One venue has a head of kitchen, another a head of exhibits; the code should know neither.
- Staff need to see clearly what they are accountable for on a booking, and others need to stay informed without owning it.

## Decision

### Access: fixed system roles
- Permissions use fixed roles again: `viewer < member < admin < owner`. `owner` and `admin` are the only roles that change configuration.
  | Role | Can |
  |---|---|
  | `viewer` | read everything |
  | `member` | read everything, write operational data (customers, inquiries, quotes, bookings, program items, requirements, payments, sheets) |
  | `admin` | everything a member can, plus configuration (types, fields, lists, setups, statuses, responsibilities, sheet definitions, price lists), members and API keys |
  | `owner` | everything, incl. other owners and the organization itself. Cannot be removed from the last owner |
- The permission language `<resource>:read|write|admin` (ADR 0003) and `hasPermission` stay. The role → permission map is a constant in `packages/auth`, no `organizationRole` table and no `dynamicAccessControl`.
- `role.*` operations, role templates and `OrganizationRole` are removed. `member.assignRole` takes one of the fixed roles. API keys are issued with a fixed role, never `owner`, and never above the member's own.

### Responsibilities: what someone answers for
- A **responsibility** is organization data, managed by an admin (`responsibility.list|get|create|update|archive`, resource `configuration`): a name (e.g. "Head of kitchen", "Head of exhibits"), the item **entity types** it covers (e.g. the organization's "Food & drink" type) and a **default assignee** (a member) plus optional default followers.
- An **assignment** says who answers for something. Every assignable subject has exactly one assignee and any number of **followers**:
  - Followers are on a need-to-know basis: they see the subject in "Following", are included where the assignee is (sheets, later notifications) and cannot be required by rules.
  - Assignable subjects: inquiry, booking and item (a package or catalog item). Quote has none of its own; it uses the inquiry's.
- A subject has one **main assignment** (no responsibility) and, for bookings, one assignment **per responsibility** that applies to it. Unique on (subject, responsibility).
- **Automatic from item types:** when a booking gets a line whose item is of a type a responsibility covers (program item, quick booking, series occurrence, later order lines from #50), core creates that responsibility's assignment on the booking with the default assignee and followers. It never overwrites an existing assignment. When no line of the covered types remains, the assignment is archived.
- **Inheritance:** the inquiry's main assignee and followers carry over to the booking that `quote.accept` creates. A quick booking gets the creating member as main assignee.
- Commands, all audited and on every surface: `assignment.assign({ subject, responsibilityId?, assigneeId })`, `assignment.follow|unfollow({ subject, responsibilityId?, userId })`, `assignment.list({ subject })` and `assignment.listMine({ kind: ASSIGNED | FOLLOWING })`. Assignee and followers must be members (`VALIDATION`). `booking.assign`, `inquiry.assign` and `programItem.assign` are removed.

### Rules that used to name roles
- Phase rule (ADR 0022): the `CONFIRMED` and `COMPLETED` phases require the booking's **main assignee** instead of a coordinator. `QUALIFIED` requires the inquiry's main assignee instead of a sales owner. Responsibility assignments are never required, but an unassigned one is shown as a warning.
- Sheets (ADR 0021): a sheet definition goes to a **responsibility** instead of a role. A generated sheet is addressed to that responsibility's assignee and followers on the booking.

## Consequences
- Removes `salesOwnerId`, `coordinatorId` and `responsibleId` from Inquiry, Booking and ProgramItem, the `organizationRole` table and the `role` feature. No production data exists, so there is no migration; the seed and templates are updated instead.
- New tables: `Responsibility` (+ covered entity types), `Assignment` (`subjectType`, `subjectId`, `responsibilityId?`, `assigneeId`) and `AssignmentFollower`. `subjectType`/`subjectId` follows the `Occupancy.sourceType`/`sourceId` pattern; core checks that the subject belongs to the organization.
- Fine-grained read restrictions per function (e.g. a kitchen user who may only read) are dropped for now. If a venue needs them, they come back as an addition to the fixed roles, not as custom roles.
- The "Conference venue" template ships responsibilities instead of roles (e.g. Sales, Coordinator, Head of kitchen) as optional data.
- Touches auth, tenancy and the parity core: built at Opus level and goes through `tenancy-review` (CLAUDE.md).
