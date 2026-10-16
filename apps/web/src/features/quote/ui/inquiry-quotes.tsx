import { INQUIRY_TRANSITIONS, type InquiryDto, listQuotes } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadQuoteItems } from "../load-quote-items";
import { CreateQuoteButton } from "./create-quote-button";
import { QuoteVersions } from "./quote-versions";

export type InquiryQuotesProps = { locale: Locale; inquiry: InquiryDto };

/**
 * The inquiry's quote (ADR 0022): its versions, and "create quote" while the open inquiry has
 * none. Hidden for callers who may not read quotes.
 */
export async function InquiryQuotes({ locale, inquiry }: InquiryQuotesProps) {
  const t = await getTranslations("quote");
  const { quoteWrite } = await getCallerAbilities();
  const quotes = await runOperation({
    operation: listQuotes,
    input: { inquiryId: inquiry.id, limit: 100 },
  });
  if (!quotes.ok) {
    if (quotes.error.code === "FORBIDDEN") return null;
    return <ErrorState errorKey={handleLoadError({ error: quotes.error, locale })} />;
  }
  const items = quotes.value.items;
  const open = INQUIRY_TRANSITIONS[inquiry.inquiryStatus].length > 0;
  const canCreate = quoteWrite && open && items.length === 0;
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("plural")}</h2>
        {canCreate ? (
          <CreateQuoteButton inquiryId={inquiry.id} items={await loadQuoteItems()} />
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <QuoteVersions quotes={items} />
      )}
    </section>
  );
}
