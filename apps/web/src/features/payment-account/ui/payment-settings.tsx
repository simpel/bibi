import { getPaymentSettings } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { PaymentSettingsForm } from "./payment-settings-form";

export type PaymentSettingsProps = { locale: Locale };

/** `/settings/payments`: how the organization takes order money (ADR 0090). */
export async function PaymentSettings({ locale }: PaymentSettingsProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("paymentSettings"),
    getCallerAbilities(),
    runOperation({ operation: getPaymentSettings, input: {} }),
  ]);
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  return (
    <div className="grid gap-8">
      <PageHeader title={t("title")} description={t("description")} />
      <PaymentSettingsForm
        settings={result.value}
        canEdit={can({ abilities, permission: "paymentAccount:write" })}
      />
    </div>
  );
}
