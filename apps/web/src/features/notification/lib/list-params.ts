import {
  NOTIFICATION_KINDS,
  NOTIFICATION_LIST_SORTS,
  type NOTIFICATION_READ_FILTERS,
  type NotificationKind,
  type NotificationListSort,
} from "@bibi/core/schemas";

/** Rows per page offered under the notification table; the first is the default. */
export const NOTIFICATION_PAGE_SIZES = [25, 50, 100];

export type NotificationReadFilter = (typeof NOTIFICATION_READ_FILTERS)[number];

/** The query names of one table's page and page size: the unread table's, or the read one's. */
export const NOTIFICATION_PAGE_PARAMS = {
  unread: { page: "page", pageSize: "pageSize" },
  read: { page: "readPage", pageSize: "readPageSize" },
} as const satisfies Record<NotificationReadFilter, { page: string; pageSize: string }>;

/** One of the page's two tables: its read state, its own page, and the shared filters and sort. */
export type NotificationListParams = {
  read: NotificationReadFilter;
  page: number;
  pageSize: number;
  q: string | undefined;
  kind: NotificationKind | undefined;
  sort: NotificationListSort;
  direction: "asc" | "desc";
};

/** Both tables: unread and read always list apart (ADR 0094). */
export type NotificationPageParams = Record<NotificationReadFilter, NotificationListParams>;

export type NotificationSearchParams = Record<string, string | string[] | undefined>;

type Raw = { value: string | string[] | undefined };

const first = ({ value }: Raw) => (Array.isArray(value) ? value[0] : value);

const positive = ({ value }: { value: string | undefined }) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : undefined;
};

const oneOf = <T extends string>({ list, value }: { list: readonly T[]; value: Raw["value"] }) =>
  list.find((entry) => entry === first({ value }));

/** Each table is split by read state, so sorting by it means nothing here. */
const SORTS = NOTIFICATION_LIST_SORTS.filter((sort) => sort !== "read");

type PagingInput = { params: NotificationSearchParams; read: NotificationReadFilter };

/** One table's page and page size from its own query names. */
const pagingOf = ({ params, read }: PagingInput) => {
  const names = NOTIFICATION_PAGE_PARAMS[read];
  const size = positive({ value: first({ value: params[names.pageSize] }) });
  return {
    page: Math.min(positive({ value: first({ value: params[names.page] }) }) ?? 1, 100_000),
    pageSize:
      size && NOTIFICATION_PAGE_SIZES.includes(size) ? size : (NOTIFICATION_PAGE_SIZES[0] ?? 25),
  };
};

/**
 * `/notifications`' URL state: search, kind and sort for both tables, and each table's own page
 * and rows per page. Hand-edited values fall back to the defaults instead of erroring.
 */
export function readNotificationPageParams({
  params,
}: {
  params: NotificationSearchParams;
}): NotificationPageParams {
  const q = first({ value: params.q })?.trim();
  const shared = {
    q: q ? q.slice(0, 200) : undefined,
    kind: oneOf({ list: NOTIFICATION_KINDS, value: params.kind }),
    sort: oneOf({ list: SORTS, value: params.sort }) ?? "created",
    direction: first({ value: params.dir }) === "asc" ? ("asc" as const) : ("desc" as const),
  };
  return {
    unread: { ...shared, read: "unread", ...pagingOf({ params, read: "unread" }) },
    read: { ...shared, read: "read", ...pagingOf({ params, read: "read" }) },
  };
}
