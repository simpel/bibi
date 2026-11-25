import type { NotificationDto } from "@bibi/core/schemas";
import { Avatar, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ActivityTimeCell } from "@/components/activity/activity-time-cell";
import { ActivityTitleCell } from "@/components/activity/activity-title-cell";
import { notificationIcon } from "@/components/activity/subject-icons";
import { Link } from "@/lib/navigation";
import { orderRoute, taskRoute } from "@/lib/routes";
import { useNotificationText } from "./use-notification-text";

type Column = ColumnDef<NotificationDto>;
type Translate = ReturnType<typeof useTranslations<"notifications">>;
type Text = ReturnType<typeof useNotificationText>;
type OnNotification = (input: { notification: NotificationDto }) => void;

export type UseNotificationColumnsInput = {
  /** Opens the sheet. */
  onSelect: OnNotification;
  onToggleRead: OnNotification;
  /** Opens the delete confirmation. */
  onDelete: OnNotification;
  /** The row being marked read before its sheet opens; it shimmers meanwhile. */
  openingId: string | null;
};

type ColumnInput = UseNotificationColumnsInput & { t: Translate; text: Text };

/** What happened, opening its sheet. */
const messageColumn = ({ t, text, onSelect, openingId }: ColumnInput): Column => ({
  id: "message",
  header: t("columns.message"),
  enableSorting: false,
  accessorFn: (notification) => text({ notification }).message,
  cell: ({ row: { original: notification } }) => (
    <ActivityTitleCell
      title={text({ notification }).message}
      icon={notificationIcon({ kind: notification.kind })}
      unread={notification.readAt === null}
      unreadLabel={t("unread")}
      pending={openingId === notification.id}
      onOpen={() => onSelect({ notification })}
    />
  ),
});

/** The order, else the task (ADR 0117), the notification is about. */
function subjectHref({ notification }: { notification: NotificationDto }): string | null {
  if (notification.orderId) return orderRoute({ id: notification.orderId });
  return notification.taskId ? taskRoute({ id: notification.taskId }) : null;
}

/** The order (or task) at the time, as a link to it. */
const orderColumn = ({ t, text }: ColumnInput): Column => ({
  id: "order",
  header: t("columns.order"),
  accessorFn: (notification) => text({ notification }).order,
  cell: ({ row: { original: notification } }) => {
    const href = subjectHref({ notification });
    const label = text({ notification }).order;
    if (!href) return label;
    return (
      <Link href={href} onClick={(event) => event.stopPropagation()} className="hover:underline">
        {label}
      </Link>
    );
  },
});

/** When, then mark read or unread and delete. */
const createdColumn = ({ t, onToggleRead, onDelete }: ColumnInput): Column => ({
  id: "created",
  header: t("columns.created"),
  accessorFn: (notification) => notification.createdAt,
  cell: ({ row: { original: notification } }) => (
    <ActivityTimeCell
      instant={notification.createdAt}
      read={notification.readAt !== null}
      onToggleRead={() => onToggleRead({ notification })}
      onDelete={() => onDelete({ notification })}
    />
  ),
});

/**
 * What happened (opens its sheet), the order (a link), the kind, who did it and when, with mark
 * read or unread and delete as icons (ADR 0040, 0094). Ids are core's sort keys where they sort.
 */
export function useNotificationColumns({
  onSelect,
  onToggleRead,
  onDelete,
  openingId,
}: UseNotificationColumnsInput): Column[] {
  const t = useTranslations("notifications");
  const text = useNotificationText();
  const columns = { onSelect, onToggleRead, onDelete, openingId, t, text };
  return [
    messageColumn(columns),
    orderColumn(columns),
    { id: "kind", header: t("columns.kind"), accessorFn: (n) => t(`kinds.${n.kind}`) },
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
