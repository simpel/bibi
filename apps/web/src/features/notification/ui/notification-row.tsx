import { FeedItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { notificationIcon } from "@/components/activity/subject-icons";
import { RelativeTime } from "@/components/relative-time";
import { notificationHref } from "../lib/notification-href";
import type { NotificationLike } from "../lib/notification-like";
import { UnreadDot } from "./unread-dot";
import { useNotificationText } from "./use-notification-text";

export type NotificationRowProps = {
  notification: NotificationLike;
  /** Called before the link opens, e.g. to mark it read and close the popover. */
  onOpen?: (input: { notification: NotificationLike }) => void;
  /** A hover button over the end of the row, e.g. dismiss. */
  action?: ReactNode;
};

/** One notification as a link: its kind's icon, what happened, the order and when, unread dot. */
export function NotificationRow({ notification, onOpen, action }: NotificationRowProps) {
  const t = useTranslations("notifications");
  const text = useNotificationText()({ notification });
  const unread = notification.readAt === null;
  return (
    <FeedItem
      icon={notificationIcon({ kind: notification.kind })}
      href={notificationHref({ notification })}
      onClick={() => onOpen?.({ notification })}
      title={text.message}
      emphasis={unread}
      muted={!unread}
      marker={unread ? <UnreadDot label={t("unread")} /> : null}
      action={action}
      meta={
        <>
          <span className="truncate">{text.order}</span>
          <span aria-hidden>·</span>
          <span className="shrink-0">
            <RelativeTime instant={notification.createdAt} />
          </span>
        </>
      }
    />
  );
}
