import { z } from "zod";

/** What a derived line warning says (ADR 0059). Add a kind here, never a free-text message. */
export const LINE_WARNING_KINDS = [
  "UNFILLED_OPTIONAL_DEMAND",
  "OUTSIDE_ITEM_HOURS",
  "OUTSIDE_VENUE_HOURS",
  "OPTION_SPLIT_MISMATCH",
  "UNCHOSEN_REQUIRED_GROUP",
] as const;

/**
 * A warning on a line read, derived and never stored (ADR 0059). Only an id and a kind, so it
 * stays within the reader's feature scope (ADR 0050): names are resolved through the owning
 * operation, so a denied piece shows as hidden.
 */
export const LineWarningSchema = z.object({
  id: z
    .string()
    .describe(
      "The thing the warning is about: for UNFILLED_OPTIONAL_DEMAND the open allocation, for " +
        "OUTSIDE_ITEM_HOURS the item, for OUTSIDE_VENUE_HOURS the venue, for " +
        "OPTION_SPLIT_MISMATCH and UNCHOSEN_REQUIRED_GROUP the customisation group (item.get " +
        "customisationGroups)",
    ),
  kind: z
    .enum(LINE_WARNING_KINDS)
    .describe(
      "UNFILLED_OPTIONAL_DEMAND: an optional demand of the line has no unit " +
        "(lineAllocation.get gives the demand, itemDemand.get the need). OUTSIDE_ITEM_HOURS: the line's " +
        "time falls outside the item's working hours (itemHours.get). OUTSIDE_VENUE_HOURS: the " +
        "item has no hours of its own and the time falls outside its venue's opening hours " +
        "(venueHours.get; only with venue:read). Both advisory, the line stays valid. " +
        "OPTION_SPLIT_MISMATCH (ADR 0082): the quantities of the options chosen in a split " +
        "group (sum) do not add up to the line's quantity (expected); never refused. " +
        "UNCHOSEN_REQUIRED_GROUP (ADR 0089): a group of the line's item needs a pick (minPick 1 " +
        "or more) and none is chosen yet; line.chooseOptions clears it",
    ),
  sum: z
    .number()
    .int()
    .nullish()
    .describe("OPTION_SPLIT_MISMATCH: the sum of the group's option quantities"),
  expected: z
    .number()
    .int()
    .nullish()
    .describe("OPTION_SPLIT_MISMATCH: the line's effective quantity the sum should reach"),
});

export const LineWarningsShape = {
  warnings: z
    .array(LineWarningSchema)
    .describe("Derived warnings; empty when the line has none. Never stored"),
};

export type LineWarning = z.infer<typeof LineWarningSchema>;
