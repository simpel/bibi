"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { OptionStatusBadge } from "@/features/option/ui/option-status-badge";
import { itemRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { occupancyPeriod } from "./occupancy-period";

export type OptionCardViewProps = GenerativeProps<"option-card">;

/** One option: its place in the queue, held period, expiry and note, linking to the item. */
export function OptionCardView({ option }: OptionCardViewProps) {
  const t = useTranslations("assistant.ui.option");
  const format = useFormatter();
  const expires = format.dateTime(new Date(option.expiresAt), {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <Card data-slot="option-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{occupancyPeriod({ format, ...option })}</CardTitle>
        <OptionStatusBadge status={option.optionStatus} rank={option.rank} />
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>{t("expires", { date: expires })}</p>
        {option.note ? <p>{option.note}</p> : null}
        <Link href={itemRoute({ id: option.itemId })} className="text-primary hover:underline">
          {t("openItem")}
        </Link>
      </CardContent>
    </Card>
  );
}
