import type { PipelineCard } from "@okazi/core";
import { useFormatter, useNow, useTranslations } from "next-intl";

export type PipelineCardContentProps = { card: PipelineCard };

/** What a board card shows: ticket number and type, customer, start and quantity. */
export function PipelineCardContent({ card }: PipelineCardContentProps) {
  const t = useTranslations("pipeline");
  const format = useFormatter();
  const since = useNow();
  const heading = `#${card.reference} · ${card.typeName}`;
  return (
    <div className="grid gap-0.5 text-sm">
      <span className="flex items-center gap-1 font-medium">{heading}</span>
      <span className="text-muted-foreground">{card.customerName}</span>
      <span className="text-xs text-muted-foreground">
        {card.startsAt ? format.dateTime(card.startsAt, { dateStyle: "medium" }) : t("noDate")}
        {card.quantity === null ? "" : ` · ${t("quantity", { count: card.quantity })}`}
      </span>
      <span className="text-xs text-muted-foreground">
        {t("inPhase", { time: format.relativeTime(card.phaseChangedAt, since) })}
        {card.heldLines > 0 ? ` · ${t("heldLines", { count: card.heldLines })}` : ""}
        {card.bookedLines > 0 ? ` · ${t("bookedLines", { count: card.bookedLines })}` : ""}
      </span>
    </div>
  );
}
