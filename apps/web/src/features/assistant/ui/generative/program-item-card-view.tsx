"use client";

import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { bookingRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { fieldLines } from "./item-facts";
import { occupancyPeriod } from "./occupancy-period";

export type ProgramItemCardViewProps = GenerativeProps<"program-item-card">;

/** One program item: name, time, quantity, whether someone is responsible and own fields. */
export function ProgramItemCardView({ programItem }: ProgramItemCardViewProps) {
  const t = useTranslations("assistant.ui.programItem");
  const format = useFormatter();
  const href = bookingRoute({ id: programItem.bookingId });
  const { quantity } = programItem;
  return (
    <Card data-slot="program-item-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{programItem.name}</CardTitle>
        <Badge variant="secondary">{t("singular")}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>{occupancyPeriod({ format, ...programItem })}</p>
        {quantity === null ? null : <p>{t("quantity", { count: quantity })}</p>}
        <p>{programItem.responsibleId ? t("hasResponsible") : t("noResponsible")}</p>
        {programItem.status === "ARCHIVED" ? <p>{t("archived")}</p> : null}
        {fieldLines({ fields: programItem.fields }).map((line) => (
          <p key={line}>{line}</p>
        ))}
        <Link href={href} className="text-primary hover:underline">
          {t("openBooking")}
        </Link>
      </CardContent>
    </Card>
  );
}
