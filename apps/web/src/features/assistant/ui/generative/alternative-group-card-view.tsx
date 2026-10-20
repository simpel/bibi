"use client";

import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ticketRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type AlternativeGroupCardViewProps = GenerativeProps<"alternative-group-card">;

/** One alternative group (ADR 0052): how many options, whether one is chosen, and its ticket. */
export function AlternativeGroupCardView({ group }: AlternativeGroupCardViewProps) {
  const t = useTranslations("assistant.ui.alternativeGroup");
  return (
    <Card data-slot="alternative-group-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{group.name}</CardTitle>
        <Badge variant={group.chosenLineId ? "success" : "secondary"}>
          {group.chosenLineId ? t("chosen") : t("open")}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>{t("options", { count: group.optionLineIds.length })}</p>
        {group.status === "ARCHIVED" ? <p>{t("archived")}</p> : null}
        <Link href={ticketRoute({ id: group.ticketId })} className="text-primary hover:underline">
          {t("openTicket")}
        </Link>
      </CardContent>
    </Card>
  );
}
