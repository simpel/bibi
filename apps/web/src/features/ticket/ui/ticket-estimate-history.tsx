import { ticketEstimateHistory } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { getNumberFormat } from "@/server/number-format";
import { runOperation } from "@/server/run-operation";
import { EstimateHistoryList } from "./estimate-history-list";

export type TicketEstimateHistoryProps = {
  locale: Locale;
  ticketId: string;
};

/** The ticket's estimated value over time (`ticket.estimateHistory`, ADR 0074). */
export async function TicketEstimateHistory({ locale, ticketId }: TicketEstimateHistoryProps) {
  const [t, dates, numbers] = await Promise.all([
    getTranslations("ticket.estimateHistory"),
    getDateTimeFormat(),
    getNumberFormat(),
  ]);
  const result = await runOperation({ operation: ticketEstimateHistory, input: { ticketId } });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  return (
    <section data-slot="ticket-estimate-history" className="grid grid-cols-1 gap-3">
      <h2 className="text-xl">{t("title")}</h2>
      <EstimateHistoryList items={result.value.items} numbers={numbers} dates={dates} />
    </section>
  );
}
