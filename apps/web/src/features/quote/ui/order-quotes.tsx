import { listQuotes, type OrderDto, type OrderStatusDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { Link } from "@/lib/navigation";
import { quoteRoute } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateQuoteButton } from "./create-quote-button";
import { currentQuote, quoteAbilities } from "./quote-abilities";
import { QuoteBody } from "./quote-body";
import { QuoteStatusBadge } from "./quote-status-badge";

export type OrderQuotesProps = {
  locale: Locale;
  order: OrderDto;
  statuses: readonly OrderStatusDto[];
};

/**
 * The order's quote (ADR 0022, 0052, 0116): the current version in full, as on its own page,
 * ending with links to the other versions; "create quote" while the order is open and has none.
 * Hidden for callers who may not read quotes.
 */
export async function OrderQuotes({ locale, order, statuses }: OrderQuotesProps) {
  const [t, abilities, quotes] = await Promise.all([
    getTranslations("quote"),
    getCallerAbilities(),
    runOperation({ operation: listQuotes, input: { orderId: order.id, limit: 100 } }),
  ]);
  if (!quotes.ok) {
    if (quotes.error.code === "FORBIDDEN") return null;
    return <ErrorState inline errorKey={handleLoadError({ error: quotes.error, locale })} />;
  }
  const items = quotes.value.items;
  const open = !statuses.find(({ id }) => id === order.statusId)?.closes;
  const canWrite = can({ abilities, permission: "quote:write" });
  const current = currentQuote({ quotes: items });
  if (!current) {
    return (
      <section className="grid grid-cols-1 gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl">{t("singular")}</h2>
          {canWrite && open ? <CreateQuoteButton orderId={order.id} /> : null}
        </div>
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </section>
    );
  }
  const quoteCan = quoteAbilities({
    quote: current,
    latestVersion: Math.max(...items.map(({ version }) => version)),
    canEdit: canWrite && open,
    canRestore: can({ abilities, permission: "program:write" }) && open,
    now: new Date(),
  });
  return (
    <section className="grid grid-cols-1 gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl">
          <Link href={quoteRoute({ id: current.id })} className="hover:underline">
            {t("title", { version: current.version })}
          </Link>
        </h2>
        <QuoteStatusBadge status={current.quoteStatus} />
      </div>
      <QuoteBody quote={current} versions={items} can={quoteCan} />
    </section>
  );
}
