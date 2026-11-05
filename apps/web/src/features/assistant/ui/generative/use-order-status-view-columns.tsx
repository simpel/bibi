import { STATUS_FLAGS } from "@bibi/core/schemas";
import { ColorSwatch, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { orderStatusesRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import type { OrderStatusTableViewProps } from "./order-status-table-view";

type Row = OrderStatusTableViewProps["items"][number];

/** Name (link), flags and transition count of the statuses in the chat card. */
export function useOrderStatusViewColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.orderStatus");
  const flags = useTranslations("orderStatus.flags");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (orderStatus) => orderStatus.name,
        cell: ({ row: { original: orderStatus } }) => (
          <Link
            href={orderStatusesRoute()}
            className="inline-flex items-center gap-2 font-medium hover:underline"
          >
            <ColorSwatch color={orderStatus.color} />
            {orderStatus.name}
          </Link>
        ),
      },
      {
        id: "flags",
        header: t("columns.flags"),
        accessorFn: (orderStatus) =>
          STATUS_FLAGS.filter((flag) => orderStatus[flag])
            .map((flag) => flags(flag))
            .join(", "),
      },
      {
        id: "transitions",
        header: t("columns.transitions"),
        accessorFn: (orderStatus) => orderStatus.transitionsTo.length,
        cell: ({ row }) => t("transitions", { count: row.original.transitionsTo.length }),
      },
    ],
    [t, flags],
  );
}
