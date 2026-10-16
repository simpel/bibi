import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldValuesSchema } from "../field-definition/field-values-schema";

export const RequirementSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  bookingId: z.string(),
  programItemId: z
    .string()
    .nullable()
    .describe("The program item it applies to; null = the whole booking"),
  entityTypeId: z.string(),
  vocabularyValueId: z.string().describe("The list value counted, e.g. Gluten"),
  quantity: z.number().int(),
  fields: FieldValuesSchema,
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const QuantitySchema = z
  .number()
  .int()
  .min(0)
  .max(100_000)
  .describe(
    "How many, e.g. 3 guests. On a program item it replaces the booking's count for the value " +
      "there; 0 means none there.",
  );

export const RequirementCreateInputSchema = z.object({
  bookingId: z.string().min(1).describe("Id of the booking (booking.list)"),
  programItemId: z
    .string()
    .min(1)
    .nullish()
    .describe("Id of one of the booking's program items (programItem.list); omit for the booking"),
  entityTypeId: z
    .string()
    .min(1)
    .describe("Id of the requirement type (entityType.list base REQUIREMENT)"),
  vocabularyValueId: z
    .string()
    .min(1)
    .describe("Id of a value in one of the organization's lists (vocabulary.list values)"),
  quantity: QuantitySchema,
  fields: FieldValuesSchema.optional().describe("Values of the type's own fields, by field key"),
});

export const RequirementUpdateInputSchema = z.object({
  id: z.string().min(1),
  quantity: QuantitySchema.optional(),
  fields: FieldValuesSchema.optional().describe(
    "Changed field values by key; other fields are kept. null clears a value.",
  ),
});

export const RequirementIdInputSchema = z.object({ id: z.string().min(1) });

export const RequirementListInputSchema = z.object({
  bookingId: z.string().optional().describe("Only requirements on this booking (both levels)"),
  programItemId: z.string().optional().describe("Only requirements on this program item"),
  vocabularyValueId: z.string().optional().describe("Only requirements for this list value"),
  ...PageInputShape,
});

export const RequirementListOutputSchema = z.object({
  items: z.array(RequirementSchema),
  nextCursor: z.string().nullable(),
});

export type RequirementDto = z.infer<typeof RequirementSchema>;
export type RequirementCreateInput = z.infer<typeof RequirementCreateInputSchema>;
export type RequirementUpdateInput = z.infer<typeof RequirementUpdateInputSchema>;
