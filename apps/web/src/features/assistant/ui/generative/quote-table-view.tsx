"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useQuoteCardColumns } from "./use-quote-card-columns";

export type QuoteTableViewProps = GenerativeProps<"quote-table">;

/** A page of quotes; each row links to the quote page. */
export function QuoteTableView({ items, nextCursor }: QuoteTableViewProps) {
  const t = useTranslations("assistant.ui.quote");
  const columns = useQuoteCardColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="quote-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.quote"
        columns={columns}
        data={items}
        getRowId={(quote) => quote.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
