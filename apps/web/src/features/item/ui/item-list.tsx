import { listItems } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadItemFormData } from "../load-item-form-data";
import { ItemCatalog } from "./item-catalog";

export type ItemListProps = {
  locale: Locale;
  typeId?: string | undefined;
  cursor?: string | undefined;
};

const PAGE_SIZE = 20;

/** Item catalog page body: loads the page of items and the form data, then renders the catalog. */
export async function ItemList({ locale, typeId, cursor }: ItemListProps) {
  const canCreate = can({ abilities: await getCallerAbilities(), permission: "item:create" });
  const [data, result] = await Promise.all([
    loadItemFormData(),
    runOperation({
      operation: listItems,
      input: {
        limit: PAGE_SIZE,
        ...(typeId ? { entityTypeId: typeId } : {}),
        ...(cursor ? { cursor } : {}),
      },
    }),
  ]);
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  return (
    <ItemCatalog
      locale={locale}
      data={data.value}
      page={result.value}
      canCreate={canCreate}
      typeId={typeId}
      cursor={cursor}
    />
  );
}
