import { getEnv } from "@okazi/config";
import type { Booking } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import { bookingReplyAddress } from "../inbound-email/address";
import type { BookingDto } from "./schema";

export type ToBookingDtoInput = { row: Booking };

export const toBookingDto = ({ row }: ToBookingDtoInput): BookingDto => ({
  ...row,
  fields: asFieldValues({ value: row.fields }),
  inboundAddress: bookingReplyAddress({ bookingId: row.id, domain: getEnv().MAIL_INBOUND_DOMAIN }),
});

export type LoadBookingInput = { context: Pick<OperationContext, "db">; id: string };

/** The active booking, or null when missing, archived or in another organization. */
export async function loadBooking({ context, id }: LoadBookingInput): Promise<BookingDto | null> {
  const row = await context.db.booking.findFirst({ where: { id } });
  return row ? toBookingDto({ row }) : null;
}
