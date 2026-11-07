"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { BillingStateBadge } from "@/features/billing/ui/billing-state-badge";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type BillingCardViewProps = GenerativeProps<"billing-card">;

/** The organization's Bibi subscription: state, trial end, seats, and a link to Settings. */
export function BillingCardView({ billing }: BillingCardViewProps) {
  const t = useTranslations("assistant.ui.billing");
  const format = useDateTimeFormat();
  const { access, seats } = billing;
  return (
    <Card data-slot="billing-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{t("singular")}</CardTitle>
        <BillingStateBadge state={access.state} />
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm">
        {access.state === "TRIAL" ? (
          <p>{t("trialEndsAt", { date: format.date({ instant: access.trialEndsAt }) })}</p>
        ) : null}
        <p className="text-muted-foreground">
          {t("seats", { used: seats.used, total: seats.included + seats.extra, held: seats.held })}
        </p>
        <Link href={ROUTES.adminBilling} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
