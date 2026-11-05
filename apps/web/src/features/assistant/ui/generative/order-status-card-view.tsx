"use client";

import { STATUS_FLAGS } from "@bibi/core/schemas";
import { Badge, Card, CardContent, CardHeader, CardTitle, ColorSwatch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { orderStatusesRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import type { GenerativeProps } from "./generative-props";

export type OrderStatusCardViewProps = GenerativeProps<"order-status-card">;

/** One order status: color, flags and how many statuses it may move to. */
export function OrderStatusCardView({ orderStatus }: OrderStatusCardViewProps) {
  const t = useTranslations("assistant.ui.orderStatus");
  const flags = useTranslations("orderStatus.flags");
  const active = orderStatus.status === "ACTIVE";
  const set = STATUS_FLAGS.filter((flag) => orderStatus[flag]);
  return (
    <Card data-slot="order-status-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="inline-flex items-center gap-2 text-base">
          <ColorSwatch color={orderStatus.color} size="md" />
          {orderStatus.name}
        </CardTitle>
        <Badge variant={active ? "secondary" : "outline"}>
          {active ? t("singular") : t("archived")}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        {set.length > 0 ? (
          <p className="text-foreground">{set.map((flag) => flags(flag)).join(", ")}</p>
        ) : null}
        <p>{t("transitions", { count: orderStatus.transitionsTo.length })}</p>
        <Link href={orderStatusesRoute()} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
