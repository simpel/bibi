"use client";

import { Link } from "@bibi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { entityTypeRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";

export type EntityTypeCardViewProps = GenerativeProps<"entity-type-card">;

type FieldListProps = { fields: EntityTypeCardViewProps["entityType"]["fields"] };

function FieldList({ fields }: FieldListProps) {
  const t = useTranslations("assistant.ui.entityType");
  const field = useTranslations("assistant.ui.field");
  if (fields.length === 0) return <p>{t("noFields")}</p>;
  return (
    <ul className="grid gap-0.5">
      {fields.map((item) => (
        <li key={item.id}>
          <span className="text-foreground">{item.name}</span> · {field(`kind.${item.kind}`)}
          {item.required ? ` · ${field("required")}` : ""}
        </li>
      ))}
    </ul>
  );
}

/** One type with its capabilities and fields (name, kind, required). */
export function EntityTypeCardView({ entityType }: EntityTypeCardViewProps) {
  const t = useTranslations("assistant.ui.entityType");
  return (
    <Card data-slot="entity-type-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={entityTypeRoute({ id: entityType.id })} className="hover:underline">
            {entityType.name}
          </Link>
        </CardTitle>
        <Badge variant="secondary">{t(`base.${entityType.base}`)}</Badge>
      </CardHeader>
      <CardContent className="grid gap-2 p-4 pt-0 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-1">
          {entityType.capabilities.map((capability) => (
            <Badge key={capability} variant="outline">
              {t(`capability.${capability}`)}
            </Badge>
          ))}
        </div>
        <FieldList fields={entityType.fields} />
        <Link
          href={entityTypeRoute({ id: entityType.id })}
          className="text-primary hover:underline"
        >
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
