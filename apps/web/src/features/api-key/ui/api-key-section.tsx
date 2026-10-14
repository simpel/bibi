import { GRANTABLE_ROLES, type GrantableRole, listApiKeys, roleRank } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { ApiKeyTable } from "./api-key-table";
import { CreateApiKeyButton } from "./create-api-key-button";

export type ApiKeySectionProps = { locale: Locale };

/** The fixed roles a key may get from this caller: never owner, never above their own. */
async function grantableRoles(): Promise<GrantableRole[]> {
  const { role } = await getCallerAbilities();
  const rank = role ? roleRank({ role }) : -1;
  return GRANTABLE_ROLES.filter((grantable) => roleRank({ role: grantable }) <= rank);
}

/** The organization's REST API keys: create (a fixed role up to the caller's) and revoke. */
export async function ApiKeySection({ locale }: ApiKeySectionProps) {
  const t = await getTranslations("integration.apiKeys");
  const [keys, roles] = await Promise.all([
    runOperation({ operation: listApiKeys, input: { limit: 100 } }),
    grantableRoles(),
  ]);
  return (
    <section className="grid gap-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <CreateApiKeyButton roles={roles} />
      </header>
      {!keys.ok ? (
        <ErrorState errorKey={handleLoadError({ error: keys.error, locale })} />
      ) : keys.value.items.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <ApiKeyTable apiKeys={keys.value.items} />
      )}
    </section>
  );
}
