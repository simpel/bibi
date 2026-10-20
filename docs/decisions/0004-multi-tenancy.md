# 0004 – Multi-tenancy with the Better Auth organization plugin

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
Each venue customer is its own organization with its own users, venues, bookings and customer data. Data must never leak between organizations. The same rule applies to web, REST, GraphQL and MCP. A user can belong to several organizations.

## Decision
- Organization = venue customer. Better Auth's organization plugin handles membership, roles and invitations.
- The active organization is part of the session. Every surface (web, REST, GraphQL, MCP) resolves it through the same session and permission resolution in `packages/auth`.
- Every row in the database has `organizationId`. See ADR 0006.
- The Prisma client is org-scoped through an extension. Queries without an org context are rejected.
- Every core operation receives a context with `organizationId` and `actorId`. The operation must use the context, not an organization sent by the client.
- Cross-organization access is disabled in the MVP. A partner (external restaurant operator) will in future get its own access through kitchen orders, not through membership.
- Tests verify that access to another organization's data is denied on all surfaces.

## Consequences
- Tenancy protection is a critical area. Changes to auth, the Prisma extension or context resolution are reviewed at Opus level per CLAUDE.md.
- Users with several organizations need organization switching in the UI and in API calls.
- The Better Auth organization plugin governs the data model for organizations and membership. We do not customize it without a new ADR.
- Partner access across company boundaries (kitchen orders) requires a separate model to be decided later.

## Addenda
- 2026-10-14: partner access across company boundaries is no longer planned (ADR 0024); handover to someone outside is an export. Access is fixed role presets with overrides (ADR 0034, 0050); cross-organization access stays disabled.
- 2026-10-14: inviting, cancelling an invitation and removing a member are core operations with parity on every surface (audited and tenant-scoped), and Better Auth's own endpoints for them are closed. Accepting an invitation stays in Better Auth. The invitation mail is an after-commit hook; a failed send never undoes the invitation. The last admin cannot be removed, and nobody grants or removes more access than they have.
- 2026-10-15: organization creation goes through Better Auth's form, not a core operation: an exception to parity because it is a platform-level action tied to the session (ADR 0015). An OAuth token locks a client to the organization at consent time and an API key belongs to one organization (ADR 0050); `resolveExecuteContext` resolves both, so a caller cannot switch organizations by changing a parameter.
