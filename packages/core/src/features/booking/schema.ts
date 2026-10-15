import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldValuesSchema } from "../field-definition/field-values-schema";

export const BookingSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  /** Reference number, sequential per organization. */
  reference: z.number().int(),
  entityTypeId: z.string(),
  customerId: z.string(),
  /** The organization's own booking status (ADR 0022); changed only by `booking.changeStatus`. */
  bookingStatusId: z.string(),
  startsAt: z.date(),
  endsAt: z.date(),
  estimatedHeadcount: z.number().int().nullable(),
  guaranteedHeadcount: z.number().int().nullable(),
  salesOwnerId: z.string().nullable(),
  coordinatorId: z.string().nullable(),
  statusChangedAt: z.date(),
  /** The reason given with the last status change; always set in the `CANCELLED` phase. */
  statusReason: z.string().nullable(),
  fields: FieldValuesSchema,
  /**
   * Derived, not stored (ADR 0012): `booking-<id>@<MAIL_INBOUND_DOMAIN>`, the reply-to of booking
   * mail. Null when inbound mail is not configured.
   */
  inboundAddress: z
    .email()
    .nullable()
    .describe(
      "Address the customer replies to so the mail lands on this booking; null when inbound mail is not configured",
    ),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const HeadcountSchema = z.number().int().min(0).max(100_000);

const OwnerIdSchema = z.string().min(1);

const BookingDetailsShape = {
  customerId: z.string().min(1).describe("Id of the customer who orders (customer.list)"),
  startsAt: z.coerce.date().describe("Start of the booking, ISO 8601"),
  endsAt: z.coerce.date().describe("End of the booking (after the start), ISO 8601"),
  estimatedHeadcount: HeadcountSchema.nullish().describe("Estimated number of guests"),
  guaranteedHeadcount: HeadcountSchema.nullish().describe(
    "Guaranteed number of guests (locked some days before)",
  ),
};

export const BookingCreateInputSchema = z.object({
  entityTypeId: z.string().min(1).describe("Id of the booking type (entityType.list base BOOKING)"),
  ...BookingDetailsShape,
  salesOwnerId: OwnerIdSchema.nullish().describe(
    "User id of the salesperson; must be a member (member.list userId)",
  ),
  coordinatorId: OwnerIdSchema.nullish().describe(
    "User id of the coordinator; must be a member (member.list userId)",
  ),
  fields: FieldValuesSchema.optional().describe("Values of the type's own fields, by field key"),
});

export const BookingUpdateInputSchema = z
  .object(BookingDetailsShape)
  .partial()
  .extend({
    id: z.string().min(1),
    fields: FieldValuesSchema.optional().describe(
      "Changed field values by key; other fields are kept. null clears a value.",
    ),
  });

/** At least one of the owners must be given; the handler refuses an empty change. */
export const BookingAssignInputSchema = z.object({
  id: z.string().min(1),
  salesOwnerId: OwnerIdSchema.nullable()
    .optional()
    .describe("User id of the new salesperson (a member); null removes; omitted = unchanged"),
  coordinatorId: OwnerIdSchema.nullable()
    .optional()
    .describe("User id of the new coordinator (a member); null removes; omitted = unchanged"),
});

export const BookingChangeStatusInputSchema = z.object({
  bookingId: z.string().min(1).describe("Id of the booking"),
  statusId: z
    .string()
    .min(1)
    .describe(
      "Id of the new status; must be an allowed transition (bookingStatus.list transitionsTo)",
    ),
  reason: z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .optional()
    .describe("Why the status changes; required when the new status is in the CANCELLED phase"),
});

export const BookingIdInputSchema = z.object({ id: z.string().min(1) });

export const BookingListInputSchema = z.object({
  customerId: z.string().optional().describe("Only bookings of this customer"),
  entityTypeId: z.string().optional().describe("Only bookings of this type"),
  bookingStatusId: z.string().optional().describe("Only bookings with this status"),
  salesOwnerId: z.string().optional().describe("Only bookings sold by this user"),
  coordinatorId: z.string().optional().describe("Only bookings coordinated by this user"),
  from: z.coerce.date().optional().describe("Only bookings that end after this time"),
  to: z.coerce.date().optional().describe("Only bookings that start before this time"),
  ...PageInputShape,
});

export const BookingListOutputSchema = z.object({
  items: z.array(BookingSchema),
  nextCursor: z.string().nullable(),
});

export type BookingDto = z.infer<typeof BookingSchema>;
export type BookingCreateInput = z.infer<typeof BookingCreateInputSchema>;
export type BookingUpdateInput = z.infer<typeof BookingUpdateInputSchema>;
export type BookingAssignInput = z.infer<typeof BookingAssignInputSchema>;
export type BookingChangeStatusInput = z.infer<typeof BookingChangeStatusInputSchema>;
