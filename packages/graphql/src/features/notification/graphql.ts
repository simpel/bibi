import {
  countUnreadNotifications,
  deleteNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  markNotificationsUnread,
  NotificationDeleteOutputSchema,
  type NotificationDto,
  NotificationMarkOutputSchema,
  NotificationSchema,
  NotificationUnreadCountOutputSchema,
} from "@bibi/core";
import type { z } from "zod";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const NotificationRef = objectFromSchema<NotificationDto>({
  name: "Notification",
  schema: NotificationSchema,
  description: "One of the caller's own notifications (ADR 0094).",
});

const NotificationPageRef = pageType({
  name: "NotificationPage",
  item: NotificationRef,
  withTotal: true,
});

const NotificationMarkRef = objectFromSchema<z.infer<typeof NotificationMarkOutputSchema>>({
  name: "NotificationMarkResult",
  schema: NotificationMarkOutputSchema,
  description: "How many notifications changed, and the caller's unread count afterwards.",
});

const NotificationUnreadRef = objectFromSchema<z.infer<typeof NotificationUnreadCountOutputSchema>>(
  {
    name: "NotificationUnreadCount",
    schema: NotificationUnreadCountOutputSchema,
    description: "How many of the caller's notifications are unread.",
  },
);

fieldFromOperation({
  operation: listNotifications,
  type: NotificationPageRef,
  name: "notifications",
});
fieldFromOperation({
  operation: countUnreadNotifications,
  type: NotificationUnreadRef,
  name: "notificationUnreadCount",
});
mutationFromOperation({ operation: markNotificationsRead, type: NotificationMarkRef });
mutationFromOperation({ operation: markNotificationsUnread, type: NotificationMarkRef });
mutationFromOperation({ operation: markAllNotificationsRead, type: NotificationMarkRef });
const NotificationDeleteRef = objectFromSchema<z.infer<typeof NotificationDeleteOutputSchema>>({
  name: "NotificationDeleteResult",
  schema: NotificationDeleteOutputSchema,
  description: "How many notifications were deleted, and the caller's unread count afterwards.",
});
mutationFromOperation({ operation: deleteNotifications, type: NotificationDeleteRef });
