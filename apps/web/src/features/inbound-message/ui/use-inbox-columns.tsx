import {
  actionsColumn,
  type ColumnDef,
  createTableColumns,
  statusColumn as uiStatusColumn,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { ActivityTitleCell } from "@/components/activity/activity-title-cell";
import { RelativeTime } from "@/components/relative-time";
import type { InboxRow } from "./inbox-row";
import type { InboxRowHandlers } from "./inbox-row-actions";

export type UseInboxColumnsInput = InboxRowHandlers & {
  /** The row being marked read before its sheet opens; it shimmers meanwhile. */
  openingId: string | null;
  renderActions?: ((row: InboxRow) => ReactNode) | undefined;
};

type Column = ColumnDef<InboxRow>;

/**
 * The subject (opens its sheet), sender, channel, status badge, received time and sticky actions
 * (ADR 0040, 0085).
 */
export function useInboxColumns({
  onSelect,
  openingId,
  renderActions,
}: UseInboxColumnsInput): Column[] {
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  return useMemo(
    () =>
      createTableColumns<InboxRow>({
        primary: [
          {
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
          },
        ],
        relations: [
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
        ],
        status: [
          uiStatusColumn<InboxRow>({
            header: common("status"),
            getStatus: (row) => ({
              label: row.read ? common("readFilter.read") : common("readFilter.unread"),
              color: row.read ? "var(--muted-foreground)" : "var(--primary)",
            }),
          }),
        ],
        dates: [
          {
            id: "received",
            header: t("columns.received"),
            accessorFn: (row) => row.receivedAt,
            cell: ({ row: { original: row } }) => (
              <span className="whitespace-nowrap text-muted-foreground">
                <RelativeTime instant={row.receivedAt} />
              </span>
            ),
          },
        ],
        actions: renderActions
          ? [actionsColumn<InboxRow>({ label: common("actions"), cell: renderActions })]
          : [],
      }),
    [t, common, onSelect, openingId, renderActions],
  );
}
