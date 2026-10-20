import { type TicketPhaseDto, ticketPhaseHistory } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { PhaseHistoryList } from "./phase-history-list";
import { PhaseWarnings } from "./phase-warnings";

export type TicketPhaseHistoryProps = {
  locale: Locale;
  ticketId: string;
  phases: readonly Pick<TicketPhaseDto, "id" | "name">[];
};

/** The ticket's phase history and the facts that contradict its phase (`ticket.phaseHistory`). */
export async function TicketPhaseHistory({ locale, ticketId, phases }: TicketPhaseHistoryProps) {
  const t = await getTranslations("ticket.phaseHistory");
  const result = await runOperation({ operation: ticketPhaseHistory, input: { ticketId } });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const phaseNames = new Map(phases.map((phase) => [phase.id, phase.name]));
  return (
    <section data-slot="ticket-phase-history" className="grid gap-3">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <PhaseWarnings warnings={result.value.warnings} />
      <PhaseHistoryList items={result.value.items} phaseNames={phaseNames} />
    </section>
  );
}
