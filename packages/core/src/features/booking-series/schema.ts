import { z } from "zod";
import { DEFAULT_SERIES_TIME_ZONE } from "../../recurrence/expand-occurrences-schema";
import { isValidTimeZone } from "../../recurrence/zoned-time";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldValuesSchema } from "../field-definition/field-values-schema";
import { RruleInputSchema } from "./rrule-input-schema";

/** What every occurrence gets (ADR 0023). Stored as JSON on the series. */
export const BookingSeriesTemplateSchema = z.object({
  itemIds: z.array(z.string()),
  setupId: z.string().nullable(),
  estimatedHeadcount: z.number().int().nullable(),
  salesOwnerId: z.string().nullable(),
  coordinatorId: z.string().nullable(),
  fields: FieldValuesSchema,
});

/** One generated booking of a series. */
export const SeriesOccurrenceSchema = z.object({
  bookingId: z.string(),
  reference: z.number().int(),
  /** 1-based position in the series. */
  occurrenceIndex: z.number().int(),
  startsAt: z.date(),
  endsAt: z.date(),
  bookingStatusId: z.string(),
  /** The template's items could not be occupied; pick another item or time. */
  clash: z.boolean(),
});

export const BookingSeriesSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  entityTypeId: z.string(),
  customerId: z.string(),
  /** RRULE subset (ADR 0023), e.g. `FREQ=MONTHLY;BYDAY=1TU;COUNT=10`. */
  rule: z.string(),
  startsAt: z.date(),
  durationMinutes: z.number().int(),
  timeZone: z.string(),
  template: BookingSeriesTemplateSchema,
  /** The rule continues past the generated 12 months / 52 occurrences. */
  truncated: z.boolean(),
  occurrences: z.array(SeriesOccurrenceSchema),
  /** The occurrences with `clash`, so the user can choose another item or time for them. */
  clashes: z.array(SeriesOccurrenceSchema),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const HeadcountSchema = z.number().int().min(0).max(100_000);
const IdSchema = z.string().min(1);

export const BookingSeriesCreateInputSchema = z.object({
  entityTypeId: IdSchema.describe("Id of the booking type (entityType.list base BOOKING)"),
  customerId: IdSchema.describe("Id of the customer who orders (customer.list)"),
  rule: RruleInputSchema,
  startsAt: z.coerce.date().describe("Start of the first occurrence, ISO 8601"),
  durationMinutes: z
    .number()
    .int()
    .min(1)
    .max(7 * 24 * 60)
    .describe("Length of every occurrence in minutes"),
  timeZone: z
    .string()
    .refine((timeZone) => isValidTimeZone({ timeZone }), "Unknown time zone")
    .default(DEFAULT_SERIES_TIME_ZONE)
    .describe("IANA time zone whose wall time every occurrence keeps"),
  itemIds: z
    .array(IdSchema)
    .max(10)
    .default([])
    .describe("Bookable items every occurrence occupies, e.g. a room (item.list BOOKABLE)"),
  setupId: IdSchema.nullish().describe("Setup of the items; its changeover time is occupied too"),
  estimatedHeadcount: HeadcountSchema.nullish().describe("Estimated number of guests"),
  salesOwnerId: IdSchema.nullish().describe("User id of the salesperson (member.list userId)"),
  coordinatorId: IdSchema.nullish().describe("User id of the coordinator (member.list userId)"),
  fields: FieldValuesSchema.optional().describe("Values of the type's own fields, by field key"),
});

export const BookingSeriesIdInputSchema = z.object({ id: IdSchema });

export const BookingSeriesListInputSchema = z.object({
  customerId: z.string().optional().describe("Only series of this customer"),
  ...PageInputShape,
});

export const BookingSeriesListOutputSchema = z.object({
  items: z.array(BookingSeriesSchema),
  nextCursor: z.string().nullable(),
});

export type BookingSeriesTemplate = z.infer<typeof BookingSeriesTemplateSchema>;
export type SeriesOccurrenceDto = z.infer<typeof SeriesOccurrenceSchema>;
export type BookingSeriesDto = z.infer<typeof BookingSeriesSchema>;
export type BookingSeriesCreateInput = z.infer<typeof BookingSeriesCreateInputSchema>;
