import { RUN_SHEET_LIST_SORTS, type RunSheetListSort } from "@bibi/core/schemas";

/** Rows per page under the run sheet table; the first is the default. */
export const RUN_SHEET_PAGE_SIZES = [25, 50, 100];

export type RunSheetListParams = {
  page: number;
  pageSize: number;
  /** The search as in the URL: undefined when there is none (everything is listed). */
  q: string | undefined;
  sort: RunSheetListSort;
  direction: "asc" | "desc";
};

export type RunSheetSearchParams = Record<string, string | string[] | undefined>;

const first = ({ value }: { value: string | string[] | undefined }) =>
  Array.isArray(value) ? value[0] : value;

const positive = ({ value }: { value: string | undefined }) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : undefined;
};

/**
 * `/run-sheets`'s URL state: page, rows per page, search (with qualifiers) and sort.
 * Hand-edited values fall back to the defaults instead of erroring.
 */
export function readRunSheetListParams({
  params,
}: {
  params: RunSheetSearchParams;
}): RunSheetListParams {
  const size = positive({ value: first({ value: params.pageSize }) });
  const sort = RUN_SHEET_LIST_SORTS.find((key) => key === first({ value: params.sort }));
  const q = first({ value: params.q })?.trim();
  return {
    page: Math.min(positive({ value: first({ value: params.page }) }) ?? 1, 100_000),
    pageSize: size && RUN_SHEET_PAGE_SIZES.includes(size) ? size : (RUN_SHEET_PAGE_SIZES[0] ?? 25),
    q: q ? q.slice(0, 200) : undefined,
    sort: sort ?? "created",
    direction: first({ value: params.dir }) === "asc" ? "asc" : "desc",
  };
}
