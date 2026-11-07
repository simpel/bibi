import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPage } from "@/components/admin/admin-page";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadItemStateData } from "../load-item-state-data";
import { CreateItemStateMenu } from "./create-item-state-menu";
import { ItemStateTable } from "./item-state-table";

export type ItemStateListProps = { locale: Locale; inTab?: boolean };

/** `/admin/item-states`: the states of every item type in one table with an item type column. */
export async function ItemStateList({ locale, inTab = false }: ItemStateListProps) {
  const [t, abilities, data] = await Promise.all([
    getTranslations("itemState"),
    getCallerAbilities(),
    loadItemStateData(),
  ]);
  const canCreate = can({ abilities, permission: "pipeline:write" });
  const access = rowAccess({ abilities, feature: "pipeline" });
  const types = data.ok ? data.value.map((entry) => entry.type) : [];
  const header = (
    <AdminHeader
      title={t("plural")}
      description={t("listDescription")}
      inTab={inTab}
      actions={canCreate && types.length > 0 ? <CreateItemStateMenu types={types} /> : undefined}
    />
  );
  if (!data.ok) {
    const errorKey = handleLoadError({ error: data.error, locale });
    return (
      <AdminPage header={header}>
        <ErrorState errorKey={errorKey} inline={inTab} />
      </AdminPage>
    );
  }
  return (
    <AdminPage header={header}>
      {data.value.length === 0 ? (
        <EmptyState title={t("noTypes")} description={t("noTypesDescription")} />
      ) : (
        <ItemStateTable entries={data.value} access={access} />
      )}
    </AdminPage>
  );
}
