import type { NotificationDto } from "@bibi/core/schemas";
import { useState } from "react";
import { markNotificationsReadAction } from "../actions";
import { useNotificationLive } from "./notification-live-context";
import type { useMarkNotifications } from "./use-mark-notifications";

type Marks = ReturnType<typeof useMarkNotifications>;

export type UseNotificationSheetInput = Pick<Marks, "mark">;

/**
 * The sheet's notification. Opening an unread one marks it read first: the row is pending
 * (`openingId`) while the server action runs, then it turns read in place and the sheet opens.
 * Nothing moves. The sheet can mark it unread again.
 */
export function useNotificationSheet({ mark }: UseNotificationSheetInput) {
  const { applyMark } = useNotificationLive();
  const [selected, setSelected] = useState<NotificationDto | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const select = async ({ notification }: { notification: NotificationDto }) => {
    if (openingId) return;
    if (notification.readAt !== null) return setSelected(notification);
    const ids = [notification.id];
    setOpeningId(notification.id);
    const result = await markNotificationsReadAction({ ids }).catch(() => null);
    setOpeningId(null);
    if (result?.ok) applyMark({ ids, read: true, unread: result.value.unread });
    setSelected({ ...notification, readAt: result?.ok ? new Date() : null });
  };
  const close = () => setSelected(null);
  const markUnread = ({ notification }: { notification: NotificationDto }) => {
    setSelected(null);
    mark({ ids: [notification.id], read: false });
  };
  return { selected, openingId, select, close, markUnread };
}
