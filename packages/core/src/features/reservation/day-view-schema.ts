import { z } from "zod";
import { PlainDateStringSchema } from "../../time/plain-date-schema";
import { LayoutSchema } from "../floor-plan/layout-schema";
import { TableBlockSchema } from "../table-block/schema";
import { ReservationListOutputSchema } from "./schema";

export const ReservationDayViewInputSchema = z.object({
  roomItemId: z.string().min(1).optional().describe("The dining room; omitted = the first by name"),
  date: PlainDateStringSchema.describe("The local date in the room's zone"),
});

/** One sitting as it runs that day: the day's exception already applied. */
export const DaySittingSchema = z.object({
  id: z.string(),
  name: z.string(),
  layoutId: z.string(),
  firstStartMinute: z.number().int(),
  lastStartMinute: z.number().int(),
  slotMinutes: z.number().int(),
  maxCoversPerSlot: z.number().int().nullable(),
  closed: z.boolean().describe("Closed that day by an exception"),
});

/**
 * The Reservations screen in one read (ADR 0071, 0097, 0119): the rooms to pick from, the chosen
 * room's day (sittings with that day's exceptions, their layouts, reservations with totals,
 * blocks) and the list values needs are counted against. Other features' fields are null or
 * empty without their read permission (item names, layouts: item:read; need values:
 * configuration:read).
 */
export const ReservationDayViewSchema = z.object({
  rooms: z.array(
    z.object({
      itemId: z.string(),
      name: z.string().nullable().describe("Item name; null without item:read"),
      slug: z.string(),
      timeZone: z.string(),
    }),
  ),
  room: z
    .object({ itemId: z.string(), timeZone: z.string(), from: z.date(), to: z.date() })
    .nullable()
    .describe("The room shown and the day's span; null when no room is set up"),
  sittings: z.array(DaySittingSchema),
  layouts: z
    .array(LayoutSchema)
    .describe("The layouts the day's sittings use; empty without item:read"),
  reservations: ReservationListOutputSchema,
  blocks: z.array(TableBlockSchema),
  needOptions: z
    .array(z.object({ id: z.string(), name: z.string() }))
    .describe('"List: Value" options; empty without configuration:read'),
});

export type ReservationDayView = z.infer<typeof ReservationDayViewSchema>;
