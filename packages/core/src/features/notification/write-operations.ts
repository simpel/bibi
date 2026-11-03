import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { requireUser } from "../../shared/require-user";
import { nowOf } from "../../time/now";
import {
  NotificationIdsInputSchema,
  NotificationMarkOutputSchema,
  NotificationNoInputSchema,
} from "./schema";
import { countUnread } from "./unread";

type MarkInput = {
  context: OperationContext;
  recipientUserId: string;
  ids?: string[];
  read: boolean;
};

/**
 * Sets or clears `readAt` on the caller's own notifications. Ids of other members' notifications
 * are skipped like unknown ones, so nothing leaks (ADR 0094). One audit row per command.
 */
async function mark({ context, recipientUserId, ids, read }: MarkInput) {
  const where = {
    recipientUserId,
    ...(ids ? { id: { in: ids } } : {}),
    readAt: read ? null : { not: null },
  };
  const { count } = await context.db.notification.updateMany({
    where,
    data: { readAt: read ? nowOf({ context }) : null },
  });
  context.recordChange({
    entityId: recipientUserId,
    before: { ids: ids ?? "all", read: !read },
    after: { updated: count, read },
  });
  const unread = await countUnread({ context, recipientUserId });
  return ok({ value: { updated: count, unread } });
}

export const markNotificationsRead = defineOperation({
  name: "notification.markRead",
  kind: "command",
  description:
    "Mark some of the caller's own notifications as read (ADR 0094). Unknown ids and ones " +
    "already read are skipped; `updated` says how many changed.",
  input: NotificationIdsInputSchema,
  output: NotificationMarkOutputSchema,
  permission: "self:write",
  approval: false,
  handler: async ({ input: { ids }, context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    return mark({ context, recipientUserId: user.value, ids, read: true });
  },
});

export const markNotificationsUnread = defineOperation({
  name: "notification.markUnread",
  kind: "command",
  description:
    "Mark some of the caller's own notifications as unread again (ADR 0094). Unknown ids and " +
    "ones already unread are skipped.",
  input: NotificationIdsInputSchema,
  output: NotificationMarkOutputSchema,
  permission: "self:write",
  approval: false,
  handler: async ({ input: { ids }, context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    return mark({ context, recipientUserId: user.value, ids, read: false });
  },
});

export const markAllNotificationsRead = defineOperation({
  name: "notification.markAllRead",
  kind: "command",
  description: "Mark every one of the caller's own notifications in the organization as read.",
  input: NotificationNoInputSchema,
  output: NotificationMarkOutputSchema,
  permission: "self:write",
  approval: false,
  handler: async ({ context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    return mark({ context, recipientUserId: user.value, read: true });
  },
});

export const notificationWriteOperations = [
  markNotificationsRead,
  markNotificationsUnread,
  markAllNotificationsRead,
];
