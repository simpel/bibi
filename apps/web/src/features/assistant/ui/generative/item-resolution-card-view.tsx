"use client";

import { Link } from "@bibi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ItemResolutionView } from "@/features/item/ui/item-resolution-view";
import { itemRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";

export type ItemResolutionCardViewProps = GenerativeProps<"item-resolution-card">;

/** `item.resolve`: what an item contains and may contain, with its expanded parts. */
export function ItemResolutionCardView({ resolution }: ItemResolutionCardViewProps) {
  const t = useTranslations("item.resolution");
  const href = itemRoute({ id: resolution.itemId });
  return (
    <Card data-slot="item-resolution-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={href} className="hover:underline">
            {resolution.name}
          </Link>
        </CardTitle>
        <Badge variant="secondary">{t("title")}</Badge>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ItemResolutionView resolution={resolution} />
      </CardContent>
    </Card>
  );
}
