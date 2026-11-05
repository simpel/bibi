import { listEntityTypes } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateEntityTypeButton } from "./create-entity-type-button";
import { EntityTypeTable } from "./entity-type-table";
import { ImportConfigurationTemplateButton } from "./import-configuration-template-button";

export type EntityTypeListProps = { locale: Locale; cursor?: string | undefined };

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

/** Types page body: header with create and one unified table with `QuerySearch` and pagination. */
export async function EntityTypeList({ locale, cursor }: EntityTypeListProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("entityType"),
    getCallerAbilities(),
    runOperation({
      operation: listEntityTypes,
      input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
    }),
  ]);
  const create = can({ abilities, permission: CREATE }) ? <CreateEntityTypeButton /> : undefined;
  const actions = create && <HeaderActions create={create} />;
  const header = (
    <PageHeader title={t("plural")} description={t("listDescription")} actions={actions} />
  );
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={errorKey} />
      </div>
    );
  }
  const { items } = result.value;
  return (
    <div className="grid gap-6">
      {header}
      {items.length === 0 && !cursor ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <EntityTypeTable
          types={items}
          access={rowAccess({ abilities, feature: "configuration" })}
        />
      )}
    </div>
  );
}
