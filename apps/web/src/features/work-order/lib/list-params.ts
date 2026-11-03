import { WORK_ORDER_LIST_SORTS, type WorkOrderListSort } from "@bibi/core/schemas";
import type { QueryVocabulary } from "@/components/query-search/lib/query-vocabulary";

/** Rows per page under the work order table; the first is the default. */
export const WORK_ORDER_PAGE_SIZES = [25, 50, 100];

export type WorkOrderListParams = {
  page: number;
  pageSize: number;
  /** The search as in the URL: undefined when there is none (the default search applies). */
  q: string | undefined;
  sort: WorkOrderListSort;
  direction: "asc" | "desc";
};

export type WorkOrderSearchParams = Record<string, string | string[] | undefined>;

const first = ({ value }: { value: string | string[] | undefined }) =>
  Array.isArray(value) ? value[0] : value;

const positive = ({ value }: { value: string | undefined }) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : undefined;
};

/**
 * `/work-orders/all`'s URL state: page, rows per page, search (with qualifiers) and sort.
 * Hand-edited values fall back to the defaults instead of erroring.
 */
export function readWorkOrderListParams({
  params,
}: {
  params: WorkOrderSearchParams;
}): WorkOrderListParams {
  const size = positive({ value: first({ value: params.pageSize }) });
  const sort = WORK_ORDER_LIST_SORTS.find((key) => key === first({ value: params.sort }));
  const q = first({ value: params.q })?.trim();
  return {
    page: Math.min(positive({ value: first({ value: params.page }) }) ?? 1, 100_000),
    pageSize:
      size && WORK_ORDER_PAGE_SIZES.includes(size) ? size : (WORK_ORDER_PAGE_SIZES[0] ?? 25),
    q: q ? q.slice(0, 200) : undefined,
    sort: sort ?? "created",
    direction: first({ value: params.dir }) === "asc" ? "asc" : "desc",
  };
}

/** Mine: involved in the version to work from, in the UI language (`inblandad:jag är:aktuell`). */
export function defaultWorkOrderQuery({ vocabulary }: { vocabulary: QueryVocabulary }) {
  const { words, values } = vocabulary;
  return `${words.involves}:${values.me} ${words.is}:${values.current}`;
}
