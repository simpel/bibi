import { orderEstimateHistory } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { getNumberFormat } from "@/server/number-format";
import { runOperation } from "@/server/run-operation";
import { EstimateHistoryList } from "./estimate-history-list";

export type OrderEstimateHistoryProps = {
  locale: Locale;
  orderId: string;
};

/** The order's estimated value over time (`order.estimateHistory`, ADR 0074). */
export async function OrderEstimateHistory({ locale, orderId }: OrderEstimateHistoryProps) {
  const [t, dates, numbers] = await Promise.all([
    getTranslations("order.estimateHistory"),
    getDateTimeFormat(),
    getNumberFormat(),
  ]);
  const result = await runOperation({ operation: orderEstimateHistory, input: { orderId } });
  if (!result.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: result.error, locale })} />;
  return (
    <section data-slot="order-estimate-history" className="grid grid-cols-1 gap-3">
      <h2 className="text-xl">{t("title")}</h2>
      <EstimateHistoryList items={result.value.items} numbers={numbers} dates={dates} />
    </section>
  );
}
