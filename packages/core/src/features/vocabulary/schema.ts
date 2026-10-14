import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { VOCABULARY_TEMPLATE_KEYS } from "../../templates/vocabularies/vocabulary-templates";

export const VocabularyValueSchema = z.object({
  id: z.string(),
  vocabularyId: z.string(),
  name: z.string(),
  position: z.number().int(),
});

export const VocabularySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  /** Active values, ordered by position. */
  values: z.array(VocabularyValueSchema),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const NameSchema = z.string().trim().min(1).max(100);

export const VocabularyCreateInputSchema = z.object({
  name: NameSchema.describe("List name as staff see it, e.g. Allergener or Hamn"),
  values: z.array(NameSchema).max(200).optional().describe("Initial values, in order"),
});

export const VocabularyUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: NameSchema,
});

export const VocabularyIdInputSchema = z.object({ id: z.string().min(1) });

export const VocabularyListInputSchema = z.object(PageInputShape);

export const VocabularyListOutputSchema = z.object({
  items: z.array(VocabularySchema),
  nextCursor: z.string().nullable(),
});

export const VocabularyAddValueInputSchema = z.object({
  vocabularyId: z.string().min(1),
  name: NameSchema,
  position: z.number().int().min(0).optional().describe("Defaults to last"),
});

export const VocabularyUpdateValueInputSchema = z.object({
  id: z.string().min(1).describe("Id of the list value"),
  name: NameSchema.optional(),
  position: z.number().int().min(0).optional(),
});

export const VocabularyArchiveValueInputSchema = z.object({
  id: z.string().min(1).describe("Id of the list value"),
});

export const VocabularyImportTemplateInputSchema = z.object({
  template: z
    .enum(VOCABULARY_TEMPLATE_KEYS)
    .describe("eu-14-allergens: the list Allergener with EU's 14 allergens"),
});

export type VocabularyDto = z.infer<typeof VocabularySchema>;
export type VocabularyValueDto = z.infer<typeof VocabularyValueSchema>;
export type VocabularyCreateInput = z.infer<typeof VocabularyCreateInputSchema>;
