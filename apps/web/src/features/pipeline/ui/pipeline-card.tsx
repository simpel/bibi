import type { PipelineCard } from "@okazi/core";
import { useFormatter, useTranslations } from "next-intl";

export type PipelineCardContentProps = { card: PipelineCard };

/** What a board card shows: ticket number and type, customer, start and quantity. */
export function PipelineCardContent({ card }: PipelineCardContentProps) {
  const t = useTranslations("pipeline");
  const format = useFormatter();
  const heading = `#${card.reference} · ${card.typeName}`;
  return (
    <div className="grid gap-0.5 text-sm">
      <span className="flex items-center gap-1 font-medium">{heading}</span>
      <span className="text-muted-foreground">{card.customerName}</span>
      <span className="text-xs text-muted-foreground">
        {card.startsAt ? format.dateTime(card.startsAt, { dateStyle: "medium" }) : t("noDate")}
        {card.quantity === null ? "" : ` · ${t("quantity", { count: card.quantity })}`}
      </span>
    </div>
  );
}
