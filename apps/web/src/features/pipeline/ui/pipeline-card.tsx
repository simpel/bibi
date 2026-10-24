import type { PipelineCard } from "@bibi/core";
import { useFormatter, useTranslations } from "next-intl";
import { RelativeTime } from "@/components/relative-time";

export type PipelineCardContentProps = {
  /** `customerName` is null when the caller may not view customers: then none is shown. */
  card: PipelineCard & { customerName: string | null };
};

/** What a board card shows: ticket number and type, customer, start and quantity. */
export function PipelineCardContent({ card }: PipelineCardContentProps) {
  const t = useTranslations("pipeline");
  const format = useFormatter();
  const heading = `#${card.reference} · ${card.typeName}`;
  return (
    <div className="grid gap-0.5 text-sm">
      <span className="flex items-center gap-1 font-medium">{heading}</span>
      {card.customerName ? (
        <span className="text-muted-foreground">{card.customerName}</span>
      ) : null}
      <span className="text-xs text-muted-foreground">
        {card.startsAt ? format.dateTime(card.startsAt, { dateStyle: "medium" }) : t("noDate")}
        {card.quantity === null ? "" : ` · ${t("quantity", { count: card.quantity })}`}
      </span>
      <span className="text-xs text-muted-foreground">
        {t.rich("inPhase", { time: () => <RelativeTime instant={card.phaseChangedAt} /> })}
        {card.heldLines ? ` · ${t("heldLines", { count: card.heldLines })}` : ""}
        {card.bookedLines ? ` · ${t("bookedLines", { count: card.bookedLines })}` : ""}
      </span>
    </div>
  );
}
