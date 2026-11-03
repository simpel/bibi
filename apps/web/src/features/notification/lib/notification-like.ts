import type { NotificationDto } from "@bibi/core/schemas";

/** A notification from a page (dates) or from a tool result (ISO strings). */
export type NotificationLike = Omit<NotificationDto, "readAt" | "createdAt"> & {
  readAt: Date | string | null;
  createdAt: Date | string;
};
