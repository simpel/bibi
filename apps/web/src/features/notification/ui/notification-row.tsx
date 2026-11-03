import { cn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { RelativeTime } from "@/components/relative-time";
import { Link } from "@/lib/navigation";
import { notificationHref } from "../lib/notification-href";
import type { NotificationLike } from "../lib/notification-like";
import { UnreadDot } from "./unread-dot";
import { useNotificationText } from "./use-notification-text";

export type NotificationRowProps = {
  notification: NotificationLike;
  /** Called before the link opens, e.g. to mark it read and close the popover. */
  onOpen?: (input: { notification: NotificationLike }) => void;
};

/** One notification as a link: unread dot, what happened, the ticket and when. */
export function NotificationRow({ notification, onOpen }: NotificationRowProps) {
  const t = useTranslations("notifications");
  const text = useNotificationText()({ notification });
  const unread = notification.readAt === null;
  return (
    <Link
      href={notificationHref({ notification })}
      onClick={() => onOpen?.({ notification })}
      className={cn(
        "grid grid-cols-[0.5rem_minmax(0,1fr)] gap-x-3 gap-y-0.5 rounded-md px-3 py-2 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
        !unread && "text-muted-foreground",
      )}
    >
      <span className="pt-1.5">{unread ? <UnreadDot label={t("unread")} /> : null}</span>
      <span className={cn("truncate", unread && "font-medium")}>{text.message}</span>
      <span className="col-start-2 flex min-w-0 gap-2 text-xs text-muted-foreground">
        <span className="truncate">{text.ticket}</span>
        <span aria-hidden>·</span>
        <span className="shrink-0">
          <RelativeTime instant={notification.createdAt} />
        </span>
      </span>
    </Link>
  );
}
