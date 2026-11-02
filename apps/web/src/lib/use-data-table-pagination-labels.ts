import type { DataTableLabels } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type PaginationLabelsInput = { total: (count: number) => string };

/** Pagination footer texts for `DataTable` (`common.table`); the list names its own total. */
export function useDataTablePaginationLabels({ total }: PaginationLabelsInput): DataTableLabels {
  const t = useTranslations("common.table");
  return {
    rowsPerPage: t("rowsPerPage"),
    pageOf: (page, pageCount) => t("pageOf", { page, pageCount }),
    first: t("firstPage"),
    previous: t("previousPage"),
    next: t("nextPage"),
    last: t("lastPage"),
    total,
  };
}
