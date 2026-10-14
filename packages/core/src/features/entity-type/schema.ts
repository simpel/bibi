import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldDefinitionSchema } from "../field-definition/schema";
import { EntityBaseSchema, ItemBehaviourSchema, ItemBehavioursSchema } from "./behaviour-kinds";

export const EntityTypeSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  base: EntityBaseSchema,
  name: z.string(),
  behaviours: z.array(ItemBehaviourSchema),
  /** Active fields of the type, in display order. */
  fields: z.array(FieldDefinitionSchema),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const NameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .describe("Type name as staff see it, e.g. Conference room, Dish, Boat or Company");

export const EntityTypeCreateInputSchema = z.object({
  base: EntityBaseSchema,
  name: NameSchema,
  behaviours: ItemBehavioursSchema.optional(),
});

export const EntityTypeUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: NameSchema.optional(),
  behaviours: ItemBehavioursSchema.optional().describe(
    "Replaces all behaviours. Switching one off while items have data for it is refused.",
  ),
});

export const EntityTypeIdInputSchema = z.object({ id: z.string().min(1) });

export const EntityTypeListInputSchema = z.object({
  base: EntityBaseSchema.optional().describe("Only types of this base entity"),
  ...PageInputShape,
});

export const EntityTypeListOutputSchema = z.object({
  items: z.array(EntityTypeSchema),
  nextCursor: z.string().nullable(),
});

export type EntityTypeDto = z.infer<typeof EntityTypeSchema>;
