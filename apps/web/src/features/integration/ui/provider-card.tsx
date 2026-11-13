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
import { ProviderHelpLink } from "./provider-help-link";
import { RefreshProviderButton } from "./refresh-provider-button";

export type ProviderCardProps = {
  connection: IntegrationConnectionDto;
  canEdit: boolean;
  /** The connect date, written on the server in the user's format. */
  connectedOn: string | null;
  /** What happened when this provider sent the admin back; only a failure is shown. */
  outcome: IntegrationOutcome | null;
};

type ProviderActionsProps = Pick<ProviderCardProps, "connection"> & { name: string };

/**
 * The actions the connection's status allows. Connected: only disconnect. Otherwise "How to
 * connect" on the left and the primary connect (or reconnect, continue) on the right.
 */
function ProviderActions({ connection, name }: ProviderActionsProps) {
  const { status, connectKind } = connection;
  const live = status !== "NOT_CONNECTED" && status !== "DISCONNECTED";
  const hostedOpen = connectKind === "HOSTED_ONBOARDING" && live && status !== "CONNECTED";
  if (status === "CONNECTED") {
    return (
      <div className="flex flex-wrap gap-2">
        <DisconnectProviderButton connection={connection} name={name} />
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <ProviderHelpLink provider={connection.provider} />
      <div className="flex flex-wrap gap-2">
        {live ? <DisconnectProviderButton connection={connection} name={name} /> : null}
        {hostedOpen ? <RefreshProviderButton /> : null}
        <ConnectProviderButton connection={connection} name={name} />
      </div>
    </div>
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
  const [t, providers] = await Promise.all([
    getTranslations("integration.card"),
    getTranslations("providers"),
  ]);
  const { provider, status, configured } = connection;
  const name = providers(`${provider}.name`);
  const usable = isConnectionUsable({ status, configured });
  // A working connection needs no sentence: the badge and the company facts say it.
  const hint = !usable
    ? t("hint.UNAVAILABLE", { name })
    : status === "CONNECTED"
      ? null
      : t(`hint.${status}`, { name });
  const facts = [
    { label: t("company"), value: connection.companyName },
    { label: t("organizationNumber"), value: connection.organizationNumber },
    { label: t("connectedAt"), value: connectedOn },
  ].filter((fact) => status === "CONNECTED" && fact.value);
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
        {hint ? <p>{hint}</p> : null}
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
        {canEdit ? <ProviderActions connection={connection} name={name} /> : null}
      </CardContent>
    </Card>
  );
}
