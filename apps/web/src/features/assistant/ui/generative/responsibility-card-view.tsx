"use client";

import { Link } from "@bibi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { responsibilitiesRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";

export type ResponsibilityCardViewProps = GenerativeProps<"responsibility-card">;

/** One responsibility: how much it covers. Names live on the responsibilities settings page. */
export function ResponsibilityCardView({ responsibility }: ResponsibilityCardViewProps) {
  const t = useTranslations("assistant.ui.responsibility");
  const active = responsibility.status === "ACTIVE";
  return (
    <Card data-slot="responsibility-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{responsibility.name}</CardTitle>
        <Badge variant={active ? "secondary" : "outline"}>
          {active ? t("singular") : t("archived")}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>
          {t("covers", {
            types: responsibility.entityTypeIds.length,
            followers: responsibility.defaultFollowerIds.length,
          })}
        </p>
        <Link href={responsibilitiesRoute()} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
