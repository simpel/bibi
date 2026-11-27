import { listIntegrations } from "@bibi/core";
import type { IntegrationProvider } from "@bibi/core/schemas";
import type { Locale } from "@bibi/i18n";
import { PageBands } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { AdminBand } from "@/components/admin/admin-section";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { redirect } from "@/lib/navigation";
import { integrationRoute, ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { ConnectProviderButton } from "./connect-provider-button";
import { IntegrationStatusBadge, isConnectionUsable } from "./integration-status-badge";
import { ProviderAccounts } from "./provider-accounts";
import { ProviderDangerArea } from "./provider-danger-area";

export type ProviderDetailProps = { locale: Locale; org: string; provider: IntegrationProvider };

/**
 * `/admin/integrations/<provider>` (ADR 0100, 0123): what a connected service is, which company
 * it is connected to, for an accounting system what Bibi books to in its accounts, and last the
 * way to disconnect. A service that is not connected has no page of its own: it goes back to the
 * list, where it is connected.
 */
export async function ProviderDetail({ locale, org, provider }: ProviderDetailProps) {
  const [t, card, providers, abilities, list, dates] = await Promise.all([
    getTranslations("integration.detail"),
    getTranslations("integration.card"),
    getTranslations("providers"),
    getCallerAbilities(),
    runOperation({ operation: listIntegrations, input: {} }),
    getDateTimeFormat(),
  ]);
  if (!list.ok) {
    return <ErrorState errorKey={handleLoadError({ error: list.error, locale })} />;
  }
  const connection = list.value.items.find((item) => item.provider === provider);
  const live =
    connection && connection.status !== "NOT_CONNECTED" && connection.status !== "DISCONNECTED";
  if (!connection || !live) redirect({ href: ROUTES.adminIntegrations, locale, org });
  const name = providers(`${provider}.name`);
  const hosted = connection.connectKind === "HOSTED_ONBOARDING";
  const canEdit = can({
    abilities,
    permission: hosted ? "paymentAccount:write" : "integration:write",
  });
  const usable = isConnectionUsable({
    status: connection.status,
    configured: connection.configured,
  });
  const connected = connection.status === "CONNECTED";
  const facts = [
    { label: card("company"), value: connection.companyName },
    { label: card("organizationNumber"), value: connection.organizationNumber },
    {
      label: card("connectedAt"),
      value: connection.connectedAt ? dates.date({ instant: connection.connectedAt }) : null,
    },
  ].filter((fact) => fact.value);
  return (
    <PageBands>
      <h1 className="sr-only">{name}</h1>
      <CrumbName href={integrationRoute({ provider })} name={name} />
      <AdminBand
        anchor="connection"
        title={name}
        description={providers(`${provider}.description`)}
        actions={
          <IntegrationStatusBadge status={connection.status} configured={connection.configured} />
        }
      >
        {!usable ? <p className="text-sm">{card("hint.UNAVAILABLE", { name })}</p> : null}
        {usable && connection.status !== "CONNECTED" ? (
          <p className="text-sm">{card(`hint.${connection.status}`, { name })}</p>
        ) : null}
        {facts.length > 0 ? (
          <dl className="grid gap-1 text-sm">
            {facts.map((fact) => (
              <div key={fact.label} className="flex gap-2">
                <dt className="text-muted-foreground">{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {canEdit && !connected ? (
          <div>
            <ConnectProviderButton connection={connection} name={name} guide={null} />
          </div>
        ) : null}
      </AdminBand>
      {connected && connection.capabilities.ledger ? (
        <AdminBand
          anchor="accounts"
          title={t("accountsTitle")}
          description={t("accountsDescription", { name })}
        >
          <ProviderAccounts locale={locale} connection={connection} name={name} canEdit={canEdit} />
        </AdminBand>
      ) : null}
      {canEdit ? (
        <AdminBand anchor="disconnect" title={t("disconnectTitle")}>
          <ProviderDangerArea connection={connection} name={name} />
        </AdminBand>
      ) : null}
    </PageBands>
  );
}
