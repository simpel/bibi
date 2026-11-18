import type { QuoteDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { HelpHint } from "@/components/help/help-hint";
import { Link } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";

export type QuoteDraftHintProps = { quote: QuoteDto };

/** ADR 0052: a DRAFT's lines are the order's, so they are edited on the order. */
export async function QuoteDraftHint({ quote }: QuoteDraftHintProps) {
  if (quote.quoteStatus !== "DRAFT") return null;
  const t = await getTranslations("quote");
  return (
    <HelpHint id="quote-draft">
      <p className="py-0.5 text-xs text-muted-foreground">
        {t("draftLines")}{" "}
        <Link href={orderRoute({ id: quote.orderId })} className="underline">
          {t("editLinesOnOrder")}
        </Link>
      </p>
    </HelpHint>
  );
}
