import { listApiKeys } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { assignableRoles } from "@/features/member/assignable-roles";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { ApiKeyUpdateForm } from "./api-key-update-form";

export type ApiKeyUpdatePageProps = { locale: Locale; id: string };

/** `/settings/api-keys/[id]/update`: rename a key and change its preset. Admins only. */
export async function ApiKeyUpdatePage({ locale, id }: ApiKeyUpdatePageProps) {
  const t = await getTranslations("integration.apiKeys");
  const abilities = await getCallerAbilities();
  if (!can({ abilities, permission: "apiKey:write" })) return <ErrorState errorKey="forbidden" />;
  const keys = await runOperation({ operation: listApiKeys, input: { limit: 100 } });
  if (!keys.ok) return <ErrorState errorKey={handleLoadError({ error: keys.error, locale })} />;
  const apiKey = keys.value.items.find((candidate) => candidate.id === id);
  if (!apiKey) notFound();
  return (
    <FormPageShell
      backHref={ROUTES.adminApiKeys}
      title={t("edit")}
      description={t("editDescription")}
    >
      <ApiKeyUpdateForm apiKey={apiKey} roles={assignableRoles({ caller: abilities.role })} />
    </FormPageShell>
  );
}
