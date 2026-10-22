import { listQuotes, type TicketDto, type TicketPhaseDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateQuoteButton } from "./create-quote-button";
import { QuoteDrift } from "./quote-drift";
import { QuoteVersions } from "./quote-versions";

export type TicketQuotesProps = {
  locale: Locale;
  ticket: TicketDto;
  phases: readonly TicketPhaseDto[];
};

/**
 * The ticket's quote (ADR 0022, 0043): its versions, "create quote" while the ticket is open and
 * has none, and how the ticket's lines differ from the accepted quote (ADR 0052). Hidden for
 * callers who may not read quotes.
 */
export async function TicketQuotes({ locale, ticket, phases }: TicketQuotesProps) {
  const t = await getTranslations("quote");
  const abilities = await getCallerAbilities();
  const quotes = await runOperation({
    operation: listQuotes,
    input: { ticketId: ticket.id, limit: 100 },
  });
  if (!quotes.ok) {
    if (quotes.error.code === "FORBIDDEN") return null;
    return <ErrorState errorKey={handleLoadError({ error: quotes.error, locale })} />;
  }
  const items = quotes.value.items;
  const open = !phases.find(({ id }) => id === ticket.phaseId)?.terminal;
  const canCreate = can({ abilities, permission: "quote:write" }) && open && items.length === 0;
  const accepted = items.find((quote) => quote.quoteStatus === "ACCEPTED");
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("plural")}</h2>
        {canCreate ? <CreateQuoteButton ticketId={ticket.id} /> : null}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <QuoteVersions quotes={items} />
      )}
      {accepted ? <QuoteDrift quote={accepted} /> : null}
    </section>
  );
}
