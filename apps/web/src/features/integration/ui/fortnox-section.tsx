import type { IntegrationConnectionDto } from "@bibi/core/schemas";
import { FortnoxLogo } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { ConnectFortnoxButton } from "./connect-fortnox-button";
import { DisconnectFortnoxButton } from "./disconnect-fortnox-button";
import { IntegrationNotice, type IntegrationOutcome } from "./integration-notice";
import { IntegrationStatusBadge } from "./integration-status-badge";

export type FortnoxSectionProps = {
  connection: IntegrationConnectionDto;
  canEdit: boolean;
  /** The connect date, written on the server in the user's format. */
  connectedOn: string | null;
  /** What happened when Fortnox sent the admin back, shown inside the section. */
  outcome: IntegrationOutcome | null;
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
export async function FortnoxSection({
  connection,
  canEdit,
  connectedOn,
  outcome,
}: FortnoxSectionProps) {
  const t = await getTranslations("integration.fortnox");
  const { status, configured } = connection;
  const hasGrant = status === "CONNECTED" || status === "EXPIRED";
  const facts = [
    { label: t("company"), value: connection.companyName },
    { label: t("organizationNumber"), value: connection.organizationNumber },
    { label: t("connectedAt"), value: connectedOn },
  ].filter((fact) => status === "CONNECTED" && fact.value);
  return (
    <AdminSection
      id="fortnox"
      title={t("name")}
      description={t("description")}
      actions={
        <>
          <IntegrationStatusBadge status={status} />
          {canEdit ? (
            <>
              <ConnectFortnoxButton reconnect={hasGrant} disabled={!configured} />
              {hasGrant ? <DisconnectFortnoxButton /> : null}
            </>
          ) : null}
        </>
      }
    >
      <div className="grid gap-4 text-sm text-muted-foreground">
        {outcome ? <IntegrationNotice outcome={outcome} /> : null}
        <div className="flex items-start gap-3">
          <FortnoxLogo className="size-6 shrink-0" aria-hidden />
          <p>{t(`hint.${status}`)}</p>
        </div>
        <CompanyFacts facts={facts} />
        {status === "CONNECTED" ? <p>{t("reconnectNote")}</p> : null}
        {configured ? <p>{t("adminNote")}</p> : <p>{t("notConfigured")}</p>}
      </div>
    </AdminSection>
  );
}
