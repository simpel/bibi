import type { Booking } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import type { BookingDto } from "./schema";

export type ToBookingDtoInput = { row: Booking };

export const toBookingDto = ({ row }: ToBookingDtoInput): BookingDto => ({
  ...row,
  fields: asFieldValues({ value: row.fields }),
});

export type LoadBookingInput = { context: Pick<OperationContext, "db">; id: string };

/** The active booking, or null when missing, archived or in another organization. */
export async function loadBooking({ context, id }: LoadBookingInput): Promise<BookingDto | null> {
  const row = await context.db.booking.findFirst({ where: { id } });
  return row ? toBookingDto({ row }) : null;
}
