"use client";

import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { bookingRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { fieldLines } from "./item-facts";
import { occupancyPeriod } from "./occupancy-period";

export type BookingCardViewProps = GenerativeProps<"booking-card">;

/** One booking: reference (link), time, headcount, whether owners are set and own fields. */
export function BookingCardView({ booking }: BookingCardViewProps) {
  const t = useTranslations("assistant.ui.booking");
  const format = useFormatter();
  const href = bookingRoute({ id: booking.id });
  const headcount = booking.estimatedHeadcount;
  return (
    <Card data-slot="booking-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={href} className="hover:underline">
            {t("reference", { reference: booking.reference })}
          </Link>
        </CardTitle>
        <Badge variant="secondary">{t("singular")}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>{occupancyPeriod({ format, startsAt: booking.startsAt, endsAt: booking.endsAt })}</p>
        {headcount === null ? null : <p>{t("headcount", { count: headcount })}</p>}
        <p>{booking.coordinatorId ? t("hasCoordinator") : t("noCoordinator")}</p>
        {fieldLines({ fields: booking.fields }).map((line) => (
          <p key={line}>{line}</p>
        ))}
        <Link href={href} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
