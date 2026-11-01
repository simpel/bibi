"use client";

import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { VatRow } from "../lib/table-rows";
import { useVatColumns } from "./use-vat-columns";

export type VatTableProps = { rows: VatRow[] };

/** Output VAT per rate for the period. */
export function VatTable({ rows }: VatTableProps) {
  const t = useTranslations("finance.vat");
  return (
    <PersistedDataTable
      flush
      tableId="finance.vat"
      columns={useVatColumns()}
      data={rows}
      getRowId={(row) => String(row.rate)}
      emptyText={t("empty")}
    />
  );
}
