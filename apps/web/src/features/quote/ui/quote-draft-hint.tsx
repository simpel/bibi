import type { QuoteDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ticketRoute } from "@/lib/routes";

export type QuoteDraftHintProps = { quote: QuoteDto };

/** ADR 0052: a DRAFT's lines are the ticket's, so they are edited on the ticket. */
export async function QuoteDraftHint({ quote }: QuoteDraftHintProps) {
  if (quote.quoteStatus !== "DRAFT") return null;
  const t = await getTranslations("quote");
  return (
    <p className="text-sm text-muted-foreground">
      {t("draftLines")}{" "}
      <Link href={ticketRoute({ id: quote.ticketId })} className="underline">
        {t("editLinesOnTicket")}
      </Link>
    </p>
  );
}
