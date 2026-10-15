import type { Prisma } from "@okazi/db";
import type { z } from "zod";
import type { BookingListInputSchema } from "./schema";

export type BookingListWhereInput = { input: z.infer<typeof BookingListInputSchema> };

/** Prisma filter of `booking.list`: every given filter must match; the window overlaps. */
export function bookingListWhere({ input }: BookingListWhereInput): Prisma.BookingWhereInput {
  const { customerId, entityTypeId, bookingStatusId, salesOwnerId, coordinatorId } = input;
  return {
    ...(customerId ? { customerId } : {}),
    ...(entityTypeId ? { entityTypeId } : {}),
    ...(bookingStatusId ? { bookingStatusId } : {}),
    ...(salesOwnerId ? { salesOwnerId } : {}),
    ...(coordinatorId ? { coordinatorId } : {}),
    ...(input.from ? { endsAt: { gt: input.from } } : {}),
    ...(input.to ? { startsAt: { lt: input.to } } : {}),
  };
}
