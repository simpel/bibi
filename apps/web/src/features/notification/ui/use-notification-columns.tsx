import type { NotificationDto } from "@bibi/core/schemas";
import { Avatar, Button, type ColumnDef } from "@bibi/ui";
import { MailCheckIcon, MailIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { RelativeTime } from "@/components/relative-time";
import { NotificationTitleCell } from "./notification-title-cell";
import { useNotificationText } from "./use-notification-text";

type Column = ColumnDef<NotificationDto>;
type Translate = ReturnType<typeof useTranslations<"notifications">>;
type Text = ReturnType<typeof useNotificationText>;
type OnNotification = (input: { notification: NotificationDto }) => void;

export type UseNotificationColumnsInput = {
  /** Opens the sheet. */
  onSelect: OnNotification;
  /** The hover action: read becomes unread and back. */
  onToggleRead: OnNotification;
  /** The row being marked read before its sheet opens; it shimmers meanwhile. */
  openingId: string | null;
};

type ColumnInput = UseNotificationColumnsInput & { t: Translate; text: Text };

/** The ticket above what happened (inbox style); the sentence opens the sheet. */
const messageColumn = ({ t, text, onSelect, openingId }: ColumnInput): Column => ({
  id: "message",
  header: t("columns.message"),
  enableSorting: false,
  accessorFn: (notification) => text({ notification }).message,
  cell: ({ row: { original: notification } }) => (
    <NotificationTitleCell
      notification={notification}
      text={text({ notification })}
      unreadLabel={t("unread")}
      pending={openingId === notification.id}
      onSelect={onSelect}
    />
  ),
});

/** When, and on hover the quick action in its place: mark read or unread. */
const createdColumn = ({ t, onToggleRead }: ColumnInput): Column => ({
  id: "created",
  header: t("columns.created"),
  accessorFn: (notification) => notification.createdAt,
  cell: ({ row: { original: notification } }) => {
    const read = notification.readAt !== null;
    return (
      <div className="flex justify-end text-xs text-muted-foreground">
        <span className="group-hover/row:hidden group-focus-within/row:hidden">
          <RelativeTime instant={notification.createdAt} />
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={read ? t("markUnread") : t("markRead")}
          title={read ? t("markUnread") : t("markRead")}
          className="hidden size-7 group-hover/row:inline-flex group-focus-within/row:inline-flex"
          onClick={(event) => {
            event.stopPropagation();
            onToggleRead({ notification });
          }}
        >
          {read ? <MailIcon /> : <MailCheckIcon />}
        </Button>
      </div>
    );
  },
});

/**
 * Inbox style (ADR 0040, 0094): the ticket over what happened (opens its sheet), the kind as the
 * reason, who did it and when, with mark read or unread in place of the time on hover. Column
 * ids are core's sort keys (`notification.list`) where they sort.
 */
export function useNotificationColumns({
  onSelect,
  onToggleRead,
  openingId,
}: UseNotificationColumnsInput): Column[] {
  const t = useTranslations("notifications");
  const text = useNotificationText();
  const columns = { onSelect, onToggleRead, openingId, t, text };
  return [
    messageColumn(columns),
    {
      id: "kind",
      header: t("columns.kind"),
      accessorFn: (n) => t(`kinds.${n.kind}`),
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">{String(getValue())}</span>
      ),
    },
    {
      id: "actor",
      header: t("columns.actor"),
      enableSorting: false,
      accessorFn: (n) => n.data.actorName ?? t("someone"),
      cell: ({ row: { original: n } }) => (
        <Avatar name={n.data.actorName ?? t("someone")} size="sm" />
      ),
    },
    createdColumn(columns),
  ];
}
