import { NotificationSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a notification as tool results carry it (dates = ISO strings). */
export const NotificationWireSchema = NotificationSchema.extend({
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export const NotificationListWireSchema = z.object({
  items: z.array(NotificationWireSchema),
  nextCursor: z.string().nullable(),
});

export type NotificationWire = z.infer<typeof NotificationWireSchema>;

/** Props of the notification components (ADR 0094). */
export type NotificationUiProps = {
  "notification-list": { items: NotificationWire[]; nextCursor: string | null };
};

/** Tool → component for the caller's own notifications (ADR 0094). */
export const NOTIFICATION_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  notification_list: uiEntry({
    component: "notification-list",
    schema: NotificationListWireSchema,
    toProps: ({ value }) => value,
  }),
};
