import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import type { NotificationListInput, NotificationListSort } from "./list-schema";
import { toNotificationDto } from "./to-notification-dto";

type Direction = "asc" | "desc";
type OrderBy = Prisma.NotificationOrderByWithRelationInput;

const ORDER: Record<NotificationListSort, (direction: Direction) => OrderBy[]> = {
  created: (direction) => [{ createdAt: direction }],
  kind: (direction) => [{ kind: direction }, { createdAt: "desc" }],
  order: (direction) => [{ order: { reference: direction } }, { createdAt: "desc" }],
  read: (direction) => [{ readAt: { sort: direction, nulls: "first" } }, { createdAt: "desc" }],
};

/**
 * The text search: the order's title, or its reference when the text is a number. Without
 * `order:read` it matches nothing, so the search cannot reveal titles (ADR 0071).
 */
function searchWhere({
  q,
  canReadOrders,
}: {
  q: string | undefined;
  canReadOrders: boolean;
}): Prisma.NotificationWhereInput {
  if (!q) return {};
  if (!canReadOrders) return { id: { in: [] } };
  const reference = /^#?\d+$/.test(q) ? Number(q.replace("#", "")) : null;
  const title = { order: { title: { contains: q, mode: "insensitive" as const } } };
  return { OR: [title, ...(reference !== null ? [{ order: { reference } }] : [])] };
}

/** Ordering by order would reveal order order to a reader without `order:read`. */
const sortOf = ({
  input,
  canReadOrders,
}: {
  input: NotificationListInput;
  canReadOrders: boolean;
}) => (input.sort === "order" && !canReadOrders ? "created" : input.sort);

export type NotificationWhereInput = {
  input: NotificationListInput;
  recipientUserId: string;
  canReadOrders: boolean;
};

/** The caller's own notifications that match the filters (ADR 0094). */
export function notificationWhere({
  input,
  recipientUserId,
  canReadOrders,
}: NotificationWhereInput) {
  const read =
    input.read === "unread" ? { readAt: null } : input.read ? { NOT: { readAt: null } } : {};
  return {
    recipientUserId,
    ...(input.kind ? { kind: input.kind } : {}),
    ...read,
    ...searchWhere({ q: input.q, canReadOrders }),
  } satisfies Prisma.NotificationWhereInput;
}

export type LoadNotificationPageInput = {
  input: NotificationListInput;
  context: OperationContext;
  recipientUserId: string;
};

/** One page of `notification.list`; with `page` it also counts every match (`total`). */
export async function loadNotificationPage({
  input,
  context,
  recipientUserId,
}: LoadNotificationPageInput) {
  const canReadOrders = canView({ context, feature: "order" });
  const where = notificationWhere({ input, recipientUserId, canReadOrders });
  const { limit, cursor, page } = input;
  const paging = page ? { take: limit + 1, skip: (page - 1) * limit } : pageArgs({ limit, cursor });
  const [rows, total] = await Promise.all([
    context.db.notification.findMany({
      where,
      orderBy: [...ORDER[sortOf({ input, canReadOrders })](input.direction), { id: "asc" }],
      ...paging,
    }),
    page ? context.db.notification.count({ where }) : Promise.resolve(null),
  ]);
  const result = paginate({ rows, limit });
  return {
    items: result.items.map((row) => toNotificationDto({ row, context })),
    nextCursor: result.nextCursor,
    total,
  };
}
