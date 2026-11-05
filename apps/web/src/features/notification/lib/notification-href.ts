import { listItemRoute, orderRoute, ROUTES } from "@/lib/routes";
import type { NotificationLike } from "./notification-like";

/** Where a notification leads: its run sheet version, else its order (ADR 0094). */
export function notificationHref({ notification }: { notification: NotificationLike }) {
  if (notification.runSheetId) {
    return listItemRoute({ list: ROUTES.runSheets, id: notification.runSheetId });
  }
  return notification.orderId ? orderRoute({ id: notification.orderId }) : ROUTES.notifications;
}
