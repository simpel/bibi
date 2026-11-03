import type { NotificationDto } from "@bibi/core/schemas";
import { ContextMenuItem, ContextMenuSeparator } from "@bibi/ui";
import { MailCheckIcon, MailIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { notificationHref } from "../lib/notification-href";
import type { useMarkNotifications } from "./use-mark-notifications";

type Marks = ReturnType<typeof useMarkNotifications>;

export type NotificationRowMenuProps = {
  notification: NotificationDto;
  mark: Marks["mark"];
  openOne: Marks["openOne"];
  disabled: boolean;
};

/** A row's right-click menu: open what it is about, and mark it read or unread. */
export function NotificationRowMenu({
  notification,
  mark,
  openOne,
  disabled,
}: NotificationRowMenuProps) {
  const t = useTranslations("notifications");
  const read = notification.readAt !== null;
  return (
    <>
      <ContextMenuItem asChild>
        <Link href={notificationHref({ notification })} onClick={() => openOne({ notification })}>
          {t("open")}
        </Link>
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        disabled={disabled}
        onSelect={() => mark({ ids: [notification.id], read: !read })}
      >
        {read ? <MailIcon /> : <MailCheckIcon />}
        {read ? t("markUnread") : t("markRead")}
      </ContextMenuItem>
    </>
  );
}
