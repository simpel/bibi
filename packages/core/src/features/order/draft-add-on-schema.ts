import { z } from "zod";
import { LineCreateInputSchema } from "../line/schema";

const { shape } = LineCreateInputSchema;

/**
 * An add-on under a draft line (ADR 0088 decision 11): what `line.create` with `parentLineId`
 * would get, without its order and parent. Written as a line with role ADD_ON under the draft
 * line, checked as `line.create` checks an add-on.
 */
export const DraftAddOnSchema = z.object({
  itemId: shape.itemId,
  name: shape.name
    .optional()
    .describe(
      "What it is, e.g. Projector; leave out to use the item's name (an item is then needed)",
    ),
  entityTypeId: shape.entityTypeId
    .optional()
    .describe("Id of the line type (entityType.list base LINE); leave out for the parent's type"),
  quantity: shape.quantity.describe("How many; leave out (or null) for the parent line's quantity"),
  unitPriceMinor: shape.unitPriceMinor.describe(
    "Unit price override in minor units; null = the customer's price list, else the item's " +
      "price (the parent's discount does not apply)",
  ),
  discountPercent: shape.discountPercent,
  startsAt: shape.startsAt.describe(
    "Start, ISO 8601; leave out with endsAt for the parent line's period",
  ),
  endsAt: shape.endsAt.describe("End, ISO 8601; leave out with startsAt for the parent's period"),
  note: shape.note,
});

export const DraftAddOnsSchema = z
  .array(DraftAddOnSchema)
  .max(50)
  .optional()
  .describe(
    "Add-ons under the line (ADR 0088): any item or free text sold with it at its own " +
      "effective price, booked and held like any line; the same item may appear more than once",
  );

export type DraftAddOn = z.infer<typeof DraftAddOnSchema>;
