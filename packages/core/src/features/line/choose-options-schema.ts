import { z } from "zod";
import { LineSchema } from "./schema";

export const ChosenOptionSchema = z.object({
  itemId: z.string().min(1).describe("The option's item id (item.get customisationGroups)"),
  quantity: z
    .number()
    .int()
    .min(1)
    .max(100_000)
    .nullish()
    .describe(
      "How many of the line's quantity get the option (ADR 0082): required for an option of a " +
        "split group, left out for any other option, which applies to the whole line",
    ),
});

export const LineChooseOptionsInputSchema = z.object({
  lineId: z.string().min(1).describe("Id of the line whose item has customisation groups"),
  options: z
    .array(ChosenOptionSchema)
    .max(100)
    .refine(
      (options) => new Set(options.map((option) => option.itemId)).size === options.length,
      "An option is chosen once",
    )
    .describe(
      "Every chosen option. Replaces the line's choices: each group with a pick needs between " +
        "its minPick and maxPick distinct options; a group can be left out, a required one then " +
        "gives the line warning UNCHOSEN_REQUIRED_GROUP (ADR 0089). Opting out is " +
        "choosing the other option. In a split group the quantities should add up to the line's " +
        "quantity; a mismatch is the line warning OPTION_SPLIT_MISMATCH, never refused.",
    ),
});

export const LineChooseOptionsOutputSchema = z.object({
  items: z.array(LineSchema).describe("The line's option lines after the change, in group order"),
});

export type ChosenOption = z.infer<typeof ChosenOptionSchema>;
export type LineChooseOptionsInput = z.infer<typeof LineChooseOptionsInputSchema>;
