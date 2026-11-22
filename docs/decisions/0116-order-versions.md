# 0116 – Order versions, restore and the superseded quote

- **Date:** 2026-11-22
- **Status:** Accepted (the user, 2026-11-22: "build this in one go")
- **Amends:** 0052 (the quote is a snapshot of lines), 0022 (quote states)
- **Related:** 0051, 0054, 0056, 0003

## Context
- Staff work on an order, send a quote, keep working, send a new quote, and then hear the customer wants the first one. Today nothing takes the order back: a sent quote freezes priced lines only, and the order's lines have no history of their own.
- The order page never says whether the order still matches the quote that was sent.
- Sending a newer quote expires the older one, so the version the customer picked can no longer be accepted.

## Decision
1. **A version is the order's content at one moment:** every active line (with sub-lines, alternative group membership, item, layout, time, buffers, quantity, price overrides, note and fields) and the order's two headcounts. Workflow is never in a version: status, line states, holds, requirements, payments, invoices.
2. Stored as snapshot rows, never JSON ids (ADR 0056): `OrderVersion` (order, number, owned `name`, `restoredFromId`, `contentHash`, headcounts, `capturedAt`) and `OrderVersionLine` (one row per line, foreign keys to the line, its parent, group, type, item and layout).
3. **Captured automatically, in core, after every command** that changed a line, an alternative group or the order (`runCommand`, inside its transaction). Nothing is written when the content hash is unchanged. Edits by the same actor within 30 minutes collapse into the newest version, unless it is named, restored or sent as a quote. Staff never have to save.
4. A sent quote points at its version (`Quote.versionId`, set by `quote.send`); that version is sealed. The version list shows each version's quotes as badges.
5. **Restore** (`orderVersion.restore`) makes the order's lines and headcounts equal the version through the normal line commands (update, archive) and brings archived lines back with their ids, so quote pairing by `lineId` still holds. The result is a new version (`restoredFromId`); history is never rewritten. Holds follow the states by trigger as always; a clash fails the restore with `CONFLICT`, nothing half-done.
6. **SUPERSEDED** is a new quote state: a newer version was sent. It differs from EXPIRED (validity passed). `quote.accept` accepts a SENT or a still-valid SUPERSEDED quote; for a superseded one it first restores the order to that quote's version and declines the newer SENT quote ("the customer chose this version").
7. Operations, feature `program`: `orderVersion.list`, `orderVersion.get` (with its changes against the order now), `orderVersion.name`, `orderVersion.restore`, in web, GraphQL, REST and MCP.

## Rejected
- Use sent quotes as the only restore points: they hold priced lines only, and the user wants versions between quotes.
- Rebuild history from `AuditLog`: domain history never comes from the audit log (ADR 0054).
- Explicit "save version" only: people forget, and the version they need is the one nobody saved.
- One JSON document per version: ids in JSON break foreign keys and tenancy checks (ADR 0056).

## Consequences
- `OrderLine` keeps its own frozen prices: a version stores overrides, the quote stores what was charged.
- Restoring does not bring back requirements or line states; a restored line takes the state the status grid gives it, like a new line.
- A version's alternative group is shown, but restore does not regroup a line whose group was dissolved.
