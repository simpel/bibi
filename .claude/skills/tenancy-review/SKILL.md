---
name: tenancy-review
description: Review a change for multi-tenant leaks, permissions, audit and AI approval. Use before merging changes to core, db, auth, MCP or the approval flow.
---

# Tenancy and security review

Basis: ADR 0004 (multi-tenancy), 0005 (auth), 0006 (database conventions), 0007 (AI-first).

Check in the diff:
- **Scoping:** all data access goes through `context.db` (org-scoped client). No raw `@okazi/db` client in core handlers, adapters or the web app. New models are in `ORG_SCOPED_MODELS` and have `organizationId`.
- **Permissions:** every operation has `permission`. Adapters do not bypass `execute`. No custom `ExecuteContext`.
- **Feature scope (ADR 0050):** no output, error message, audit image, search text or approval preview carries data of a feature other than the operation's own (`ENTITY_FEATURE`), except ids. Cross-feature input ids use `checkReadable(<feature>:view)`. Pages show a denied piece as hidden instead of failing. A field like `customerName` on a ticket DTO is a scope bug.
- **Audit:** every command calls `context.recordChange`. `actor` (`user`/`ai`), `conversationId` and `approvedBy` are set correctly.
- **AI:** mutations from the assistant return `approval_required`. The AI actor is accepted only for the assistant's OAuth client. No special path into the service layer.
- **Reads:** search and lists filter `status` (soft delete) and visibility (`filter-visible-hits`). No cross-org ids via parameters.
- **Boundaries:** Zod on all input (HTTP, GraphQL arguments, MCP, env, AI output). Env only via `@okazi/config`. No secrets in logs or error messages.
- **Tests:** an `apps/mcp/test/isolation-<area>.test.ts` step covers every new operation with two organizations (`isolation-coverage.test.ts` enforces it; `ISOLATION_GAPS` must not grow).
- **References and lifecycle:** every input id pointing at another record is checked for organization and read permission. Archive, rename and removal handle what links to the record. Races return `CONFLICT`.

Report findings with file:line, scenario and suggested fix. Make no changes without asking.
