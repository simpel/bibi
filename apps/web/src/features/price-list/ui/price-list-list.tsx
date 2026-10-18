import { listPriceLists } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreatePriceListButton } from "./create-price-list-button";
import { loadPriceListFormData } from "./load-price-list-form-data";
import { PriceListTable } from "./price-list-table";

export type PriceListListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 50;

/** One page of price lists plus what the forms pick from. */
const load = ({ cursor }: { cursor?: string | undefined }) =>
  Promise.all([
    runOperation({
      operation: listPriceLists,
      input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
    }),
    loadPriceListFormData(),
  ]);

/** Price lists page body (ADR 0023): header with create, table, cursor pagination. */
export async function PriceListList({ locale, cursor }: PriceListListProps) {
  const t = await getTranslations("priceList");
  const { priceListWrite } = await getCallerAbilities();
  const [result, data] = await load({ cursor });
  const create = priceListWrite ? <CreatePriceListButton /> : undefined;
  const header = (
    <PageHeader title={t("plural")} description={t("listDescription")} actions={create} />
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
  const { items, nextCursor } = result.value;
  return (
    <div className="grid gap-6">
      {header}
      {items.length === 0 && !cursor ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <>
          <PriceListTable priceLists={items} data={data} canWrite={priceListWrite} />
          <CursorPagination
            pathname={ROUTES.settingsPriceLists}
            cursor={cursor}
            nextCursor={nextCursor}
          />
        </>
      )}
    </div>
  );
}
