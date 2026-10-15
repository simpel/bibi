"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PaymentStatusBadge } from "@/features/payment-account/ui/payment-status-badge";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type PaymentAccountCardViewProps = GenerativeProps<"payment-account-card">;

/** The organization's payout account: connection status and, while onboarding, Stripe's link. */
export function PaymentAccountCardView({ account }: PaymentAccountCardViewProps) {
  const t = useTranslations("assistant.ui.paymentAccount");
  return (
    <Card data-slot="payment-account-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{t("singular")}</CardTitle>
        <PaymentStatusBadge status={account.status} />
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm">
        {account.onboardingUrl ? (
          <a href={account.onboardingUrl} className="text-primary hover:underline">
            {t("onboardingLink")}
          </a>
        ) : null}
        <Link href={ROUTES.settingsPayments} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
