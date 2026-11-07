import { listEntityTypes } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AdminSection } from "@/components/admin/admin-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateEntityTypeButton } from "./create-entity-type-button";
import { EntityTypeTable } from "./entity-type-table";
import { ImportConfigurationTemplateButton } from "./import-configuration-template-button";

export type EntityTypeListProps = { locale: Locale };

const PAGE_SIZE = 100;
const CREATE = "configuration:write";

/** Import the starter pack next to create: types that already exist are skipped. */
function HeaderActions({ create }: { create: ReactNode }) {
  return (
    <>
      <ImportConfigurationTemplateButton />
      {create}
    </>
  );
}

/** The `types` section: header with import and create, one table with search and pagination. */
export async function EntityTypeList({ locale }: EntityTypeListProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("entityType"),
    getCallerAbilities(),
    runOperation({ operation: listEntityTypes, input: { limit: PAGE_SIZE } }),
  ]);
  const create = can({ abilities, permission: CREATE }) ? <CreateEntityTypeButton /> : undefined;
  const section = {
    section: "types" as const,
    description: t("listDescription"),
    actions: create && <HeaderActions create={create} />,
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
        <EntityTypeTable
          types={items}
          access={rowAccess({ abilities, feature: "configuration" })}
        />
      )}
    </AdminSection>
  );
}
