import type { DataTableTextLabels } from "@bibi/ui";
import { useTranslations } from "next-intl";

/** Sorting, column reorder and selection texts for `DataTable` (`common.table`). */
export function useDataTableTextLabels(): DataTableTextLabels {
  const t = useTranslations("common.table");
  return {
    sortAscending: t("sortAscending"),
    sortDescending: t("sortDescending"),
    clearSort: t("clearSort"),
    dragColumn: (column) => t("dragColumn", { column }),
    dragInstructions: t("dragInstructions"),
    columnPickedUp: (column) => t("columnPickedUp", { column }),
    columnMoved: (column, position, total) => t("columnMoved", { column, position, total }),
    columnDropped: (column, position, total) => t("columnDropped", { column, position, total }),
    selectAll: t("selectAll"),
    selectRow: t("selectRow"),
    selected: (count) => t("selected", { count }),
  };
}
