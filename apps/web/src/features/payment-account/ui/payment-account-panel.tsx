import { getPaymentAccount } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { PaymentStatusBadge } from "./payment-status-badge";
import { StartOnboardingButton } from "./start-onboarding-button";
import { SyncStatusButton } from "./sync-status-button";

export type PaymentAccountPanelProps = { locale: Locale };

/** Organization settings: connect to Stripe so customers pay the venue directly (ADR 0028). */
export async function PaymentAccountPanel({ locale }: PaymentAccountPanelProps) {
  const t = await getTranslations("paymentAccount");
  const { paymentAdmin } = await getCallerAbilities();
  const account = await runOperation({ operation: getPaymentAccount, input: {} });
  const header = <PageHeader title={t("title")} description={t("description")} />;
  if (!account.ok) {
    const errorKey = handleLoadError({ error: account.error, locale });
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={errorKey} />
      </div>
    );
  }
  const { status } = account.value;
  const connected = status !== "NOT_CONNECTED";
  return (
    <div className="grid gap-6">
      {header}
      <Card className="shadow-none">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("stripe")}</CardTitle>
          <PaymentStatusBadge status={status} />
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground">
          <p>{t(`hint.${status}`)}</p>
          {paymentAdmin && status !== "ACTIVE" ? (
            <div className="flex flex-wrap gap-2">
              <StartOnboardingButton connected={connected} />
              {connected ? <SyncStatusButton /> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
