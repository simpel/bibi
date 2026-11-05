import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { desiredPeriod } from "@/features/order/ui/desired-period";
import { Link } from "@/lib/navigation";
import { orderName } from "@/lib/order-label";
import { orderRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { OrderTableViewProps } from "./order-table-view";

type Row = OrderTableViewProps["items"][number];

/** Title (link), desired period and headcount of the orders in the chat card. */
export function useOrderViewColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.order");
  const format = useDateTimeFormat();
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "title",
        header: t("columns.title"),
        accessorFn: (order) => order.title ?? order.reference,
        cell: ({ row: { original: order } }) => (
          <Link href={orderRoute({ id: order.id })} className="font-medium hover:underline">
            {orderName({
              title: order.title,
              fallback: t("reference", { reference: order.reference }),
            })}
          </Link>
        ),
      },
      {
        id: "when",
        header: t("columns.when"),
        accessorFn: (order) => order.desiredStartsAt,
        cell: ({ row: { original: order } }) => desiredPeriod({ order, format }),
      },
      {
        id: "headcount",
        header: t("columns.headcount"),
        accessorFn: (order) => order.estimatedHeadcount,
      },
    ],
    [t, format],
  );
}
