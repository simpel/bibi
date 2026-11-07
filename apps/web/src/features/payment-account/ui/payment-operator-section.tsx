import { getPaymentAccount } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { ErrorState } from "@/components/states/error-state";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { PaymentOperatorSelect } from "./payment-operator-select";

export type PaymentOperatorSectionProps = { locale: Locale };

/**
 * The payment operator in use. Stripe is the only one Bibi supports (ADR 0090), so the select
 * reflects its connection; connecting and disconnecting happens in Integrations.
 */
export async function PaymentOperatorSection({ locale }: PaymentOperatorSectionProps) {
  const [t, account] = await Promise.all([
    getTranslations("paymentSettings"),
    runOperation({ operation: getPaymentAccount, input: {} }),
  ]);
  if (!account.ok) {
    return (
      <AdminSection section="paymentOperator">
        <ErrorState inline errorKey={handleLoadError({ error: account.error, locale })} />
      </AdminSection>
    );
  }
  const { status } = account.value;
  const connected = status !== "NOT_CONNECTED" && status !== "DISCONNECTED";
  return (
    <AdminSection section="paymentOperator" description={t("operator.description")}>
      <div className="grid gap-3">
        <PaymentOperatorSelect
          label={t("operator.label")}
          placeholder={t("operator.none")}
          selected={connected ? "STRIPE" : undefined}
          options={[{ value: "STRIPE", label: t("provider.STRIPE"), disabled: !connected }]}
        />
        <Link
          href={`${ROUTES.adminIntegrations}#stripe`}
          className="w-fit text-sm text-primary hover:underline"
        >
          {t("operator.manage")}
        </Link>
      </div>
    </AdminSection>
  );
}
