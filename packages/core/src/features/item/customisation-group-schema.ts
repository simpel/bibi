import { z } from "zod";

/** Max picks and options in one customisation group; a group can never offer more than 100 items. */
const MAX_OPTIONS = 100;

export const PRICE_EFFECTS = ["INCLUDED", "EXTRA", "REPLACES"] as const;

export const PriceEffectSchema = z
  .enum(PRICE_EFFECTS)
  .describe(
    "What choosing the option does to the price (ADR 0059). INCLUDED: in the item's price, the " +
      "option adds nothing. EXTRA: charged on top at the option's own price. REPLACES: the " +
      "option's price replaces the item's price.",
  );

export const ItemCustomisationOptionSchema = z.object({
  itemId: z.string().min(1).describe("Id of the item offered as the option (item.list)"),
  priceEffect: PriceEffectSchema,
});

export const ItemCustomisationGroupSchema = z.object({
  name: z.string().trim().min(1).max(200).describe("Name of the group, e.g. 'Installation'"),
  minPick: z
    .number()
    .int()
    .min(0)
    .max(MAX_OPTIONS)
    .describe("Fewest options to pick; 0 = the group can be skipped"),
  maxPick: z
    .number()
    .int()
    .min(1)
    .max(MAX_OPTIONS)
    .describe("Most options to pick; at least minPick and at most the number of options"),
  options: z
    .array(ItemCustomisationOptionSchema)
    .min(1)
    .max(MAX_OPTIONS)
    .describe(
      "The options, in order: other items, each with its price effect. An item is an option in " +
        "at most one group of the same item. Opting out is an option too (e.g. 'Self-install').",
    ),
});

export const CustomisationGroupsInputSchema = z
  .array(ItemCustomisationGroupSchema)
  .max(50)
  .describe(
    "CUSTOMISATIONS: the item's customisation groups (on any item, not only bundles). Replaces " +
      "the whole set. Options are catalog items, or bundles of the item's own customer.",
  );

export type PriceEffect = z.infer<typeof PriceEffectSchema>;
export type ItemCustomisationGroupInput = z.infer<typeof ItemCustomisationGroupSchema>;
