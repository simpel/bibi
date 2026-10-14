---
name: tenancy-review
description: Review a change for multi-tenant leaks, permissions, audit and AI approval. Use before merging changes to core, db, auth, MCP or the approval flow.
---

# Tenancy and security review

Basis: ADR 0004 (multi-tenancy), 0005 (auth), 0006 (database conventions), 0007 (AI-first).

Check in the diff:
- **Scoping:** all data access goes through `context.db` (org-scoped client). No raw `@okazi/db` client in core handlers, adapters or the web app. New models are in `ORG_SCOPED_MODELS` and have `organizationId`.
- **Permissions:** every operation has `permission`. Adapters do not bypass `execute`. No custom `ExecuteContext`.
- **Audit:** every command calls `context.recordChange`. `actor` (`user`/`ai`), `conversationId` and `approvedBy` are set correctly.
- **AI:** mutations from the assistant return `approval_required`. The AI actor is accepted only for the assistant's OAuth client. No special path into the service layer.
- **Reads:** search and lists filter `status` (soft delete) and visibility (`filter-visible-hits`). No cross-org ids via parameters.
- **Boundaries:** Zod on all input (HTTP, GraphQL arguments, MCP, env, AI output). Env only via `@okazi/config`. No secrets in logs or error messages.
- **Tests:** the isolation test (`apps/mcp/test/isolation.test.ts`) covers the new entity with two organizations.

Report findings with file:line, scenario and suggested fix. Make no changes without asking.
