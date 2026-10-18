import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadItemStateData } from "../load-item-state-data";
import { ItemStateSection } from "./item-state-section";

export type ItemStateListProps = { locale: Locale };

/** `/settings/item-states`: the states of every item type. */
export async function ItemStateList({ locale }: ItemStateListProps) {
  const t = await getTranslations("itemState");
  const { itemStateAdmin } = await getCallerAbilities();
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
          <ItemStateSection key={entry.type.id} {...entry} canAdmin={itemStateAdmin} />
        ))
      )}
    </div>
  );
}
