import { listIntegrations } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { ApiKeysCard } from "./api-keys-card";
import { FortnoxCard } from "./fortnox-card";
import { IntegrationNotice, type IntegrationOutcome } from "./integration-notice";

export type IntegrationPanelProps = { locale: Locale; outcome: IntegrationOutcome | null };

/** Settings → Integrations (ADR 0087): the Fortnox connection and the way to API keys. */
export async function IntegrationPanel({ locale, outcome }: IntegrationPanelProps) {
  const t = await getTranslations("integration");
  const abilities = await getCallerAbilities();
  const list = await runOperation({ operation: listIntegrations, input: {} });
  const header = <PageHeader title={t("title")} description={t("description")} />;
  if (!list.ok) {
    const errorKey = handleLoadError({ error: list.error, locale });
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={errorKey} />
      </div>
    );
  }
  const fortnox = list.value.items.find((item) => item.provider === "FORTNOX");
  const dates = await getDateTimeFormat();
  const connectedOn = fortnox?.connectedAt ? dates.date({ instant: fortnox.connectedAt }) : null;
  return (
    <div className="grid gap-6">
      {header}
      {outcome ? <IntegrationNotice outcome={outcome} /> : null}
      {fortnox ? (
        <FortnoxCard
          connection={fortnox}
          canEdit={can({ abilities, permission: "integration:write" })}
          connectedOn={connectedOn}
        />
      ) : null}
      {can({ abilities, permission: "apiKey:read" }) ? <ApiKeysCard /> : null}
    </div>
  );
}
