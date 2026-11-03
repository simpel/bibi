import type { WebSurface } from "./web-surfaces";

/** The caller's own notifications (ADR 0094): the top bar's bell and the full list. */
export const NOTIFICATION_SURFACES: readonly WebSurface[] = [
  { operation: "notification.list", route: "/notifications" },
  { operation: "notification.markRead", route: "/notifications" },
  { operation: "notification.markUnread", route: "/notifications" },
  { operation: "notification.markAllRead", route: "/notifications" },
  {
    operation: "notification.unreadCount",
    route: "*",
    component: "features/notification/ui/notification-bell.tsx",
  },
];
