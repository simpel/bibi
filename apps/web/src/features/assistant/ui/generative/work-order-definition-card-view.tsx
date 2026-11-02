"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { workOrderDefinitionsRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import type { GenerativeProps } from "./generative-props";

export type WorkOrderDefinitionCardViewProps = GenerativeProps<"work-order-definition-card">;

/** One work order definition: how much it includes. Names live on the work orders settings page. */
export function WorkOrderDefinitionCardView({ workOrder }: WorkOrderDefinitionCardViewProps) {
  const t = useTranslations("assistant.ui.workOrderDefinition");
  const active = workOrder.status === "ACTIVE";
  return (
    <Card data-slot="work-order-definition-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{workOrder.name}</CardTitle>
        <Badge variant={active ? "secondary" : "outline"}>
          {active ? t("singular") : t("archived")}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>
          {t("contents", {
            types: workOrder.entityTypeIds.length,
            fields: workOrder.fieldIds.length,
            lists: workOrder.vocabularyIds.length,
          })}
        </p>
        <Link href={workOrderDefinitionsRoute()} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
