import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ExportRow } from "../lib/export-rows";
import { DownloadExportMenu } from "./download-export-menu";

export type UseAccountingExportColumnsInput = { canDownload: boolean };

/** Number, file name, range, date and voucher count; "Download" in the row menu with `finance:write`. */
export function useAccountingExportColumns({
  canDownload,
}: UseAccountingExportColumnsInput): ColumnDef<ExportRow>[] {
  const t = useTranslations("finance.export.columns");
  const common = useTranslations("common");
  return useMemo<ColumnDef<ExportRow>[]>(
    () => [
      { id: "number", header: t("number"), accessorFn: (row) => row.number },
      { id: "fileName", header: t("fileName"), accessorFn: (row) => row.fileName },
      { id: "range", header: t("range"), accessorFn: (row) => row.rangeText },
      {
        id: "date",
        header: t("date"),
        accessorFn: (row) => row.createdAt,
        cell: ({ row }) => row.original.dateText,
      },
      { id: "vouchers", header: t("vouchers"), accessorFn: (row) => row.voucherCount },
      ...(canDownload
        ? [
            actionsColumn<ExportRow>({
              label: common("actions"),
              cell: (row) => <DownloadExportMenu id={row.id} />,
            }),
          ]
        : []),
    ],
    [t, common, canDownload],
  );
}
