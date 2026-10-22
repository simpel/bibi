"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { itemRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import type { GenerativeProps } from "./generative-props";
import { occupancyPeriod } from "./occupancy-period";

export type OccupancyCardViewProps = GenerativeProps<"occupancy-card">;

/** One occupancy: type, period and note, linking to the item's page where blocks are edited. */
export function OccupancyCardView({ occupancy }: OccupancyCardViewProps) {
  const t = useTranslations("assistant.ui.occupancy");
  const types = useTranslations("occupancy.types");
  const format = useFormatter();
  return (
    <Card data-slot="occupancy-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{types(occupancy.type)}</CardTitle>
        <Badge variant={occupancy.status === "ACTIVE" ? "secondary" : "outline"}>
          {occupancy.status === "ACTIVE" ? t("singular") : t("released")}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p className="text-foreground">{occupancyPeriod({ format, ...occupancy })}</p>
        {occupancy.note ? <p>{occupancy.note}</p> : null}
        <Link href={itemRoute({ id: occupancy.itemId })} className="text-primary hover:underline">
          {t("openItem")}
        </Link>
      </CardContent>
    </Card>
  );
}
