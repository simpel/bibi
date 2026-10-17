import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldValuesSchema } from "../field-definition/field-values-schema";

/** `Occupancy.sourceType` of the occupancies a program item holds. */
export const PROGRAM_ITEM_SOURCE = "programItem";

export const ProgramItemSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  bookingId: z.string(),
  entityTypeId: z.string(),
  name: z.string(),
  startsAt: z.date(),
  endsAt: z.date(),
  itemId: z.string().nullable(),
  setupId: z.string().nullable(),
  quantity: z.number().int().nullable(),
  note: z.string().nullable(),
  fields: FieldValuesSchema,
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const ProgramItemDetailsShape = {
  name: z.string().trim().min(1).max(200).describe("What happens, e.g. Morning session or Lunch"),
  startsAt: z.coerce.date().describe("Start, ISO 8601"),
  endsAt: z.coerce.date().describe("End (after the start, exclusive), ISO 8601"),
  itemId: z
    .string()
    .min(1)
    .nullish()
    .describe("Id of the bookable item it is held in (item.list behaviour BOOKABLE); occupies it"),
  setupId: z
    .string()
    .min(1)
    .nullish()
    .describe("Id of one of the item's setups (needs itemId); adds its changeover time before"),
  quantity: z.number().int().min(0).max(100_000).nullish().describe("How many take part"),
  note: z.string().trim().max(1000).nullish().describe("Internal note"),
};

export const ProgramItemCreateInputSchema = z.object({
  bookingId: z.string().min(1).describe("Id of the booking (booking.list)"),
  entityTypeId: z
    .string()
    .min(1)
    .describe("Id of the program item type (entityType.list base PROGRAM_ITEM)"),
  ...ProgramItemDetailsShape,
  fields: FieldValuesSchema.optional().describe("Values of the type's own fields, by field key"),
});

export const ProgramItemUpdateInputSchema = z
  .object(ProgramItemDetailsShape)
  .partial()
  .extend({
    id: z.string().min(1),
    fields: FieldValuesSchema.optional().describe(
      "Changed field values by key; other fields are kept. null clears a value.",
    ),
  });

export const ProgramItemIdInputSchema = z.object({ id: z.string().min(1) });

export const ProgramItemListInputSchema = z.object({
  bookingId: z.string().optional().describe("Only the program of this booking"),
  itemId: z.string().optional().describe("Only program items held in this item"),
  from: z.coerce.date().optional().describe("Only program items that end after this time"),
  to: z.coerce.date().optional().describe("Only program items that start before this time"),
  ...PageInputShape,
});

export const ProgramItemListOutputSchema = z.object({
  items: z.array(ProgramItemSchema),
  nextCursor: z.string().nullable(),
});

export type ProgramItemDto = z.infer<typeof ProgramItemSchema>;
export type ProgramItemCreateInput = z.infer<typeof ProgramItemCreateInputSchema>;
export type ProgramItemUpdateInput = z.infer<typeof ProgramItemUpdateInputSchema>;
