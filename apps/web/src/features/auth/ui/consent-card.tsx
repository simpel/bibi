"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ConsentOrganization } from "../consent-organization-type";
import { AuthCard } from "./auth-card";
import { ConsentOrganizationPicker } from "./consent-organization";
import { ConsentScopes } from "./consent-scopes";
import { useConsentActions } from "./use-consent-actions";
import { useOAuthClientName } from "./use-oauth-client-name";

export type ConsentCardProps = {
  clientId: string | null;
  scopes: string[];
  /** Where Better Auth sends the code, e.g. `claude.ai`: shown so a look-alike client stands out. */
  redirectHost: string | null;
  organizations: ConsentOrganization[];
  defaultId: string | null;
};

/**
 * OAuth consent: who asks, for which organization, for what, and where access is sent.
 */
export function ConsentCard({
  clientId,
  scopes,
  redirectHost,
  organizations,
  defaultId,
}: ConsentCardProps) {
  const t = useTranslations("auth");
  const clientName = useOAuthClientName({ clientId }) ?? t("unknownClient");
  const [organizationId, setOrganizationId] = useState(defaultId);
  const { pending, allow, deny } = useConsentActions({ organizationId });
  return (
    <AuthCard
      title={t("consentTitle", { client: clientName })}
      description={t("consentDescription", { client: clientName })}
    >
      <ConsentOrganizationPicker
        organizations={organizations}
        value={organizationId}
        onChange={({ id }) => setOrganizationId(id)}
      />
      <ConsentScopes scopes={scopes} />
      {redirectHost ? (
        <p className="text-sm text-muted-foreground">
          {t("consentRedirect", { host: redirectHost })}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" disabled={pending} onClick={deny}>
          {t("deny")}
        </Button>
        <Button className="flex-1" disabled={pending || !organizationId} onClick={allow}>
          {t("allow")}
        </Button>
      </div>
    </AuthCard>
  );
}
