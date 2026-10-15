import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { defaultTentativeStatusId, nextReference } from "./booking-defaults";
import { checkCustomer, checkOwners, checkPeriod } from "./booking-rules";
import { BookingCreateInputSchema, BookingSchema, BookingUpdateInputSchema } from "./schema";
import { loadBooking, toBookingDto } from "./to-booking-dto";

export const createBooking = defineOperation({
  name: "booking.create",
  kind: "command",
  description:
    "Create a booking of one of the organization's booking types for a customer. It gets the " +
    "next reference number and the default status of the TENTATIVE phase. Owners must be " +
    "members. `fields` must match the type's own fields.",
  input: BookingCreateInputSchema,
  output: BookingSchema,
  permission: "booking:write",
  handler: async ({ input: { entityTypeId, fields, ...data }, context }) => {
    const type = await loadTypeOfBase({ context, entityTypeId, base: "BOOKING" });
    if (!type.ok) return type;
    for (const check of [
      checkPeriod(data),
      await checkCustomer({ context, customerId: data.customerId }),
      await checkOwners({ context, ...data }),
    ]) {
      if (!check.ok) return check;
    }
    const checked = await validateFields({ context, entityTypeId, values: fields ?? {} });
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
    return ok({ value: booking });
  },
});

export const updateBooking = defineOperation({
  name: "booking.update",
  kind: "command",
  description:
    "Update a booking's customer, time, headcount or own fields. Omitted properties are " +
    "unchanged; `fields` is merged by key (null clears a value). The type cannot be changed, " +
    "the status changes only with booking.changeStatus and the owners with booking.assign.",
  input: BookingUpdateInputSchema,
  output: BookingSchema,
  permission: "booking:write",
  handler: async ({ input: { id, fields: patch, ...data }, context }) => {
    const before = await loadBooking({ context, id });
    if (!before) return notFound({ entity: "Booking" });
    const period = checkPeriod({
      startsAt: data.startsAt ?? before.startsAt,
      endsAt: data.endsAt ?? before.endsAt,
    });
    if (!period.ok) return period;
    if (data.customerId && data.customerId !== before.customerId) {
      const customer = await checkCustomer({ context, customerId: data.customerId });
      if (!customer.ok) return customer;
    }
    let json: ReturnType<typeof toJson>;
    if (patch) {
      const values = mergeFields({ before: before.fields, patch });
      const checked = await validateFields({ context, entityTypeId: before.entityTypeId, values });
      if (!checked.ok) return checked;
      json = toJson({ value: checked.value });
    }
    const row = await context.db.booking.update({
      where: { id },
      data: { ...data, ...(json ? { fields: json } : {}) },
    });
    const booking = toBookingDto({ row });
    context.recordChange({ entityId: id, before, after: booking });
    return ok({ value: booking });
  },
});
