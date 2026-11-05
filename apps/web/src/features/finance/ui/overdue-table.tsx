"use client";

import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { OverdueRow } from "../lib/table-rows";
import { useOverdueColumns } from "./use-overdue-columns";

export type OverdueTableProps = { rows: OverdueRow[] };

/** The most overdue invoices, each linking to its order. */
export function OverdueTable({ rows }: OverdueTableProps) {
  const t = useTranslations("finance.overdue");
  return (
    <PersistedDataTable
      flush
      tableId="finance.overdue"
      columns={useOverdueColumns()}
      data={rows}
      getRowId={(row) => row.invoiceId}
      emptyText={t("empty")}
    />
  );
}
