"use client";

import type { QuoteDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useQuoteVersionColumns } from "./use-quote-version-columns";

export type QuoteVersionsProps = {
  quotes: readonly QuoteDto[];
  /** The version shown on the page, highlighted. */
  currentId?: string;
};

/** Every version of an ticket's quote, newest first; each links to its page. */
export function QuoteVersions({ quotes, currentId }: QuoteVersionsProps) {
  const t = useTranslations("quote");
  const columns = useQuoteVersionColumns();
  return (
    <PersistedDataTable
      tableId="quote.versions"
      columns={columns}
      data={[...quotes]}
      getRowId={(quote) => quote.id}
      {...(currentId ? { selectedRowId: currentId } : {})}
      emptyText={t("empty")}
    />
  );
}
