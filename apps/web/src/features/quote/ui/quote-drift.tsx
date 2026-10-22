import type { QuoteDto } from "@bibi/core";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { QuoteLinesTable } from "./quote-lines-table";

export type QuoteDriftProps = { quote: QuoteDto };

/**
 * ADR 0052: how the ticket's lines now differ from an accepted quote (derived, never stored).
 * Nothing when the quote is not accepted or still matches the ticket.
 */
export async function QuoteDrift({ quote }: QuoteDriftProps) {
  if (!quote.differsFromTicket) return null;
  const t = await getTranslations("quote.drift");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("title", { version: quote.version })}
          <Badge variant="warning">{t("badge")}</Badge>
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <QuoteLinesTable
          lines={quote.ticketChanges}
          removedLines={quote.ticketRemovedLines}
          tableId="quote.drift"
        />
      </CardContent>
    </Card>
  );
}
