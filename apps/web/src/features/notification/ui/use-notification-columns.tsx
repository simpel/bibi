import type { NotificationDto } from "@bibi/core/schemas";
import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { RelativeTime } from "@/components/relative-time";
import { Link } from "@/lib/navigation";
import { notificationHref } from "../lib/notification-href";
import { UnreadDot } from "./unread-dot";
import { useNotificationText } from "./use-notification-text";

type Column = ColumnDef<NotificationDto>;
type Translate = ReturnType<typeof useTranslations<"notifications">>;
type Text = ReturnType<typeof useNotificationText>;
type OnOpen = (input: { notification: NotificationDto }) => void;

export type UseNotificationColumnsInput = { onOpen: OnOpen };

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

/**
 * What happened (opens it), kind, ticket and when. No read status and no row actions: the page
 * splits unread from read, and marking is in the right-click menu and the bulk bar. Column ids
 * are core's sort keys (`notification.list`).
 */
export function useNotificationColumns({ onOpen }: UseNotificationColumnsInput): Column[] {
  const t = useTranslations("notifications");
  const text = useNotificationText();
  return [
    messageColumn({ t, text, onOpen }),
    { id: "kind", header: t("columns.kind"), accessorFn: (n) => t(`kinds.${n.kind}`) },
    {
      id: "ticket",
      header: t("columns.ticket"),
      accessorFn: (notification) => text({ notification }).ticket,
    },
    {
      id: "created",
      header: t("columns.created"),
      accessorFn: (notification) => notification.createdAt,
      cell: ({ row }) => <RelativeTime instant={row.original.createdAt} />,
    },
  ];
}
