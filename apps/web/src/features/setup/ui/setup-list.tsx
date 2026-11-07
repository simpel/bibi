import { listSetups } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateSetupButton } from "./create-setup-button";
import { SetupTable } from "./setup-table";

export type SetupListProps = { locale: Locale };

const PAGE_SIZE = 100;
const CREATE = "configuration:write";

/** The `setups` section: header with create and one table with search and pagination. */
export async function SetupList({ locale }: SetupListProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("setup"),
    getCallerAbilities(),
    runOperation({ operation: listSetups, input: { limit: PAGE_SIZE } }),
  ]);
  const create = can({ abilities, permission: CREATE }) ? <CreateSetupButton /> : undefined;
  const section = {
    section: "setups" as const,
    description: t("listDescription"),
    actions: create,
  };
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <AdminSection {...section}>
        <ErrorState errorKey={errorKey} inline />
      </AdminSection>
    );
  }
  const { items } = result.value;
  return (
    <AdminSection {...section}>
      {items.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <SetupTable setups={items} access={rowAccess({ abilities, feature: "configuration" })} />
      )}
    </AdminSection>
  );
}
