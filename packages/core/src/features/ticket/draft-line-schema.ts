import { z } from "zod";
import { ChosenOptionSchema } from "../line/choose-options-schema";
import { LineCreateInputSchema } from "../line/schema";
import { LineRequirementInputSchema } from "../requirement/schema";

/**
 * A draft line: what `line.create` would get, without its ticket (ADR 0081 decision 6). The one
 * shape `ticket.previewLines` plans and `ticket.create` writes, so the two never drift.
 */
export const PreviewDraftLineSchema = LineCreateInputSchema.pick({
  entityTypeId: true,
  name: true,
  itemId: true,
  setupId: true,
  startsAt: true,
  endsAt: true,
  quantity: true,
  unitPriceMinor: true,
  discountPercent: true,
});

/** A draft line as `ticket.create` writes it: the planned fields plus note, choices and needs. */
export const CreateDraftLineSchema = PreviewDraftLineSchema.extend({
  note: LineCreateInputSchema.shape.note,
  options: z
    .array(ChosenOptionSchema)
    .max(100)
    .refine(
      (options) => new Set(options.map((option) => option.itemId)).size === options.length,
      "An option is chosen once",
    )
    .optional()
    .describe(
      "The line item's chosen customisation options, as line.chooseOptions takes them (ADR " +
        "0082): a quantity for an option of a split group, none for any other option",
    ),
  requirements: z
    .array(LineRequirementInputSchema)
    .max(100)
    .optional()
    .describe("Needs on the line as counts per list value (requirement.create without ids)"),
});

export type PreviewDraftLine = z.infer<typeof PreviewDraftLineSchema>;
export type CreateDraftLine = z.infer<typeof CreateDraftLineSchema>;
