import type { DataTableLabels } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type PaginationLabelsInput = { total?: ((count: number) => string) | undefined };

/** Pagination footer texts for `DataTable` (`common.table`); a list may name its own total, else "3 rows". */
export function useDataTablePaginationLabels({ total }: PaginationLabelsInput): DataTableLabels {
  const t = useTranslations("common.table");
  return {
    rowsPerPage: t("rowsPerPage"),
    pageOf: (page, pageCount) => t("pageOf", { page, pageCount }),
    first: t("firstPage"),
    previous: t("previousPage"),
    next: t("nextPage"),
    last: t("lastPage"),
    total: total ?? ((count) => t("total", { count })),
  };
}
