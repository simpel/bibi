import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { RelativeTime } from "@/components/relative-time";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { BoardCard } from "../lib/kanban-model";

export type PipelineCardContentProps = {
  /** `customerName` is null when the caller may not view customers: then none is shown. */
  card: Omit<BoardCard, "zoneId" | "title">;
};

/** What a board card shows: ticket number and type, status in a grouped column, customer, start. */
export function PipelineCardContent({ card }: PipelineCardContentProps) {
  const t = useTranslations("pipeline");
  const format = useDateTimeFormat();
  const heading = `#${card.reference} · ${card.typeName}`;
  return (
    <div className="grid gap-0.5 text-sm">
      <span className="flex items-center gap-1 font-medium">
        {heading}
        {card.statusTitle ? (
          <Badge variant="outline" className="ml-auto font-normal">
            {card.statusTitle}
          </Badge>
        ) : null}
      </span>
      {card.customerName ? (
        <span className="text-muted-foreground">{card.customerName}</span>
      ) : null}
      <span className="text-xs text-muted-foreground">
        {card.startsAt ? format.date({ instant: card.startsAt }) : t("noDate")}
        {card.quantity === null ? "" : ` · ${t("quantity", { count: card.quantity })}`}
      </span>
      <span className="text-xs text-muted-foreground">
        {t.rich("inStatus", { time: () => <RelativeTime instant={card.statusChangedAt} /> })}
        {card.heldLines ? ` · ${t("heldLines", { count: card.heldLines })}` : ""}
        {card.bookedLines ? ` · ${t("bookedLines", { count: card.bookedLines })}` : ""}
      </span>
    </div>
  );
}
