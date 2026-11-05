import { listOauthGrants } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { AddConnection } from "./add-connection";
import { OauthGrantTable } from "./oauth-grant-table";

export type OauthGrantSectionProps = { locale: Locale; id?: string };

/**
 * The signed-in user's own connected OAuth/MCP clients in this organization, on the profile page:
 * every role may see and disconnect their own (`self:write` is personal, ADR 0034).
 */
export async function OauthGrantSection({ locale, id }: OauthGrantSectionProps) {
  const [t, grants] = await Promise.all([
    getTranslations("integration.oauthGrants"),
    runOperation({ operation: listOauthGrants, input: {} }),
  ]);
  return (
    <Card id={id} className="scroll-mt-6">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
        <CardAction>
          <AddConnection />
        </CardAction>
      </CardHeader>
      <CardContent>
        {!grants.ok ? (
          <ErrorState inline errorKey={handleLoadError({ error: grants.error, locale })} />
        ) : grants.value.items.length === 0 ? (
          <EmptyState title={t("empty")} />
        ) : (
          <OauthGrantTable grants={grants.value.items} />
        )}
      </CardContent>
    </Card>
  );
}
