# 0048 – Access levels for changes

- **Date:** 2026-10-19
- **Status:** Superseded by 0050
- **Related:** 0034 (fixed access roles, amended; roles renamed 2026-10-19), 0007 (AI-first UX), 0003 (parity)

> **2026-10-19:** ADR 0050 supersedes the access levels and `RESOURCE_LEVELS`: permissions are `<feature>:<action>`, the roles are presets (`PRESET_PERMISSIONS` in core) and admins add per-member overrides. The assistant and the approval card follow the effective permissions. Kept below for history.

## Context
- Staff change Bibi by talking to the assistant, and every change is a proposal the user confirms (ADR 0007). Who may confirm what must be clear to the user, the assistant and the code.
- ADR 0034 fixed the access roles (since renamed `member`, `manager`, `admin`). Which resources a role writes was only implicit in a list in `packages/auth`, and the docs listed it incompletely (items, venues and ticket templates were missing from configuration; contacts, assignments and occupancy from operational data).
- The assistant saw every tool whatever the user's role, and did not know the role. A manager asking for a new price got a card that failed, or a FORBIDDEN error after the fact.

## Decision

### Three access levels, one table
- Every resource has one access level, defined once as data in `packages/core/src/permissions/resource-levels.ts` (`RESOURCE_LEVELS`). The fixed role map in `packages/auth` is built from it.

| Level | Who writes it | Resources |
|---|---|---|
| Operational: the daily work | manager, admin | customer, contact, quote, ticket, programItem, assignment, occupancy, requirement, payment, sheet, changeSet (each step still needs its own permission, ADR 0049) |
| Configuration: how the organization is set up | admin | venue, item (incl. its prices and capacities), priceList, configuration (types, fields, lists, setups, responsibilities, sheet definitions), ticketPhase, itemState, phaseGrid, ticketTemplate, search, member, audit |
| Personal: each user's own space | everyone, their own | conversation, skill, integration |

- Members read everything and change only their own space. Managers also change operational data. Admins change everything, including the organization itself (ADR 0034).
- A new resource is added to `RESOURCES` and `RESOURCE_LEVELS` together; TypeScript requires both.

### The assistant follows the levels
- The MCP server lists only the commands the caller has permission for. Queries stay visible to everyone who may read. A direct call to a hidden command still goes through `execute` and gets FORBIDDEN.
- The system prompt has an Access section: the user's role, and in plain words what they may and may not change, derived from their permissions.
- When a user asks for a change outside their level, the assistant says plainly that an admin must make it, names what it would change, and offers to write the request as text for an admin. It never proposes it anyway.

## Consequences
- No change in what any role may do; the permission sets are pinned by a test in `packages/auth`.
- Members and managers see fewer tools and get an explanation instead of a failing card.
- A manager cannot hand a configuration change to an admin inside Bibi yet (no request queue); that is a possible follow-up.
