import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import {
  markAllNotificationsReadAction,
  markNotificationsReadAction,
  markNotificationsUnreadAction,
} from "../actions";
import type { NotificationLike } from "../lib/notification-like";

/**
 * Read state changes with the shared toast flow, then a refresh. Opening an unread notification
 * marks it read quietly: it is bookkeeping, not something the member asked for.
 */
export function useMarkNotifications() {
  const t = useTranslations("notifications");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const mark = ({ ids, read }: { ids: string[]; read: boolean }) =>
    run({
      action: () =>
        read ? markNotificationsReadAction({ ids }) : markNotificationsUnreadAction({ ids }),
      messages: {
        pending: common("saving"),
        success: t(read ? "markedRead" : "markedUnread", { count: ids.length }),
      },
      onSuccess: () => router.refresh(),
    });
  const markAllRead = () =>
    run({
      action: () => markAllNotificationsReadAction(),
      messages: { pending: common("saving"), success: t("markedAllRead") },
      onSuccess: () => router.refresh(),
    });
  const openOne = ({ notification }: { notification: NotificationLike }) => {
    if (notification.readAt === null) void markNotificationsReadAction({ ids: [notification.id] });
  };
  return { mark, markAllRead, openOne, pending };
}
