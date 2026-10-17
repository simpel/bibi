import type { Prisma } from "@okazi/db";
import type { z } from "zod";
import type { BookingListInputSchema } from "./schema";

export type BookingListWhereInput = { input: z.infer<typeof BookingListInputSchema> };

/**
 * Prisma filter of `booking.list` on the booking's own columns: every given filter must match; the
 * window overlaps. Assignee and follower filters are added by `subjectIdFilter`.
 */
export function bookingListWhere({ input }: BookingListWhereInput): Prisma.BookingWhereInput {
  const { customerId, entityTypeId, bookingStatusId } = input;
  return {
    ...(customerId ? { customerId } : {}),
    ...(entityTypeId ? { entityTypeId } : {}),
    ...(bookingStatusId ? { bookingStatusId } : {}),
    ...(input.from ? { endsAt: { gt: input.from } } : {}),
    ...(input.to ? { startsAt: { lt: input.to } } : {}),
  };
}
