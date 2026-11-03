# 0094 – In-app notifications

- **Date:** 2026-11-03
- **Status:** Accepted (approved by the user on 2026-11-03)
- **Related:** 0003 (parity), 0034 and 0055 (assignees and followers), 0051 (single source of truth), 0056 (references), 0085 (the inbox), 0092 (`followUp`)

## Context
- Staff have no way to learn that something concerns them: being made assignee, a work order sent to them, a status change or a payment on a ticket they answer for or follow. Two specs defer "notify the responsibility" until notifications exist.
- The inbox (ADR 0085) is something else: the organization's shared queue of incoming customer messages, triaged by attaching or dismissing. Notifications are internal, personal, and read or unread.

## Decision
1. **A notification belongs to one member in one organization.** `Notification` is org-scoped with `recipientUserId`; core filters every read and write on the caller (the `Conversation.ownerUserId` pattern). Another member's notification is `NOT_FOUND`. It is not a user-scoped model, because the system writes it for someone else.
2. **Kinds are a closed list in code:** `ASSIGNED`, `WORK_ORDER_SENT`, `TICKET_STATUS_CHANGED`, `PAYMENT_RECEIVED`. Subjects are foreign keys (`ticketId`, `workOrderId`, `paymentId`, ADR 0056). `data` is a snapshot of the display facts at the time (status names, amount, ticket title), never rewritten (ADR 0051). `readAt` is the lifecycle; rows are never deleted.
3. **Producers run in the command's `followUp` (ADR 0092),** as the system, through one function `notify`. It drops the actor (nobody is told about their own action), members who turned the kind off, members who are no longer members, and members who cannot read the subject (`ticket:read`). A failure is logged and never undoes the command.
   - `assignment.assign`: the new assignee.
   - `workOrder.send`: the stored recipients.
   - `ticket.changeStatus` and `payment.applySignal` (a payment that becomes `SUCCEEDED`): the ticket's main assignee and followers, plus the assignee and followers of every responsibility slot on it, stored or by default (ADR 0055).
4. **Preferences are per member, per kind, default on.** `NotificationPreference` stores only a choice; no row means on.
5. **Live updates through Server-Sent Events.** A trigger on `Notification` (insert, and update of `readAt`) calls `pg_notify('notification', {organizationId, recipientUserId})`. The web app holds one `LISTEN` connection per process and pushes the caller's unread count over `/api/notifications/stream`. One browser holds one stream per organization: the tab with the Web Lock opens it and relays events to its other tabs over a BroadcastChannel (HTTP/1.1 allows only six connections per origin). The stream is only a signal; nothing is rendered again on the server. The shell renders the count, the bell reads its latest rows with a server action when it opens, the caller's own marks apply to open lists locally, and `/notifications` offers to show changes from elsewhere instead of moving rows under the pointer. `LISTEN` needs a direct database connection, not a transaction pooler.
6. **Operations are `self:*`** (`notification.list|unreadCount|markRead|markUnread|markAllRead`, `notificationPreference.list|set`) on every surface. An API key, which has no user, cannot use them.

## Rejected
- **Reusing the inbox.** It is shared organization work with a different lifecycle (attach, dismiss); mixing in personal alerts would make both worse.
- **Polling the count.** Simpler, but the dot lags by the interval and every open tab queries every minute. SSE with `LISTEN/NOTIFY` is instant and only talks when something changes.
- **`router.refresh()` on each event.** It renders the whole layout and page again to update one dot, runs twice after the caller's own mark, and reorders a paged table while someone is using it.
- **WebSockets.** Two-way traffic is not needed, and SSE works through the existing Next.js route handlers and proxy.
- **Reading `AuditLog` to build a feed.** Domain history never comes from the audit log.
- **A user-scoped model.** `scopedDb` refuses the system actor on user-scoped models, and a notification belongs to one organization.
