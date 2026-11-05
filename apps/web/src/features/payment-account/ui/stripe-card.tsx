import { getPaymentAccount } from "@bibi/core";
import { Card, CardAction, CardContent, CardHeader, CardTitle, StripeLogo } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { runOperation } from "@/server/run-operation";
import { DisconnectStripeButton } from "./disconnect-stripe-button";
import { PaymentStatusBadge } from "./payment-status-badge";
import { StartOnboardingButton } from "./start-onboarding-button";
import { SyncStatusButton } from "./sync-status-button";

export type StripeCardProps = { canEdit: boolean };

/**
 * The organization's own Stripe account on Settings → Integrations (ADR 0090): customers pay the
 * venue directly into it, Bibi never holds the money. Renders nothing if the account can't load.
 */
export async function StripeCard({ canEdit }: StripeCardProps) {
  const [t, account] = await Promise.all([
    getTranslations("paymentAccount"),
    runOperation({ operation: getPaymentAccount, input: {} }),
  ]);
  if (!account.ok) return null;
  const { status } = account.value;
  // Disconnected resumes the same account, so it connects like a first time.
  const connecting = status === "NOT_CONNECTED" || status === "DISCONNECTED";
  return (
    <Card className="flex h-full flex-col shadow-none">
      <CardHeader>
        <CardTitle className="text-base">
          <StripeLogo className="h-6" />
          <span className="sr-only">{t("stripe")}</span>
        </CardTitle>
        <CardAction>
          <PaymentStatusBadge status={status} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted-foreground">
        <p>{t("description")}</p>
        <p>{t(`hint.${status}`)}</p>
        {canEdit ? (
          <div className="mt-auto flex flex-wrap gap-2">
            {status !== "ACTIVE" ? <StartOnboardingButton connected={!connecting} /> : null}
            {status === "ONBOARDING" || status === "RESTRICTED" ? <SyncStatusButton /> : null}
            {connecting ? null : <DisconnectStripeButton />}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
