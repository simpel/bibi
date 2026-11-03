import type { OperationContext } from "../../operations/types";

export type CountUnreadInput = { context: Pick<OperationContext, "db">; recipientUserId: string };

/** The member's unread notifications in the organization (ADR 0094). */
export function countUnread({ context, recipientUserId }: CountUnreadInput): Promise<number> {
  return context.db.notification.count({ where: { recipientUserId, readAt: null } });
}
