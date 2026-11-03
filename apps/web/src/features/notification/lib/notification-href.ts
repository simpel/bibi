import { listItemRoute, ROUTES, ticketRoute } from "@/lib/routes";
import type { NotificationLike } from "./notification-like";

/** Where a notification leads: its work order version, else its ticket (ADR 0094). */
export function notificationHref({ notification }: { notification: NotificationLike }) {
  if (notification.workOrderId) {
    return listItemRoute({ list: ROUTES.workOrders, id: notification.workOrderId });
  }
  return notification.ticketId ? ticketRoute({ id: notification.ticketId }) : ROUTES.notifications;
}
