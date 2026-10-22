"use client";

import { Link } from "@bibi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PriceListPricing, PriceListValidity } from "@/features/price-list/ui/price-list-terms";
import { priceListsRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";

export type PriceListCardViewProps = GenerativeProps<"price-list-card">;

/** One price list: name, validity and its discount or number of agreed item prices. */
export function PriceListCardView({ priceList }: PriceListCardViewProps) {
  const t = useTranslations("assistant.ui.priceList");
  return (
    <Card data-slot="price-list-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{priceList.name}</CardTitle>
        <Badge variant={priceList.status === "ACTIVE" ? "secondary" : "outline"}>
          {priceList.status === "ACTIVE" ? t("singular") : t("archived")}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p className="text-foreground">
          <PriceListPricing {...priceList} itemCount={priceList.items.length} />
        </p>
        <p>
          <PriceListValidity {...priceList} />
        </p>
        <Link href={priceListsRoute()} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
