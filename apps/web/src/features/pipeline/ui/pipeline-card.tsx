import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { KeyboardEvent } from "react";
import { RelativeTime } from "@/components/relative-time";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { BoardCard } from "../lib/kanban-model";

export type PipelineCardContentProps = {
  /** `customerName` is null when the caller may not view customers: then none is shown. */
  card: BoardCard;
  /** Opens the order's sheet beside the board; without it (customize mode) the title is plain. */
  onOpen?: (input: { orderId: string }) => void;
};

/** Enter and space open the order; they must not reach the card, where they lift it. */
const keepKeys = ({ event }: { event: KeyboardEvent }) => {
  if (event.key === "Enter" || event.key === " ") event.stopPropagation();
};

/** What a board card shows: its title (opens the order), status in a grouped column, type and customer, start. */
export function PipelineCardContent({ card, onOpen }: PipelineCardContentProps) {
  const t = useTranslations("pipeline");
  const format = useDateTimeFormat();
  const about = [card.typeName, card.customerName].filter(Boolean).join(" · ");
  return (
    <div className="grid gap-0.5 text-sm">
      <span className="flex items-start gap-1">
        {onOpen ? (
          <button
            type="button"
            className="text-left font-medium underline-offset-4 hover:underline focus-visible:underline"
            onClick={() => onOpen({ orderId: card.id })}
            onKeyDown={(event) => keepKeys({ event })}
          >
            {card.title}
          </button>
        ) : (
          <span className="font-medium">{card.title}</span>
        )}
        {card.statusTitle ? (
          <Badge variant="outline" className="ml-auto font-normal">
            {card.statusTitle}
          </Badge>
        ) : null}
      </span>
      <span className="text-muted-foreground">{about}</span>
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
