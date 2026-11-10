import { listItems } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { loadItemTypeGroups } from "@/features/item-type-group/load-item-type-groups";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { itemGroupView } from "../group-tabs";
import { loadItemFormData } from "../load-item-form-data";
import { ItemCatalog } from "./item-catalog";

export type ItemListProps = {
  locale: Locale;
  typeId?: string | undefined;
  /** The `group` search param: a group id, or `none` for ungrouped types. */
  group?: string | undefined;
  cursor?: string | undefined;
};

const PAGE_SIZE = 100;

/** Item catalog page body: loads the page of items and the form data, then renders the catalog. */
export async function ItemList({ locale, typeId: requestedType, group, cursor }: ItemListProps) {
  const canCreate = can({ abilities: await getCallerAbilities(), permission: "item:write" });
  const t = await getTranslations("item");
  const [data, groups] = await Promise.all([loadItemFormData(), loadItemTypeGroups()]);
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  if (!groups.ok) return <ErrorState errorKey={handleLoadError({ error: groups.error, locale })} />;
  const view = itemGroupView({
    groups: groups.value,
    types: data.value.types,
    requested: group,
    otherLabel: t("otherGroup"),
  });
  const types = view?.types ?? data.value.types;
  const typeId = types.some((type) => type.id === requestedType) ? requestedType : undefined;
  const result = await runOperation({
    operation: listItems,
    input: {
      limit: PAGE_SIZE,
      ...(typeId ? { entityTypeId: typeId } : {}),
      ...(view ? { groupId: view.groupId } : {}),
      ...(cursor ? { cursor } : {}),
    },
  });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  return (
    <ItemCatalog
      data={{ ...data.value, types }}
      groups={view ? { tabs: view.tabs, current: view.current } : null}
      page={result.value}
      canCreate={canCreate}
      typeId={typeId}
      cursor={cursor}
    />
  );
}
