import type { NotificationDto } from "@bibi/core/schemas";
import { actionsColumn, Badge, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { RelativeTime } from "@/components/relative-time";
import { Link } from "@/lib/navigation";
import { notificationHref } from "../lib/notification-href";
import { UnreadDot } from "./unread-dot";
import { useNotificationText } from "./use-notification-text";

type Column = ColumnDef<NotificationDto>;
type Translate = ReturnType<typeof useTranslations<"notifications">>;
type Text = ReturnType<typeof useNotificationText>;
type OnOpen = (input: { notification: NotificationDto }) => void;

export type UseNotificationColumnsInput = {
  renderActions: (notification: NotificationDto) => ReactNode;
  onOpen: OnOpen;
};

type MessageColumnInput = { t: Translate; text: Text; onOpen: OnOpen };

/** What happened, opening it; the server cannot order by the sentence. */
const messageColumn = ({ t, text, onOpen }: MessageColumnInput): Column => ({
  id: "message",
  header: t("columns.message"),
  enableSorting: false,
  accessorFn: (notification) => text({ notification }).message,
  cell: ({ row: { original: notification } }) => {
    const unread = notification.readAt === null;
    return (
      <Link
        href={notificationHref({ notification })}
        onClick={() => onOpen({ notification })}
        className="flex items-center gap-2 hover:underline"
      >
        {unread ? <UnreadDot label={t("unread")} /> : null}
        <span className={unread ? "font-medium" : undefined}>{text({ notification }).message}</span>
      </Link>
    );
  },
});

/** Unread or read, as a badge. */
const readColumn = ({ t }: { t: Translate }): Column => ({
  id: "read",
  header: t("columns.read"),
  accessorFn: (notification) => (notification.readAt === null ? t("unread") : t("read")),
  cell: ({ row: { original: notification } }) =>
    notification.readAt === null ? (
      <Badge variant="destructive">{t("unread")}</Badge>
    ) : (
      <Badge variant="outline">{t("read")}</Badge>
    ),
});

/**
 * What happened (opens it), kind, ticket, read status and when, then the row actions. Column ids
 * are core's sort keys (`notification.list`).
 */
export function useNotificationColumns({ renderActions, onOpen }: UseNotificationColumnsInput) {
  const t = useTranslations("notifications");
  const common = useTranslations("common");
  const text = useNotificationText();
  const columns: Column[] = [
    messageColumn({ t, text, onOpen }),
    { id: "kind", header: t("columns.kind"), accessorFn: (n) => t(`kinds.${n.kind}`) },
    {
      id: "ticket",
      header: t("columns.ticket"),
      accessorFn: (notification) => text({ notification }).ticket,
    },
    readColumn({ t }),
    {
      id: "created",
      header: t("columns.created"),
      accessorFn: (notification) => notification.createdAt,
      cell: ({ row }) => <RelativeTime instant={row.original.createdAt} />,
    },
  ];
  return [
    ...columns,
    actionsColumn<NotificationDto>({ label: common("actions"), cell: renderActions }),
  ];
}
