import { z } from "zod";

/** Max picks and options in one choice group; a group can never offer more than 100 parts. */
const MAX_OPTIONS = 100;

export const ItemChoiceGroupSchema = z.object({
  name: z.string().trim().min(1).max(200).describe("Name of the group, e.g. 'Main course'"),
  minPick: z
    .number()
    .int()
    .min(0)
    .max(MAX_OPTIONS)
    .describe("Fewest options to pick; 0 = the group is optional"),
  maxPick: z
    .number()
    .int()
    .min(1)
    .max(MAX_OPTIONS)
    .describe("Most options to pick; at least minPick and at most the number of options"),
  itemIds: z
    .array(z.string().min(1))
    .min(1)
    .max(MAX_OPTIONS)
    .describe("The options: ids of parts listed in `components`. A part is in at most one group."),
});

export const ChoiceGroupsInputSchema = z
  .array(ItemChoiceGroupSchema)
  .max(50)
  .describe(
    "CHOICES: choice groups among the parts. Replaces the whole set. When only `components` " +
      "change, the existing groups are kept and must still match the parts.",
  );

export type ItemChoiceGroupInput = z.infer<typeof ItemChoiceGroupSchema>;
