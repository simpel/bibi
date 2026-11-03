import { restRoute } from "../../rest-route";

/** The caller's own notifications (ADR 0094). */
export const notificationRoutes = [
  restRoute({ operation: "notification.list", method: "GET", path: "/notifications" }),
  restRoute({
    operation: "notification.unreadCount",
    method: "GET",
    path: "/notifications/unread-count",
  }),
  restRoute({ operation: "notification.markRead", method: "POST", path: "/notifications/read" }),
  restRoute({
    operation: "notification.markUnread",
    method: "POST",
    path: "/notifications/unread",
  }),
  restRoute({
    operation: "notification.markAllRead",
    method: "POST",
    path: "/notifications/read-all",
  }),
];
