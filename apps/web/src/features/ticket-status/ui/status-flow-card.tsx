import type { TicketStatusDto } from "@bibi/core/schemas";
import { ColorSwatch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { FlowGatesForm } from "./flow-gates-form";
import { FlowMovesForm } from "./flow-moves-form";

export type StatusFlowCardProps = {
  ticketStatus: TicketStatusDto;
  /** Every active status. */
  statuses: readonly TicketStatusDto[];
};

/** One status in the flow editor: where its tickets may go, and what moves into it require. */
export function StatusFlowCard({ ticketStatus, statuses }: StatusFlowCardProps) {
  const t = useTranslations("ticketStatus.flow");
  const others = statuses.filter((status) => status.id !== ticketStatus.id);
  return (
    <article className="grid gap-4 rounded-lg border p-4">
      <h3 className="inline-flex items-center gap-2 font-medium">
        <ColorSwatch color={ticketStatus.color} />
        {ticketStatus.name}
      </h3>
      <section className="grid gap-2" aria-label={t("movesOut", { name: ticketStatus.name })}>
        <FlowMovesForm
          key={movesKey({ ticketStatus })}
          ticketStatus={ticketStatus}
          targets={others}
        />
      </section>
      <section className="grid gap-2" aria-label={t("movesIn", { name: ticketStatus.name })}>
        <FlowGatesForm
          key={gatesKey({ ticketStatus })}
          ticketStatus={ticketStatus}
          sources={others.filter((status) => !status.closes)}
        />
      </section>
    </article>
  );
}

const movesKey = ({ ticketStatus }: { ticketStatus: TicketStatusDto }) =>
  `${ticketStatus.restrictsNext}:${ticketStatus.closes}:${ticketStatus.transitionsTo.join(",")}`;

const gatesKey = ({ ticketStatus }: { ticketStatus: TicketStatusDto }) =>
  JSON.stringify(ticketStatus.gatesInto);
