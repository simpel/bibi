"use client";

import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { itemRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { fieldLines } from "./item-facts";

export type ItemCardViewProps = GenerativeProps<"item-card">;

/** One item: name (link), field values, price, default duration, setup capacities and parts. */
export function ItemCardView({ item }: ItemCardViewProps) {
  const t = useTranslations("assistant.ui.item");
  const format = useFormatter();
  const lines = fieldLines({ fields: item.fields });
  const price =
    item.priceMinor === null
      ? null
      : format.number(item.priceMinor / 100, { style: "currency", currency: "SEK" });
  const facts = [
    price && item.priceUnit ? `${price} ${t(`priceUnit.${item.priceUnit}`)}` : price,
    item.defaultDurationMinutes === null
      ? null
      : t("duration", { minutes: item.defaultDurationMinutes }),
    item.setups.length > 0 ? t("setupsCount", { count: item.setups.length }) : null,
    item.components.length > 0 ? t("componentsCount", { count: item.components.length }) : null,
  ].filter(Boolean);
  return (
    <Card data-slot="item-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={itemRoute({ id: item.id })} className="hover:underline">
            {item.name}
          </Link>
        </CardTitle>
        <Badge variant="secondary">{t("singular")}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        {item.description ? <p className="text-foreground">{item.description}</p> : null}
        {facts.length > 0 ? <p>{facts.join(" · ")}</p> : null}
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <Link href={itemRoute({ id: item.id })} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
