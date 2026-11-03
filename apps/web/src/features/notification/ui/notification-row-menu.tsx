import type { NotificationDto } from "@bibi/core/schemas";
import { ContextMenuItem, ContextMenuSeparator } from "@bibi/ui";
import { MailCheckIcon, MailIcon, PanelRightOpenIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";

type OnNotification = (input: { notification: NotificationDto }) => void;

export type NotificationRowMenuProps = {
  notification: NotificationDto;
  onSelect: OnNotification;
  onToggleRead: OnNotification;
  onDelete: OnNotification;
  disabled: boolean;
};

/** A row's right-click menu, the same as the inbox's: open, mark read or unread, delete. */
export function NotificationRowMenu({
  notification,
  onSelect,
  onToggleRead,
  onDelete,
  disabled,
}: NotificationRowMenuProps) {
  const common = useTranslations("common");
  const read = notification.readAt !== null;
  return (
    <>
      <ContextMenuItem onSelect={() => onSelect({ notification })}>
        <PanelRightOpenIcon />
        {common("open")}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem disabled={disabled} onSelect={() => onToggleRead({ notification })}>
        {read ? <MailIcon /> : <MailCheckIcon />}
        {read ? common("markUnread") : common("markRead")}
      </ContextMenuItem>
      <ContextMenuItem destructive onSelect={() => onDelete({ notification })}>
        <Trash2Icon />
        {common("delete")}
      </ContextMenuItem>
    </>
  );
}
