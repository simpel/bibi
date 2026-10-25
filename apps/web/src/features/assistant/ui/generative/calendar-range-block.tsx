"use client";

import { Badge, ColorSwatch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { CalendarBlockWire } from "./calendar-range-model";

export type CalendarRangeBlockProps = { block: CalendarBlockWire; timeZone: string };

/** One block: time range, title (or its type), ticket reference and state colour. */
export function CalendarRangeBlock({ block, timeZone }: CalendarRangeBlockProps) {
  const t = useTranslations("assistant.ui.calendar");
  const types = useTranslations("occupancy.types");
  const format = useDateTimeFormat();
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="tabular-nums text-muted-foreground">
        {format.timeRange({ start: block.startsAt, end: block.endsAt, timeZone })}
      </span>
      {block.stateColor ? <ColorSwatch color={block.stateColor} /> : null}
      <span className="font-medium">{block.title ?? types(block.type)}</span>
      {block.reference === null ? null : (
        <span className="text-muted-foreground">#{block.reference}</span>
      )}
      {block.stateName ? <span className="text-muted-foreground">{block.stateName}</span> : null}
      {block.soft ? <Badge variant="outline">{t("softHold")}</Badge> : null}
    </li>
  );
}
