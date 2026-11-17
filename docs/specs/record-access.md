# Record access

Target behaviour, not built yet. Why: ADR 0113 (Proposed). Capability is `docs/specs/permissions.md`; this spec covers which records a caller sees.

## Scope
- Each member has a scope per root. The only root is `order`. Values: `all` (default for every preset) and `related`.
- Stored as a difference only (`RecordScopeOverride`: subject, root, scope). Resetting archives the row. Read and changed through `permission.get` and `permission.update` (`member:write`), audited.
- `related` is refused (`VALIDATION`) for a member on the admin preset and for API keys.
- Resolved live on every request with preset and overrides (`resolveSubjectAccess`) and carried on the context as `access: { principalId, scopes }`.

## Related to an order
- A member is related to an order when they are its creator, its main assignee, the assignee of a responsibility that applies to it (explicit, or the responsibility's default) or a follower (main or responsibility; defaults plus follows minus unfollows).
- Run sheet recipients, item assignees and staffing are My work signals, not access.
- Kept in `RecordRelation` (record, principal, relation `CREATOR|ASSIGNEE|FOLLOWER`, responsibility, source `EXPLICIT|DEFAULT`), written only by database triggers from `record_relation_wanted`; a reconciliation compares the two.
- When the last line a responsibility covers is removed, its default assignee and followers lose the relation (ADR 0055 semantics).

## What a `related` member sees
- Orders and everything owned by an order (lines, history, requirements, alternative groups, allocations, quotes, quote and invoice lines, payments, deposits, invoices, credit notes, run sheets, inbound mail, linked inbox messages, notifications about it, its audit entries) only when related to the order.
- A hidden record is `NOT_FOUND`, also when its id is passed as input. Lists, boards, counts and search leave it out.
- Totals (dashboard tiles and trends, finance overview, customer values and recent customers) count only visible orders.
- Capacity counts every booking. A hidden booking shows as "Busy" with times and hold kind, without order, line, customer, status or value; a collision with one reads "Overlaps a booking you cannot view".
- A refusal because something is still in use names only records the caller may see; otherwise "It is still in use".

## Actors
| Actor | Orders | Personal records | Board views |
|---|---|---|---|
| SYSTEM | all | all | all |
| Member | their scope | their own; others' only with an oversight permission (`assistant:read` for conversations) | default, shared with the organization, their own, shared with them |
| AI | as its member | its member's own, no oversight | as its member |
| API key | all | none (`self:*` is refused) | default and shared with the organization |

## Errors
- `UNAUTHENTICATED`: no principal. `FORBIDDEN`: a missing capability, never naming a record. `NOT_FOUND`: missing, archived or outside the caller's access. `VALIDATION`: input only.

## Enforcement
- Every query on a record-scoped model, and every relation hop into one, carries `visibleWhere` (the caller's access) or `allRecordsWhere` with a purpose (`capacity`, `integrity`, `configuration`, `derivation`, `system`). The scoped client refuses a query with neither.
- Operations declare scoped ids they take and return (`records` on `defineOperation`); execute checks the input ids before the handler.
- Guards: marker tests in `packages/db`, a declaration test in core, a same-organization behaviour suite with a coverage test over every operation, and a snapshot of every `allRecordsWhere` call.

## UI
- On a member's permissions page an admin picks "All orders" or "Only orders they are involved in".
