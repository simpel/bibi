import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { toJson } from "../../shared/to-json";
import { assignOnCreate } from "../assignment/assign-on-create";
import { defaultTentativeStatusId, nextReference } from "./booking-defaults";
import { checkPeriod } from "./booking-rules";
import { checkNewBooking } from "./check-new-booking";
import type { BookingCreateInput, BookingDto } from "./schema";
import { toBookingDto } from "./to-booking-dto";

export type InsertBookingInput = { context: OperationContext; input: BookingCreateInput };

/**
 * Creates a booking in the default `TENTATIVE` status with the next reference number and records
 * the change, with its main assignment when an assignee is given. Shared by `booking.create` and `booking.createQuick`.
 */
export async function insertBooking({
  context,
  input: { entityTypeId, fields, assigneeId, ...data },
}: InsertBookingInput): Promise<Result<BookingDto>> {
  const period = checkPeriod(data);
  if (!period.ok) return period;
  const checked = await checkNewBooking({ context, entityTypeId, fields, assigneeId, ...data });
  if (!checked.ok) return checked;
  const bookingStatusId = await defaultTentativeStatusId({ context });
  if (!bookingStatusId.ok) return bookingStatusId;
  const row = await context.db.booking.create({
    data: {
      ...data,
      entityTypeId,
      bookingStatusId: bookingStatusId.value,
      reference: await nextReference({ context }),
      fields: toJson({ value: checked.value }) ?? {},
      organizationId: context.organizationId,
    },
  });
  const booking = toBookingDto({ row });
  context.recordChange({ entityId: row.id, after: booking });
  await assignOnCreate({ context, subjectType: "BOOKING", subjectId: row.id, assigneeId });
  return ok({ value: booking });
}
