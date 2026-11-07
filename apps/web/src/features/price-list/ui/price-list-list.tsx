import { listPriceLists } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import {
  type CallerAbilities,
  can,
  getCallerAbilities,
  rowAccess,
} from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreatePriceListButton } from "./create-price-list-button";
import { loadPriceListFormData } from "./load-price-list-form-data";
import { PriceListTable } from "./price-list-table";

export type PriceListListProps = { locale: Locale };

const PAGE_SIZE = 100;

/** Up to 100 price lists plus what the forms pick from. */
const load = () =>
  Promise.all([
    runOperation({
      operation: listPriceLists,
      input: { limit: PAGE_SIZE },
    }),
    loadPriceListFormData(),
  ]);

const createAction = ({ abilities }: { abilities: CallerAbilities }) =>
  can({ abilities, permission: "priceList:write" }) ? <CreatePriceListButton /> : undefined;

/** The `price-lists` section (ADR 0023): header with create, one table with search and pagination. */
export async function PriceListList({ locale }: PriceListListProps) {
  const [t, abilities, [result, data]] = await Promise.all([
    getTranslations("priceList"),
    getCallerAbilities(),
    load(),
  ]);
  const create = createAction({ abilities });
  const section = {
    section: "priceLists" as const,
    description: t("listDescription"),
    actions: create,
  };
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <AdminSection {...section}>
        <ErrorState errorKey={errorKey} inline />
      </AdminSection>
    );
  }
  const { items } = result.value;
  // Nothing to show and nothing the caller may create here: the section stays off the page.
  if (items.length === 0 && !create) return null;
  return (
    <AdminSection {...section}>
      {items.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <PriceListTable
          priceLists={items}
          data={data}
          access={rowAccess({ abilities, feature: "priceList" })}
        />
      )}
    </AdminSection>
  );
}
