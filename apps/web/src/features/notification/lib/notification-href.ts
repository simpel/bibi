import { commentAnchor } from "@/features/comment/lib/comment-anchor";
import { listItemRoute, orderRoute, ROUTES, taskRoute } from "@/lib/routes";
import type { NotificationLike } from "./notification-like";

/** Where a notification leads: its run sheet version, its task, else its order or its comments (ADR 0094). */
export function notificationHref({ notification }: { notification: NotificationLike }) {
  if (notification.runSheetId) {
    return listItemRoute({ list: ROUTES.runSheets, id: notification.runSheetId });
  }
  if (notification.taskId) return taskRoute({ id: notification.taskId });
  if (!notification.orderId) return ROUTES.notifications;
  const order = orderRoute({ id: notification.orderId });
  if (notification.kind !== "COMMENT_ADDED" && notification.kind !== "COMMENT_MENTIONED") {
    return order;
  }
  // A comment opens the order at its comments, on the line it was about (ADR 0115).
  return `${order}#${commentAnchor({ lineId: notification.data.lineId ?? null })}`;
}
