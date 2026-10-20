# 0034 – Fixed access roles and configurable responsibilities

- **Date:** 2026-10-17
- **Status:** Accepted
- **Supersedes:** 0020
- **Amended by:** 0048 (superseded by 0050), 0050 (roles are presets with per-member overrides), 0055 (derived assignments)
- **Related:** 0021 (sheets go to a responsibility), 0022 (owners), 0043 (ticket and phases)
- **Spec:** `docs/specs/permissions.md`, `docs/specs/assignments-and-responsibilities.md`

## Context
- Permissions (what a member may do) and responsibility (what a member answers for: sales, coordinator, kitchen) are different things and must not share one concept. Custom permission roles per venue (ADR 0020) would force every venue to build roles before it can model who does what.
- Fixed owner slots such as a sales owner or a responsible person per line would break the configurable-domain rule (ADR 0021). One venue has a head of kitchen, another a head of exhibits; the code should know neither.
- Staff need to see what they are accountable for on a ticket, and others need to stay informed without owning it.

## Decision
- **Access uses fixed roles**, `member < manager < admin`, not configurable per organization. Only `admin` changes configuration, and the organization always keeps one admin. Rejected: custom roles per organization (ADR 0020).
- **Responsibilities are organization data**: a name, the item types it covers, a default assignee and default followers. They are not permissions.
- **Every assignable subject has one assignee plus followers.** Followers are need-to-know and never required by rules.
- **Rules that used to name roles name responsibilities or the main assignee instead**: a phase can require the main assignee (`requiresAssignee`), and a sheet goes to a responsibility.

## Consequences
- No `organizationRole` table and no `role.*` operations. Tickets, lines and items carry no owner columns.
- Fine-grained read restrictions per function are dropped for now; if needed they return as an addition to the fixed roles, not as custom roles.
- Touches auth, tenancy and the parity core: built at Opus level and goes through `tenancy-review`.

## Addenda
- 2026-10-19: roles renamed (`viewer < member < admin < owner` became `member < manager < admin`; `owner` merged into `admin` because the two differed only in rare organization-level actions).
- 2026-10-19: ADR 0050 replaces the role → permission map with presets of `<feature>:<action>` plus per-member overrides.
- 2026-10-19: which responsibilities apply to a ticket is derived, not stored (ADR 0055, 0056).
