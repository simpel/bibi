import { getPaymentSettings } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPage } from "@/components/admin/admin-page";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { PaymentSettingsForm } from "./payment-settings-form";
import { StripeCard } from "./stripe-card";

export type PaymentSettingsProps = { locale: Locale };

/** `/admin/payments`: the Stripe account and how the organization takes order money (ADR 0090). */
export async function PaymentSettings({ locale }: PaymentSettingsProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("paymentSettings"),
    getCallerAbilities(),
    runOperation({ operation: getPaymentSettings, input: {} }),
  ]);
  const canEdit = can({ abilities, permission: "paymentAccount:write" });
  const header = <AdminHeader title={t("title")} description={t("description")} />;
  return (
    <AdminPage header={header}>
      <div className="grid gap-4 md:grid-cols-2">
        <StripeCard canEdit={canEdit} />
      </div>
      {result.ok ? (
        <PaymentSettingsForm settings={result.value} canEdit={canEdit} />
      ) : (
        <ErrorState inline errorKey={handleLoadError({ error: result.error, locale })} />
      )}
    </AdminPage>
  );
}
