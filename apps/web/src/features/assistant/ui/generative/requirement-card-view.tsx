"use client";

import { Link } from "@okazi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ticketRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { fieldLines } from "./item-facts";

export type RequirementCardViewProps = GenerativeProps<"requirement-card">;

/** One requirement: the count, where it applies and the type's own fields. */
export function RequirementCardView({ requirement }: RequirementCardViewProps) {
  const t = useTranslations("assistant.ui.requirement");
  const href = ticketRoute({ id: requirement.ticketId });
  return (
    <Card data-slot="requirement-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          {t("quantity", { count: requirement.quantity })}
        </CardTitle>
        <Badge variant="secondary">{t("singular")}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        <p>{requirement.programItemId ? t("onProgramItem") : t("onTicket")}</p>
        {requirement.status === "ARCHIVED" ? <p>{t("archived")}</p> : null}
        {fieldLines({ fields: requirement.fields }).map((line) => (
          <p key={line}>{line}</p>
        ))}
        <Link href={href} className="text-primary hover:underline">
          {t("openTicket")}
        </Link>
      </CardContent>
    </Card>
  );
}
