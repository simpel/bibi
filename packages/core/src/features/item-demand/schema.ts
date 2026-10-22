import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { PoolTargetShape } from "../item/pool-schema";

/** The line windows a demanded unit is held for (ADR 0059). */
export const DEMAND_WINDOWS = ["SETUP", "BOOKING", "TEARDOWN"] as const;
export type DemandWindow = (typeof DEMAND_WINDOWS)[number];

export const DemandWindowSchema = z
  .enum(DEMAND_WINDOWS)
  .describe("SETUP: the line's setup buffer; BOOKING: the line's own time; TEARDOWN: its teardown");

const WindowsSchema = z
  .array(DemandWindowSchema)
  .min(1)
  .max(DEMAND_WINDOWS.length)
  .refine((list) => new Set(list).size === list.length, "Windows must be unique")
  .describe("The windows of every line booking the item that each unit is held for");

export const ItemDemandSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  itemId: z.string().describe("The item that needs the units"),
  targetItemId: z.string().nullable().describe("A specific item; null for a pool"),
  entityTypeId: z.string().nullable().describe("The pool's item type; null for a specific item"),
  tagValueIds: z.array(z.string()).describe("Pool only: list values every unit carries"),
  required: z.boolean().describe("true = mandatory: met only when a unit is allocated"),
  quantity: z.number().int().describe("How many units each line needs"),
  windows: z.array(DemandWindowSchema),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const QuantitySchema = z.number().int().min(1).max(100).describe("How many units each line needs");
const RequiredSchema = z
  .boolean()
  .describe("true = mandatory (a line is refused when no unit is free), false = optional");

export const ItemDemandCreateInputSchema = z.object({
  itemId: z.string().min(1).describe("The item that needs the units (item.list)"),
  targetItemId: PoolTargetShape.itemId,
  entityTypeId: PoolTargetShape.entityTypeId,
  tagValueIds: PoolTargetShape.tagValueIds,
  required: RequiredSchema.default(true),
  quantity: QuantitySchema.default(1),
  windows: WindowsSchema,
});

export const ItemDemandUpdateInputSchema = z.object({
  id: z.string().min(1),
  tagValueIds: PoolTargetShape.tagValueIds.unwrap().optional().describe("Replaces the tags"),
  required: RequiredSchema.optional(),
  quantity: QuantitySchema.optional(),
  windows: WindowsSchema.optional(),
});

export const ItemDemandIdInputSchema = z.object({ id: z.string().min(1) });

export const ItemDemandListInputSchema = z.object({
  itemId: z.string().min(1).describe("The needing item"),
  ...PageInputShape,
});

export const ItemDemandListOutputSchema = z.object({
  items: z.array(ItemDemandSchema),
  nextCursor: z.string().nullable(),
});

export type ItemDemandDto = z.infer<typeof ItemDemandSchema>;
export type ItemDemandCreateInput = z.infer<typeof ItemDemandCreateInputSchema>;
export type ItemDemandUpdateInput = z.infer<typeof ItemDemandUpdateInputSchema>;
