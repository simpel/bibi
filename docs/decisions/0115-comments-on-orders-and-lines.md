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
5. A new comment notifies the people on the order (its assignees, followers and creator, never the author) with a `COMMENT_ADDED` notification (ADR 0094) that snapshots the line and the start of the text. Each person reads their own: the red dot on a comment icon (order header, line rows, timeline bars, My work cards) is that person's unread comment notifications on the order or line, and opening the comments reads them.
6. A comment can be a reply (`parentCommentId`, one level, on its parent's order and line) and can mention colleagues: `CommentMention` rows (comment, user id; join rows, never ids in the text), replaced as a set on edit. A mentioned member gets `COMMENT_MENTIONED` instead of `COMMENT_ADDED`, on or off the order; a reply also tells its parent's author. Run sheets list a reply right after its comment.
7. The `note` fields stay as the booking brief that intake writes; they do not go on run sheets.

## Rejected
- Reuse `note` and show it on run sheets: no author or time, one text that colleagues overwrite.
- A "last seen" marker per person and order for the red dot: it would show for everyone who opens the order, not only the people on it, and needs a table of its own beside notifications.
- Only comments marked "for the run sheet": one more choice on every comment; the user wants every comment where the work is done.
- Mentions parsed from `@Name` in the text: names change and repeat; the author picks a person and the ids are stored.
- Replies to replies: a long chain is hard to follow on a run sheet; one level keeps the thread readable.
- Comments on any record (customers, items): no need yet; the order is where the work is.

## Consequences
- Run sheet content gains `comments` per row; older snapshots read as no comments.
- Comment bodies are free text and may hold personal data; they stay inside Bibi (never on the payment page or in accounting exports).
- Mentioning someone who may not read the order or comments tells nobody (notifications check the reader, ADR 0094). Search over comments can follow.
