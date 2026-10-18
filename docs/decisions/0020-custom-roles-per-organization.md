# 0020 – Custom roles per organization

- **Date:** 2026-10-14
- **Status:** Superseded by 0034

## Context
- Today there are four fixed levels: `viewer < member < admin < owner` (`packages/auth/src/permissions.ts`). Core translates them to `read|write|admin` on all resources (`packages/core/src/operations/permission.ts`).
- A venue works with functions, not levels: sales, coordinator, kitchen, finance, admin. Different venues split responsibility differently. A small conference estate may have only two roles, an experience center six.
- Tickets need a responsible person per step. That requires knowing which users have which function.

## Decision
- Better Auth's organization plugin runs with `dynamicAccessControl: { enabled: true }`. Roles are stored per organization in the `organizationRole` table (role name + permissions as JSON).
- The permission language is unchanged: `<resource>:read|write|admin` (ADR 0003). A role is a named set of such permissions per resource.
- `owner` is a fixed system role with all permissions. It cannot be changed or removed, so an organization can never lock itself out.
- A new organization has only `owner`. Role templates can be imported and edited freely (ADR 0021). Example, the "Conference estate" template:

  | Role | Write | Read |
  |---|---|---|
  | Admin | everything, incl. `role:admin` and `member:admin` | everything |
  | Sales | customer, contact, ticket, quote | items, venues, price lists |
  | Coordinator | ticket, program item, requirement, occupancy | items, venues, customers |
  | Kitchen | – | ticket, program item, items, sheets |
  | Finance | price list, invoice, payment | everything |
  | Viewer | – | everything |

- Core does not look up roles in the database. `packages/auth` resolves the member's roles to actual permissions once per call and puts them in `ExecuteContext` (`permissions: Record<resource, action[]>`). `hasPermission` in core checks against them instead of against `ROLE_ACTIONS`.
- New operations with parity on all surfaces: `role.list|get` (`role:read`), `role.create|update|archive` (`role:admin`), `member.list` (`member:read`), `member.assignRole` (`member:admin`).
- API keys are issued with a role name from the organization's roles. The ceiling is still `admin`.

## Consequences
- The change touches core, auth and tenancy. It must be built and reviewed at Opus level (CLAUDE.md) and go through `tenancy-review`.
- `ORG_ROLES` and `ROLE_ACTIONS` disappear as hardcoded lists. There is no production data, so no migration is done. New organizations are seeded with the "default" template (one default set of ticket phases, one `owner` role) or can import templates (e.g. "Conference estate") on first use.
- The parity test needs test cases per role template, so that for example Kitchen may read but not write a ticket.
- The AI assistant acts as the user (ADR 0007). It can never get more permissions than the user, and role and member changes require approval.
