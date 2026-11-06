# 0004 – Multi-tenancy with the Better Auth organization plugin

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
- Each venue customer has its own users, venues, orders and customer data. Data must never leak between organizations, on any surface.
- A user can belong to several organizations.

## Decision
1. Organization = venue customer. Better Auth's organization plugin owns membership, roles and invitations.
2. The active organization is part of the session. Every surface resolves it through the same session and permission resolution in `packages/auth`.
3. Every row has `organizationId` (ADR 0006). The Prisma client is org-scoped through an extension and rejects queries without an org context.
4. Every core operation receives a context with `organizationId` and `actorId` and must use it, never an organization sent by the client.
5. OAuth tokens lock a client to the organization approved at consent, and API keys belong to one organization (ADR 0050). A caller cannot switch organization by changing a parameter.
6. Cross-organization access is disabled. Handover outside the company is an export (ADR 0024).
7. Inviting, cancelling an invitation and removing a member are core operations with parity; Better Auth's own endpoints for them are closed, accepting stays in Better Auth. The last admin cannot be removed and nobody grants more access than they have.
8. Organization creation goes through Better Auth's form: an exception to parity because it is a platform action tied to the session (ADR 0015).
9. Tests verify that another organization's data is denied on all surfaces.

## Rejected
- Row-level scoping by convention in each query: one missed filter is a leak.
- Cross-company partner access through membership: replaced by exports (ADR 0024).

## Consequences
- Changes to auth, the Prisma extension or context resolution are security-critical and get Opus review.
- Users with several organizations need organization switching in the UI and API calls.
- We do not customise the organization plugin without a new ADR.
