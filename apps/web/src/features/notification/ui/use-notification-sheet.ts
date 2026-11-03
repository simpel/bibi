import type { NotificationDto } from "@bibi/core/schemas";
import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import type { useMarkNotifications } from "./use-mark-notifications";

type Marks = ReturnType<typeof useMarkNotifications>;

export type UseNotificationSheetInput = Pick<Marks, "mark" | "openOne">;

/**
 * The sheet's notification: opening one marks it read quietly, closing reads the page again so
 * a newly read row moves to the Read table, and the sheet can mark it unread.
 */
export function useNotificationSheet({ mark, openOne }: UseNotificationSheetInput) {
  const router = useRouter();
  const [selected, setSelected] = useState<NotificationDto | null>(null);
  const select = ({ notification }: { notification: NotificationDto }) => {
    openOne({ notification });
    setSelected(notification);
  };
  const close = () => {
    const wasUnread = selected?.readAt === null;
    setSelected(null);
    if (wasUnread) router.refresh();
  };
  const markUnread = ({ notification }: { notification: NotificationDto }) => {
    setSelected(null);
    mark({ ids: [notification.id], read: false });
  };
  return { selected, select, close, markUnread };
}
