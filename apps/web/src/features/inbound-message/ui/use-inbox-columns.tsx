import { actionsColumn, Badge, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { InboxRow } from "./inbox-row";

export type UseInboxColumnsInput = {
  renderActions?: (row: InboxRow) => ReactNode;
  /** Opens the message's sheet. */
  onSelect: (input: { row: InboxRow }) => void;
};

type SubjectColumnInput = {
  t: ReturnType<typeof useTranslations<"inbox">>;
  onSelect: UseInboxColumnsInput["onSelect"];
};

/** The subject, opening the message's sheet; bold while unread. */
const subjectColumn = ({ t, onSelect }: SubjectColumnInput): ColumnDef<InboxRow> => ({
  id: "subject",
  header: t("columns.subject"),
  accessorFn: (row) => row.subject ?? "",
  cell: ({ row }) => (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect({ row: row.original });
      }}
      className={
        row.original.read ? "text-left hover:underline" : "text-left font-medium hover:underline"
      }
    >
      {row.original.subject ?? t("noSubject")}
    </button>
  ),
});

/** Subject (opens the message's sheet), sender, channel, received, row actions. */
export function useInboxColumns({
  renderActions,
  onSelect,
}: UseInboxColumnsInput): ColumnDef<InboxRow>[] {
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  const actions: ColumnDef<InboxRow>[] = renderActions
    ? [actionsColumn<InboxRow>({ label: common("actions"), cell: renderActions })]
    : [];
  return [
    subjectColumn({ t, onSelect }),
    {
      id: "sender",
      header: t("columns.sender"),
      accessorFn: (row) => row.sender ?? t("unknownSender"),
    },
    {
      id: "channel",
      header: t("columns.channel"),
      accessorFn: (row) => t(`channels.${row.channel}`),
      cell: ({ row }) => <Badge variant="secondary">{t(`channels.${row.original.channel}`)}</Badge>,
    },
    {
      id: "received",
      header: t("columns.received"),
      accessorFn: (row) => row.receivedAt,
      cell: ({ row }) => row.original.receivedLabel,
    },
    ...actions,
  ];
}
