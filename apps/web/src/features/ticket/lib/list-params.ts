import { TICKET_LIST_SORTS, type TicketListSort } from "@bibi/core/schemas";
import { type MineFilter, readMine } from "@/features/assignment/ui/mine-filter";

/** Rows per page offered under the ticket table; the first is the default. */
export const TICKET_PAGE_SIZES = [25, 50, 100];

export type TicketListParams = {
  page: number;
  pageSize: number;
  q: string | undefined;
  sort: TicketListSort;
  direction: "asc" | "desc";
  mine: MineFilter | undefined;
};

export type TicketSearchParams = Record<string, string | string[] | undefined>;

type Raw = { value: string | string[] | undefined };

const first = ({ value }: Raw) => (Array.isArray(value) ? value[0] : value);

const positive = ({ value }: { value: string | undefined }) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : undefined;
};

/**
 * `/tickets`' URL state: page, rows per page, search, sort and the mine filter. Hand-edited or old
 * values fall back to the defaults instead of erroring.
 */
export function readTicketListParams({ params }: { params: TicketSearchParams }): TicketListParams {
  const size = positive({ value: first({ value: params.pageSize }) });
  const sort = TICKET_LIST_SORTS.find((key) => key === first({ value: params.sort }));
  const q = first({ value: params.q })?.trim();
  return {
    page: Math.min(positive({ value: first({ value: params.page }) }) ?? 1, 100_000),
    pageSize: size && TICKET_PAGE_SIZES.includes(size) ? size : (TICKET_PAGE_SIZES[0] ?? 25),
    q: q ? q.slice(0, 200) : undefined,
    sort: sort ?? "reference",
    direction: first({ value: params.dir }) === "asc" ? "asc" : "desc",
    mine: readMine({ value: params.mine }),
  };
}
