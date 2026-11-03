import type { NotificationDto } from "@bibi/core/schemas";
import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { RelativeTime } from "@/components/relative-time";
import { Link } from "@/lib/navigation";
import { ticketRoute } from "@/lib/routes";
import { UnreadDot } from "./unread-dot";
import { useNotificationText } from "./use-notification-text";

type Column = ColumnDef<NotificationDto>;
type Translate = ReturnType<typeof useTranslations<"notifications">>;
type Text = ReturnType<typeof useNotificationText>;
type OnSelect = (input: { notification: NotificationDto }) => void;

export type UseNotificationColumnsInput = { onSelect: OnSelect };

type MessageColumnInput = { t: Translate; text: Text; onSelect: OnSelect };

/** What happened, opening its sheet; the server cannot order by the sentence. */
const messageColumn = ({ t, text, onSelect }: MessageColumnInput): Column => ({
  id: "message",
  header: t("columns.message"),
  enableSorting: false,
  accessorFn: (notification) => text({ notification }).message,
  cell: ({ row: { original: notification } }) => {
    const unread = notification.readAt === null;
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onSelect({ notification });
        }}
        className="flex items-center gap-2 text-left hover:underline"
      >
        {unread ? <UnreadDot label={t("unread")} /> : null}
        <span className={unread ? "font-medium" : undefined}>{text({ notification }).message}</span>
      </button>
    );
  },
});

/** The ticket at the time, as a link to it; text alone when there is no ticket. */
const ticketColumn = ({ t, text }: { t: Translate; text: Text }): Column => ({
  id: "ticket",
  header: t("columns.ticket"),
  accessorFn: (notification) => text({ notification }).ticket,
  cell: ({ row: { original: notification } }) =>
    notification.ticketId ? (
      <Link
        href={ticketRoute({ id: notification.ticketId })}
        onClick={(event) => event.stopPropagation()}
        className="hover:underline"
      >
        {text({ notification }).ticket}
      </Link>
    ) : (
      text({ notification }).ticket
    ),
});

/**
 * What happened (opens its sheet), kind, ticket (a link) and when. No read status and no row actions: the page
 * splits unread from read, and marking is in the right-click menu and the bulk bar. Column ids
 * are core's sort keys (`notification.list`).
 */
export function useNotificationColumns({ onSelect }: UseNotificationColumnsInput): Column[] {
  const t = useTranslations("notifications");
  const text = useNotificationText();
  return [
    messageColumn({ t, text, onSelect }),
    { id: "kind", header: t("columns.kind"), accessorFn: (n) => t(`kinds.${n.kind}`) },
    ticketColumn({ t, text }),
    {
      id: "created",
      header: t("columns.created"),
      accessorFn: (notification) => notification.createdAt,
      cell: ({ row }) => <RelativeTime instant={row.original.createdAt} />,
    },
  ];
}
