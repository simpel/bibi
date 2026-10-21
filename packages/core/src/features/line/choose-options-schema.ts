import { z } from "zod";
import { LineSchema } from "./schema";

export const LineChooseOptionsInputSchema = z.object({
  lineId: z.string().min(1).describe("Id of the line whose item has customisation groups"),
  optionItemIds: z
    .array(z.string().min(1))
    .max(100)
    .refine((ids) => new Set(ids).size === ids.length, "An option is chosen once")
    .describe(
      "Every chosen option, as the option's item id (item.get customisationGroups). Replaces " +
        "the line's choices: each group needs between its minPick and maxPick of them; a group " +
        "with minPick 0 can be left out. Opting out is choosing the other option.",
    ),
});

export const LineChooseOptionsOutputSchema = z.object({
  items: z.array(LineSchema).describe("The line's option lines after the change, in group order"),
});

export type LineChooseOptionsInput = z.infer<typeof LineChooseOptionsInputSchema>;
