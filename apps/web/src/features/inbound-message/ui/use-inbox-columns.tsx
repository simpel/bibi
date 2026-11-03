import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ActivityTimeCell } from "@/components/activity/activity-time-cell";
import { ActivityTitleCell } from "@/components/activity/activity-title-cell";
import type { InboxRow } from "./inbox-row";
import type { InboxRowHandlers } from "./inbox-row-actions";

export type UseInboxColumnsInput = InboxRowHandlers & {
  /** The row being marked read before its sheet opens; it shimmers meanwhile. */
  openingId: string | null;
};

type Column = ColumnDef<InboxRow>;
type ColumnInput = UseInboxColumnsInput & { t: ReturnType<typeof useTranslations<"inbox">> };

/** The subject, opening its sheet. */
const subjectColumn = ({ t, onSelect, openingId }: ColumnInput): Column => ({
  id: "subject",
  header: t("columns.subject"),
  accessorFn: (row) => row.subject ?? "",
  cell: ({ row: { original: row } }) => (
    <ActivityTitleCell
      title={row.subject ?? t("noSubject")}
      unread={!row.read}
      unreadLabel={t("unread")}
      pending={openingId === row.id}
      onOpen={() => onSelect({ row })}
    />
  ),
});

/** When it came in, then mark read or unread and delete. */
const receivedColumn = ({ t, onToggleRead, onDelete }: ColumnInput): Column => ({
  id: "received",
  header: t("columns.received"),
  accessorFn: (row) => row.receivedAt,
  cell: ({ row: { original: row } }) => (
    <ActivityTimeCell
      instant={row.receivedAt}
      read={row.read}
      {...(onToggleRead ? { onToggleRead: () => onToggleRead({ row }) } : {})}
      {...(onDelete ? { onDelete: () => onDelete({ row }) } : {})}
    />
  ),
});

/**
 * The subject (opens its sheet), sender, channel and when, with mark read or unread and delete
 * as icons: the same as the notifications table (ADR 0040, 0085).
 */
export function useInboxColumns({
  onSelect,
  onToggleRead,
  onDelete,
  openingId,
}: UseInboxColumnsInput): Column[] {
  const t = useTranslations("inbox");
  const columns = { onSelect, onToggleRead, onDelete, openingId, t };
  return [
    subjectColumn(columns),
    {
      id: "sender",
      header: t("columns.sender"),
      accessorFn: (row) => row.sender ?? t("unknownSender"),
    },
    {
      id: "channel",
      header: t("columns.channel"),
      accessorFn: (row) => t(`channels.${row.channel}`),
    },
    receivedColumn(columns),
  ];
}
