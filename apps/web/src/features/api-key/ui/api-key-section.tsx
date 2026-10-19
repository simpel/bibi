import { listApiKeys } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { assignableRoles } from "@/features/member/assignable-roles";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { ApiKeyTable } from "./api-key-table";
import { CreateApiKeyButton } from "./create-api-key-button";

export type ApiKeySectionProps = { locale: Locale };

/** The organization's REST API keys: create (a preset up to the caller's), edit and revoke. */
export async function ApiKeySection({ locale }: ApiKeySectionProps) {
  const t = await getTranslations("integration.apiKeys");
  const abilities = await getCallerAbilities();
  const keys = await runOperation({ operation: listApiKeys, input: { limit: 100 } });
  const roles = assignableRoles({ caller: abilities.role });
  return (
    <section className="grid gap-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        {can({ abilities, permission: "apiKey:create" }) ? (
          <CreateApiKeyButton roles={roles} />
        ) : null}
      </header>
      {!keys.ok ? (
        <ErrorState errorKey={handleLoadError({ error: keys.error, locale })} />
      ) : keys.value.items.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <ApiKeyTable
          apiKeys={keys.value.items}
          canManage={can({ abilities, permission: "apiKey:edit" })}
        />
      )}
    </section>
  );
}
