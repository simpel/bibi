import {
  NOTIFICATION_KINDS,
  NOTIFICATION_LIST_SORTS,
  NOTIFICATION_READ_FILTERS,
  type NotificationKind,
  type NotificationListSort,
} from "@bibi/core/schemas";

/** Rows per page offered under the notification table; the first is the default. */
export const NOTIFICATION_PAGE_SIZES = [25, 50, 100];

export type NotificationReadFilter = (typeof NOTIFICATION_READ_FILTERS)[number];

export type NotificationListParams = {
  page: number;
  pageSize: number;
  q: string | undefined;
  kind: NotificationKind | undefined;
  read: NotificationReadFilter | undefined;
  sort: NotificationListSort;
  direction: "asc" | "desc";
};

export type NotificationSearchParams = Record<string, string | string[] | undefined>;

type Raw = { value: string | string[] | undefined };

const first = ({ value }: Raw) => (Array.isArray(value) ? value[0] : value);

const positive = ({ value }: { value: string | undefined }) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : undefined;
};

const oneOf = <T extends string>({ list, value }: { list: readonly T[]; value: Raw["value"] }) =>
  list.find((entry) => entry === first({ value }));

/**
 * `/notifications`' URL state: page, rows per page, search, kind, read filter and sort.
 * Hand-edited values fall back to the defaults instead of erroring.
 */
export function readNotificationListParams({
  params,
}: {
  params: NotificationSearchParams;
}): NotificationListParams {
  const size = positive({ value: first({ value: params.pageSize }) });
  const q = first({ value: params.q })?.trim();
  return {
    page: Math.min(positive({ value: first({ value: params.page }) }) ?? 1, 100_000),
    pageSize:
      size && NOTIFICATION_PAGE_SIZES.includes(size) ? size : (NOTIFICATION_PAGE_SIZES[0] ?? 25),
    q: q ? q.slice(0, 200) : undefined,
    kind: oneOf({ list: NOTIFICATION_KINDS, value: params.kind }),
    read: oneOf({ list: NOTIFICATION_READ_FILTERS, value: params.read }),
    sort: oneOf({ list: NOTIFICATION_LIST_SORTS, value: params.sort }) ?? "created",
    direction: first({ value: params.dir }) === "asc" ? "asc" : "desc",
  };
}
