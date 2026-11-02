import type { IntegrationConnectionDto } from "@bibi/core/schemas";
import { Card, CardAction, CardContent, CardHeader, CardTitle, FortnoxLogo } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { ConnectFortnoxButton } from "./connect-fortnox-button";
import { DisconnectFortnoxButton } from "./disconnect-fortnox-button";
import { IntegrationStatusBadge } from "./integration-status-badge";

export type FortnoxCardProps = {
  connection: IntegrationConnectionDto;
  canEdit: boolean;
  /** The connect date, written on the server in the user's format. */
  connectedOn: string | null;
};

type CompanyFactsProps = { facts: { label: string; value: string | null }[] };

function CompanyFacts({ facts }: CompanyFactsProps) {
  if (facts.length === 0) return null;
  return (
    <dl className="grid gap-1 text-foreground">
      {facts.map((fact) => (
        <div key={fact.label} className="flex gap-2">
          <dt className="text-muted-foreground">{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The organization's Fortnox connection: status, company and the actions that fit the status. */
export async function FortnoxCard({ connection, canEdit, connectedOn }: FortnoxCardProps) {
  const t = await getTranslations("integration.fortnox");
  const { status, configured } = connection;
  const hasGrant = status === "CONNECTED" || status === "EXPIRED";
  const facts = [
    { label: t("company"), value: connection.companyName },
    { label: t("organizationNumber"), value: connection.organizationNumber },
    { label: t("connectedAt"), value: connectedOn },
  ].filter((fact) => status === "CONNECTED" && fact.value);
  return (
    <Card className="flex h-full flex-col shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FortnoxLogo className="size-6" aria-hidden />
          {t("name")}
        </CardTitle>
        <CardAction>
          <IntegrationStatusBadge status={status} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted-foreground">
        <p>{t(`hint.${status}`)}</p>
        <CompanyFacts facts={facts} />
        {status === "CONNECTED" ? <p>{t("reconnectNote")}</p> : null}
        {configured ? <p>{t("adminNote")}</p> : <p>{t("notConfigured")}</p>}
        {canEdit ? (
          <div className="mt-auto flex flex-wrap gap-2">
            <ConnectFortnoxButton reconnect={hasGrant} disabled={!configured} />
            {hasGrant ? <DisconnectFortnoxButton /> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
