import { getPaymentAccount } from "@bibi/core";
import { Card, CardContent, CardHeader, CardTitle, StripeLogo } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { runOperation } from "@/server/run-operation";
import { PaymentStatusBadge } from "./payment-status-badge";
import { StartOnboardingButton } from "./start-onboarding-button";
import { SyncStatusButton } from "./sync-status-button";

export type StripeCardProps = { canEdit: boolean };

/**
 * The organization's own Stripe account on Settings → Integrations (ADR 0090): customers pay the
 * venue directly into it, Bibi never holds the money. Renders nothing if the account can't load.
 */
export async function StripeCard({ canEdit }: StripeCardProps) {
  const t = await getTranslations("paymentAccount");
  const account = await runOperation({ operation: getPaymentAccount, input: {} });
  if (!account.ok) return null;
  const { status } = account.value;
  const connected = status !== "NOT_CONNECTED";
  return (
    <Card className="shadow-none">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">
          <StripeLogo className="h-6" />
          <span className="sr-only">{t("stripe")}</span>
        </CardTitle>
        <PaymentStatusBadge status={status} />
      </CardHeader>
      <CardContent className="grid gap-4 text-sm text-muted-foreground">
        <p>{t("description")}</p>
        <p>{t(`hint.${status}`)}</p>
        {canEdit && status !== "ACTIVE" ? (
          <div className="flex flex-wrap gap-2">
            <StartOnboardingButton connected={connected} />
            {connected ? <SyncStatusButton /> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
