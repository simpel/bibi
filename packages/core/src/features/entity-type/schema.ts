import { z } from "zod";
import { BufferMinutesShape, bufferMinutesInputShape } from "../../shared/buffers";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { BuyerKindSchema } from "../customer/buyer-kind";
import { FieldDefinitionSchema } from "../field-definition/schema";
import { TaskShapeSchema } from "../task/task-shape";
import {
  EntityBaseSchema,
  ItemCapabilitiesSchema,
  ItemCapabilitySchema,
  ResourceKindSchema,
} from "./capability-kinds";

export const EntityTypeSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  base: EntityBaseSchema,
  name: z.string(),
  /** The name for several of them, e.g. "Conference rooms"; null = use `name`. */
  pluralName: z.string().nullable(),
  capabilities: z.array(ItemCapabilitySchema),
  /** Item types: the state lines in an `expires` state fall to when `holdsUntil` passes. */
  expiryStateId: z.string().nullable(),
  /** Item types: default buffers around a booking (ADR 0059); items and lines override them. */
  ...BufferMinutesShape,
  /** Item types: EQUIPMENT or PERSON (ADR 0059); null on every other base. */
  resourceKind: ResourceKindSchema.nullable(),
  /** Customer types: BUSINESS or PRIVATE, taken by a new customer (ADR 0106); null otherwise. */
  buyerKind: BuyerKindSchema.nullable(),
  /** Task types: MEETING or DEADLINE (ADR 0117); null otherwise. */
  taskShape: TaskShapeSchema.nullable(),
  /** Item types: the group the type is browsed under (ADR 0101); null = ungrouped. */
  groupId: z.string().nullable(),
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

const PluralNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .nullable()
  .optional()
  .describe(
    "The name for several of them, e.g. Conference rooms or Dishes, shown in lists and " +
      "summaries; null = use the name",
  );

const GroupIdSchema = z
  .string()
  .min(1)
  .nullable()
  .optional()
  .describe("Item types only: the group (itemTypeGroup.list) to browse it under; null = ungrouped");

const TypeBuyerKindSchema = BuyerKindSchema.describe(
  "Customer types only: BUSINESS (default) or PRIVATE; a new customer of the type takes it",
);

const TypeTaskShapeSchema = TaskShapeSchema.describe(
  "Task types only (required for them): MEETING (start and end) or DEADLINE (one due time). " +
    "Changing it while the type has active tasks is CONFLICT",
);

/** Item types only: the default buffers of the type's items (ADR 0059). */
const TypeBufferInputShape = bufferMinutesInputShape({ inherits: "none (item types only)" });

export const EntityTypeCreateInputSchema = z.object({
  base: EntityBaseSchema,
  name: NameSchema,
  pluralName: PluralNameSchema,
  capabilities: ItemCapabilitiesSchema.optional(),
  ...TypeBufferInputShape,
  resourceKind: ResourceKindSchema.optional().describe(
    "Item types only: EQUIPMENT (default) or PERSON (ADR 0059)",
  ),
  buyerKind: TypeBuyerKindSchema.optional(),
  taskShape: TypeTaskShapeSchema.optional(),
  groupId: GroupIdSchema,
});

export const EntityTypeUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: NameSchema.optional(),
  pluralName: PluralNameSchema,
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
        "order's holdsUntil date passes; null clears it",
    ),
  ...TypeBufferInputShape,
  resourceKind: ResourceKindSchema.optional(),
  buyerKind: TypeBuyerKindSchema.optional(),
  taskShape: TypeTaskShapeSchema.optional(),
  groupId: GroupIdSchema,
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
