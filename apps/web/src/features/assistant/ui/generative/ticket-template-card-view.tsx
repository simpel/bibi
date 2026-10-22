"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type TicketTemplateCardViewProps = GenerativeProps<"ticket-template-card">;

/** One predefined ticket: its name, status and how many lines it makes. */
export function TicketTemplateCardView({ template }: TicketTemplateCardViewProps) {
  const t = useTranslations("assistant.ui.ticketTemplate");
  const active = template.status === "ACTIVE";
  return (
    <Card data-slot="ticket-template-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{template.name}</CardTitle>
        <Badge variant={active ? "secondary" : "outline"}>
          {active ? t("singular") : t("archived")}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>{t("lines", { count: template.lines.length })}</p>
        <Link href={ROUTES.settingsTicketTemplates} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
