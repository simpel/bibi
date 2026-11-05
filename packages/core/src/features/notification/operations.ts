import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { requireUser } from "../../shared/require-user";
import { loadNotificationPage } from "./list-page";
import { NotificationListInputSchema, NotificationListOutputSchema } from "./list-schema";
import { NotificationNoInputSchema, NotificationUnreadCountOutputSchema } from "./schema";
import { countUnread } from "./unread";
import { notificationWriteOperations } from "./write-operations";

export const listNotifications = defineOperation({
  name: "notification.list",
  kind: "query",
  description:
    "List the caller's own notifications (ADR 0094), newest first by default: being made " +
    "assignee, a run sheet sent to them, a status change or a received payment on an order " +
    "they answer for or follow. `read` narrows to unread or read ones, `kind` to one kind, `q` " +
    "searches the order's title or reference. Never returns anyone else's.",
  input: NotificationListInputSchema,
  output: NotificationListOutputSchema,
  permission: "self:read",
  handler: async ({ input, context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    return ok({
      value: await loadNotificationPage({ input, context, recipientUserId: user.value }),
    });
  },
});

export const countUnreadNotifications = defineOperation({
  name: "notification.unreadCount",
  kind: "query",
  description: "How many of the caller's own notifications are unread (ADR 0094).",
  input: NotificationNoInputSchema,
  output: NotificationUnreadCountOutputSchema,
  permission: "self:read",
  handler: async ({ context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    return ok({ value: { unread: await countUnread({ context, recipientUserId: user.value }) } });
  },
});

/** The caller's own notifications (ADR 0094). */
export const notificationOperations = [
  listNotifications,
  countUnreadNotifications,
  ...notificationWriteOperations,
];
