import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Link } from "@/lib/navigation";
import { ticketRoute } from "@/lib/routes";
import type { OverdueRow } from "../lib/table-rows";

/** Invoice, ticket (link), due date, days overdue and the open amount. */
export function useOverdueColumns(): ColumnDef<OverdueRow>[] {
  const t = useTranslations("finance.overdue.columns");
  return useMemo<ColumnDef<OverdueRow>[]>(
    () => [
      { id: "invoice", header: t("invoice"), accessorFn: (row) => row.invoiceLabel },
      {
        id: "ticket",
        header: t("ticket"),
        accessorFn: (row) => row.ticketLabel,
        cell: ({ row: { original: row } }) => (
          <Link href={ticketRoute({ id: row.ticketId })} className="font-medium hover:underline">
            {row.ticketLabel}
          </Link>
        ),
      },
      {
        id: "dueDate",
        header: t("dueDate"),
        accessorFn: (row) => row.dueDate,
        cell: ({ row }) => row.original.dueDateText,
      },
      { id: "daysOverdue", header: t("daysOverdue"), accessorFn: (row) => row.daysOverdue },
      {
        id: "open",
        header: t("open"),
        accessorFn: (row) => row.openMinor,
        cell: ({ row }) => row.original.openText,
      },
    ],
    [t],
  );
}
