import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import type { OrderListInput } from "./list-schema";

export type OrderListWhereInput = {
  input: OrderListInput;
  context: Pick<OperationContext, "permissions">;
};

const REFERENCE = /^#?(\d{1,9})$/;

type SearchInput = { q: string | undefined; customers: boolean };

/**
 * The search `q`: an exact reference number, or a substring of the title or note and, for
 * callers who may view customers, of the customer's or contact's name (ADR 0071).
 */
function searchWhere({ q, customers }: SearchInput): Prisma.OrderWhereInput {
  if (!q) return {};
  const contains = { contains: q, mode: "insensitive" as const };
  const reference = REFERENCE.exec(q)?.[1];
  const names = customers
    ? [{ customer: { name: contains } }, { contact: { name: contains } }]
    : [];
  return {
    OR: [
      ...(reference ? [{ reference: Number(reference) }] : []),
      ...names,
      { title: contains },
      { note: contains },
    ],
  };
}

/**
 * Prisma filter of `order.list` on the order's own columns: every given filter must match; the
 * window overlaps the desired period. Assignee and follower filters are added by `subjectIdFilter`.
 */
export function orderListWhere({ input, context }: OrderListWhereInput): Prisma.OrderWhereInput {
  const customers = canView({ context, feature: "customer" });
  const { customerId, entityTypeId, statusId } = input;
  return {
    ...(customerId ? { customerId } : {}),
    ...(entityTypeId ? { entityTypeId } : {}),
    ...(statusId ? { statusId } : {}),
    ...(input.from ? { desiredEndsAt: { gt: input.from } } : {}),
    ...(input.to ? { desiredStartsAt: { lt: input.to } } : {}),
    ...searchWhere({ q: input.q, customers }),
  };
}
