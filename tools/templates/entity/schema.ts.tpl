import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";

// The {{Pascal}} entity. Fields and status values per docs/domain-model.md.
// TODO: add domain fields. Every row has organizationId and audit fields (ADR 0006).
export const {{Pascal}}Schema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const {{Pascal}}CreateInputSchema = z.object({
  name: z.string().trim().min(1).max(100).describe("TODO: describe the name for the AI assistant"),
});

export const {{Pascal}}UpdateInputSchema = {{Pascal}}CreateInputSchema.partial().extend({
  id: z.string().min(1),
});

export const {{Pascal}}IdInputSchema = z.object({ id: z.string().min(1) });

export const {{Pascal}}ListInputSchema = z.object(PageInputShape);

export const {{Pascal}}ListOutputSchema = z.object({
  items: z.array({{Pascal}}Schema),
  nextCursor: z.string().nullable(),
});

export type {{Pascal}}Dto = z.infer<typeof {{Pascal}}Schema>;
export type {{Pascal}}CreateInput = z.infer<typeof {{Pascal}}CreateInputSchema>;
