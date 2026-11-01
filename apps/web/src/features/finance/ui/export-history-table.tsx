"use client";

import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { ExportRow } from "../lib/export-rows";
import { useAccountingExportColumns } from "./use-accounting-export-columns";

export type ExportHistoryTableProps = { rows: ExportRow[]; canDownload: boolean };

/** The SIE files made so far, newest first. */
export function ExportHistoryTable({ rows, canDownload }: ExportHistoryTableProps) {
  const t = useTranslations("finance.export");
  return (
    <PersistedDataTable
      tableId="finance.exports"
      columns={useAccountingExportColumns({ canDownload })}
      data={rows}
      getRowId={(row) => row.id}
      emptyText={t("historyEmpty")}
    />
  );
}
