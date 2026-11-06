# 0094 – In-app notifications

- **Date:** 2026-11-03
- **Status:** Accepted
- **Related:** 0003, 0034, 0055, 0051, 0056, 0085, 0092

## Context
- Staff had no way to learn that something concerns them: being made assignee, a work order sent to them, a status change or a payment on an order they follow.
- The inbox (ADR 0085) is the organization's shared queue of customer messages. Notifications are internal, personal and read or unread.

## Decision
1. A notification belongs to one member in one organization. It is org-scoped with `recipientUserId`, and core filters every read and write on the caller. It is not a user-scoped model, because the system writes it for someone else.
2. Kinds are a closed list in code. Subjects are foreign keys (ADR 0056). `data` is a snapshot of display facts, never rewritten (ADR 0051). `readAt` is the lifecycle and rows are never deleted.
3. Producers run in the command's `followUp` (ADR 0092) as the system, through one `notify` function. It drops the actor, members who turned the kind off, non-members and members who cannot read the subject. A failure is logged and never undoes the command.
4. Preferences are per member and kind, default on. A row stores only a choice.
5. Live updates use Server-Sent Events. A database trigger calls `pg_notify`, the web app holds one `LISTEN` connection per process and pushes the unread count. One browser tab holds the stream and relays to the others. The stream is only a signal. `LISTEN` needs a direct database connection, not a transaction pooler. The same stream carries the inbox badge.
6. Operations are `self:*` on every surface. An API key, which has no user, cannot use them.

## Rejected
- Reuse the inbox. Shared organization work has a different lifecycle.
- Poll the count. The dot lags and every open tab queries every minute.
- `router.refresh()` on each event. It renders everything again for one dot and reorders tables under the pointer.
- WebSockets. Two-way traffic is not needed.
- Build a feed from `AuditLog`. Domain history never comes from it.
- A user-scoped model. `scopedDb` refuses the system actor on those, and a notification belongs to one organization.

## Consequences
- Production needs a direct Postgres connection for `LISTEN`.
- Two specs that deferred "notify the responsibility" can now build on this.
