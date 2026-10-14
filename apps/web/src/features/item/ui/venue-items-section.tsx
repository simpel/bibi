import { listItems } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { venueRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadItemFormData } from "../load-item-form-data";
import { ItemTable } from "./item-table";

export type VenueItemsSectionProps = {
  locale: Locale;
  venueId: string;
  cursor?: string | undefined;
};

const PAGE_SIZE = 20;

/** Items of one venue (`?itemCursor=`), read-only table linking to the item pages. */
export async function VenueItemsSection({ locale, venueId, cursor }: VenueItemsSectionProps) {
  const t = await getTranslations("venue");
  const [data, result] = await Promise.all([
    loadItemFormData(),
    runOperation({
      operation: listItems,
      input: { venueId, limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
    }),
  ]);
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const { items, nextCursor } = result.value;
  if (items.length === 0 && !cursor) return <EmptyState title={t("itemsEmpty")} />;
  return (
    <div className="grid gap-4">
      <ItemTable
        items={items}
        types={data.value.types}
        venues={data.value.venues}
        locale={locale}
      />
      <CursorPagination
        pathname={venueRoute({ id: venueId })}
        cursor={cursor}
        nextCursor={nextCursor}
        param="itemCursor"
      />
    </div>
  );
}
