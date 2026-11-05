import { listQuotes, type OrderDto, type OrderStatusDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateQuoteButton } from "./create-quote-button";
import { QuoteDrift } from "./quote-drift";
import { QuoteVersions } from "./quote-versions";

export type OrderQuotesProps = {
  locale: Locale;
  order: OrderDto;
  statuses: readonly OrderStatusDto[];
};

/**
 * The order's quote (ADR 0022, 0043): its versions, "create quote" while the order is open and
 * has none, and how the order's lines differ from the accepted quote (ADR 0052). Hidden for
 * callers who may not read quotes.
 */
export async function OrderQuotes({ locale, order, statuses }: OrderQuotesProps) {
  const [t, abilities, quotes] = await Promise.all([
    getTranslations("quote"),
    getCallerAbilities(),
    runOperation({ operation: listQuotes, input: { orderId: order.id, limit: 100 } }),
  ]);
  if (!quotes.ok) {
    if (quotes.error.code === "FORBIDDEN") return null;
    return <ErrorState errorKey={handleLoadError({ error: quotes.error, locale })} />;
  }
  const items = quotes.value.items;
  const open = !statuses.find(({ id }) => id === order.statusId)?.closes;
  const canCreate = can({ abilities, permission: "quote:write" }) && open && items.length === 0;
  const accepted = items.find((quote) => quote.quoteStatus === "ACCEPTED");
  return (
    <section className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl">{t("plural")}</h2>
        {canCreate ? <CreateQuoteButton orderId={order.id} /> : null}
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
