import { type OrderStatusDto, orderStatusHistory } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { StatusHistoryList } from "./status-history-list";
import { StatusWarnings } from "./status-warnings";

export type OrderStatusHistoryProps = {
  locale: Locale;
  orderId: string;
  statuses: readonly Pick<OrderStatusDto, "id" | "name">[];
};

/** The order's status history and the facts that contradict its status (`order.statusHistory`). */
export async function OrderStatusHistory({ locale, orderId, statuses }: OrderStatusHistoryProps) {
  const [t, dates] = await Promise.all([
    getTranslations("order.statusHistory"),
    getDateTimeFormat(),
  ]);
  const result = await runOperation({ operation: orderStatusHistory, input: { orderId } });
  if (!result.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: result.error, locale })} />;
  const statusNames = new Map(statuses.map((orderStatus) => [orderStatus.id, orderStatus.name]));
  return (
    <section data-slot="order-status-history" className="grid grid-cols-1 gap-3">
      <h2 className="text-xl">{t("title")}</h2>
      <StatusWarnings warnings={result.value.warnings} />
      <StatusHistoryList items={result.value.items} statusNames={statusNames} dates={dates} />
    </section>
  );
}
