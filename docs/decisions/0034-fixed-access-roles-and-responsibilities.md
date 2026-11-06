# 0034 – Fixed access roles and configurable responsibilities

- **Date:** 2026-10-17
- **Status:** Accepted
- **Supersedes:** 0020
- **Amended by:** 0048 (superseded by 0050), 0050 (roles are presets with per-member overrides), 0055 (derived assignments)
- **Related:** 0021 (sheets go to a responsibility), 0022 (owners), 0043 (order and phases)
- **Spec:** `docs/specs/permissions.md`, `docs/specs/assignments-and-responsibilities.md`

## Context
- Permission (what a member may do) and responsibility (what a member answers for, such as sales or kitchen) are different things and must not share one concept.
- Custom permission roles per venue (ADR 0020) would force every venue to build roles before it can model who does what.
- Fixed owner slots such as a sales owner would break the configurable-domain rule (ADR 0021). The code must not know a head of kitchen or a head of exhibits.

## Decision
1. Access uses fixed roles, `member < manager < admin`, not configurable per organization. Only `admin` changes configuration and an organization always keeps one admin.
2. Responsibilities are organization data (name, item types covered, default assignee and followers). They are not permissions.
3. Every assignable subject has one assignee plus followers. Followers are need-to-know and never required by rules.
4. Rules that once named roles name responsibilities or the main assignee: a phase can require the main assignee, and a sheet goes to a responsibility.

## Rejected
- Custom roles per organization (ADR 0020): venues would have to design roles before use.
- Fixed owner columns on orders, lines and items: domain words in code.

## Consequences
- No role table and no `role.*` operations. Orders, lines and items carry no owner columns.
- Fine-grained read restrictions per function are dropped. If needed they return as additions to the fixed roles.
- `owner` was merged into `admin`, since they differed only in rare organization-level actions. ADR 0050 later turned roles into presets, and ADR 0055 derives which responsibilities apply to an order.
- Touches auth, tenancy and the parity core: built at Opus level and goes through `tenancy-review`.
