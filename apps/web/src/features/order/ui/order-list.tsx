import { listOrders } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { toCanonicalQuery } from "@/components/query-search/lib/query-canonical";
import type { QueryVocabulary } from "@/components/query-search/lib/query-vocabulary";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { type CallerAbilities, can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import type { OrderListParams } from "../lib/list-params";
import { loadOrderData } from "../load-order-data";
import { loadOrderQuery } from "../load-order-query";
import { CreateOrderButton } from "./create-order-button";
import { OrderListTable } from "./order-list-table";
import { OrderSearchBar } from "./order-search-bar";

export type OrderListProps = {
  locale: Locale;
  /** Page, size, search (with qualifiers), and sort, read from the URL. */
  params: OrderListParams;
};

const GoToTypes = ({ label }: { label: string }) => (
  <Button asChild variant="outline">
    <Link href={ROUTES.settingsTypes}>{label}</Link>
  </Button>
);

type HeaderPartsInput = { abilities: CallerAbilities; noTypes: boolean };

/** The create button (not without types); needs `order:write`. */
function headerParts({ abilities, noTypes }: HeaderPartsInput) {
  const canCreate = can({ abilities, permission: "order:write" });
  const create = canCreate && !noTypes ? <CreateOrderButton /> : undefined;
  return { create, actions: create };
}

type ListInputArgs = { params: OrderListParams; vocabulary: QueryVocabulary };

/**
 * `order.list` by page number, so the server returns the total for the page count; the search's
 * words of the UI language become core's canonical ones.
 */
const listInput = ({ params, vocabulary }: ListInputArgs) => ({
  page: params.page,
  limit: params.pageSize,
  sort: params.sort,
  direction: params.direction,
  ...(params.q ? { q: toCanonicalQuery({ q: params.q, vocabulary }) } : {}),
});

/** Orders page body: header with create, filters and search, then the paged table. */
export async function OrderList({ locale, params }: OrderListProps) {
  const t = await getTranslations("order");
  const [abilities, query] = await Promise.all([getCallerAbilities(), loadOrderQuery()]);
  const [data, result] = await Promise.all([
    loadOrderData(),
    runOperation({
      operation: listOrders,
      input: listInput({ params, vocabulary: query.vocabulary }),
    }),
  ]);
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const noTypes = data.value.types.length === 0;
  const { create, actions } = headerParts({ abilities, noTypes });
  const { items, total } = result.value;
  const empty = total === 0 && !params.q;
  return (
    <div className="grid gap-6">
      <PageHeader title={t("plural")} description={t("listDescription")} actions={actions} />
      {empty ? (
        <EmptyState
          title={t("empty")}
          description={noTypes ? t("noTypes") : t("emptyDescription")}
          action={noTypes ? <GoToTypes label={t("goToTypes")} /> : create}
        />
      ) : (
        <>
          <OrderSearchBar q={params.q} query={query} data={data.value} />
          <OrderListTable
            orders={items}
            total={total ?? 0}
            view={params}
            data={data.value}
            canEdit={can({ abilities, permission: "order:write" })}
          />
        </>
      )}
    </div>
  );
}
