"use client";

import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { entityTypeRoute, vocabularyRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";

export type FieldDefinitionCardViewProps = GenerativeProps<"field-definition-card">;

/** One field: name, key, kind, required, and the list or inline options of a choice field. */
export function FieldDefinitionCardView({ field }: FieldDefinitionCardViewProps) {
  const t = useTranslations("assistant.ui.field");
  return (
    <Card data-slot="field-definition-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{field.name}</CardTitle>
        <Badge variant="secondary">{t(`kind.${field.kind}`)}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>
          {t("key", { key: field.key })}
          {field.required ? ` · ${t("required")}` : ""}
        </p>
        {field.options.length > 0 ? <p>{field.options.join(", ")}</p> : null}
        {field.vocabularyId ? (
          <Link
            href={vocabularyRoute({ id: field.vocabularyId })}
            className="text-primary hover:underline"
          >
            {t("openList")}
          </Link>
        ) : null}
        <Link
          href={entityTypeRoute({ id: field.entityTypeId })}
          className="text-primary hover:underline"
        >
          {t("openType")}
        </Link>
      </CardContent>
    </Card>
  );
}
