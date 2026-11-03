import type { NotificationListParams } from "./list-params";

/** `notification.list` by page number, so the server returns the total for the page count. */
export const notificationListInput = ({ params }: { params: NotificationListParams }) => ({
  page: params.page,
  limit: params.pageSize,
  sort: params.sort,
  direction: params.direction,
  ...(params.q ? { q: params.q } : {}),
  ...(params.kind ? { kind: params.kind } : {}),
  read: params.read,
});
