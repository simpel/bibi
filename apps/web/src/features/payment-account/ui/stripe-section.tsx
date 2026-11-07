import { getPaymentAccount } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { StripeLogo } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { ErrorState } from "@/components/states/error-state";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { DisconnectStripeButton } from "./disconnect-stripe-button";
import { PaymentStatusBadge } from "./payment-status-badge";
import { StartOnboardingButton } from "./start-onboarding-button";
import { SyncStatusButton } from "./sync-status-button";

export type StripeSectionProps = { locale: Locale; canEdit: boolean };

/**
 * The organization's own Stripe account on Administration → Integrations (ADR 0090): customers
 * pay the venue directly into it, Bibi never holds the money.
 */
export async function StripeSection({ locale, canEdit }: StripeSectionProps) {
  const [t, account] = await Promise.all([
    getTranslations("paymentAccount"),
    runOperation({ operation: getPaymentAccount, input: {} }),
  ]);
  if (!account.ok) {
    return (
      <AdminSection id="stripe" title={t("stripe")}>
        <ErrorState inline errorKey={handleLoadError({ error: account.error, locale })} />
      </AdminSection>
    );
  }
  const { status } = account.value;
  // Disconnected resumes the same account, so it connects like a first time.
  const connecting = status === "NOT_CONNECTED" || status === "DISCONNECTED";
  const buttons = canEdit ? (
    <>
      {status !== "ACTIVE" ? <StartOnboardingButton connected={!connecting} /> : null}
      {status === "ONBOARDING" || status === "RESTRICTED" ? <SyncStatusButton /> : null}
      {connecting ? null : <DisconnectStripeButton />}
    </>
  ) : null;
  return (
    <AdminSection
      id="stripe"
      title={t("stripe")}
      description={t("description")}
      actions={
        <>
          <PaymentStatusBadge status={status} />
          {buttons}
        </>
      }
    >
      <div className="flex items-start gap-3 text-sm text-muted-foreground">
        <StripeLogo className="h-6 shrink-0" aria-hidden />
        <p>{t(`hint.${status}`)}</p>
      </div>
    </AdminSection>
  );
}
