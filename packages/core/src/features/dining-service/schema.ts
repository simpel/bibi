import { z } from "zod";
import { PlainDateStringSchema } from "../../time/plain-date-schema";

const Minute = z.number().int().min(0).max(1439);
const Weekday = z.number().int().min(0).max(6);

/** How long a party keeps its table: up to this many people, this many minutes. */
export const TurnTimeSchema = z.object({
  upToParty: z.number().int().min(1).max(100),
  minutes: z.number().int().min(15).max(600),
});

const TurnTimesSchema = z
  .array(TurnTimeSchema)
  .min(1)
  .max(10)
  .refine(
    (rows) => rows.every((row, i) => i === 0 || row.upToParty > (rows[i - 1]?.upToParty ?? 0)),
    {
      message: "Party sizes must grow row by row",
    },
  )
  .describe("Ordered rows; the last row also covers larger parties");

const ServiceFields = {
  name: z.string().trim().min(1).max(80).describe("e.g. Lunch, Dinner"),
  layoutId: z
    .string()
    .min(1)
    .describe("A layout of the room (layout.get); its seated pieces are the tables"),
  weekdays: z
    .array(Weekday)
    .min(1)
    .max(7)
    .refine((days) => new Set(days).size === days.length, { message: "A weekday twice" })
    .describe("0 = Monday … 6 = Sunday"),
  firstStartMinute: Minute.describe("First start guests can book, minutes after local midnight"),
  lastStartMinute: Minute.describe("Last start guests can book, minutes after local midnight"),
  validFrom: z.coerce.date().nullable().describe("Season start (instant); null = open-ended"),
  validUntil: z.coerce.date().nullable().describe("Season end (instant); null = open-ended"),
  slotMinutes: z.number().int().min(5).max(120).describe("Minutes between bookable starts"),
  turnTimes: TurnTimesSchema,
  maxCoversPerSlot: z
    .number()
    .int()
    .min(1)
    .nullable()
    .describe("The most new guests starting in one slot; null = no limit"),
  minMinutesAhead: z
    .number()
    .int()
    .min(0)
    .max(43_200)
    .describe("Guests book at least this far ahead"),
  maxDaysAhead: z
    .number()
    .int()
    .min(1)
    .max(730)
    .describe("Guests book at most this many days ahead"),
  changeCutoffMinutes: z
    .number()
    .int()
    .min(0)
    .max(10_080)
    .describe("Guests change or cancel up to this many minutes before the start"),
  maxOnlineParty: z.number().int().min(1).max(100).describe("The largest party guests book online"),
  depositFromParty: z.number().int().min(1).nullable().describe("Deposit from this party size"),
  depositPerCoverMinor: z
    .number()
    .int()
    .min(1)
    .nullable()
    .describe("Deposit per person in minor units (öre); null with depositFromParty = none"),
};

/** A sitting (ADR 0119): when a dining room takes table bookings. */
export const DiningServiceSchema = z.object({
  id: z.string(),
  roomItemId: z.string().describe("The dining room's item (item.get)"),
  ...ServiceFields,
  validFrom: z.date().nullable(),
  validUntil: z.date().nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
});

export const DiningServiceListInputSchema = z.object({
  roomItemId: z.string().min(1).optional().describe("Only this room's sittings"),
});

export const DiningServiceListOutputSchema = z.object({ items: z.array(DiningServiceSchema) });

export const DiningServiceIdInputSchema = z.object({ id: z.string().min(1) });

export const DiningServiceCreateInputSchema = z.object({
  roomItemId: z.string().min(1).describe("A room set up with diningRoom.set"),
  ...ServiceFields,
  validFrom: ServiceFields.validFrom.optional().default(null),
  validUntil: ServiceFields.validUntil.optional().default(null),
  slotMinutes: ServiceFields.slotMinutes.optional().default(15),
  maxCoversPerSlot: ServiceFields.maxCoversPerSlot.optional().default(null),
  minMinutesAhead: ServiceFields.minMinutesAhead.optional().default(120),
  maxDaysAhead: ServiceFields.maxDaysAhead.optional().default(60),
  changeCutoffMinutes: ServiceFields.changeCutoffMinutes.optional().default(180),
  maxOnlineParty: ServiceFields.maxOnlineParty.optional().default(8),
  depositFromParty: ServiceFields.depositFromParty.optional().default(null),
  depositPerCoverMinor: ServiceFields.depositPerCoverMinor.optional().default(null),
});

export const DiningServiceUpdateInputSchema = z
  .object(ServiceFields)
  .partial()
  .extend({ id: z.string().min(1) })
  .describe("Omitted fields are unchanged");

/** One date's change to a sitting. */
export const DiningServiceExceptionSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  date: z.string().describe("YYYY-MM-DD in the room's zone"),
  closed: z.boolean(),
  firstStartMinute: Minute.nullable(),
  lastStartMinute: Minute.nullable(),
  layoutId: z.string().nullable(),
  maxCoversPerSlot: z.number().int().nullable(),
  note: z.string().nullable(),
});

export const DiningServiceExceptionListInputSchema = z.object({
  serviceId: z.string().min(1),
  from: PlainDateStringSchema.optional().describe("First date, inclusive"),
  to: PlainDateStringSchema.optional().describe("Last date, inclusive"),
});

export const DiningServiceExceptionListOutputSchema = z.object({
  items: z.array(DiningServiceExceptionSchema),
});

export const DiningServiceExceptionSetInputSchema = z.object({
  serviceId: z.string().min(1),
  date: PlainDateStringSchema.describe("The local date it applies to"),
  closed: z.boolean().default(false).describe("The sitting is closed that day"),
  firstStartMinute: Minute.nullable()
    .default(null)
    .describe("Other first start; null = the sitting's"),
  lastStartMinute: Minute.nullable()
    .default(null)
    .describe("Other last start; null = the sitting's"),
  layoutId: z
    .string()
    .min(1)
    .nullable()
    .default(null)
    .describe("Other layout of the room; null = the sitting's"),
  maxCoversPerSlot: z
    .number()
    .int()
    .min(1)
    .nullable()
    .default(null)
    .describe("Other pace; null = the sitting's"),
  note: z.string().trim().max(200).nullable().default(null),
});

export const DiningServiceExceptionDeleteInputSchema = z.object({
  serviceId: z.string().min(1),
  date: PlainDateStringSchema,
});

export type DiningServiceDto = z.infer<typeof DiningServiceSchema>;
export type DiningServiceCreateInput = z.infer<typeof DiningServiceCreateInputSchema>;
export type DiningServiceUpdateInput = z.infer<typeof DiningServiceUpdateInputSchema>;
export type DiningServiceExceptionDto = z.infer<typeof DiningServiceExceptionSchema>;
export type TurnTime = z.infer<typeof TurnTimeSchema>;
