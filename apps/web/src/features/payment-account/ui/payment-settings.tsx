import { getPaymentSettings, listIntegrations } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { AdminSection } from "@/components/admin/admin-section";
import type { AdminSectionId } from "@/components/shell/admin-sections";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { PaymentSettingsForm } from "./payment-settings-form";

export type PaymentSettingsProps = { locale: Locale; show: ReadonlySet<AdminSectionId> };

/**
 * `/admin/payments` (ADR 0090, 0100): which provider takes each payment method, and the deposit
 * rule. Connections come from Integrations; without `integration:read` the rows name providers
 * without saying whether they are connected.
 */
export async function PaymentSettings({ locale, show }: PaymentSettingsProps) {
  const [abilities, result, integrations] = await Promise.all([
    getCallerAbilities(),
    runOperation({ operation: getPaymentSettings, input: {} }),
    runOperation({ operation: listIntegrations, input: {} }),
  ]);
  const canEdit = can({ abilities, permission: "paymentAccount:write" });
  const connected = integrations.ok
    ? integrations.value.items
        .filter((item) => item.status === "CONNECTED")
        .map((item) => item.provider)
    : null;
  if (result.ok) {
    return (
      <PaymentSettingsForm
        settings={result.value}
        connected={connected}
        canEdit={canEdit}
        showRoutes={show.has("paymentMethods")}
        showDeposit={show.has("deposit")}
      />
    );
  }
  const sections = (["paymentMethods", "deposit"] as const).filter((section) => show.has(section));
  return sections.map((section) => (
    <AdminSection key={section} section={section}>
      <ErrorState inline errorKey={handleLoadError({ error: result.error, locale })} />
    </AdminSection>
  ));
}
