import { z } from "zod";
import {
  BufferMinutesShape,
  bufferMinutesInputShape,
  EffectiveBuffersShape,
} from "../../shared/buffers";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldValuesSchema } from "../field-definition/field-values-schema";
import { PriceEffectSchema } from "../item/customisation-group-schema";
import { LineEffectiveShape } from "./effective-schema";
import { LineRecordSchema } from "./record-schema";
import { LineWarningsShape } from "./warning-schema";

export { LineRecordSchema };

/**
 * A line with its effective quantity, price, discount, VAT and buffers and where each comes from,
 * and its derived warnings.
 */
export const LineSchema = LineRecordSchema.extend(LineEffectiveShape)
  .extend(EffectiveBuffersShape)
  .extend(LineWarningsShape);

const LineDetailsShape = {
  name: z.string().trim().min(1).max(200).describe("What happens, e.g. Morning session or Lunch"),
  startsAt: z.coerce
    .date()
    .nullish()
    .describe("Start, ISO 8601; leave out (or null) with endsAt for an untimed line, e.g. a fee"),
  endsAt: z.coerce
    .date()
    .nullish()
    .describe("End (after the start, exclusive), ISO 8601; null with startsAt = untimed"),
  itemId: z
    .string()
    .min(1)
    .nullish()
    .describe(
      "Id of the item (item.list), e.g. a room or a dish. It starts in the item type's initial " +
        "state; a bookable item is held as that state says",
    ),
  setupId: z
    .string()
    .min(1)
    .nullish()
    .describe("Id of one of the item's setups (needs itemId); its changeover is the least setup"),
  ...bufferMinutesInputShape({ inherits: "the item's, else its type's" }),
  quantity: z
    .number()
    .int()
    .min(0)
    .max(100_000)
    .nullish()
    .describe("How many; null = the ticket's headcount (guaranteed if set, else estimated)"),
  unitPriceMinor: z
    .number()
    .int()
    .min(0)
    .max(1_000_000_000)
    .nullish()
    .describe("Unit price override in minor units (1/100 kr); null = the price list or item"),
  discountPercent: z
    .number()
    .min(0)
    .max(100)
    .multipleOf(0.01)
    .nullish()
    .describe("Discount override in percent, e.g. 10; null = the customer's price list"),
  vatRatePercent: z
    .number()
    .int()
    .min(0)
    .max(100)
    .nullish()
    .describe("VAT rate override in percent; null = the item's, else the venue's default"),
  note: z.string().trim().max(1000).nullish().describe("Internal note"),
};

export const LineCreateInputSchema = z.object({
  ticketId: z.string().min(1).describe("Id of the ticket (ticket.list)"),
  entityTypeId: z.string().min(1).describe("Id of the line type (entityType.list base LINE)"),
  ...LineDetailsShape,
  fields: FieldValuesSchema.optional().describe("Values of the type's own fields, by field key"),
});

export const LineUpdateInputSchema = z
  .object(LineDetailsShape)
  .partial()
  .extend({
    id: z.string().min(1),
    fields: FieldValuesSchema.optional().describe(
      "Changed field values by key; other fields are kept. null clears a value.",
    ),
  });

export const LineChangeStateInputSchema = z.object({
  lineId: z.string().min(1).describe("Id of the line (line.list)"),
  stateId: z
    .string()
    .min(1)
    .describe("Id of a state of the line's item type (itemState.list entityTypeId)"),
});

export const LineFollowPhaseInputSchema = z.object({
  lineId: z.string().min(1).describe("Id of the line (line.list)"),
});

export const LineIdInputSchema = z.object({ id: z.string().min(1) });

export type LineRecord = z.infer<typeof LineRecordSchema>;
export type LineDto = z.infer<typeof LineSchema>;
export type LineCreateInput = z.infer<typeof LineCreateInputSchema>;
export type LineUpdateInput = z.infer<typeof LineUpdateInputSchema>;
