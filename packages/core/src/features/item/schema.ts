import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { ItemCapabilitySchema } from "../entity-type/capability-kinds";
import { FieldValuesSchema } from "../field-definition/field-values-schema";
import {
  CustomisationGroupsInputSchema,
  ItemCustomisationGroupSchema,
} from "./customisation-group-schema";

export const PRICE_UNITS = ["PER_PERSON", "PER_UNIT", "PER_HOUR", "FLAT"] as const;
export const PriceUnitSchema = z.enum(PRICE_UNITS);

export const ItemSetupSchema = z.object({
  setupId: z.string().min(1),
  capacity: z.number().int().positive().max(100_000).describe("Max people in this setup"),
});

export const ItemPartSchema = z.object({
  itemId: z.string().min(1).describe("Id of the part (another item)"),
  quantity: z.number().int().positive().max(100_000).describe("How many of the part"),
  offsetMinutes: z
    .number()
    .int()
    .min(-7 * 24 * 60)
    .max(7 * 24 * 60)
    .describe("Start of the part relative to the start of the parent, in minutes"),
  durationMinutes: z
    .number()
    .int()
    .positive()
    .max(7 * 24 * 60)
    .nullable()
    .describe("Length of the part in minutes; null = the parent's length"),
  required: z.boolean().describe("true = mandatory part, false = optional part"),
});

/** Max levels in a composition, the top item included (ADR 0021). */
export const MAX_PART_DEPTH = 5;

export const ItemSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  entityTypeId: z.string(),
  venueId: z.string().nullable(),
  customerId: z
    .string()
    .nullable()
    .describe("null = catalog item; set = a bundle specific to this customer"),
  name: z.string(),
  description: z.string().nullable(),
  fields: FieldValuesSchema,
  priceMinor: z.number().int().nullable(),
  priceUnit: PriceUnitSchema.nullable(),
  vatRatePercent: z.number().int().nullable(),
  defaultDurationMinutes: z.number().int().nullable(),
  setups: z.array(ItemSetupSchema),
  parts: z.array(ItemPartSchema),
  customisationGroups: z.array(ItemCustomisationGroupSchema),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const Capability = {
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
  parts: z
    .array(
      ItemPartSchema.extend({
        offsetMinutes: ItemPartSchema.shape.offsetMinutes.default(0),
        durationMinutes: ItemPartSchema.shape.durationMinutes.default(null),
        quantity: ItemPartSchema.shape.quantity.default(1),
        required: ItemPartSchema.shape.required.default(true),
      }),
    )
    .max(100)
    .describe(
      `BUNDLE: the parts. Replaces the whole set. No cycles, at most ${MAX_PART_DEPTH} levels.`,
    ),
};

export const ItemCreateInputSchema = z.object({
  entityTypeId: z.string().min(1).describe("Id of the item type (entityType.list base ITEM)"),
  venueId: z.string().min(1).nullish().describe("Venue the item belongs to, if any"),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).nullish(),
  fields: FieldValuesSchema.optional().describe("Values of the type's own fields, by field key"),
  priceMinor: Capability.priceMinor.nullish(),
  priceUnit: Capability.priceUnit.nullish(),
  vatRatePercent: Capability.vatRatePercent.nullish(),
  defaultDurationMinutes: Capability.defaultDurationMinutes.nullish(),
  setups: Capability.setups.optional(),
  parts: Capability.parts.optional(),
  customisationGroups: CustomisationGroupsInputSchema.optional(),
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
  capability: ItemCapabilitySchema.optional().describe("Only items whose type has this capability"),
  customerId: z
    .string()
    .optional()
    .describe("Also list this customer's own bundles. Without it, only the catalog is listed."),
  onlyCustomer: z
    .boolean()
    .optional()
    .describe("With customerId: only that customer's bundles, without the catalog"),
  ...PageInputShape,
});

export const ItemListOutputSchema = z.object({
  items: z.array(ItemSchema),
  nextCursor: z.string().nullable(),
});

export type ItemDto = z.infer<typeof ItemSchema>;
export type ItemCreateInput = z.infer<typeof ItemCreateInputSchema>;
export type ItemUpdateInput = z.infer<typeof ItemUpdateInputSchema>;
