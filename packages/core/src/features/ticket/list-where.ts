import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import type { TicketListInput } from "./list-schema";

export type TicketListWhereInput = {
  input: TicketListInput;
  context: Pick<OperationContext, "permissions">;
};

const REFERENCE = /^#?(\d{1,9})$/;

type SearchInput = { q: string | undefined; customers: boolean };

/**
 * The search `q`: an exact reference number, or a substring of the note and, for callers who may
 * view customers, of the customer's or contact's name (ADR 0071).
 */
function searchWhere({ q, customers }: SearchInput): Prisma.TicketWhereInput {
  if (!q) return {};
  const contains = { contains: q, mode: "insensitive" as const };
  const reference = REFERENCE.exec(q)?.[1];
  const names = customers
    ? [{ customer: { name: contains } }, { contact: { name: contains } }]
    : [];
  return {
    OR: [...(reference ? [{ reference: Number(reference) }] : []), ...names, { note: contains }],
  };
}

/**
 * Prisma filter of `ticket.list` on the ticket's own columns: every given filter must match; the
 * window overlaps the desired period. Assignee and follower filters are added by `subjectIdFilter`.
 */
export function ticketListWhere({ input, context }: TicketListWhereInput): Prisma.TicketWhereInput {
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
