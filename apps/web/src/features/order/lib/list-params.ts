import { ORDER_LIST_SORTS, type OrderListSort } from "@bibi/core/schemas";

/** Rows per page offered under the order table; the first is the default. */
export const ORDER_PAGE_SIZES = [25, 50, 100];

/** Links from before qualifiers (`?mine=assigned`) still open the same list. */
const OLD_MINE: Record<string, string> = { assigned: "assignee:me", following: "follower:me" };

export type OrderListParams = {
  page: number;
  pageSize: number;
  q: string | undefined;
  sort: OrderListSort;
  direction: "asc" | "desc";
};

export type OrderSearchParams = Record<string, string | string[] | undefined>;

type Raw = { value: string | string[] | undefined };

const first = ({ value }: Raw) => (Array.isArray(value) ? value[0] : value);

const positive = ({ value }: { value: string | undefined }) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : undefined;
};

/**
 * `/orders`' URL state: page, rows per page, search (with qualifiers) and sort. Hand-edited or old
 * values fall back to the defaults instead of erroring.
 */
export function readOrderListParams({ params }: { params: OrderSearchParams }): OrderListParams {
  const size = positive({ value: first({ value: params.pageSize }) });
  const sort = ORDER_LIST_SORTS.find((key) => key === first({ value: params.sort }));
  const q = first({ value: params.q })?.trim() || OLD_MINE[first({ value: params.mine }) ?? ""];
  return {
    page: Math.min(positive({ value: first({ value: params.page }) }) ?? 1, 100_000),
    pageSize: size && ORDER_PAGE_SIZES.includes(size) ? size : (ORDER_PAGE_SIZES[0] ?? 25),
    q: q ? q.slice(0, 200) : undefined,
    sort: sort ?? "reference",
    direction: first({ value: params.dir }) === "asc" ? "asc" : "desc",
  };
}
