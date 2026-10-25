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

export const CalendarBlockSchema = z.object({
  id: z.string().describe("The occupancy id"),
  itemId: z.string().describe("The occupied item; resolve its name with item.get or item.list"),
  type: OccupancyTypeSchema,
  startsAt: z.date(),
  endsAt: z.date(),
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
});

export const CalendarRangeSchema = z.object({
  timeZone: z.string().describe("The zone the days are in: the venue's, else the organization's"),
  from: z.date().describe("Start of the first day (inclusive)"),
  to: z.date().describe("Start of the day after the last (exclusive)"),
  blocks: z.array(CalendarBlockSchema).describe("Every block overlapping [from, to), by start"),
});

export type CalendarRangeInput = z.infer<typeof CalendarRangeInputSchema>;
export type CalendarBlockDto = z.infer<typeof CalendarBlockSchema>;
export type CalendarRange = z.infer<typeof CalendarRangeSchema>;
