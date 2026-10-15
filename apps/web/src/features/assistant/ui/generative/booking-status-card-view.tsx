"use client";

import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle, ColorSwatch } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { bookingStatusesRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";

export type BookingStatusCardViewProps = GenerativeProps<"booking-status-card">;

/** One booking status: color, phase and how many statuses it may move to. */
export function BookingStatusCardView({ status }: BookingStatusCardViewProps) {
  const t = useTranslations("assistant.ui.bookingStatus");
  const phases = useTranslations("bookingStatus.phases");
  const active = status.status === "ACTIVE";
  return (
    <Card data-slot="booking-status-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="inline-flex items-center gap-2 text-base">
          <ColorSwatch color={status.color} size="md" />
          {status.name}
        </CardTitle>
        <Badge variant={active ? "secondary" : "outline"}>
          {active ? t("singular") : t("archived")}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p className="text-foreground">{phases(status.phase)}</p>
        <p>{t("transitions", { count: status.transitionsTo.length })}</p>
        <Link href={bookingStatusesRoute()} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
