import { type TicketStatusDto, ticketStatusHistory } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { StatusHistoryList } from "./status-history-list";
import { StatusWarnings } from "./status-warnings";

export type TicketStatusHistoryProps = {
  locale: Locale;
  ticketId: string;
  statuses: readonly Pick<TicketStatusDto, "id" | "name">[];
};

/** The ticket's status history and the facts that contradict its status (`ticket.statusHistory`). */
export async function TicketStatusHistory({
  locale,
  ticketId,
  statuses,
}: TicketStatusHistoryProps) {
  const [t, dates] = await Promise.all([
    getTranslations("ticket.statusHistory"),
    getDateTimeFormat(),
  ]);
  const result = await runOperation({ operation: ticketStatusHistory, input: { ticketId } });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const statusNames = new Map(statuses.map((ticketStatus) => [ticketStatus.id, ticketStatus.name]));
  return (
    <section data-slot="ticket-status-history" className="grid gap-3">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <StatusWarnings warnings={result.value.warnings} />
      <StatusHistoryList items={result.value.items} statusNames={statusNames} dates={dates} />
    </section>
  );
}
