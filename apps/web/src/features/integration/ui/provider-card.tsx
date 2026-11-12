import type { IntegrationConnectionDto } from "@bibi/core/schemas";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ProviderLogo,
} from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { ConnectProviderButton } from "./connect-provider-button";
import { DisconnectProviderButton } from "./disconnect-provider-button";
import { IntegrationNotice, type IntegrationOutcome } from "./integration-notice";
import { IntegrationStatusBadge, isConnectionUsable } from "./integration-status-badge";
import { RefreshProviderButton } from "./refresh-provider-button";

export type ProviderCardProps = {
  connection: IntegrationConnectionDto;
  canEdit: boolean;
  /** The connect date, written on the server in the user's format. */
  connectedOn: string | null;
  /** What happened when this provider sent the admin back, shown inside its card. */
  outcome: IntegrationOutcome | null;
};

type ProviderActionsProps = Pick<ProviderCardProps, "connection"> & { name: string };

/** The actions the connection's status allows: connect or reconnect, refresh, disconnect. */
function ProviderActions({ connection, name }: ProviderActionsProps) {
  const { status, connectKind } = connection;
  const live = status !== "NOT_CONNECTED" && status !== "DISCONNECTED";
  const hostedOpen = connectKind === "HOSTED_ONBOARDING" && live && status !== "CONNECTED";
  return (
    <>
      {status === "CONNECTED" && connectKind === "HOSTED_ONBOARDING" ? null : (
        <ConnectProviderButton connection={connection} name={name} />
      )}
      {hostedOpen ? <RefreshProviderButton /> : null}
      {live ? <DisconnectProviderButton connection={connection} name={name} /> : null}
    </>
  );
}

/**
 * One provider on Administration → Integrations (ADR 0100), drawn from `integration.list`: its
 * status, what it can do, the connected company and the actions that fit the status.
 */
export async function ProviderCard({
  connection,
  canEdit,
  connectedOn,
  outcome,
}: ProviderCardProps) {
  const [t, providers, methods] = await Promise.all([
    getTranslations("integration.card"),
    getTranslations("providers"),
    getTranslations("payment.method"),
  ]);
  const { provider, status, configured, capabilities } = connection;
  const name = providers(`${provider}.name`);
  const usable = isConnectionUsable({ status, configured });
  const facts = [
    { label: t("company"), value: connection.companyName },
    { label: t("organizationNumber"), value: connection.organizationNumber },
    { label: t("connectedAt"), value: connectedOn },
  ].filter((fact) => status === "CONNECTED" && fact.value);
  const takes = capabilities.methods.map((method) => methods(method)).join(", ");
  return (
    <Card
      data-slot="provider-card"
      id={`provider-${provider.toLowerCase()}`}
      className="shadow-none"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ProviderLogo provider={provider} className="size-5 w-auto" aria-hidden />
          {name}
        </CardTitle>
        <CardDescription>{providers(`${provider}.description`)}</CardDescription>
        <CardAction>
          <IntegrationStatusBadge status={status} configured={configured} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-muted-foreground">
        {outcome ? <IntegrationNotice outcome={outcome} name={name} /> : null}
        <p>{usable ? t(`hint.${status}`, { name }) : t("hint.UNAVAILABLE", { name })}</p>
        {takes ? <p>{t("takes", { methods: takes })}</p> : null}
        {capabilities.ledger ? <p>{t("ledger", { name })}</p> : null}
        {facts.length > 0 ? (
          <dl className="grid gap-1 text-foreground">
            {facts.map((fact) => (
              <div key={fact.label} className="flex gap-2">
                <dt className="text-muted-foreground">{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {configured || !usable ? null : <p>{t("notConfigured", { name })}</p>}
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <ProviderActions connection={connection} name={name} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
