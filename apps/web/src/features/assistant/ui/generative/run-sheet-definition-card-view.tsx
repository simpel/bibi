"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { runSheetDefinitionsRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import type { GenerativeProps } from "./generative-props";

export type RunSheetDefinitionCardViewProps = GenerativeProps<"run-sheet-definition-card">;

/** One run sheet definition: how much it includes. Names live on the run sheets settings page. */
export function RunSheetDefinitionCardView({ runSheet }: RunSheetDefinitionCardViewProps) {
  const t = useTranslations("assistant.ui.runSheetDefinition");
  const active = runSheet.status === "ACTIVE";
  return (
    <Card data-slot="run-sheet-definition-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{runSheet.name}</CardTitle>
        <Badge variant={active ? "secondary" : "outline"}>
          {active ? t("singular") : t("archived")}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>
          {t("contents", {
            types: runSheet.entityTypeIds.length,
            fields: runSheet.fieldIds.length,
            lists: runSheet.vocabularyIds.length,
          })}
        </p>
        <Link href={runSheetDefinitionsRoute()} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
