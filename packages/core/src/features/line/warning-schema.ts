import { z } from "zod";

/** What a derived line warning says (ADR 0059). Add a kind here, never a free-text message. */
export const LINE_WARNING_KINDS = ["UNFILLED_OPTIONAL_DEMAND"] as const;

/**
 * A warning on a line read, derived and never stored (ADR 0059). Only an id and a kind, so it
 * stays within the reader's feature scope (ADR 0050): names are resolved through the owning
 * operation, so a denied piece shows as hidden.
 */
export const LineWarningSchema = z.object({
  id: z
    .string()
    .describe("The thing the warning is about: for UNFILLED_OPTIONAL_DEMAND the open allocation"),
  kind: z
    .enum(LINE_WARNING_KINDS)
    .describe(
      "UNFILLED_OPTIONAL_DEMAND: an optional demand of the line has no unit " +
        "(lineAllocation.get gives the demand, itemDemand.get the need)",
    ),
});

export const LineWarningsShape = {
  warnings: z
    .array(LineWarningSchema)
    .describe("Derived warnings; empty when the line has none. Never stored"),
};

export type LineWarning = z.infer<typeof LineWarningSchema>;
