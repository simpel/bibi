import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";

/** A heading the organization browses its item types under (ADR 0101), e.g. Spaces or Food. */
export const ItemTypeGroupSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  /** Order among the groups (0 = first). */
  position: z.number().int(),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const ItemTypeGroupNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .describe("Group name as staff see it, e.g. Spaces, Food or Extras");

export const ItemTypeGroupCreateInputSchema = z.object({ name: ItemTypeGroupNameSchema });

export const ItemTypeGroupUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: ItemTypeGroupNameSchema.optional(),
});

export const ItemTypeGroupIdInputSchema = z.object({ id: z.string().min(1) });

export const ItemTypeGroupListInputSchema = z.object({ ...PageInputShape });

export const ItemTypeGroupReorderInputSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).describe("Every active group id once, in the new order"),
});

export const ItemTypeGroupListOutputSchema = z.object({
  items: z.array(ItemTypeGroupSchema),
  nextCursor: z.string().nullable(),
});

export type ItemTypeGroupDto = z.infer<typeof ItemTypeGroupSchema>;
export type ItemTypeGroupCreateInput = z.infer<typeof ItemTypeGroupCreateInputSchema>;
export type ItemTypeGroupUpdateInput = z.infer<typeof ItemTypeGroupUpdateInputSchema>;
