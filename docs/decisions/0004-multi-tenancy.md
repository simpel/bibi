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

## Addendum 2026-10-14
- Partner access across company boundaries is no longer planned. The partner line in Decision and the last bullet in Consequences no longer apply (ADR 0024). Sheets go to a role in the organization's own staff, and handover to someone outside happens through export.
- Roles belong to the organization (ADR 0020). `packages/auth` resolves the member's roles to permissions per call. Cross-organization access remains disabled.

## Addendum 2026-10-14 (membership changes)
- Inviting, revoking an invitation and removing a member are core operations (`member.invite`, `member.cancelInvitation`, `member.listInvitations`, `member.remove`) with parity on every surface, like `member.assignRole`. They write Better Auth's `invitation` and `member` rows through `scopedDb`, so they are authorized, tenant-scoped and audited (`AuditLog` with entity type `invitation` or `member`).
- Better Auth's own invite, cancel-invitation and remove-member endpoints are closed, even to an admin. Accepting an invitation stays in Better Auth (the invitee is not yet a member, so there is no organization context to run a core operation in).
- Core cannot send mail, so the invitation mail is an after-commit hook (`invitationMailHook` in `packages/auth`) that every surface passes to `execute`. A failed send is logged and never undoes the invitation.
- The last admin cannot be removed (the organization always keeps one), and nobody invites with, assigns or removes more access than they have themselves (ADR 0034).
- Invitations name roles like members do: a role rename rewrites pending invitations, and a role cannot be archived while a pending invitation names it.

## Addendum 2026-10-15 (organization creation and switching)
- **Organization creation:** New organizations are created via Better Auth's `create-organization-form.tsx` in the web app, without routing through a core operation. This is an exception to the parity principle because organization creation is a platform-level action tied to the user's authentication session (ADR 0015, platform scope).
- **Organization switching for API clients:** An OAuth token locks a client to the organization at consent time. An API key belongs to one organization (ADR 0050) and that organization is its scope. Both are resolved by `resolveExecuteContext` in `packages/auth`; the caller cannot switch organizations by changing a parameter.
