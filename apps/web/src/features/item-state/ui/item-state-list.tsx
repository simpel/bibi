import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadItemStateData } from "../load-item-state-data";
import { ItemStateSection } from "./item-state-section";

export type ItemStateListProps = { locale: Locale };

/** `/settings/item-states`: the states of every item type. */
export async function ItemStateList({ locale }: ItemStateListProps) {
  const t = await getTranslations("itemState");
  const abilities = await getCallerAbilities();
  const canCreate = can({ abilities, permission: "pipeline:write" });
  const access = rowAccess({ abilities, feature: "pipeline" });
  const data = await loadItemStateData();
  const header = <PageHeader title={t("plural")} description={t("listDescription")} />;
  if (!data.ok) {
    const errorKey = handleLoadError({ error: data.error, locale });
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={errorKey} />
      </div>
    );
  }
  return (
    <div className="grid gap-6">
      {header}
      {data.value.length === 0 ? (
        <EmptyState title={t("noTypes")} description={t("noTypesDescription")} />
      ) : (
        data.value.map((entry) => (
          <ItemStateSection key={entry.type.id} {...entry} canCreate={canCreate} access={access} />
        ))
      )}
    </div>
  );
}
