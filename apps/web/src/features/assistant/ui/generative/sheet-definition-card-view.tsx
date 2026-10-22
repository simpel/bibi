"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { sheetDefinitionsRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import type { GenerativeProps } from "./generative-props";

export type SheetDefinitionCardViewProps = GenerativeProps<"sheet-definition-card">;

/** One sheet definition: how much it includes. Names live on the sheets settings page. */
export function SheetDefinitionCardView({ sheet }: SheetDefinitionCardViewProps) {
  const t = useTranslations("assistant.ui.sheetDefinition");
  const active = sheet.status === "ACTIVE";
  return (
    <Card data-slot="sheet-definition-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{sheet.name}</CardTitle>
        <Badge variant={active ? "secondary" : "outline"}>
          {active ? t("singular") : t("archived")}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>
          {t("contents", {
            types: sheet.entityTypeIds.length,
            fields: sheet.fieldIds.length,
            lists: sheet.vocabularyIds.length,
          })}
        </p>
        <Link href={sheetDefinitionsRoute()} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
