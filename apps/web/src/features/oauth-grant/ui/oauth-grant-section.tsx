import { listOauthGrants } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { OauthGrantTable } from "./oauth-grant-table";

export type OauthGrantSectionProps = { locale: Locale };

/**
 * The signed-in user's own connected OAuth/MCP clients in this organization, on the profile page:
 * every role may see and disconnect their own (`self:write` is personal, ADR 0034).
 */
export async function OauthGrantSection({ locale }: OauthGrantSectionProps) {
  const t = await getTranslations("integration.oauthGrants");
  const grants = await runOperation({ operation: listOauthGrants, input: {} });
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {!grants.ok ? (
          <ErrorState errorKey={handleLoadError({ error: grants.error, locale })} />
        ) : grants.value.items.length === 0 ? (
          <EmptyState title={t("empty")} />
        ) : (
          <OauthGrantTable grants={grants.value.items} />
        )}
      </CardContent>
    </Card>
  );
}
