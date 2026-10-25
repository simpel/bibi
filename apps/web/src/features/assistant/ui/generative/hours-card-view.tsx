"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { rowsFromDays } from "@/features/hours/lib/hours";
import { exceptionRowsFrom } from "@/features/hours/lib/hours-exceptions";
import { HoursExceptionsSummary } from "@/features/hours/ui/hours-exceptions-summary";
import { HoursSummary } from "@/features/hours/ui/hours-summary";
import type { GenerativeProps } from "./generative-props";

export type HoursCardViewProps = GenerativeProps<"hours-card">;

/** Weekday ranges and dated exceptions of a venue's opening hours or an item's working hours. */
export function HoursCardView({ hours }: HoursCardViewProps) {
  const t = useTranslations("assistant.ui.hours");
  const empty = hours.days.length === 0 && hours.exceptions.length === 0;
  return (
    <Card data-slot="hours-card" className="shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("zone", { zone: hours.timeZone })}</p>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 pt-0 text-sm">
        {empty ? <p className="text-muted-foreground">{t("empty")}</p> : null}
        {empty ? null : <HoursSummary rows={rowsFromDays({ days: hours.days })} />}
        <HoursExceptionsSummary rows={exceptionRowsFrom({ exceptions: hours.exceptions })} />
      </CardContent>
    </Card>
  );
}
