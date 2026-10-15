"use client";

import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { bookingRoute, bookingSeriesRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { occupancyPeriod } from "./occupancy-period";

export type BookingSeriesCardViewProps = GenerativeProps<"booking-series-card">;

/** One series: rule (link), occurrence count, and each clashing occurrence linked to its booking. */
export function BookingSeriesCardView({ series }: BookingSeriesCardViewProps) {
  const t = useTranslations("assistant.ui.bookingSeries");
  const format = useFormatter();
  const href = bookingSeriesRoute({ id: series.id });
  const total = series.occurrences.length;
  return (
    <Card data-slot="booking-series-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={href} className="hover:underline">
            {series.rule}
          </Link>
        </CardTitle>
        <Badge variant="secondary">{t("singular")}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>{t("occurrences", { count: total })}</p>
        {series.clashes.length === 0 ? <p>{t("noClashes")}</p> : null}
        {series.clashes.map((clash) => (
          <p key={clash.bookingId} className="flex items-center gap-2">
            <Badge variant="warning">{t("clash")}</Badge>
            <Link href={bookingRoute({ id: clash.bookingId })} className="hover:underline">
              {t("occurrence", { index: clash.occurrenceIndex, total })}
            </Link>
            {occupancyPeriod({ format, startsAt: clash.startsAt, endsAt: clash.endsAt })}
          </p>
        ))}
        <Link href={href} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
