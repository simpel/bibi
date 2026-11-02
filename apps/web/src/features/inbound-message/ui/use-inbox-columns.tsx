import { actionsColumn, Badge, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { inboxMessageRoute } from "@/lib/inbox-routes";
import { Link } from "@/lib/navigation";
import type { InboxRow } from "./inbox-row";

export type UseInboxColumnsInput = { renderActions?: (row: InboxRow) => ReactNode };

/** Subject (opens the message), sender, channel, received, row actions. */
export function useInboxColumns({ renderActions }: UseInboxColumnsInput): ColumnDef<InboxRow>[] {
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
        <Link
          href={inboxMessageRoute({ id: row.original.id })}
          className="font-medium hover:underline"
        >
          {row.original.subject ?? t("noSubject")}
        </Link>
      ),
    },
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
