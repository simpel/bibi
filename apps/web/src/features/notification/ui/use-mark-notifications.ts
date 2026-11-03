import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import {
  markAllNotificationsReadAction,
  markNotificationsReadAction,
  markNotificationsUnreadAction,
} from "../actions";
import type { NotificationLike } from "../lib/notification-like";
import { useNotificationLive } from "./notification-live-context";

/**
 * Read state changes with the shared toast flow. A success hands the new count and the change to
 * the live state, which every open list applies itself: nothing is rendered again on the server.
 * Opening an unread notification marks it read quietly: bookkeeping, not something asked for.
 */
export function useMarkNotifications() {
  const t = useTranslations("notifications");
  const common = useTranslations("common");
  const { applyMark } = useNotificationLive();
  const { run, pending } = useToastAction();
  const mark = ({ ids, read }: { ids: string[]; read: boolean }) =>
    run({
      action: () =>
        read ? markNotificationsReadAction({ ids }) : markNotificationsUnreadAction({ ids }),
      messages: {
        pending: common("saving"),
        success: t(read ? "markedRead" : "markedUnread", { count: ids.length }),
      },
      onSuccess: ({ value }) => applyMark({ ids, read, unread: value.unread }),
    });
  const markAllRead = () =>
    run({
      action: () => markAllNotificationsReadAction(),
      messages: { pending: common("saving"), success: t("markedAllRead") },
      onSuccess: ({ value }) => applyMark({ ids: "all", read: true, unread: value.unread }),
    });
  const openOne = ({ notification }: { notification: NotificationLike }) => {
    if (notification.readAt !== null) return;
    const ids = [notification.id];
    void markNotificationsReadAction({ ids }).then((result) => {
      if (result.ok) applyMark({ ids, read: true, unread: result.value.unread });
    });
  };
  return { mark, markAllRead, openOne, pending };
}
