import { listEntityTypes } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPage } from "@/components/admin/admin-page";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateEntityTypeButton } from "./create-entity-type-button";
import { EntityTypeTable } from "./entity-type-table";
import { ImportConfigurationTemplateButton } from "./import-configuration-template-button";

export type EntityTypeListProps = {
  locale: Locale;
  /** Accepted for the page's search params; the client view paginates one loaded page. */
  inTab?: boolean;
};

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
export async function EntityTypeList({ locale, inTab = false }: EntityTypeListProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("entityType"),
    getCallerAbilities(),
    runOperation({
      operation: listEntityTypes,
      input: { limit: PAGE_SIZE },
    }),
  ]);
  const create = can({ abilities, permission: CREATE }) ? <CreateEntityTypeButton /> : undefined;
  const actions = create && <HeaderActions create={create} />;
  const header = (
    <AdminHeader
      title={t("plural")}
      description={t("listDescription")}
      actions={actions}
      inTab={inTab}
    />
  );
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <AdminPage header={header}>
        <ErrorState errorKey={errorKey} inline={inTab} />
      </AdminPage>
    );
  }
  const { items } = result.value;
  return (
    <AdminPage header={header}>
      {items.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <EntityTypeTable
          types={items}
          access={rowAccess({ abilities, feature: "configuration" })}
        />
      )}
    </AdminPage>
  );
}
