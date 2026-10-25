import { z } from "zod";
import { PlainDateStringSchema } from "../../time/plain-date-schema";
import { OccupancyTypeSchema } from "../occupancy/schema";

/** The longest range one call may cover, in days (ADR 0064 decision 2). */
export const MAX_CALENDAR_DAYS = 62;

export const CalendarRangeInputSchema = z.object({
  from: PlainDateStringSchema.describe("First day shown, YYYY-MM-DD (inclusive)"),
  to: PlainDateStringSchema.describe(
    `Last day shown, YYYY-MM-DD (inclusive); at most ${MAX_CALENDAR_DAYS} days after from`,
  ),
  venueId: z
    .string()
    .min(1)
    .optional()
    .describe("Only items of this venue; the days are then in the venue's time zone"),
  typeId: z.string().min(1).optional().describe("Only items of this item type"),
  stateId: z.string().min(1).optional().describe("Only blocks whose line is in this item state"),
  statusId: z
    .string()
    .min(1)
    .optional()
    .describe("Only blocks whose ticket is in this ticket status"),
  ticketId: z.string().min(1).optional().describe("Only blocks of this ticket"),
});

const ClientSchema = z.object({
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
});

const ContactSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string().nullable().describe("Work email here, else the login email"),
  phone: z.string().nullable().describe("From the member's profile here (ADR 0072)"),
  avatarKey: z.string().nullable().describe("Read the photo with file.get"),
  via: z.enum(["LINE", "TICKET"]).describe("The line's own assignee, else the ticket's"),
});

const StaffSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  type: z.string().describe("The unit's item type: a person's position"),
  person: z.boolean().describe("Linked to a member's profile (ADR 0068)"),
});

/**
 * What a booking is about, joined for the screen (ADR 0071 view read model). Each field from
 * another feature is null or empty without that feature's read.
 */
export const CalendarDetailsSchema = z.object({
  customer: z.string().nullable().describe("The ticket's customer; null without customer:read"),
  client: ClientSchema.nullable().describe(
    "The ticket's contact person; null without customer:read",
  ),
  headcount: z
    .number()
    .int()
    .nullable()
    .describe("The ticket's guaranteed, else estimated, guests"),
  quantity: z.number().int().nullable().describe("The line's effective quantity; program:read"),
  valueMinor: z
    .number()
    .int()
    .nullable()
    .describe("The line's total excl. VAT in minor units; null without program:read or a price"),
  currency: z.string().describe("ISO 4217 code of valueMinor"),
  note: z.string().nullable().describe("The line's internal note; null without program:read"),
  contact: ContactSchema.nullable().describe(
    "Who to reach: the line's assignee (program:read), else the ticket's",
  ),
  staff: z.array(StaffSchema).describe("Units allocated to the line (ADR 0059); program:read"),
});

export const CalendarBlockSchema = z.object({
  id: z.string().describe("The occupancy id"),
  itemId: z.string().describe("The occupied item; resolve its name with item.get or item.list"),
  type: OccupancyTypeSchema,
  startsAt: z.date(),
  endsAt: z.date(),
  lineId: z
    .string()
    .nullable()
    .describe("The line the hold or buffer belongs to; null for a manual block"),
  ticketId: z.string().nullable().describe("The line's ticket; null for a manual block"),
  reference: z.number().int().nullable().describe("The ticket's reference number"),
  title: z
    .string()
    .nullable()
    .describe("The line's name (null without program:read), or the note of a manual block"),
  soft: z.boolean().describe("A soft hold (ADR 0044): may overlap other soft holds"),
  heldAt: z
    .date()
    .nullable()
    .describe("Soft holds: when the line entered its state; null without program:read"),
  stateId: z.string().nullable().describe("The line's item state; null for manual blocks"),
  stateName: z.string().nullable().describe("The state's name; null without pipeline:read"),
  stateColor: z.string().nullable().describe("The state's colour; null without pipeline:read"),
  statusId: z.string().nullable().describe("The ticket's status"),
  expiresAt: z
    .date()
    .nullable()
    .describe("Soft holds in an expiring state: the ticket's hold expiry (holdsUntil)"),
  details: CalendarDetailsSchema.nullable().describe("Null for a manual block"),
});

export const CalendarRangeSchema = z.object({
  timeZone: z.string().describe("The zone the days are in: the venue's, else the organization's"),
  from: z.date().describe("Start of the first day (inclusive)"),
  to: z.date().describe("Start of the day after the last (exclusive)"),
  blocks: z.array(CalendarBlockSchema).describe("Every block overlapping [from, to), by start"),
});

export type CalendarRangeInput = z.infer<typeof CalendarRangeInputSchema>;
export type CalendarDetails = z.infer<typeof CalendarDetailsSchema>;
export type CalendarBlockDto = z.infer<typeof CalendarBlockSchema>;
export type CalendarRange = z.infer<typeof CalendarRangeSchema>;
