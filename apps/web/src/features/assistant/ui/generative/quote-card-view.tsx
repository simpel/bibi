"use client";

import { Link } from "@bibi/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { QuoteLinesTable } from "@/features/quote/ui/quote-lines-table";
import { QuoteStatusBadge } from "@/features/quote/ui/quote-status-badge";
import { QuoteTotals } from "@/features/quote/ui/quote-totals";
import { quoteRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type QuoteCardViewProps = GenerativeProps<"quote-card">;

/** One quote version: status, validity, lines with change markers and totals. */
export function QuoteCardView({ quote }: QuoteCardViewProps) {
  const t = useTranslations("assistant.ui.quote");
  const format = useFormatter();
  const href = quoteRoute({ id: quote.id });
  const validUntil = quote.validUntil
    ? format.dateTime(new Date(quote.validUntil), { dateStyle: "medium" })
    : null;
  return (
    <Card data-slot="quote-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={href} className="hover:underline">
            {t("title", { version: quote.version })}
          </Link>
        </CardTitle>
        <QuoteStatusBadge status={quote.quoteStatus} />
      </CardHeader>
      <CardContent className="grid gap-3 p-4 pt-0 text-sm">
        <p className="text-muted-foreground">
          {validUntil ? t("validUntil", { date: validUntil }) : t("noValidity")}
        </p>
        <QuoteLinesTable lines={quote.lines} removedLines={quote.removedLines} />
        <QuoteTotals quote={quote} />
        <Link href={href} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
