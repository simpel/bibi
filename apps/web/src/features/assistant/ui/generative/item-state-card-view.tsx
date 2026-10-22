"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle, ColorSwatch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { entityTypeRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import type { GenerativeProps } from "./generative-props";
import { useStateFlagLabels } from "./use-item-state-view-columns";

export type ItemStateCardViewProps = GenerativeProps<"item-state-card">;

/** One item state: color, hold, flags and how many states it may move to (ADR 0044). */
export function ItemStateCardView({ state }: ItemStateCardViewProps) {
  const t = useTranslations("assistant.ui.itemState");
  const flagLabels = useStateFlagLabels();
  const active = state.status === "ACTIVE";
  const flags = flagLabels({ state });
  return (
    <Card data-slot="item-state-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="inline-flex items-center gap-2 text-base">
          <ColorSwatch color={state.color} size="md" />
          {state.name}
        </CardTitle>
        <Badge variant={active ? "secondary" : "outline"}>
          {active ? t("singular") : t("archived")}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        {flags ? <p className="text-foreground">{flags}</p> : null}
        <p>{t("transitions", { count: state.transitionsTo.length })}</p>
        <Link
          href={entityTypeRoute({ id: state.entityTypeId })}
          className="text-primary hover:underline"
        >
          {t("openType")}
        </Link>
      </CardContent>
    </Card>
  );
}
