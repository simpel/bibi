import { listApiKeys } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
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
  const [t, abilities, keys] = await Promise.all([
    getTranslations("integration.apiKeys"),
    getCallerAbilities(),
    runOperation({ operation: listApiKeys, input: { limit: 100 } }),
  ]);
  const roles = assignableRoles({ caller: abilities.role });
  const canManage = can({ abilities, permission: "apiKey:write" });
  const create = canManage ? <CreateApiKeyButton roles={roles} /> : null;
  return (
    <AdminSection
      id="api-keys"
      title={t("title")}
      description={t("description")}
      actions={keys.ok && keys.value.items.length === 0 ? null : create}
    >
      {!keys.ok ? (
        <ErrorState inline errorKey={handleLoadError({ error: keys.error, locale })} />
      ) : keys.value.items.length === 0 ? (
        <EmptyState title={t("empty")} action={create} />
      ) : (
        <ApiKeyTable apiKeys={keys.value.items} canManage={canManage} />
      )}
    </AdminSection>
  );
}
