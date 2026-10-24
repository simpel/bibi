"use client";

import type { OrderLineDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { type QuoteLineRow, useQuoteLineColumns } from "./use-quote-line-columns";

export type QuoteLinesTableProps = {
  lines: readonly QuoteLineRow["line"][];
  removedLines?: readonly OrderLineDto[];
  /** Saved column order key; the ticket's differences use their own. */
  tableId?: string;
};

/** The quote's order lines with change markers, and the lines this version removed. */
export function QuoteLinesTable({
  lines,
  removedLines = [],
  tableId = "quote.lines",
}: QuoteLinesTableProps) {
  const t = useTranslations("quote");
  const columns = useQuoteLineColumns();
  const rows = useMemo<QuoteLineRow[]>(
    () => [
      ...lines.map((line) => ({ line, removed: false })),
      ...removedLines.map((line) => ({ line, removed: true })),
    ],
    [lines, removedLines],
  );
  return (
    <PersistedDataTable
      tableId={tableId}
      columns={columns}
      data={rows}
      getRowId={({ line }) => line.id}
      emptyText={t("lines.none")}
    />
  );
}
