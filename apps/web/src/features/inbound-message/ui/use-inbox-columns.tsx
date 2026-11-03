import { actionsColumn, Button, type ColumnDef } from "@bibi/ui";
import { MailCheckIcon, MailIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { RelativeTime } from "@/components/relative-time";
import type { InboxRow } from "./inbox-row";
import { InboxTitleCell } from "./inbox-title-cell";

type Translate = ReturnType<typeof useTranslations<"inbox">>;
type OnRow = (input: { row: InboxRow }) => void;

export type UseInboxColumnsInput = {
  renderActions?: (row: InboxRow) => ReactNode;
  /** Opens the message's sheet. */
  onSelect: OnRow;
  /** The hover action: read becomes unread and back (left out without `inbox:write`). */
  onToggleRead?: OnRow;
  /** The row being marked read before its sheet opens; it shimmers meanwhile. */
  openingId: string | null;
};

type ReceivedInput = { t: Translate; onToggleRead: OnRow | undefined };

/** When it came in, and on hover mark read or unread in its place. */
const receivedColumn = ({ t, onToggleRead }: ReceivedInput): ColumnDef<InboxRow> => ({
  id: "received",
  header: t("columns.received"),
  accessorFn: (row) => row.receivedAt,
  cell: ({ row: { original: row } }) => (
    <div className="flex justify-end text-xs text-muted-foreground">
      <span
        className={
          onToggleRead ? "group-hover/row:hidden group-focus-within/row:hidden" : undefined
        }
      >
        <RelativeTime instant={row.receivedAt} />
      </span>
      {onToggleRead ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={row.read ? t("markUnread") : t("markRead")}
          title={row.read ? t("markUnread") : t("markRead")}
          className="hidden size-7 group-hover/row:inline-flex group-focus-within/row:inline-flex"
          onClick={(event) => {
            event.stopPropagation();
            onToggleRead({ row });
          }}
        >
          {row.read ? <MailIcon /> : <MailCheckIcon />}
        </Button>
      ) : null}
    </div>
  ),
});

/**
 * Inbox style (ADR 0040, 0085): the sender over the subject (opens its sheet), the channel as the
 * reason, when it came in (mark read or unread in its place on hover), then the row actions.
 */
export function useInboxColumns({
  renderActions,
  onSelect,
  onToggleRead,
  openingId,
}: UseInboxColumnsInput): ColumnDef<InboxRow>[] {
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  const actions: ColumnDef<InboxRow>[] = renderActions
    ? [actionsColumn<InboxRow>({ label: common("actions"), cell: renderActions })]
    : [];
  return [
    {
      id: "subject",
      header: t("columns.subject"),
      accessorFn: (row) => row.subject ?? "",
      cell: ({ row }) => (
        <InboxTitleCell
          row={row.original}
          pending={openingId === row.original.id}
          onSelect={onSelect}
        />
      ),
    },
    {
      id: "channel",
      header: t("columns.channel"),
      accessorFn: (row) => t(`channels.${row.channel}`),
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">{String(getValue())}</span>
      ),
    },
    receivedColumn({ t, onToggleRead }),
    ...actions,
  ];
}
