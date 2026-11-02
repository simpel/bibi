import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { WorkOrderNeedRow } from "../document-rows";
import { ChangeCell } from "./use-work-order-task-columns";

type Column = ColumnDef<WorkOrderNeedRow>;

/** ★ · need · count · where it applies. */
export function useWorkOrderNeedColumns(): Column[] {
  const t = useTranslations("workOrder.document.columns");
  return useMemo<Column[]>(
    () => [
      {
        id: "change",
        header: "★",
        accessorFn: (row) => row.change ?? "",
        cell: ({ row }) => <ChangeCell change={row.original.change} />,
      },
      {
        id: "need",
        header: t("need"),
        accessorFn: (row) => row.need,
        cell: ({ row }) => (
          <span className={row.original.change === "REMOVED" ? "line-through" : "font-medium"}>
            {row.original.need}
          </span>
        ),
      },
      { id: "quantity", header: t("count"), accessorFn: (row) => row.quantity ?? "" },
      { id: "appliesTo", header: t("appliesTo"), accessorFn: (row) => row.appliesTo },
    ],
    [t],
  );
}
