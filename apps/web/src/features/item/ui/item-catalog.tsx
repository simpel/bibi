import type { ItemDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { CreateItemButton } from "./create-item-button";
import type { ItemFormData } from "./item-form-data";
import { ItemTable } from "./item-table";
import { ItemTypeFilter } from "./item-type-filter";

export type ItemCatalogProps = {
  locale: Locale;
  data: ItemFormData;
  page: { items: ItemDto[]; nextCursor: string | null };
  canCreate: boolean;
  typeId?: string | undefined;
  cursor?: string | undefined;
};

/** The catalog: header with create, type filter, and the table (or an empty state). */
export async function ItemCatalog(props: ItemCatalogProps) {
  const { locale, data, page, canCreate, typeId, cursor } = props;
  const t = await getTranslations("item");
  const noTypes = data.types.length === 0;
  const create = canCreate && !noTypes ? <CreateItemButton typeId={typeId} /> : undefined;
  const toTypes = (
    <Button asChild variant="outline">
      <Link href={ROUTES.settingsTypes}>{t("goToTypes")}</Link>
    </Button>
  );
  return (
    <div className="grid gap-6">
      <PageHeader title={t("plural")} description={t("listDescription")} actions={create} />
      <ItemTypeFilter types={data.types} typeId={typeId} />
      {page.items.length === 0 && !cursor ? (
        <EmptyState
          title={t("empty")}
          description={noTypes ? t("noTypes") : t("emptyDescription")}
          action={noTypes ? toTypes : create}
        />
      ) : (
        <>
          <ItemTable
            items={page.items}
            types={data.types}
            venues={data.venues}
            venuesHidden={data.venuesHidden}
            locale={locale}
          />
          <CursorPagination
            pathname={ROUTES.items}
            cursor={cursor}
            nextCursor={page.nextCursor}
            query={typeId ? { type: typeId } : {}}
          />
        </>
      )}
    </div>
  );
}
