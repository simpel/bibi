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
  ticket: (direction) => [{ ticket: { reference: direction } }, { createdAt: "desc" }],
  read: (direction) => [{ readAt: { sort: direction, nulls: "first" } }, { createdAt: "desc" }],
};

/**
 * The text search: the ticket's title, or its reference when the text is a number. Without
 * `ticket:read` it matches nothing, so the search cannot reveal titles (ADR 0071).
 */
function searchWhere({
  q,
  canReadTickets,
}: {
  q: string | undefined;
  canReadTickets: boolean;
}): Prisma.NotificationWhereInput {
  if (!q) return {};
  if (!canReadTickets) return { id: { in: [] } };
  const reference = /^#?\d+$/.test(q) ? Number(q.replace("#", "")) : null;
  const title = { ticket: { title: { contains: q, mode: "insensitive" as const } } };
  return { OR: [title, ...(reference !== null ? [{ ticket: { reference } }] : [])] };
}

/** Ordering by ticket would reveal ticket order to a reader without `ticket:read`. */
const sortOf = ({
  input,
  canReadTickets,
}: {
  input: NotificationListInput;
  canReadTickets: boolean;
}) => (input.sort === "ticket" && !canReadTickets ? "created" : input.sort);

export type NotificationWhereInput = {
  input: NotificationListInput;
  recipientUserId: string;
  canReadTickets: boolean;
};

/** The caller's own notifications that match the filters (ADR 0094). */
export function notificationWhere({
  input,
  recipientUserId,
  canReadTickets,
}: NotificationWhereInput) {
  const read =
    input.read === "unread" ? { readAt: null } : input.read ? { NOT: { readAt: null } } : {};
  return {
    recipientUserId,
    ...(input.kind ? { kind: input.kind } : {}),
    ...read,
    ...searchWhere({ q: input.q, canReadTickets }),
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
  const canReadTickets = canView({ context, feature: "ticket" });
  const where = notificationWhere({ input, recipientUserId, canReadTickets });
  const { limit, cursor, page } = input;
  const paging = page ? { take: limit + 1, skip: (page - 1) * limit } : pageArgs({ limit, cursor });
  const [rows, total] = await Promise.all([
    context.db.notification.findMany({
      where,
      orderBy: [...ORDER[sortOf({ input, canReadTickets })](input.direction), { id: "asc" }],
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
