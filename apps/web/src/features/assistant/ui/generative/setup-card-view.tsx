"use client";

import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { setupsRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";

export type SetupCardViewProps = GenerativeProps<"setup-card">;

/** One setup with its changeover time. */
export function SetupCardView({ setup }: SetupCardViewProps) {
  const t = useTranslations("assistant.ui.setup");
  return (
    <Card data-slot="setup-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{setup.name}</CardTitle>
        <Badge variant="secondary">{t("singular")}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>{t("changeover", { minutes: setup.changeoverMinutes })}</p>
        <Link href={setupsRoute()} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
