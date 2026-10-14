import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { ItemBehaviourSchema } from "../entity-type/behaviour-kinds";

export const PRICE_UNITS = ["PER_PERSON", "PER_UNIT", "PER_HOUR", "FLAT"] as const;
export const PriceUnitSchema = z.enum(PRICE_UNITS);

export const ItemSetupSchema = z.object({
  setupId: z.string().min(1),
  capacity: z.number().int().positive().max(100_000).describe("Max people in this setup"),
});

/** Max keys in `fields`: well above any type's field count, low enough to bound the input. */
export const MAX_FIELD_VALUES = 200;

/** Field values as stored: keys are the type's field keys. */
export const FieldValuesSchema = z
  .record(z.string().max(40), z.unknown())
  .refine((values) => Object.keys(values).length <= MAX_FIELD_VALUES, {
    message: `At most ${MAX_FIELD_VALUES} field values`,
  });

export const ItemSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  entityTypeId: z.string(),
  venueId: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  fields: FieldValuesSchema,
  priceMinor: z.number().int().nullable(),
  priceUnit: PriceUnitSchema.nullable(),
  vatRatePercent: z.number().int().nullable(),
  defaultDurationMinutes: z.number().int().nullable(),
  setups: z.array(ItemSetupSchema),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const Behaviour = {
  priceMinor: z
    .number()
    .int()
    .min(0)
    .max(1_000_000_000)
    .describe("PRICED: price excl. VAT in minor units (1/100 kr), e.g. 450000 = 4 500 kr"),
  priceUnit: PriceUnitSchema.describe("PRICED: per person, per unit, per hour or flat"),
  vatRatePercent: z.number().int().min(0).max(100).describe("PRICED: null = the venue's default"),
  defaultDurationMinutes: z
    .number()
    .int()
    .positive()
    .max(7 * 24 * 60)
    .describe("BOOKABLE: default booking length in minutes"),
  setups: z
    .array(ItemSetupSchema)
    .max(100)
    .describe("SETUPS: capacity per setup. Replaces the whole set."),
};

export const ItemCreateInputSchema = z.object({
  entityTypeId: z.string().min(1).describe("Id of the item type (entityType.list base ITEM)"),
  venueId: z.string().min(1).nullish().describe("Venue the item belongs to, if any"),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).nullish(),
  fields: FieldValuesSchema.optional().describe("Values of the type's own fields, by field key"),
  priceMinor: Behaviour.priceMinor.nullish(),
  priceUnit: Behaviour.priceUnit.nullish(),
  vatRatePercent: Behaviour.vatRatePercent.nullish(),
  defaultDurationMinutes: Behaviour.defaultDurationMinutes.nullish(),
  setups: Behaviour.setups.optional(),
});

export const ItemUpdateInputSchema = ItemCreateInputSchema.omit({ entityTypeId: true })
  .partial()
  .extend({
    id: z.string().min(1),
    fields: FieldValuesSchema.optional().describe(
      "Changed field values by key; other fields are kept. null clears a value.",
    ),
  });

export const ItemIdInputSchema = z.object({ id: z.string().min(1) });

export const ItemListInputSchema = z.object({
  entityTypeId: z.string().optional().describe("Only items of this type"),
  venueId: z.string().optional().describe("Only items in this venue"),
  behaviour: ItemBehaviourSchema.optional().describe("Only items whose type has this behaviour"),
  ...PageInputShape,
});

export const ItemListOutputSchema = z.object({
  items: z.array(ItemSchema),
  nextCursor: z.string().nullable(),
});

export type ItemDto = z.infer<typeof ItemSchema>;
export type ItemCreateInput = z.infer<typeof ItemCreateInputSchema>;
export type ItemUpdateInput = z.infer<typeof ItemUpdateInputSchema>;
