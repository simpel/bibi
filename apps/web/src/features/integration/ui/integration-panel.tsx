import { listIntegrations } from "@bibi/core";
import type { IntegrationConnectionDto, IntegrationProvider } from "@bibi/core/schemas";
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
 * Administration → Integrations (ADR 0087, 0100, 0108): the providers grouped by what they are
 * used for, all drawn from one `integration.list`. Invoicing and bookkeeping is one accounting
 * system at a time: once one is connected only it shows, with a note on how to switch. Card and
 * Swish are the payment providers. A payout account (hosted onboarding) is edited with
 * `paymentAccount:write`, every other connection with `integration:write`.
 */
export async function IntegrationPanel({ locale, returned }: IntegrationPanelProps) {
  const [t, providers, abilities, list, dates] = await Promise.all([
    getTranslations("integration"),
    getTranslations("providers"),
    getCallerAbilities(),
    runOperation({ operation: listIntegrations, input: {} }),
    getDateTimeFormat(),
  ]);
  if (!list.ok) {
    return (
      <AdminSection section="ledger">
        <ErrorState inline errorKey={handleLoadError({ error: list.error, locale })} />
      </AdminSection>
    );
  }
  const canEdit = {
    hosted: can({ abilities, permission: "paymentAccount:write" }),
    other: can({ abilities, permission: "integration:write" }),
  };
  const card = ({ connection }: { connection: IntegrationConnectionDto }) => (
    <ProviderCard
      key={connection.provider}
      connection={connection}
      canEdit={connection.connectKind === "HOSTED_ONBOARDING" ? canEdit.hosted : canEdit.other}
      connectedOn={connection.connectedAt ? dates.date({ instant: connection.connectedAt }) : null}
      checkedOn={
        connection.setupCheckedAt ? dates.date({ instant: connection.setupCheckedAt }) : null
      }
      outcome={returned?.provider === connection.provider ? returned.outcome : null}
    />
  );
  const { items } = list.value;
  const ledgers = items.filter((item) => item.capabilities.ledger);
  // An expired one keeps the slot until it is disconnected (ADR 0108): it can be reconnected.
  const live = ledgers.find((item) => item.status === "CONNECTED" || item.status === "EXPIRED");
  const others = ledgers
    .filter((item) => item !== live)
    .map((item) => providers(`${item.provider}.name`));
  return (
    <>
      <AdminSection section="ledger" description={t("ledgerDescription")}>
        <div className="grid gap-4 md:grid-cols-2">
          {(live ? [live] : ledgers).map((connection) => card({ connection }))}
        </div>
        {live ? (
          <p className="text-sm text-muted-foreground">
            {t("ledgerSwitch", {
              connected: providers(`${live.provider}.name`),
              others: others.join(", "),
            })}
          </p>
        ) : null}
      </AdminSection>
      <AdminSection section="paymentProviders" description={t("paymentsDescription")}>
        <div className="grid gap-4 md:grid-cols-2">
          {items
            .filter((item) => !item.capabilities.ledger)
            .map((connection) => card({ connection }))}
        </div>
      </AdminSection>
    </>
  );
}
