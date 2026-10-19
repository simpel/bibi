import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";

export const SheetDefinitionSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  entityTypeIds: z.array(z.string()).describe("Item types whose items appear on the sheet"),
  fieldIds: z.array(z.string()).describe("Fields of those types shown per item"),
  vocabularyIds: z.array(z.string()).describe("Lists whose requirements are counted"),
  responsibilityId: z.string().describe("The responsibility the sheet goes to"),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const NameSchema = z.string().trim().min(1).max(100);
const IdsSchema = z.array(z.string().min(1)).max(100);

export const SheetDefinitionCreateInputSchema = z.object({
  name: NameSchema.describe("Sheet name as staff see it, e.g. Kitchen order or Brewing order"),
  entityTypeIds: IdsSchema.default([]).describe(
    "Ids of item types (entityType.list, base ITEM) whose items appear on the sheet",
  ),
  fieldIds: IdsSchema.default([]).describe(
    "Ids of fields (fieldDefinition.list) of those item types, shown per item",
  ),
  vocabularyIds: IdsSchema.default([]).describe(
    "Ids of lists (vocabulary.list) whose requirements are counted on the sheet",
  ),
  responsibilityId: z
    .string()
    .min(1)
    .describe("Id of the responsibility (responsibility.list) that receives the sheet"),
});

export const SheetDefinitionUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: NameSchema.optional(),
  entityTypeIds: IdsSchema.optional().describe("Replaces the item types"),
  fieldIds: IdsSchema.optional().describe("Replaces the fields"),
  vocabularyIds: IdsSchema.optional().describe("Replaces the lists"),
  responsibilityId: z
    .string()
    .min(1)
    .optional()
    .describe("The responsibility that receives the sheet"),
});

export const SheetDefinitionIdInputSchema = z.object({ id: z.string().min(1) });

export const SheetDefinitionListInputSchema = z.object(PageInputShape);

export const SheetDefinitionListOutputSchema = z.object({
  items: z.array(SheetDefinitionSchema),
  nextCursor: z.string().nullable(),
});

export type SheetDefinitionDto = z.infer<typeof SheetDefinitionSchema>;
export type SheetDefinitionCreateInput = z.infer<typeof SheetDefinitionCreateInputSchema>;
export type SheetDefinitionUpdateInput = z.infer<typeof SheetDefinitionUpdateInputSchema>;

/** What a definition includes and where it goes: checked together by `checkSheetContents`. */
export type SheetDefinitionContents = Pick<
  SheetDefinitionDto,
  "entityTypeIds" | "fieldIds" | "vocabularyIds" | "responsibilityId"
>;
