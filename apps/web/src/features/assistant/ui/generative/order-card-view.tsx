"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { desiredPeriod } from "@/features/order/ui/desired-period";
import { Link } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";
import { orderName } from "@/lib/order-label";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";
import { fieldLines } from "./item-facts";

export type OrderCardViewProps = GenerativeProps<"order-card">;

/** One order: title (link), desired period, headcount and own fields. */
export function OrderCardView({ order }: OrderCardViewProps) {
  const t = useTranslations("assistant.ui.order");
  const format = useDateTimeFormat();
  const href = orderRoute({ id: order.id });
  const headcount = order.guaranteedHeadcount ?? order.estimatedHeadcount;
  return (
    <Card data-slot="order-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={href} className="hover:underline">
            {orderName({
              title: order.title,
              fallback: t("reference", { reference: order.reference }),
            })}
          </Link>
        </CardTitle>
        <Badge variant="secondary">{t("singular")}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>{desiredPeriod({ order, format })}</p>
        {headcount === null ? null : <p>{t("headcount", { count: headcount })}</p>}
        {fieldLines({ fields: order.fields }).map((line) => (
          <p key={line}>{line}</p>
        ))}
        <Link href={href} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
