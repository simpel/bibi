import type { OrderStatusDto } from "@bibi/core/schemas";
import { ColorSwatch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { FlowGatesForm } from "./flow-gates-form";
import { FlowMovesForm } from "./flow-moves-form";

export type StatusFlowCardProps = {
  orderStatus: OrderStatusDto;
  /** Every active status. */
  statuses: readonly OrderStatusDto[];
};

/** One status in the flow editor: where its orders may go, and what moves into it require. */
export function StatusFlowCard({ orderStatus, statuses }: StatusFlowCardProps) {
  const t = useTranslations("orderStatus.flow");
  const others = statuses.filter((status) => status.id !== orderStatus.id);
  return (
    <article className="grid gap-4 rounded-lg border p-4">
      <h3 className="inline-flex items-center gap-2 font-medium">
        <ColorSwatch color={orderStatus.color} />
        {orderStatus.name}
      </h3>
      <section className="grid gap-2" aria-label={t("movesOut", { name: orderStatus.name })}>
        <FlowMovesForm
          key={movesKey({ orderStatus })}
          orderStatus={orderStatus}
          targets={others}
        />
      </section>
      <section className="grid gap-2" aria-label={t("movesIn", { name: orderStatus.name })}>
        <FlowGatesForm
          key={gatesKey({ orderStatus })}
          orderStatus={orderStatus}
          sources={others.filter((status) => !status.closes)}
        />
      </section>
    </article>
  );
}

const movesKey = ({ orderStatus }: { orderStatus: OrderStatusDto }) =>
  `${orderStatus.restrictsNext}:${orderStatus.closes}:${orderStatus.transitionsTo.join(",")}`;

const gatesKey = ({ orderStatus }: { orderStatus: OrderStatusDto }) =>
  JSON.stringify(orderStatus.gatesInto);
