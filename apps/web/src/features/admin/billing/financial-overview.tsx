import type { BillingFinancialsDto } from "@bibi/core";
import { Alert, AlertDescription, AlertTitle, StatCard, StatCards } from "@bibi/ui";
import { AlertCircleIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getNumberFormat } from "@/server/number-format";

export type FinancialOverviewProps = { financials: BillingFinancialsDto };

/** Financial metrics and balances from Stripe. */
export async function FinancialOverview({ financials }: FinancialOverviewProps) {
  const [t, numbers] = await Promise.all([
    getTranslations("admin.billing.financials"),
    getNumberFormat(),
  ]);

  if (!financials.configured) {
    return (
      <Alert>
        <AlertCircleIcon className="size-4" />
        <AlertTitle>{t("title")}</AlertTitle>
        <AlertDescription>{t("notConfigured")}</AlertDescription>
      </Alert>
    );
  }

  const primaryAvailable = financials.available[0];
  const primaryPending = financials.pending[0];

  const availableText = primaryAvailable
    ? numbers.money({ minor: primaryAvailable.amount, currency: primaryAvailable.currency })
    : numbers.money({ minor: 0, currency: financials.currency });

  const pendingText = primaryPending
    ? numbers.money({ minor: primaryPending.amount, currency: primaryPending.currency })
    : numbers.money({ minor: 0, currency: financials.currency });

  const mrrText =
    financials.mrrMinor !== null
      ? numbers.money({ minor: financials.mrrMinor, currency: financials.currency })
      : null;

  return (
    <div className="grid gap-4">
      {financials.error ? (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>{t("title")}</AlertTitle>
          <AlertDescription>{financials.error}</AlertDescription>
        </Alert>
      ) : null}

      <StatCards>
        <StatCard
          label={t("availableBalance")}
          tone="positive"
          value={availableText}
          hint={primaryAvailable?.currency.toUpperCase() ?? financials.currency.toUpperCase()}
        />
        <StatCard
          label={t("pendingBalance")}
          tone="pending"
          value={pendingText}
          hint={primaryPending?.currency.toUpperCase() ?? financials.currency.toUpperCase()}
        />
        <StatCard
          label={t("activeSubscriptions")}
          tone="neutral"
          value={financials.activeSubscriptions}
        />
        {mrrText ? (
          <StatCard
            label={t("mrr")}
            tone="positive"
            value={mrrText}
            hint={t("mrrHint", { count: financials.activeSubscriptions })}
          />
        ) : null}
      </StatCards>
    </div>
  );
}
