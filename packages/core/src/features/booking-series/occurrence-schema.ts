import { z } from "zod";
import { FieldValuesSchema } from "../field-definition/field-values-schema";
import { HeadcountSchema, IdSchema } from "./schema";

export const OCCURRENCE_SCOPES = ["THIS", "FOLLOWING"] as const;

/** What a change to one or more occurrences sets. Omitted = unchanged, null = cleared. */
export const OccurrencePatchSchema = z
  .object({
    startsAt: z.coerce
      .date()
      .optional()
      .describe(
        "New start of the occurrence at fromIndex, ISO 8601. With FOLLOWING every later " +
          "occurrence moves by the same offset",
      ),
    durationMinutes: z
      .number()
      .int()
      .min(1)
      .max(7 * 24 * 60)
      .optional()
      .describe("New length in minutes"),
    itemIds: z
      .array(IdSchema)
      .max(10)
      .optional()
      .describe("Bookable items to occupy instead, e.g. another room (item.list BOOKABLE)"),
    setupId: IdSchema.nullish().describe("Setup of the items; null = none"),
    estimatedHeadcount: HeadcountSchema.nullish().describe("Estimated number of guests"),
    fields: FieldValuesSchema.optional().describe(
      "Values of the type's own fields, merged by key (null clears a value)",
    ),
  })
  .refine((patch) => Object.values(patch).some((value) => value !== undefined), {
    message: "Give at least one change",
  });

export const BookingSeriesUpdateOccurrencesInputSchema = z.object({
  seriesId: IdSchema.describe("Id of the series (bookingSeries.list)"),
  fromIndex: z
    .number()
    .int()
    .min(1)
    .describe("1-based occurrenceIndex of the occurrence the change starts at"),
  scope: z
    .enum(OCCURRENCE_SCOPES)
    .describe("THIS = only that occurrence, FOLLOWING = it and every later one plus the template"),
  patch: OccurrencePatchSchema,
});

export const BookingSeriesCancelInputSchema = z.object({
  id: IdSchema.describe("Id of the series"),
  reason: z.string().trim().min(1).max(1000).describe("Why the series is cancelled"),
  statusId: IdSchema.optional().describe(
    "Status in the CANCELLED phase the occurrences get; default the phase's first status",
  ),
});

export type OccurrenceScope = (typeof OCCURRENCE_SCOPES)[number];
export type OccurrencePatch = z.infer<typeof OccurrencePatchSchema>;
export type BookingSeriesUpdateOccurrencesInput = z.infer<
  typeof BookingSeriesUpdateOccurrencesInputSchema
>;
export type BookingSeriesCancelInput = z.infer<typeof BookingSeriesCancelInputSchema>;
