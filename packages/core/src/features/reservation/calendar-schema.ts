import { z } from "zod";
import { PlainDateStringSchema } from "../../time/plain-date-schema";

export const ReservationCalendarInputSchema = z.object({
  roomItemId: z.string().min(1),
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .describe("The month as YYYY-MM in the room's zone"),
  partySize: z.number().int().min(1).max(100).default(2).describe("The party the guest would be"),
});

/** What a guest would meet on one date. */
export const CalendarDaySchema = z.object({
  date: PlainDateStringSchema,
  status: z
    .enum(["OPEN", "FULL", "CLOSED", "NO_SITTING", "OUTSIDE_WINDOW"])
    .describe(
      "OPEN: bookable times left; FULL: every time taken; CLOSED: closed by an exception; NO_SITTING: no sitting that weekday; OUTSIDE_WINDOW: not released yet or too soon, too far ahead or too large a party",
    ),
  starts: z.number().int().describe("Start times a guest could book"),
  total: z.number().int().describe("Start times the sittings offer that date"),
});

export const ReservationCalendarOutputSchema = z.object({
  timeZone: z.string(),
  days: z.array(CalendarDaySchema),
});

export type CalendarDay = z.infer<typeof CalendarDaySchema>;
