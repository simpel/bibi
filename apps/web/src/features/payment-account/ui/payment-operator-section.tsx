import { getPaymentAccount, getPaymentSettings } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { ErrorState } from "@/components/states/error-state";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { PaymentOperatorSelect } from "./payment-operator-select";

export type PaymentOperatorSectionProps = { locale: Locale };

/**
 * The payment operator that takes card payments (ADR 0090), stored in the payment settings;
 * "follow what is connected" leaves it empty. Connecting happens in Integrations.
 */
export async function PaymentOperatorSection({ locale }: PaymentOperatorSectionProps) {
  const [t, abilities, account, settings] = await Promise.all([
    getTranslations("paymentSettings"),
    getCallerAbilities(),
    runOperation({ operation: getPaymentAccount, input: {} }),
    runOperation({ operation: getPaymentSettings, input: {} }),
  ]);
  const failed = !account.ok ? account : !settings.ok ? settings : null;
  if (failed || !account.ok || !settings.ok) {
    const error = failed && !failed.ok ? failed.error : null;
    return (
      <AdminSection section="paymentOperator">
        {error ? <ErrorState inline errorKey={handleLoadError({ error, locale })} /> : null}
      </AdminSection>
    );
  }
  const { status } = account.value;
  const stripeConnected = status !== "NOT_CONNECTED" && status !== "DISCONNECTED";
  return (
    <AdminSection section="paymentOperator" description={t("operator.description")}>
      <div className="grid gap-3">
        <PaymentOperatorSelect
          label={t("operator.label")}
          value={settings.value.paymentOperator ?? "AUTO"}
          canEdit={can({ abilities, permission: "paymentAccount:write" })}
          options={[
            { value: "AUTO", label: t("provider.AUTO") },
            {
              value: "STRIPE",
              label: stripeConnected ? t("provider.STRIPE") : t("operator.notConnected"),
            },
          ]}
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
