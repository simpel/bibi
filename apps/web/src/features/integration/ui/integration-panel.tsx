import { listIntegrations } from "@bibi/core";
import type { IntegrationProvider } from "@bibi/core/schemas";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import type { IntegrationOutcome } from "./integration-notice";
import { ProviderCard } from "./provider-card";

/** The provider a callback sent the admin back from, with what happened. */
export type ProviderOutcome = { provider: IntegrationProvider; outcome: IntegrationOutcome };

export type IntegrationPanelProps = { locale: Locale; returned: ProviderOutcome | null };

/**
 * Administration → Integrations (ADR 0087, 0100): one card per provider Bibi knows, connected or
 * not, all drawn from `integration.list`. A payout account (hosted onboarding) is edited with
 * `paymentAccount:write`, every other connection with `integration:write`.
 */
export async function IntegrationPanel({ locale, returned }: IntegrationPanelProps) {
  const [t, abilities, list, dates] = await Promise.all([
    getTranslations("integration"),
    getCallerAbilities(),
    runOperation({ operation: listIntegrations, input: {} }),
    getDateTimeFormat(),
  ]);
  if (!list.ok) {
    return (
      <AdminSection section="providers">
        <ErrorState inline errorKey={handleLoadError({ error: list.error, locale })} />
      </AdminSection>
    );
  }
  const canEdit = {
    hosted: can({ abilities, permission: "paymentAccount:write" }),
    other: can({ abilities, permission: "integration:write" }),
  };
  return (
    <AdminSection section="providers" description={t("description")}>
      <div className="grid gap-4 md:grid-cols-2">
        {list.value.items.map((connection) => (
          <ProviderCard
            key={connection.provider}
            connection={connection}
            canEdit={
              connection.connectKind === "HOSTED_ONBOARDING" ? canEdit.hosted : canEdit.other
            }
            connectedOn={
              connection.connectedAt ? dates.date({ instant: connection.connectedAt }) : null
            }
            outcome={returned?.provider === connection.provider ? returned.outcome : null}
          />
        ))}
      </div>
    </AdminSection>
  );
}
