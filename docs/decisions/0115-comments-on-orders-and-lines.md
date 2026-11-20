# 0115 – Comments on orders and lines

- **Date:** 2026-11-20
- **Status:** Accepted (the user, 2026-11-20)
- **Related:** 0034, 0050, 0052, 0081, 0092, 0113

## Context
- Staff talk about an order while they work it: what the customer said on the phone, a change the kitchen must know, a question to the host. Today an order and each line have one owned `note` (ADR 0081). It has no author and no time, and a second writer overwrites the first.
- Run sheets (ADR 0021) go to the responsibility that does the work, but carry no free text, so the kitchen learns about "no onions on the late lunch" outside Bibi.

## Decision
1. A `Comment` belongs to an order and, optionally, one of its lines (`lineId` null = the whole order). It holds a body (at most 2000 characters), its author (`createdBy`) and `editedAt`. Archiving is the delete (ADR 0006). It is record-scoped by its order (ADR 0113): who may see the order sees its comments.
2. A new feature `comment` (group bookings, read, write, delete; ADR 0050). Members read and write, managers and admins have all. Only the author edits a comment; the author or a caller with `comment:delete` archives it.
3. Operations `comment.list|create|update|archive` on every surface (ADR 0003). The assistant proposes, the user approves.
4. Every run sheet row carries its comments, oldest first: a line's comments on its row, the order's on the order row. They are part of the snapshot, so a comment change makes a new version with the row marked ★, and a comment command regenerates the order's run sheets in its `followUp` (ADR 0092).
5. The `note` fields stay as the booking brief that intake writes; they do not go on run sheets.

## Rejected
- Reuse `note` and show it on run sheets: no author or time, one text that colleagues overwrite.
- Only comments marked "for the run sheet": one more choice on every comment; the user wants every comment where the work is done.
- Comments on any record (customers, items): no need yet; the order is where the work is.

## Consequences
- Run sheet content gains `comments` per row; older snapshots read as no comments.
- Comment bodies are free text and may hold personal data; they stay inside Bibi (never on the payment page or in accounting exports).
- Notifications and mentions on a new comment, and search over comments, can follow.
