import { z } from "zod";
import { PlainDateStringSchema } from "../../time/plain-date-schema";

export const RESERVATION_STATES = [
  "PENDING_PAYMENT",
  "BOOKED",
  "SEATED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;
export const ReservationStateSchema = z.enum(RESERVATION_STATES);

/** Why staff should look twice at a time (ADR 0119); never a refusal. */
export const RESERVATION_WARNINGS = [
  "OUTSIDE_SITTING",
  "OVER_PACE",
  "ROOM_SOFT_HELD",
  "OUTSIDE_ONLINE_WINDOW",
] as const;
export const ReservationWarningSchema = z.enum(RESERVATION_WARNINGS);

const Booker = {
  bookerName: z.string().trim().min(1).max(120).describe("The one booker (the buyer, ADR 0119)"),
  bookerPhone: z.string().trim().max(40).nullable().optional(),
  bookerEmail: z.string().trim().email().max(200).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional().describe("Message to the restaurant"),
};

export const ReservationRequirementSchema = z.object({
  vocabularyValueId: z.string().min(1).describe("A value of the organization's own lists"),
  quantity: z.number().int().min(1).max(100).describe("How many of the party, never who"),
});

export const ReservationTableSchema = z.object({
  elementId: z.string().describe("The table (a layout piece)"),
  label: z.string().nullable().describe("The table's number"),
});

/** A party at one or more tables (ADR 0119). The manage token is never in it. */
export const ReservationSchema = z.object({
  id: z.string(),
  roomItemId: z.string().describe("The dining room's item (item.get)"),
  serviceId: z.string().nullable().describe("The sitting (diningService.get); null = outside one"),
  startsAt: z.date(),
  endsAt: z.date(),
  partySize: z.number().int(),
  state: ReservationStateSchema,
  source: z.enum(["STAFF", "WEB", "API"]),
  bookerName: z.string().nullable().describe("Null after erasure (90 days after the visit)"),
  bookerPhone: z.string().nullable(),
  bookerEmail: z.string().nullable(),
  note: z.string().nullable(),
  customerId: z.string().nullable().describe("customer.get; a regular or company, staff only"),
  contactId: z.string().nullable(),
  orderId: z.string().nullable().describe("The private order behind a deposit"),
  tables: z.array(ReservationTableSchema),
  requirements: z.array(ReservationRequirementSchema),
  seatedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  cancelledAt: z.date().nullable(),
  cancelledBy: z.enum(["GUEST", "STAFF", "SYSTEM"]).nullable(),
  cancelReason: z.string().nullable(),
  createdAt: z.date(),
});

export const ReservationWithWarningsSchema = ReservationSchema.extend({
  warnings: z.array(ReservationWarningSchema).describe("Saved anyway; staff overrode these"),
});

export const ReservationIdInputSchema = z.object({ id: z.string().min(1) });

export const ReservationListInputSchema = z.object({
  roomItemId: z.string().min(1).optional(),
  from: z.coerce.date().describe("First start, inclusive"),
  to: z.coerce.date().describe("Last start, exclusive"),
  states: z.array(ReservationStateSchema).optional().describe("Default: every state but CANCELLED"),
});

export const ReservationTotalsSchema = z.object({
  reservations: z.number().int(),
  covers: z.number().int().describe("People in BOOKED, SEATED and COMPLETED reservations"),
  needs: z.array(ReservationRequirementSchema).describe("Requirement counts summed"),
});

export const ReservationListOutputSchema = z.object({
  items: z.array(ReservationSchema).describe("By start time"),
  totals: ReservationTotalsSchema,
});

export const ReservationCreateInputSchema = z.object({
  roomItemId: z.string().min(1).describe("A dining room (diningRoom.list)"),
  startsAt: z.coerce.date(),
  partySize: z.number().int().min(1).max(100),
  durationMinutes: z
    .number()
    .int()
    .min(15)
    .max(720)
    .optional()
    .describe("Default: the sitting's turn time for the party, else 120"),
  tableIds: z
    .array(z.string().min(1))
    .min(1)
    .max(20)
    .optional()
    .describe("Tables to use; default: the smallest free fit"),
  ...Booker,
  customerId: z.string().min(1).nullable().optional(),
  contactId: z.string().min(1).nullable().optional(),
  requirements: z.array(ReservationRequirementSchema).max(30).optional(),
});

export const ReservationUpdateInputSchema = z
  .object({
    id: z.string().min(1),
    startsAt: z.coerce.date(),
    partySize: z.number().int().min(1).max(100),
    durationMinutes: z.number().int().min(15).max(720),
    tableIds: z.array(z.string().min(1)).min(1).max(20),
    ...Booker,
    customerId: z.string().min(1).nullable(),
    contactId: z.string().min(1).nullable(),
    requirements: z.array(ReservationRequirementSchema).max(30),
  })
  .partial()
  .required({ id: true })
  .describe("Omitted fields are unchanged; a new time or party size finds tables again");

export const ReservationCancelInputSchema = z.object({
  id: z.string().min(1),
  reason: z.string().trim().max(300).nullable().optional(),
});

export const ReservationAvailabilityInputSchema = z.object({
  roomItemId: z.string().min(1),
  date: PlainDateStringSchema.describe("The local date in the room's zone"),
  partySize: z.number().int().min(1).max(100),
  online: z
    .boolean()
    .default(false)
    .describe("Apply the guest rules: online window, online tables, no online-only blocks"),
});

export const AvailabilitySlotSchema = z.object({
  startsAt: z.date(),
  endsAt: z.date(),
  serviceId: z.string(),
  serviceName: z.string(),
  available: z.boolean().describe("Free tables fit and nothing refuses it"),
  tableIds: z.array(z.string()).nullable().describe("The tables it would get"),
  warnings: z.array(ReservationWarningSchema),
  coversInSlot: z.number().int().describe("People already starting in this slot"),
});

export const ReservationAvailabilityOutputSchema = z.object({
  timeZone: z.string(),
  slots: z.array(AvailabilitySlotSchema),
});

export type ReservationDto = z.infer<typeof ReservationSchema>;
export type ReservationState = z.infer<typeof ReservationStateSchema>;
export type ReservationWarning = z.infer<typeof ReservationWarningSchema>;
export type ReservationCreateInput = z.infer<typeof ReservationCreateInputSchema>;
export type ReservationUpdateInput = z.infer<typeof ReservationUpdateInputSchema>;
export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;
