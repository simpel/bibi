import { listIntegrations } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPage } from "@/components/admin/admin-page";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { FortnoxCard } from "./fortnox-card";
import { IntegrationNotice, type IntegrationOutcome } from "./integration-notice";

export type IntegrationPanelProps = {
  locale: Locale;
  outcome: IntegrationOutcome | null;
  inTab?: boolean;
};

/**
 * Administration → Integrations (ADR 0087): one card per accounting system. Stripe sits on
 * Payments and API keys in their own tab.
 */
export async function IntegrationPanel({ locale, outcome, inTab = false }: IntegrationPanelProps) {
  const [t, abilities, list, dates] = await Promise.all([
    getTranslations("integration"),
    getCallerAbilities(),
    runOperation({ operation: listIntegrations, input: {} }),
    getDateTimeFormat(),
  ]);
  const header = <AdminHeader title={t("title")} description={t("description")} inTab={inTab} />;
  if (!list.ok) {
    const errorKey = handleLoadError({ error: list.error, locale });
    return (
      <AdminPage header={header}>
        <ErrorState inline errorKey={errorKey} />
      </AdminPage>
    );
  }
  const fortnox = list.value.items.find((item) => item.provider === "FORTNOX");
  const connectedOn = fortnox?.connectedAt ? dates.date({ instant: fortnox.connectedAt }) : null;
  return (
    <AdminPage header={header}>
      {outcome ? <IntegrationNotice outcome={outcome} /> : null}
      {fortnox ? (
        <div className="grid gap-4 md:grid-cols-2">
          <FortnoxCard
            connection={fortnox}
            canEdit={can({ abilities, permission: "integration:write" })}
            connectedOn={connectedOn}
          />
        </div>
      ) : null}
    </AdminPage>
  );
}
