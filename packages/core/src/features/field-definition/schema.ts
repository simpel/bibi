import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldKindSchema } from "./field-kinds";

export const FieldDefinitionSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  entityTypeId: z.string(),
  key: z.string(),
  name: z.string(),
  kind: FieldKindSchema,
  required: z.boolean(),
  vocabularyId: z.string().nullable(),
  options: z.array(z.string()),
  position: z.number().int(),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const FieldKeySchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]{0,39}$/, "Lowercase letters, digits and _, starting with a letter")
  .describe("Stable key of the value in `fields` JSON. Generated from the name if omitted.");

const OptionsSchema = z
  .array(z.string().trim().min(1).max(100))
  .max(100)
  .refine((options) => new Set(options).size === options.length, "Options must be unique")
  .describe("Inline values of a CHOICE/MULTI_CHOICE field, when it does not use a list");

export const FieldDefinitionCreateInputSchema = z.object({
  entityTypeId: z.string().min(1).describe("Id of the type the field belongs to"),
  name: z.string().trim().min(1).max(100).describe("Field name as staff see it, e.g. Yta m²"),
  key: FieldKeySchema.optional(),
  kind: FieldKindSchema,
  required: z.boolean().optional(),
  vocabularyId: z.string().min(1).optional().describe("List the choice values come from"),
  options: OptionsSchema.optional(),
  position: z.number().int().min(0).optional().describe("Order on the type; defaults to last"),
});

export const FieldDefinitionUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(100).optional(),
  kind: FieldKindSchema.optional().describe("Refused while items have a value for the field"),
  required: z.boolean().optional(),
  vocabularyId: z.string().min(1).nullable().optional(),
  options: OptionsSchema.optional(),
  position: z.number().int().min(0).optional(),
});

export const FieldDefinitionIdInputSchema = z.object({ id: z.string().min(1) });

export const FieldDefinitionListInputSchema = z.object({
  entityTypeId: z.string().optional().describe("Only fields of this type"),
  ...PageInputShape,
});

export const FieldDefinitionListOutputSchema = z.object({
  items: z.array(FieldDefinitionSchema),
  nextCursor: z.string().nullable(),
});

export type FieldDefinitionDto = z.infer<typeof FieldDefinitionSchema>;
export type FieldDefinitionCreateInput = z.infer<typeof FieldDefinitionCreateInputSchema>;
export type FieldDefinitionUpdateInput = z.infer<typeof FieldDefinitionUpdateInputSchema>;
