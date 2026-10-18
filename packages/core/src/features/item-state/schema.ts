import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { HoldKindSchema } from "./hold-kind";

/** The generic boolean state flags (ADR 0044); `hold` is the fourth. */
export const STATE_FLAGS = ["initial", "inSheets", "released", "expires"] as const;

const FlagShape = {
  initial: z.boolean().describe("New lines of the type start here; exactly one state per type"),
  hold: HoldKindSchema.describe(
    "NONE, SOFT (reserves the item without blocking; soft holds may overlap) or HARD (blocks " +
      "the item). SOFT and HARD only for types with BOOKABLE",
  ),
  inSheets: z.boolean().describe("Lines in this state are included in generated sheets"),
  released: z.boolean().describe("Final state: the hold is dropped and nothing leaves it"),
  expires: z
    .boolean()
    .describe("Lines fall to the type's expiry state when the ticket's holdsUntil date passes"),
};

export const ItemStateSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  /** The item type (base `ITEM`) the state belongs to. */
  entityTypeId: z.string(),
  name: z.string(),
  color: z.string(),
  /** Order among the type's states. */
  position: z.number().int(),
  ...FlagShape,
  /** Ids of the states a line may move to from this one (ADR 0044). */
  transitionsTo: z.array(z.string()),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const NameSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .describe("State name as staff see it, e.g. Prebooked, Booked or Ordered");

const ColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color such as #22c55e")
  .describe("Hex color, e.g. #22c55e");

const OptionalFlags = z.object(FlagShape).partial().shape;

export const ItemStateCreateInputSchema = z.object({
  entityTypeId: z.string().min(1).describe("Id of the item type (entityType.list base ITEM)"),
  name: NameSchema,
  color: ColorSchema,
  ...OptionalFlags,
});

export const ItemStateUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: NameSchema.optional(),
  color: ColorSchema.optional(),
  ...OptionalFlags,
});

export const ItemStateIdInputSchema = z.object({ id: z.string().min(1) });

export const ItemStateArchiveInputSchema = z.object({
  id: z.string().min(1),
  targetStateId: z
    .string()
    .min(1)
    .optional()
    .describe("A state of the same type the state's lines move to; required when lines use it"),
});

export const ItemStateListInputSchema = z.object({
  entityTypeId: z.string().optional().describe("Only the states of this item type"),
  ...PageInputShape,
});

export const ItemStateListOutputSchema = z.object({
  items: z.array(ItemStateSchema),
  nextCursor: z.string().nullable(),
});

export const ItemStateReorderInputSchema = z.object({
  entityTypeId: z.string().min(1).describe("The item type whose states are reordered"),
  ids: z.array(z.string().min(1)).min(1).describe("Every active state id of the type, in order"),
});

export const ItemStateSetTransitionsInputSchema = z.object({
  id: z.string().min(1).describe("The state the transitions start from"),
  toStateIds: z
    .array(z.string().min(1))
    .describe("Every state of the same type a line may move to from this one; replaces the set"),
});

export type ItemStateDto = z.infer<typeof ItemStateSchema>;
export type ItemStateFlags = Pick<ItemStateDto, (typeof STATE_FLAGS)[number] | "hold">;
export type ItemStateCreateInput = z.infer<typeof ItemStateCreateInputSchema>;
export type ItemStateUpdateInput = z.infer<typeof ItemStateUpdateInputSchema>;
