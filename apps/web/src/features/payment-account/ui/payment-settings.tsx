import { getPaymentSettings } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import type { AdminSectionId } from "@/components/shell/admin-sections";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { PaymentOperatorSection } from "./payment-operator-section";
import { PaymentSettingsForm } from "./payment-settings-form";

export type PaymentSettingsProps = { locale: Locale; show: ReadonlySet<AdminSectionId> };

/** `/admin/payments`: the payment operator and how the organization takes order money (ADR 0090). */
export async function PaymentSettings({ locale, show }: PaymentSettingsProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("paymentSettings"),
    getCallerAbilities(),
    runOperation({ operation: getPaymentSettings, input: {} }),
  ]);
  const canEdit = can({ abilities, permission: "paymentAccount:write" });
  const deposit = show.has("deposit");
  const invoices = show.has("invoices");
  return (
    <>
      {show.has("paymentOperator") ? <PaymentOperatorSection locale={locale} /> : null}
      {result.ok ? (
        <PaymentSettingsForm
          settings={result.value}
          canEdit={canEdit}
          showDeposit={deposit}
          showInvoices={invoices}
        />
      ) : (
        <>
          {deposit ? (
            <AdminSection id="deposit" title={t("deposit.title")}>
              <ErrorState inline errorKey={handleLoadError({ error: result.error, locale })} />
            </AdminSection>
          ) : null}
          {invoices ? (
            <AdminSection id="invoices" title={t("invoice.title")}>
              <ErrorState inline errorKey={handleLoadError({ error: result.error, locale })} />
            </AdminSection>
          ) : null}
        </>
      )}
    </>
  );
}
