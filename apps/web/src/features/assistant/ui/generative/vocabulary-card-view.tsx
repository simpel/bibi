"use client";

import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { vocabularyRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";

export type VocabularyCardViewProps = GenerativeProps<"vocabulary-card">;

/** One list with its values, in order. */
export function VocabularyCardView({ vocabulary }: VocabularyCardViewProps) {
  const t = useTranslations("assistant.ui.vocabulary");
  return (
    <Card data-slot="vocabulary-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={vocabularyRoute({ id: vocabulary.id })} className="hover:underline">
            {vocabulary.name}
          </Link>
        </CardTitle>
        <Badge variant="secondary">{t("valuesCount", { count: vocabulary.values.length })}</Badge>
      </CardHeader>
      <CardContent className="grid gap-2 p-4 pt-0 text-sm text-muted-foreground">
        {vocabulary.values.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {vocabulary.values.map((value) => (
              <Badge key={value.id} variant="outline">
                {value.name}
              </Badge>
            ))}
          </div>
        ) : null}
        <Link
          href={vocabularyRoute({ id: vocabulary.id })}
          className="text-primary hover:underline"
        >
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
