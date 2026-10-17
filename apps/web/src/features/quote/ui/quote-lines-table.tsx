"use client";

import type { OrderLineDto, QuoteLineDto } from "@okazi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { type QuoteLineRow, useQuoteLineColumns } from "./use-quote-line-columns";

export type QuoteLinesTableProps = {
  lines: readonly QuoteLineDto[];
  removedLines: readonly OrderLineDto[];
};

/** The quote's order lines with change markers, and the lines this version removed. */
export function QuoteLinesTable({ lines, removedLines }: QuoteLinesTableProps) {
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
      tableId="quote.lines"
      columns={columns}
      data={rows}
      getRowId={({ line }) => line.id}
      emptyText={t("lines.none")}
    />
  );
}
