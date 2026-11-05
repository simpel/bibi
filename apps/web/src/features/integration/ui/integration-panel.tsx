import { listIntegrations } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { StripeCard } from "@/features/payment-account/ui/stripe-card";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { ApiKeysCard } from "./api-keys-card";
import { FortnoxCard } from "./fortnox-card";
import { IntegrationNotice, type IntegrationOutcome } from "./integration-notice";

export type IntegrationPanelProps = { locale: Locale; outcome: IntegrationOutcome | null };

/** Settings → Integrations (ADR 0087, 0090): Stripe, Fortnox and the way to API keys. */
export async function IntegrationPanel({ locale, outcome }: IntegrationPanelProps) {
  const [t, abilities, list, dates] = await Promise.all([
    getTranslations("integration"),
    getCallerAbilities(),
    runOperation({ operation: listIntegrations, input: {} }),
    getDateTimeFormat(),
  ]);
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
  const connectedOn = fortnox?.connectedAt ? dates.date({ instant: fortnox.connectedAt }) : null;
  return (
    <div className="grid gap-6">
      {header}
      {outcome ? <IntegrationNotice outcome={outcome} /> : null}
      {/* One card per provider (ADR 0090). */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {can({ abilities, permission: "paymentAccount:read" }) ? (
          <StripeCard canEdit={can({ abilities, permission: "paymentAccount:write" })} />
        ) : null}
        {fortnox ? (
          <FortnoxCard
            connection={fortnox}
            canEdit={can({ abilities, permission: "integration:write" })}
            connectedOn={connectedOn}
          />
        ) : null}
        {can({ abilities, permission: "apiKey:read" }) ? <ApiKeysCard /> : null}
      </div>
    </div>
  );
}
