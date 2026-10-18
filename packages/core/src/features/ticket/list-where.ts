import type { Prisma } from "@okazi/db";
import type { z } from "zod";
import type { TicketListInputSchema } from "./schema";

export type TicketListWhereInput = { input: z.infer<typeof TicketListInputSchema> };

/**
 * Prisma filter of `ticket.list` on the ticket's own columns: every given filter must match; the
 * window overlaps the desired period. Assignee and follower filters are added by `subjectIdFilter`.
 */
export function ticketListWhere({ input }: TicketListWhereInput): Prisma.TicketWhereInput {
  const { customerId, entityTypeId, phaseId } = input;
  return {
    ...(customerId ? { customerId } : {}),
    ...(entityTypeId ? { entityTypeId } : {}),
    ...(phaseId ? { phaseId } : {}),
    ...(input.from ? { desiredEndsAt: { gt: input.from } } : {}),
    ...(input.to ? { desiredStartsAt: { lt: input.to } } : {}),
  };
}
