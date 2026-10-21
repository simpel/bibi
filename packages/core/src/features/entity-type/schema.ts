import { z } from "zod";
import { BufferMinutesShape, bufferMinutesInputShape } from "../../shared/buffers";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldDefinitionSchema } from "../field-definition/schema";
import { EntityBaseSchema, ItemCapabilitiesSchema, ItemCapabilitySchema } from "./capability-kinds";

export const EntityTypeSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  base: EntityBaseSchema,
  name: z.string(),
  capabilities: z.array(ItemCapabilitySchema),
  /** Item types: the state lines in an `expires` state fall to when `holdsUntil` passes. */
  expiryStateId: z.string().nullable(),
  /** Item types: default buffers around a booking (ADR 0059); items and lines override them. */
  ...BufferMinutesShape,
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

/** Item types only: the default buffers of the type's items (ADR 0059). */
const TypeBufferInputShape = bufferMinutesInputShape({ inherits: "none (item types only)" });

export const EntityTypeCreateInputSchema = z.object({
  base: EntityBaseSchema,
  name: NameSchema,
  capabilities: ItemCapabilitiesSchema.optional(),
  ...TypeBufferInputShape,
});

export const EntityTypeUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: NameSchema.optional(),
  capabilities: ItemCapabilitiesSchema.optional().describe(
    "Replaces all capabilities. Switching one off while items have data for it is refused.",
  ),
  expiryStateId: z
    .string()
    .min(1)
    .nullable()
    .optional()
    .describe(
      "Item types: the state (itemState.list) lines in an expiring state fall to when the " +
        "ticket's holdsUntil date passes; null clears it",
    ),
  ...TypeBufferInputShape,
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
